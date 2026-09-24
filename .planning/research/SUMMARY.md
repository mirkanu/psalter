# Project Research Summary

**Project:** CPRC Psalter — v2.0 Public Beta
**Domain:** Feature-addition milestone on an existing production Next.js/PostgreSQL app (not greenfield) — email (transactional + broadcast), inline admin-authored content, batch image processing, third-party audio embed, plus two data/routing fixes (meter-mismatch banner, tune slug migration, Backup/Historical tune sort)
**Researched:** 2026-07-29
**Confidence:** HIGH

## Executive Summary

This milestone bolts six well-understood, low-novelty capabilities onto a live production app (`psalter.gsdlabs.dev`) that already has real users and precedent for nearly every pattern needed: Resend for email (feedback-notify + changelog broadcast), a new `changelog_posts`/`changelog_subscribers` pair of tables with inline Markdown authoring gated by the existing Better Auth admin role, `sharp` (already installed) for one-off JPEG re-compression of 172 scanned tune scores, a plain iframe embed for SoundCloud/YouTube reused from `TuneAudioPlayer.tsx`, a numeric-ID→name-slug migration for `/tunes/[id]`, and a 3-tier Backup/Historical tune sort sourced from an unmigrated Airtable field. None of this requires new architecture or exotic libraries — every researcher independently converged on "extend what's already built, don't add infrastructure," and confidence across all four research files is HIGH because findings are grounded in direct inspection of this specific codebase and VPS, not generic best-practice advice.

The real risk in this milestone is not technical novelty, it's **operational discipline on a resource- and history-constrained system that is about to go in front of outside testers for the first time.** Three concrete, launch-blocking gaps surfaced: (1) `/dev/melisma-editor` and its 8 API routes are live, unauthenticated, and publicly writable right now — this must close before or with this milestone, not after; (2) the 172 scanned tune-score JPGs live only as git-ignored local files on the VPS (not in R2, contrary to CLAUDE.md's stack table) with zero backup, so any batch compression script must back up first, write to a new directory, and verify legibility before ever touching the originals in place; (3) Resend email will silently underperform (spam folder, bounces) unless a sending subdomain is verified with SPF/DKIM/DMARC in the Cloudflare-managed DNS before the first real beta-tester send — this is a manual dashboard step outside the codebase and easy to skip.

The recommended approach is: fix the two security/data-integrity gaps first (auth on `/dev/*`, backup before compression) as they're cheap now and expensive after an incident; provision Resend + verify the sending domain early since DNS propagation and testing take real wall-clock time; then build the two largely-independent feature tracks (A: meter-mismatch/tune-slug/backup-sort, all centered on `TuneTable.tsx` and tune data; B: changelog + email, centered on new tables and routes) which can proceed in parallel with only light sequencing within each track.

## Key Findings

### Recommended Stack

Four new capabilities, four correspondingly small additions — no framework or architecture changes. `resend@6.18.1` (Node ≥20 — verify VPS Node version first) covers both transactional feedback-notify and audience/broadcast changelog-subscriber email under one free-tier account, avoiding a second product to provision. `sharp` is already an installed devDependency (`^0.34.5`→`0.35.3` optional bump) and needs no new package, only a careful standalone script. `react-markdown` + `remark-gfm` render stored changelog Markdown safely (escapes raw HTML by default — do not enable `rehype-raw`/`allowDangerousHtml`). The SoundCloud embed needs no SDK at all — a documented, stable public iframe URL pattern, already proven in `TuneAudioPlayer.tsx`.

**Core technologies:**
- `resend` 6.18.1 — feedback-notify + changelog broadcast/audience email — one SDK, one free-tier account, matches existing Stack Registry pattern (`{PROJECT}_RESEND_API_KEY`)
- `sharp` (already installed) — one-off batch JPEG re-compression script, not a runtime dependency — fastest native image lib, `mozjpeg` quality control for notation legibility
- `react-markdown` + `remark-gfm` — changelog rendering — zero-config, safe-by-default (no raw HTML passthrough), GFM for bullets/bold/links
- Plain iframe (`w.soundcloud.com/player`) — inline embed player — zero dependencies, reuses existing pattern exactly

