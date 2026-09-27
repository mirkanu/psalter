# Pitfalls Research — v2.0 Public Beta

**Domain:** Adding 6 features to an existing production Next.js 15 app (CPRC Psalter) on a resource-constrained VPS, about to open to first outside beta testers
**Researched:** 2026-07-29
**Confidence:** HIGH (grounded in direct inspection of this repo's code, `.env.production`, PM2/docker state, and VPS memory — not generic advice)

> **Note:** This file was rewritten for the v2.0 Public Beta milestone (previously covered v1.0's Airtable/abcjs migration pitfalls, researched 2026-05-07). Those earlier pitfalls (Airtable attachment URL expiry, abcjs SSR incompatibility, copyright, etc.) are now resolved/shipped and are preserved in the "Hard rules" section of the project's `CLAUDE.md` and the `.planning/research/` alignment/notation docs referenced there — this file now focuses on the pitfalls specific to adding v2.0's 6 new capabilities.

## Codebase facts that shape every pitfall below

Verified directly against the running system before writing this doc:

- **PM2 runs `psalter` in `fork` mode, single instance** (not cluster) — confirmed via `pm2 list`. This changes the in-memory rate-limit risk profile from "split across workers" to "wiped on every restart/deploy."
- **`src/middleware.ts` does not exist.** There is no global route-gating layer. Every `/dev/*` page and every `/api/dev/*` route is responsible for its own auth check.
- **`/dev/melisma-editor` and all 8 of its `/api/dev/*` routes currently have zero session/auth checks** (`grep` for `getSession`/`auth.` returned 0 hits in every one). PROJECT.md calls this page "the de facto tune-data admin UI" — it is live on `psalter.gsdlabs.dev` right now, publicly reachable, unauthenticated, and writes directly to the tunes table.
- **Tune score images are NOT in R2** despite CLAUDE.md's stack table saying so. They are local files at `public/tunes/` (328 files, 1.4GB), served as Next.js static assets, and are **git-ignored** (`public/tunes/.gitignore: *.jpg`) — meaning there is no version-control safety net if a batch script overwrites them.
- **VPS memory is already tight at rest:** `free -h` shows 2.5Gi used / 398Mi free / 4.0Gi swap in use, out of 3.7Gi total, before any new batch job runs.
- **`next.config.ts` already has a `redirects()` array** (one entry, `/search` → `/psalms`, `permanent: true`) — this is the established, in-repo pattern to extend for slug migration, not middleware.
- **`scripts/migrate-airtable.ts`** already uses an idempotent two-pass pattern (`onConflictDoUpdate` keyed on `airtable_id`) and a `SKIP_IMAGES=1` escape hatch — any new migration script should match this pattern, not reinvent it.
- **No Resend key exists yet** anywhere in `.env.production` (checked `PSALTER_RESEND_API_KEY` — absent). This is a from-scratch integration, not a config change.
- **`feedback_submissions` already has server-side validation** (message length cap, email regex, trimming) but **zero rate limiting** — confirmed by reading `src/app/api/feedback/route.ts` in full.

---

## Critical Pitfalls

### Pitfall 1: Shipping the changelog's inline admin authoring with the same "gate later" gap that `/dev/melisma-editor` already has

**What goes wrong:**
The team builds `/changelog` with inline admin authoring, protects the *write* action with a Better Auth session check, but leaves the *page route itself* or a companion API route unauthenticated — repeating the exact gap that already exists in `/dev/melisma-editor` today. Because there's no `middleware.ts`, there is no safety net; each route is only as safe as its own code remembers to be.

**Why it happens:**
The project's precedent (`/dev/melisma-editor`) was built as an internal tool before public beta was ever planned, when "nobody but me will ever hit this URL" was a reasonable assumption. That assumption breaks the moment outside testers exist and the URL is guessable/crawlable. The new admin-authoring feature is being bolted onto a codebase where the existing admin surface has no enforced pattern to copy correctly.

**How to avoid:**
- Do not copy `/dev/melisma-editor`'s auth pattern (or lack thereof) as a template.
- Use `getSessionOr401()` from `src/lib/precent-auth.ts` (already exists, already tested) at the top of every new admin-authoring API route, and check `session.user.role === 'admin'` (the `admin()` Better Auth plugin is already installed in `src/lib/auth.ts`) — not just "any logged-in user."
- For the page component itself, do a server-side session check in the RSC page (not just client-side hide/show of the editor UI) — client-side-only gating still serves the full HTML/JS bundle and leaves the API routes reachable by anyone who reads the network tab.
- While in this area, retrofit the same check onto `/dev/melisma-editor`'s 8 API routes — it is currently a live unauthenticated write surface on the public production domain and should not ship a public beta milestone without being closed.
- Add a `robots.txt` disallow for `/dev/*` as defense-in-depth (none exists currently — confirmed no `robots.txt`/`sitemap` files in `src/app`), but treat this as a courtesy to crawlers, never as the actual security boundary.

**Warning signs:**
- `curl https://psalter.gsdlabs.dev/api/dev/melisma-save` (or the new changelog write endpoint) returns anything other than a 401/403 without a session cookie.
- The admin authoring UI is reachable and renders content in a browser with no active session.

**Phase to address:** Changelog/admin-authoring phase — must be a launch-blocking check, not a follow-up.

---

### Pitfall 2: XSS via unsanitized rich text in changelog entries

**What goes wrong:**
Changelog entries are authored as rich text/HTML (even a minimal WYSIWYG or Markdown-with-HTML-passthrough) and rendered on a public page with `dangerouslySetInnerHTML` or an unsanitized Markdown renderer. A single malicious or careless paste (e.g. copying formatted text from a webpage that carries embedded `<script>` or `onerror=` attributes) becomes a stored XSS payload served to every beta tester's browser, including session-cookie theft against Better Auth sessions on the same origin.

**Why it happens:**
"It's just me writing changelog entries" feels safe, but (a) the admin's own browser/clipboard can carry malicious markup from copy-paste, and (b) the moment this pattern exists in the codebase it becomes the template for any future admin-authored content, some of which may not stay single-admin-only (e.g. if precentors ever get authoring rights later).

**How to avoid:**
- Prefer Markdown source stored as plain text, rendered through a Markdown library that escapes raw HTML by default (do not enable an `allowDangerousHtml`/`rehype-raw` style passthrough).
- If rich text HTML must be stored, sanitize on write (not just on render) with an allowlist-based sanitizer (e.g. `sanitize-html` or DOMPurify server-side) so the stored data itself is never a payload — belt-and-suspenders against a future render path that forgets to sanitize.
- Never use `dangerouslySetInnerHTML` directly on unsanitized DB content, even content the admin themselves wrote.

**Warning signs:**
- Any component in the changelog render path uses `dangerouslySetInnerHTML` with content sourced from `db.query...` without a sanitize step visible in the same file or an imported helper.
- The rich-text editor library's default config allows raw HTML paste-through (many WYSIWYG editors do by default).

**Phase to address:** Changelog/admin-authoring phase, same phase as Pitfall 1 — sanitize on write, escape on render.

---

### Pitfall 3: Resend integration ships without domain verification, so beta emails land in spam or fail silently

**What goes wrong:**
The Resend API key is wired up and `resend.emails.send()` works in testing (sending from Resend's shared `onboarding@resend.dev` sandbox domain or an unverified custom domain), but for real beta testers on Gmail/Outlook, mail either bounces, lands in spam, or silently fails DMARC/SPF alignment — because the sending domain (`gsdlabs.dev` or a psalter subdomain) was never added and verified in the Resend dashboard with SPF + DKIM DNS records.

**Why it happens:**
Resend's sandbox/test mode works without any DNS setup, which masks the gap during development. The DNS step lives outside the codebase (Cloudflare DNS dashboard, not a file Claude edits), so it's easy for a coding-focused workflow to skip it or assume "the API key is enough."

**How to avoid:**
- Add a sending subdomain (e.g. `mail.psalter.gsdlabs.dev` or `send.gsdlabs.dev`) in the Resend dashboard, not the bare apex — the `From:` address must live on whatever subdomain Resend issues DKIM for, or DKIM/DMARC alignment fails.
- Add the SPF TXT, DKIM TXT (`resend._domainkey.<subdomain>`), and DMARC records via Cloudflare DNS (already the DNS provider per project CLAUDE.md) and wait for Resend to report the domain as verified before sending real beta emails.
- Start DMARC at `p=none` to observe reports rather than `p=reject`, per project's low email volume and no prior sending reputation on this domain.
- Store the key as `PSALTER_RESEND_API_KEY` in `/home/services/.env.production` per the project's existing naming convention (`PROJECT_` prefix) — do not hardcode it in `ecosystem.config.js` or any committed file (this is a hard global rule already established for this VPS).
- Test with a real Gmail and a real Outlook/Hotmail address before considering the feature done — Resend's own delivery log (dashboard) shows bounce/spam-complaint status per send, use it.

**Warning signs:**
- Test emails only ever get checked via Resend's dashboard log ("delivered") without confirming the beta tester's own inbox (not spam folder) actually received it.
- The `From:` address is on the apex domain (`gsdlabs.dev`) rather than a subdomain Resend explicitly verified.
- No DMARC record has been added at all (Resend can pass SPF+DKIM but land in spam without any DMARC policy present, depending on receiving provider heuristics).

**Phase to address:** Resend integration phase — DNS setup is a manual/dashboard prerequisite that should be scheduled before the first real send, not discovered after a beta tester reports "I never got the email."

---

### Pitfall 4: Feedback-notify email and changelog broadcast email share one Resend integration but have very different compliance requirements

**What goes wrong:**
The feedback-to-`manuelkuhs@gmail.com` notification (transactional, triggered by one user's submission) and the changelog broadcast to subscribers (bulk, opt-in marketing-adjacent) get built with the same `resend.emails.send()` call and no unsubscribe mechanism, because from the code's perspective they're "just an email." The broadcast list then has no unsubscribe link, which is both a deliverability problem (spam-complaint-triggered sender reputation damage) and, if the beta ever grows past a handful of friends, a CAN-SPAM/GDPR compliance gap.

**Why it happens:**
At 2-3 beta testers, "just email them" feels informal enough that unsubscribe mechanics seem like premature engineering. But the broadcast list is explicitly described as "changelog subscribers" (an opt-in list, implying growth), and Resend's own delivery reputation is shared across all sends from the domain — spam complaints on the broadcast list can degrade deliverability for the transactional feedback-notify email too, since both originate from the same verified domain.

**How to avoid:**
- Treat the two email types as architecturally separate even if they share the Resend client: the feedback-notify email needs no unsubscribe (it's not sent to the subscriber, it's sent to the site owner about a submission) but the changelog broadcast does.
- Add a one-click unsubscribe link (a simple token-based route, e.g. `/api/changelog/unsubscribe?token=...`) even for a tiny list — it's cheap to build now and expensive to retrofit once real beta testers exist and expect it.
- Store subscriber consent (timestamp of subscribe action) so there's a record if this ever needs to be audited later.
- Do not use Resend's shared sending reputation carelessly — if the broadcast list ever gets a spam complaint, both email flows are on the same domain and both are affected.

**Warning signs:**
- The changelog subscribe form exists but there's no corresponding unsubscribe route/link in the sent email template.
- Both feedback-notify and changelog-broadcast use one un-parameterized `sendEmail()` helper with no distinction in headers/list-unsubscribe metadata.

**Phase to address:** Changelog + Resend integration phase, before first broadcast send.

---

### Pitfall 5: Batch JPEG compression runs at full concurrency and either OOM-kills the VPS or destroys the only copies of the score images

**What goes wrong:**
Two compounding risks, both concrete on this specific VPS:
1. **Memory:** A naive script that does `Promise.all(files.map(compressImage))` across 172 (328 counting solfège+staff variants) images spikes memory sharply — `sharp`/libvips must fully decompress progressive JPEGs into memory, and concurrent operations multiply that. This VPS is already at 398Mi free / 4Gi swap in use at idle. A concurrent batch job risks tripping `earlyoom` (which kills the greediest process — possibly this script, possibly an unrelated service on the same box) or the `claude` user's 2.4GB cgroup cap.
2. **Irreversibility:** The images live at `public/tunes/*.jpg`, are git-ignored, and are not actually in R2 (contrary to what CLAUDE.md's stack table claims). If the compression script overwrites files in place and something goes wrong (wrong quality setting, corrupt output, script bug), there is currently **no backup and no version history** to recover from — these are scanned sheet-music images that can't be regenerated from source data.

**Why it happens:**
`sharp` is fast and its examples in docs use `Promise.all` for "batch processing," which is fine on a normal dev machine but not on a 3.7GB shared VPS. Separately, the assumption "images are in R2" (per CLAUDE.md) turns out to be false for this project — the actual deploy uses local static files — so anyone trusting the stack doc into skipping a manual backup step is working from stale/incorrect documentation.

**How to avoid:**
- **Back up `public/tunes/` before running anything.** `tar czf` to a separate path (e.g. `/home/services/psalter/backups/tunes-pre-compression-$(date +%Y%m%d).tar.gz`) or push to R2/an external location — do this first, unconditionally, even though it wasn't required by any existing script. Verify the archive is readable (untar to a temp dir and diff file count) before proceeding.
- **Process sequentially or with `p-limit` concurrency of 1–2**, not `Promise.all` across all 328 files. Set `sharp.cache(false)` and `sharp.concurrency(1)` to reduce libvips' internal thread/cache overhead.
- **Write to a new directory first** (`public/tunes-compressed/`), verify output visually/dimensionally against a sample of originals, and only then swap directories — never compress in place on the first pass.
- **Check for progressive JPEGs** among the source scans before running at scale; these need full decompression into memory and are the specific case that caused documented OOM crashes in `sharp`'s own issue tracker. If any are found, process those specifically one at a time.
- **Verify legibility, not just file size, on notation-bearing images.** These are OCR'd sheet-music scans that solfège underlines and staff notation were painstakingly hand-reviewed from (`/dev/melisma-editor`, 70/172 tunes approved so far per PROJECT.md). Over-aggressive JPEG quality reduction can blur exactly the fine details (underlines, ledger lines) that the melisma-editor workflow depends on humans being able to read. Spot-check compressed output against originals at 100% zoom for a handful of representative tunes, prioritizing ones already marked `approved`.
- Run the script with `free -h` monitoring before/during/after, and consider running during low-traffic hours since the VPS is shared with other services and the `psalter` PM2 process itself will keep serving traffic during the batch job.

**Warning signs:**
- `free -h` available memory drops toward zero while the script runs, or `earlyoom` logs a kill event.
- Compressed file sizes drop dramatically (e.g. >80%) — a sign quality was set too aggressively.
- No `tar`/backup file exists anywhere before the script's first write.

**Phase to address:** JPEG compression phase — backup step must be the literal first action taken, before any code that touches `public/tunes/` is even written.

---

### Pitfall 6: In-memory rate limiting on the feedback API gives a false sense of protection because PM2 fork-mode restarts wipe it silently

**What goes wrong:**
A `Map`-based in-memory rate limiter is added to `src/app/api/feedback/route.ts` and works correctly in manual testing. But every PM2 restart — deploys, crash recovery, or a future `max_memory_restart` threshold if one gets added to the ecosystem config — silently resets the counters to zero. On a single-fork-mode PM2 process (confirmed: `psalter` runs as 1 fork instance, not cluster), this isn't the "split across workers" failure mode most in-memory-rate-limiter warnings describe — it's simpler: any deploy (which happens routinely during active development of this milestone) gives every client a clean slate.

**Why it happens:**
Fork mode (vs. cluster mode) makes it easy to assume "single process = single source of truth, in-memory is fine." That's true moment-to-moment, but this project deploys frequently (active GSD phase work), and each deploy is a full process restart.

**How to avoid:**
- For a public beta with 2-3 known testers plus general public read traffic, an in-memory `Map` keyed by IP with a modest window (e.g. 5 submissions/hour) is proportionate — this is not a high-abuse-risk target, and Redis is not in this project's stack (adding it purely for rate limiting would be disproportionate infra for the actual risk level).
- If persistence across restarts matters more than "good enough," use the existing PostgreSQL database (already in the stack, already has a `feedback_submissions` table) as the rate-limit store instead of adding Redis — e.g. count recent rows by IP/email within a time window as part of the same insert transaction. This survives restarts for free and matches the project's "don't add new infra without checking the stack registry" convention (per global CLAUDE.md Stack Registry Rule).
- Document the tradeoff explicitly in code comments: in-memory is a deliberate choice for this traffic scale, not an oversight — so a future maintainer doesn't "fix" it into unnecessary Redis infra.
- Rate-limit on a composite signal if possible (IP + no message dedup within N seconds) since IP alone is coarse (shared NAT/VPN users), but don't over-engineer this for a 2-3-tester beta.

**Warning signs:**
- Rate limit "resets" observed immediately after every `pm2 restart psalter` or deploy.
- No code comment or decision record explaining why in-memory (vs. DB-backed) was chosen — signals it wasn't a deliberate tradeoff.

**Phase to address:** Feedback rate-limiting phase — decide in-memory vs. DB-backed explicitly, don't default to in-memory by accident.

---

### Pitfall 7: Numeric-to-name tune slug migration breaks `generateStaticParams`, existing bookmarked links, and any hardcoded `/tunes/<id>` references without redirects

**What goes wrong:**
`src/app/tunes/[id]/page.tsx` currently uses numeric Airtable-derived IDs as the route param (confirmed: directory is literally `tunes/[id]`) and the project's static-rendering convention (`generateStaticParams`, no runtime DB queries on the read path, per project CLAUDE.md) means old numeric URLs simply won't exist as generated pages once slugs change — they don't gracefully "fall through" to a lookup, they 404, unless `dynamicParams` handling or explicit redirects are added. Any existing bookmarks, the precentor portal's set-list links (`precenting_sets`/`set_items` reference tunes), or external links from `psalter.cprc.co.uk`'s prior life break silently.

**Why it happens:**
Static generation with `generateStaticParams` is optimized for "build every known page ahead of time," which is exactly right for read-path performance but means there's no runtime fallback path by default — a migration has to be planned as "generate new + explicitly redirect old," not just "rename the param."

**How to avoid:**
- Generate the full old-ID → new-slug mapping at build/migration time (172 known tunes, a finite list) and add it to `next.config.ts`'s existing `redirects()` array (already has one entry — this is the established, working pattern in this repo, don't introduce middleware for something `next.config.ts` already handles) with `permanent: true`.
- Keep both `/tunes/[id]` (numeric, old) and `/tunes/[slug]` (name-based, new) resolvable during a transition window if any internal code (precenting sets, service history) stores the numeric ID as a foreign key reference rather than resolving through a join — audit `precenting_sets`/`set_items` schema for hardcoded tune ID storage vs. relational FK before assuming redirects alone are sufficient.
- **Slug uniqueness:** tune names are not guaranteed unique or URL-safe as-is (check for tunes sharing a name with different meters/arrangements, punctuation, or non-ASCII characters) — reuse the existing `slugifyTuneName()` helper already in `scripts/download-tunes.ts` (lowercase, non-alphanumeric → hyphen) for consistency rather than writing a second slugify implementation, and add a uniqueness check/disambiguation suffix (e.g. append meter or a numeric suffix) for any collisions found in the actual 172-tune dataset before generating routes.
- Since pages are static, adding/renaming a slug requires a full rebuild — remember the project's known build-memory constraint (`next.config.ts` already caps `experimental.cpus: 1` because default build concurrency previously got SIGTERM'd by OOM pressure on this VPS) — this isn't a new risk from this migration, but it means testing the full rebuild locally/in CI before assuming it'll succeed unattended on the VPS.
- Update the sitemap (none currently exists per this audit) and any OG-image generation (planned in this same milestone's polish backlog) to use the new slugs from the start rather than generating them against old numeric routes that are about to be redirected.

**Warning signs:**
- `grep -rn "tunes/\[id\]\|tunes/\${.*id}" src` still finds numeric-ID link construction after the migration lands.
- Visiting an old bookmarked `/tunes/169`-style URL 404s instead of 308-redirecting.
- Two tunes end up generating the same slug and one silently overwrites/shadows the other in `generateStaticParams`'s output.

**Phase to address:** Tune slug migration phase — build the old→new mapping and redirects as one atomic change, not slug-rename-now/redirects-later.

---

### Pitfall 8: New Airtable field migration repeats the same field-name assumption errors the last migration already paid for

**What goes wrong:**
The project has already been burned once: PROJECT.md/CLAUDE.md history notes the original Airtable migration "surfaced 6 incorrect field-name assumptions across 4 tables" and needed a `SKIP_IMAGES` flag for disk constraints. A new migration script for Backup/Historical tune data risks repeating exactly this: assuming a field name/shape from memory or from the Airtable UI's display label (which often differs from the API field name — spacing, casing, or renamed-but-not-migrated fields) instead of verifying against the live schema via the API before writing insert logic.

**Why it happens:**
Airtable's UI display names and its API `field.name` values can drift (fields get renamed in the UI without anyone updating downstream assumptions), and it's faster to eyeball the Airtable grid and start coding than to first fetch and print the actual field list via the API.

**How to avoid:**
- Before writing any new migration logic, run a throwaway script that does `base(tableName).select({ maxRecords: 1 }).firstPage()` and `console.log(Object.keys(record.fields))` for every table/field this migration touches, and diff that against the assumed field names in the script — this is a 5-minute step that would have caught all 6 prior errors.
- Reuse the exact idempotent pattern already established in `scripts/migrate-airtable.ts` (`onConflictDoUpdate` keyed on `airtable_id`, two-pass primary-then-junction inserts) rather than writing a one-off script with different semantics — this keeps the new script safely re-runnable if it's interrupted or needs a field-name fix mid-run.
- Since this migration is explicitly for **Backup/Historical tune data** (not the already-migrated core fields), treat every field name as unverified going in, even ones that sound similar to already-migrated fields (e.g. a "Backup Score" field is not guaranteed to have the same shape/type as the primary "Score" attachment field that's already handled).
- Reuse the `str()`/`normaliseMeter()`/`parsePosition()` style defensive parsing helpers already in the script rather than assuming Airtable always returns the expected type — Airtable fields can be `undefined`, empty string, or unexpected type depending on how sparsely a given historical record was filled in.
- Given the disk-constraint lesson already learned (`SKIP_IMAGES=1`), check current disk headroom before deciding whether this migration also needs an image-skip escape hatch, especially since `public/tunes/` is already 1.4GB and any additional historical images add to that footprint directly (not to R2, per the corrected understanding above).

**Warning signs:**
- Any `r.get('Field Name')` call in the new script hasn't been checked against an actual `console.log(Object.keys(record.fields))` dump from the live base.
- The new script inserts without `onConflictDoUpdate`, meaning a second run (e.g. to pick up post-snapshot Airtable edits, which the existing script's docstring explicitly anticipates as a normal re-run scenario) would create duplicates instead of updating.

**Phase to address:** Real Airtable field migration phase — the field-verification step should be the literal first commit/script, before any insert logic is written.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| In-memory `Map` rate limiter instead of DB-backed | Fast to build, no schema change | Silently resets on every deploy; false sense of protection | Acceptable now (2-3 testers, low abuse risk) — revisit if traffic/abuse grows |
| Skip robots.txt disallow for `/dev/*` | One less file | Search engines can index/crawl admin tooling once public | Never acceptable for a site about to be public — cheap to add now |
| Ship changelog broadcast without unsubscribe | Faster to ship | Deliverability/reputation risk shared with transactional feedback email on same domain | Never acceptable, even at small list size — cheap to build now |
| Compress `public/tunes/` in place without a prior backup | Saves one `tar` command | Irrecoverable loss of hand-curated OCR source scans if something goes wrong | Never acceptable — no version control safety net exists for these files |
| Leave `/dev/melisma-editor` unauthenticated a bit longer | Nothing needs to change today | Live public write access to tune notation data on production domain | Never acceptable once the site has outside visitors — close before/with this milestone |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Resend | Sending from unverified apex domain, assuming sandbox-mode success means production readiness | Verify a sending subdomain (SPF+DKIM+DMARC) in Resend dashboard first; test against real Gmail/Outlook inboxes, not just the Resend delivery log |
| Resend | Storing API key inline in `ecosystem.config.js` or a committed file | `PSALTER_RESEND_API_KEY` in `/home/services/.env.production`, loaded via `env_file` per project's established secrets convention |
| Airtable (new migration) | Trusting Airtable UI display-name as the API `field.name` | Dump `Object.keys(record.fields)` from a live fetch before writing any `r.get(...)` calls |
| sharp / libvips | `Promise.all` over all 328 images at once | Sequential or `p-limit`(1-2) processing, `sharp.concurrency(1)`, `sharp.cache(false)` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Concurrent `sharp` batch compression on a 3.7GB VPS | `free -h` available memory collapses; `earlyoom` kill events; other PM2 services (unrelated projects sharing the box) get OOM-killed | Sequential processing, monitor `free -h` during run, process during low-traffic window | Immediately at default `Promise.all` concurrency — this VPS is already at ~400Mi free at idle |
| `next build` default worker concurrency | Build gets SIGTERM'd mid-build | Already mitigated (`experimental.cpus: 1` in `next.config.ts`) — remember this constraint still applies to any rebuild triggered by the slug migration | Confirmed already broken once before this fix landed |
| Static generation of 172+ tune pages growing further with slug migration duplicates | Build time/memory grows if old numeric + new slug routes are both statically generated indefinitely | Redirect old routes rather than dual-generating them forever; treat the numeric routes as a transition window, not a permanent second route set | Noticeable once both route sets are generated on every build going forward |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `/dev/melisma-editor` and its 8 API routes ship to public beta with no auth check | Any outside beta tester (or search engine, or anyone who finds the URL) can read and overwrite tune notation/melisma data in production | Add `getSessionOr401()` + admin-role check to every route before beta opens |
| Admin-authored changelog rendered via `dangerouslySetInnerHTML` without sanitization | Stored XSS reachable by every site visitor, including session-cookie theft against Better Auth | Sanitize on write with an allowlist sanitizer; prefer Markdown-without-raw-HTML |
| Feedback API accepts unlimited submissions | Trivial spam/abuse vector once URL is public, especially once rate limiting is "in name only" due to PM2-restart resets | DB-backed or intentionally-scoped in-memory limiter, documented as a deliberate tradeoff |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Old `/tunes/<numeric-id>` links 404 after slug migration | Beta testers' bookmarks/shared links break, undermining first-impression trust during the exact week they're being asked to test the site | Redirect via `next.config.ts`, verified against every existing numeric ID before cutover |
| Changelog subscribe with no unsubscribe | A friend-group beta tester who subscribed out of politeness has no way to opt out, creating awkward social pressure instead of goodwill | One-click unsubscribe link in every broadcast email |
| Feedback submission with no rate-limit feedback to legitimate users | A tester who resubmits after a typo correction could get silently blocked with no error message explaining why | Return a clear "you've reached the limit, try again in X minutes" response rather than a generic failure |

## "Looks Done But Isn't" Checklist

- [ ] **Resend integration:** Often missing domain verification — verify sending domain shows "Verified" in the Resend dashboard, not just that `resend.emails.send()` returns 200 in a test.
- [ ] **JPEG compression script:** Often missing a pre-run backup — verify a `tar`/external copy of `public/tunes/` exists and was validated (untarred, file count checked) before the script's first write.
- [ ] **Admin authoring (changelog):** Often missing server-side (not just client-side) auth enforcement — verify `curl` against the write API route with no session cookie returns 401/403.
- [ ] **Feedback rate limiting:** Often missing restart-survival consideration — verify the chosen approach (in-memory vs. DB-backed) was a documented decision, and test that a `pm2 restart psalter` does or doesn't reset the counter as intended.
- [ ] **Tune slug migration:** Often missing the redirect map for 100% of old IDs — verify every one of the 172 existing numeric tune IDs resolves via redirect to its new slug, not just a spot-checked sample.
- [ ] **Airtable field migration:** Often missing live-schema verification — verify every `r.get('Field Name')` in the new script was checked against an actual field dump, not assumed from memory of the last migration.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|-----------------|
| JPEG compression corrupts/over-compresses images without a backup | HIGH | If no backup exists, originals may be unrecoverable from this VPS — check R2/Airtable attachments (still active per Backlog Phase 999.1) as a last-resort re-download source before accepting data loss |
| `/dev/melisma-editor` was exploited while unauthenticated | MEDIUM | Compare current tune/melisma data against the most recent `backups/*.sql` snapshot or a fresh `pg_dump`; Airtable (not yet decommissioned) may also serve as a cross-check source of truth |
| Slug migration breaks old links post-launch | LOW | Since routes are statically generated and `next.config.ts` redirects are code, this is a fast follow-up deploy — add the missed mapping and rebuild |
| Rate limiter proves ineffective against real spam | LOW | Swap the in-memory approach for the DB-backed approach described in Pitfall 6 — the `feedback_submissions` table already exists, no schema migration needed beyond a query |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Unauthenticated admin routes (`/dev/melisma-editor` + new changelog authoring) | Changelog/admin-authoring phase | `curl` every admin write route with no session cookie, confirm 401/403 |
| XSS via unsanitized changelog rich text | Changelog/admin-authoring phase | Attempt to save a `<script>`-containing entry, confirm it's stripped/escaped on both write and render |
| Resend domain/deliverability | Resend integration phase | Domain shows "Verified" in Resend dashboard; test send lands in real Gmail/Outlook inbox, not spam |
| Broadcast list compliance (unsubscribe) | Resend integration / changelog phase | Every broadcast email contains a working one-click unsubscribe link |
| Batch JPEG compression memory/irreversibility | JPEG compression phase | Backup archive exists and was validated before any in-place write; `free -h` monitored during run; spot-checked legibility on approved tunes |
| In-memory rate limiter reset on restart | Feedback rate-limiting phase | Restart `psalter` via PM2 mid-testing, confirm rate-limit behavior matches the documented intended tradeoff (not an accidental gap) |
| Tune slug migration breaking old links | Slug migration phase | Every existing numeric tune ID (all 172) redirects correctly; `generateStaticParams` builds without slug collisions |
| Airtable field-name assumption errors | Airtable field migration phase | Live field dump (`Object.keys(record.fields)`) checked against every `r.get(...)` call before first insert run |

## Sources

- Direct repository inspection: `src/app/api/feedback/route.ts`, `src/lib/auth.ts`, `src/lib/precent-auth.ts`, `src/app/api/dev/*/route.ts`, `src/app/dev/melisma-editor/*`, `scripts/migrate-airtable.ts`, `scripts/download-tunes.ts`, `next.config.ts`, `package.json` — read 2026-07-29.
- Direct VPS state: `pm2 list`, `free -h`, `docker volume ls`, `git check-ignore`/`git ls-files public/tunes` — checked 2026-07-29.
- Project docs: `.planning/PROJECT.md`, project `CLAUDE.md` (stack table, global secrets-hygiene rules, memory constraints section).
- [Email Deliverability for SaaS: SPF, DKIM, DMARC Setup and Resend Integration](https://dev.to/whoffagents/email-deliverability-for-saas-spf-dkim-dmarc-setup-and-resend-integration-1hpd) — MEDIUM confidence, WebSearch-sourced, cross-checked against multiple Resend-specific setup guides in the same search batch.
- [How do I set up a custom sending domain in Resend (SPF, DKIM, DMARC) step by step?](https://codeables.dev/article/how-do-i-set-up-a-custom-sending-domain-in-resend-spf-dkim-dmarc-step) — MEDIUM confidence.
- [Trying to understand sharp memory usage · Issue #349 · lovell/sharp](https://github.com/lovell/sharp/issues/349) — HIGH confidence (official sharp GitHub issue, documents the progressive-JPEG OOM failure mode directly).
- [Preventing Memory Issues in Node.js Sharp: A Journey](https://www.context.dev/blog/preventing-memory-issues-in-node-js-sharp-a-journey) — MEDIUM confidence.
- [sharp Performance docs](https://sharp.pixelplumbing.com/performance/) — HIGH confidence (official docs).
- [next.config.js: redirects | Next.js official docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects) — HIGH confidence (official Next.js docs).
- [Functions: generateStaticParams | Next.js official docs](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) — HIGH confidence.
- [301 Redirect inside RSC · vercel/next.js Discussion #54182](https://github.com/vercel/next.js/discussions/54182) — MEDIUM confidence (community discussion, cross-checked against official docs on 307/308 behavior).
- PM2 in-memory rate-limiting cluster/restart caveats — MEDIUM confidence, synthesized from multiple PM2/rate-limiter community sources in the same WebSearch batch; the fork-mode-specific restart-reset claim was independently verified against this project's actual `pm2 list` output (fork mode, 1 instance) rather than taken purely from search results.

---
*Pitfalls research for: CPRC Psalter v2.0 Public Beta milestone*
*Researched: 2026-07-29*