**Explicitly rejected:** headless CMS or WYSIWYG editor (Tiptap/Lexical) for changelog — one author, occasional short posts; `imagemin` — maintenance-mode, more deps than `sharp`; `@upstash/ratelimit`/Redis — single PM2 fork process needs no external rate-limit infra; SoundCloud Widget JS API — massive complexity increase for a "click to expand iframe" spec.

### Expected Features

**Must have (table stakes) — all P1, all explicitly scoped in the milestone:**
- Changelog: reverse-chronological list, title+date+body, homepage hero teaser
- Changelog: inline admin authoring (Markdown textarea, reusing the admin-role gate) — without this, publishing requires a DB console
- Feedback → owner email on every submission (closes the explicitly named gap: "only saves to DB, no email sent"), with rate-limiting
- Email subscribe: single field, single opt-in, Resend Audience-backed, working unsubscribe link
- Inline embed player in tune list: click-to-expand SoundCloud/YouTube iframe, reusing `TuneAudioPlayer.tsx`
- `PSALTER_RESEND_API_KEY` provisioning — shared prerequisite blocking both email features, should happen once, early

**Should have (P2, add if time allows):** feedback email `reply_to` set to submitter's address; abcjs-notation fallback in the inline embed player for melisma-approved tunes with no SoundCloud link (reuses existing `AbcAudioControls.tsx`/`abc-soundfont.ts` playback engine, not new capability).

**Defer (v2+, explicitly out of scope):** double opt-in/confirmed-subscribe flow, changelog tags/filter UI, feedback digest emails, CAPTCHA/Turnstile, SoundCloud Widget JS API — all correctly identified as overkill at this scale (2-3 beta testers + small congregation) and named as anti-features by the research.

### Architecture Approach

This is a subsequent-milestone integration onto an already-diverged codebase, not greenfield design — every recommendation anchors to a specific existing file. The dominant pattern across all new work is **extend-and-reuse, not reinvent**: a pure `isMeterMismatch()` predicate gets extracted once and consumed by both the existing precentor UI and the new public notation banner; `tuneNameToSlug()` (already load-bearing for JPG filenames) is reused for slug routing rather than writing a second slugifier; the one-off Airtable backfill pattern from `migrate-double-length.ts` is repeated verbatim for the new Backup/Historical fields; admin-gating mirrors `getSessionOr401()`/role checks already in `src/lib/precent-auth.ts` via a new shared `src/lib/admin-auth.ts`.

**Major components:**
1. `src/lib/resend.ts` — single Resend client + two distinct send shapes (single transactional, batch broadcast) — feedback email failures are swallowed (DB write must never be blocked), broadcast failures should surface to the admin UI
2. `changelogPosts`/`changelogSubscribers` (new Drizzle tables) + `/changelog` page (force-dynamic, not static, because it needs a live session check for inline admin affordances) + `/api/admin/changelog/**` (session+role gated) + `/api/changelog/subscribe` (rate-limited)
3. `src/lib/meter-mismatch.ts` (new pure predicate, extracted from `SetItemRow.tsx`) — unifies precentor-portal and public-notation mismatch detection
4. `src/app/tunes/[id]/` → `src/app/tunes/[slug]/` rename, reusing existing `tuneNameToSlug()`, with `next.config.ts` `redirects()` extended for the old→new mapping (not middleware — the repo already has this established pattern)
5. `src/lib/rate-limit.ts` — in-memory `Map`-based sliding window, explicitly documented as a deliberate tradeoff (no Redis) given single-fork PM2 deployment

### Critical Pitfalls

1. **Unauthenticated admin write surfaces** — `/dev/melisma-editor` and its 8 API routes are live on production right now with zero session checks. The changelog admin-authoring feature must not repeat this gap (server-side RSC session check + role check on every write route, not client-side hide/show), and the existing `/dev/*` gap should be retrofitted closed as part of this milestone before beta testers arrive.
2. **Stored XSS via unsanitized changelog content** — even single-author content is a risk (malicious clipboard paste, future precedent for other admin-authored content). Use Markdown-only with HTML escaped by default (`react-markdown` without `rehype-raw`); never `dangerouslySetInnerHTML` on unsanitized DB content.
3. **Resend emails silently fail to land** — sandbox/test-mode success masks a missing sending-domain verification step (SPF/DKIM/DMARC via Cloudflare DNS) that lives outside the codebase and is easy to skip. Must test against real Gmail/Outlook inboxes before considering the feature done, not just the Resend dashboard log.
4. **Irreversible loss of the 172 scanned tune-score images** — they are git-ignored local files, not in R2 despite CLAUDE.md's stack table, with no existing backup. Any compression script must back up unconditionally first, process sequentially (not `Promise.all`, given ~400Mi free RAM at idle on this VPS), write to a new directory first, and spot-check legibility on notation-critical (melisma-approved) images before any in-place swap.
5. **Broadcast email with no unsubscribe mechanism** — the changelog subscriber list is opt-in and implies growth; skipping unsubscribe now is cheap-feeling but expensive to retrofit and risks shared sending-domain reputation damage that would also degrade the transactional feedback-notify email.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Security & Data-Safety Prerequisites
**Rationale:** Two launch-blocking gaps (unauthenticated `/dev/*` admin routes, no backup of irreplaceable tune scans) exist independently of any new feature and become materially more dangerous the moment the site has outside beta testers. Cheapest to fix before other work touches the same files/data.
**Delivers:** `getSessionOr401()` + admin-role check retrofitted onto all 8 `/dev/melisma-editor` API routes; `robots.txt` disallow for `/dev/*`; validated backup archive of `public/tunes/` (untar-verified, file count checked).
**Addresses:** N/A (infra/security hardening, not a listed feature) — but is an explicit precondition named across FEATURES.md, ARCHITECTURE.md, and PITFALLS.md.
**Avoids:** Pitfall 1 (unauthenticated admin write surface), sets up the mandatory precondition for Pitfall 5 (irreversible JPEG loss).

### Phase 2: Resend Provisioning & Email Foundation
**Rationale:** Both email features (feedback-notify, changelog broadcast) share one provisioning step (`PSALTER_RESEND_API_KEY`) and one non-codebase prerequisite (sending-domain SPF/DKIM/DMARC verification in Cloudflare DNS) that has real wall-clock lag (DNS propagation, Resend verification). Doing this early de-risks every later phase that depends on it.
**Delivers:** `PSALTER_RESEND_API_KEY` in `/home/services/.env.production`; verified sending subdomain; `src/lib/resend.ts` client with both `sendFeedbackNotification()` and `sendChangelogBroadcast()` shapes stubbed; test sends confirmed landing in real Gmail/Outlook inboxes.
**Uses:** `resend` 6.18.1 from STACK.md.
**Implements:** Pattern 5 (transactional vs. broadcast email through one client) from ARCHITECTURE.md.

### Phase 3: Feedback Email + Rate Limiting
**Rationale:** Smallest, most isolated of the remaining feature work — extends an existing route (`/api/feedback`) rather than building new surfaces. Depends only on Phase 2's Resend client.
**Delivers:** Feedback submissions trigger an owner-notification email (fire-and-forget, DB write never blocked by email failure), `reply_to` wired when submitter email present, in-memory rate limiter (documented as a deliberate tradeoff, not an oversight).
**Addresses:** Feedback → owner email notification, feedback email rate-limiting (both P1 in FEATURES.md).
**Avoids:** Pitfall 6 (in-memory rate limiter reset on PM2 restart) — must be an explicit, documented decision.

### Phase 4: Changelog (Content Model + Public Pages + Inline Admin Authoring)
**Rationale:** Independent of the tune-data track; can run in parallel with Phase 5/6 per ARCHITECTURE.md's build-order analysis. Depends on Phase 2 (Resend) only for the subscribe/broadcast slice, not for the read-only changelog itself — read-only changelog + admin authoring can ship before subscribe if sequencing pressure requires it.
**Delivers:** `changelogPosts`/`changelogSubscribers` tables, `/changelog` public feed (force-dynamic, not static) with inline admin authoring gated by `admin-auth.ts`, homepage hero teaser, subscribe form + unsubscribe-link-bearing broadcast on publish.
**Addresses:** All changelog table-stakes features + email subscribe (FEATURES.md P1 list).
**Avoids:** Pitfall 1 (repeat of unauthenticated-admin-route gap — server-side session check, not client-only), Pitfall 2 (XSS via unsanitized rich text), Pitfall 4 (broadcast list without unsubscribe).

### Phase 5: Tune Data Fixes — Meter Mismatch, Backup/Historical Sort, Slug Migration
**Rationale:** Three related changes that all touch `TuneTable.tsx` and tune data; sequencing within this phase matters (meter-mismatch extraction first as a zero-dependency foundation, then Airtable field verification before schema changes, then the sort, then the slug migration last since it touches the same files and avoids extra merge friction).
**Delivers:** Extracted `isMeterMismatch()` predicate + public notation warning banner; verified Airtable field shapes for Backup/Historical data + migration script + 3-tier `TuneTable.tsx` sort; `/tunes/[id]` → `/tunes/[slug]` migration with a complete old→new redirect map in `next.config.ts`.
**Addresses:** Meter-mismatch parity (precentor portal ↔ public), Backup/Historical tune sort, tune slug/SEO improvement — all named in the milestone brief per ARCHITECTURE.md.
**Avoids:** Pitfall 7 (broken bookmarks/404s from slug migration without full redirect coverage), Pitfall 8 (repeating prior Airtable field-name assumption errors — verify live field shapes before writing migration logic).

### Phase 6: Inline Embed Player & Batch JPEG Compression
**Rationale:** Two independent, low-risk-if-done-carefully capabilities grouped last: the embed player is the smallest lift of the whole milestone (relocating an existing pattern), and the JPEG compression is a one-off operational script that should run once the backup from Phase 1 is confirmed solid, ideally during a low-traffic window given VPS memory constraints.
**Delivers:** Click-to-expand SoundCloud/YouTube iframe in `TuneTable.tsx`'s Recording column (single-expanded-row state, auto-collapse others); compressed `public/tunes/` JPGs (sequential processing, `sharp.cache(false)`/`sharp.concurrency(1)`, write-to-new-directory-first, legibility-spot-checked against melisma-approved tunes).
**Addresses:** Inline embed player (P1), JPEG compression (explicit milestone scope item).
**Avoids:** Pitfall 5 (OOM/irreversible image loss) — depends on Phase 1's backup already existing.

### Phase Ordering Rationale

- Security and data-safety fixes come first because they are cheap now, expensive after an incident, and unrelated to any other phase's code — no reason to defer them.
- Resend provisioning comes early specifically because of its non-codebase lag (DNS verification) — blocking two later phases (3 and 4's subscribe slice) on a step that could otherwise become a last-minute scramble.
- Changelog (Phase 4) and tune-data fixes (Phase 5) are architecturally independent tracks per ARCHITECTURE.md's explicit analysis — they can be built in parallel if resourcing allows, with only the shared file `TuneTable.tsx` requiring light coordination (Phase 5 touches it for sort+slug, Phase 4/embed-player touches it separately in Phase 6 for the Recording column).
- The embed player and JPEG compression are grouped last as the lowest-risk, most self-contained remaining work, with compression explicitly gated behind Phase 1's backup step.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Resend provisioning):** DNS/SPF/DKIM/DMARC setup is a manual dashboard/DNS process outside the codebase with real failure modes (spam landing, silent bounces) — worth a `/gsd-research-phase` pass or at minimum a detailed manual checklist before declaring done, since "it sent successfully" is not the same as "it was delivered."
- **Phase 5 (Airtable Backup/Historical migration):** The milestone brief describes these as Airtable "lookup" fields whose actual shape (mirrors a `Tunes`-level field vs. genuine per-service-item data) is unverified — explicitly flagged in ARCHITECTURE.md as needing a live-field-inspection script before schema design, not assumption from field names alone.

Phases with standard patterns (skip research-phase):
- **Phase 1 (security/backup hardening):** Direct application of an already-existing auth helper (`getSessionOr401`) and a plain `tar` backup — no open questions.
- **Phase 3 (feedback email + rate limit):** Extends an existing, well-understood route; in-memory rate limiting is a well-documented, deliberate tradeoff at this scale.
- **Phase 6 (embed player, JPEG compression):** Both are near-verbatim reuse of existing patterns (`TuneAudioPlayer.tsx`, already-installed `sharp`) with documented safe-usage parameters already specified in STACK.md and PITFALLS.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Context7 + official docs verified for all four new capabilities; npm registry checked for exact current versions; grounded in direct codebase inspection of what's already installed |
| Features | MEDIUM-HIGH | Patterns are well-established web conventions verified against existing codebase precedent; the Resend Audiences/Broadcasts specifics are WebSearch-sourced (multiple independent sources, not Context7-line-by-line) |
| Architecture | HIGH | Every recommendation anchors to a specific file in the live `src/` tree — no external ecosystem research needed, this is integration research into known code |
| Pitfalls | HIGH | Grounded in direct inspection of this repo's code, `.env.production`, PM2/docker state, and live `free -h`/VPS memory — not generic advice; email deliverability and sharp-memory sources are MEDIUM (WebSearch/community) but cross-checked against official docs and GitHub issues |

**Overall confidence:** HIGH

### Gaps to Address

- **Airtable Backup/Historical field shapes are unverified** — ARCHITECTURE.md and PITFALLS.md both independently flag that the actual Airtable field type (lookup vs. real per-record data) must be confirmed via a live API field dump before schema design, not assumed from the field's display name. Handle in Phase 5 as the literal first step, before writing any schema or migration code.
- **VPS Node version for `resend@6.18.1` (requires ≥20) is unconfirmed** — STACK.md flags this as a check to run before install; if the VPS is on an older LTS, this blocks the dependency and needs either a Node upgrade or a pinned older `resend` version. Handle at the start of Phase 2.
- **Whether `precenting_sets`/`set_items` store tune references by numeric ID (hardcoded FK) vs. relational join** is unconfirmed — affects whether the slug migration (Phase 5) needs a transition window where both `/tunes/[id]` and `/tunes/[slug]` resolve, or whether redirects alone suffice. Audit the schema as part of Phase 5 before finalizing the redirect-only approach.
- **CLAUDE.md's stack table incorrectly states tune JPGs are in Cloudflare R2** — they are actually local git-ignored files in `public/tunes/`. This stale doc should be corrected as part of (or before) Phase 6, since trusting the doc could cause someone to skip the mandatory backup step.

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/resend` — audiences/create, contacts/create, broadcasts/create, Next.js App Router send examples
- Context7 `/lovell/sharp` — `.jpeg()` options, `sharp.concurrency()`, `sharp.cache()`
- Direct repository inspection (`src/**`, `package.json`, `.env` key inventory, `next.config.ts`, `scripts/migrate-double-length.ts`, `scripts/migrate-airtable.ts`) across all four research files
- Direct VPS state inspection (`pm2 list`, `free -h`, `git check-ignore public/tunes`) — 2026-07-29
- [sharp Performance docs](https://sharp.pixelplumbing.com/performance/) and [Trying to understand sharp memory usage · Issue #349 · lovell/sharp](https://github.com/lovell/sharp/issues/349)
- [Next.js official docs — `redirects()`](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects) and [`generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [SoundCloud HTML5 Widget API docs](https://developers.soundcloud.com/docs/api/html5-widget) and [SoundCloud oEmbed docs](https://developers.soundcloud.com/docs/oembed)
- `npm view resend / react-markdown / remark-gfm / sharp` — exact versions and peer/engine requirements, 2026-07-29

### Secondary (MEDIUM confidence)
- WebSearch on Resend Audiences/Broadcasts newsletter subscribe/unsubscribe patterns (multiple independent tutorials, consistent findings)
- WebSearch on Resend SPF/DKIM/DMARC domain-verification setup (two independent guides, cross-checked)
- PM2 fork-mode in-memory rate-limiting restart-reset behavior — synthesized from community sources, independently verified against this project's actual `pm2 list` fork-mode output

### Tertiary (LOW confidence)
- None flagged — all four research files rated their overall confidence MEDIUM or higher, with no single-source/unvalidated claims carried into this summary.

---
*Research completed: 2026-07-29*
*Ready for roadmap: yes*
