# Stack Research

**Domain:** v2.0 Public Beta additions — transactional/broadcast email, batch JPEG compression, inline admin authoring, third-party audio embed
**Researched:** 2026-07-29
**Confidence:** HIGH (Context7 + official docs verified for all four capabilities; npm registry checked for exact current versions)

> This file supersedes the v1.0-era STACK.md (2026-05-07, abcjs/Next.js/Drizzle foundation research). Those decisions are validated and unchanged — see PROJECT.md "Target Stack (achieved)". This research is scoped strictly to the four NEW capabilities in the v2.0 Public Beta milestone.

## Context: what's already installed

`sharp@^0.34.5` is **already a devDependency** in `package.json` (used at build/migration time already). `react`/`react-dom` are 19.2.4, Next.js is actually `16.2.5` in `package.json` (CLAUDE.md's "Next.js 15" is stale — App Router APIs used below are unchanged across that bump). Better Auth session helpers already exist at `src/lib/precent-auth.ts` (`getSessionOr401()`, `session.user.role === 'admin'` checks) — reuse this exact pattern for changelog admin-gating, don't invent a new auth helper.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `resend` (npm) | **6.18.1** | Transactional email (feedback → owner) + audience/broadcast email (changelog subscribers) | One SDK covers both needs in this milestone. Free tier = 3,000 transactional emails/mo (100/day cap) **and separately** unlimited sends to up to 1,000 marketing contacts — both live under the same free account, no second product to provision. Already listed in Stack Registry pattern (`{PROJECT}_RESEND_API_KEY`) used elsewhere in the GSD infra, so provisioning is a known, repeatable step (see `stackRegistry.js`). |
| `sharp` (npm) | **0.35.3** (installed: `^0.34.5`, minor bump optional) | Batch JPEG re-compression of 172 scanned score images | Already installed as a devDependency — no new package needed, only a new script. Native libvips binding, fastest Node image library, and its `mozjpeg`/`quality` options give fine control to preserve notation legibility. Runs as a one-off CLI script (`scripts/compress-tune-images.ts`), not a runtime dependency, so it never touches the production request path or the app's RAM budget. |
| `react-markdown` | **10.1.0** | Render stored changelog Markdown as HTML on the public `/changelog` page | Zero-config, no `dangerouslySetInnerHTML`, actively maintained, tiny (no VDOM diffing tricks, just AST→React). Peer requirement `react >= 18` — satisfied by React 19.2.4 already in use. |
| `remark-gfm` | **4.0.1** | GitHub-flavoured Markdown (tables, strikethrough, autolinks) as a `react-markdown` plugin | Changelog entries will want bullet lists, bold, links, maybe a table for "what changed" — GFM covers all of it without extra syntax the admin has to learn. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-email/render` | 2.1.0 (optional peer of `resend`) | Render JSX email templates instead of raw HTML strings | **Skip for this milestone.** Two email types (feedback notification, changelog broadcast) are simple enough for plain HTML template-literal strings passed to `resend.emails.send({ html })`. `@react-email/render` is an *optional* peer of `resend` (confirmed via `npm view resend peerDependenciesMeta`) — add it later only if email templates grow complex enough to need component reuse. Adding it now is unnecessary build weight for two short emails. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| None new | — | No new dev tooling needed. The compression script uses the already-installed `sharp` devDependency; email and changelog code paths reuse existing Drizzle/Better Auth/Next.js tooling. |

## Installation

```bash
# Core
npm install resend react-markdown remark-gfm

# sharp is already installed (devDependency) — optional version bump:
npm install -D sharp@latest
```

No other packages are required for this milestone's four capabilities.

## Capability-by-capability detail

### 1. Email — Resend (feedback notification + changelog broadcast/audience)

**Package:** `resend@6.18.1`, Node engine requirement `>=20` (verify VPS Node version matches — check `node -v` before deploy; if VPS runs Node 18 this blocks the upgrade path entirely and needs resolving first).

**Two distinct Resend primitives needed:**
- **Transactional send** (`resend.emails.send`) — for the feedback form. One call, `to: 'manuelkuhs@gmail.com'`, no audience involved.
- **Audiences + Broadcasts** (`resend.audiences.create`, `resend.contacts.create`, `resend.broadcasts.create`) — for changelog subscribers. Create one Audience ("Changelog Subscribers") once (manually via Resend dashboard or a one-off script), then:
  - Subscribe flow: homepage/changelog email input → route handler calls `resend.contacts.create({ audienceId, email, unsubscribed: false })`.
  - Publish flow: when an admin publishes a changelog post, server action calls `resend.broadcasts.create({ audienceId, from, subject, html, send: true })`.

**Integration with existing stack:**
- `RESEND_API_KEY` goes in `/home/services/.env.production` as `PSALTER_RESEND_API_KEY` (project-scoped, per global CLAUDE.md convention) and is loaded into the PM2 process the same way other psalter secrets already are.
- Feedback route (`src/app/api/feedback/route.ts`) — add a `resend.emails.send(...)` call after the existing `db.insert(feedbackSubmissions)`, wrapped in try/catch so an email failure never blocks the DB write (the whole point of the current DB-first design is that feedback isn't lost if email breaks).
- Rate limiting the feedback form (explicit v2.0 requirement) — **do not add a rate-limiting package.** This is a single PM2 process (not serverless, not multi-instance), so an in-memory `Map<ip, timestamp[]>` sliding-window check (~15 lines) inside the route handler is sufficient and has zero footprint. It resets on PM2 restart, which is an acceptable tradeoff for a low-traffic personal-use feedback form.
- Audience ID and contacts table: **no new Postgres table needed for subscriber storage** — Resend's Audience *is* the subscriber list (with built-in unsubscribe links via `{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag). Only store the `audienceId` as a constant/env var, not per-subscriber rows in Postgres. This avoids a sync problem between two sources of truth.

**RAM/footprint:** Resend SDK is a thin fetch wrapper over HTTPS — negligible RAM impact, no persistent connections, no background workers.

### 2. Batch JPEG compression — sharp (already installed)

**No new package.** `sharp` is already a devDependency at `^0.34.5`; latest is `0.35.3`. This is a build-time/one-off-script tool, not a runtime dependency — it must **not** be imported anywhere in `src/app/` request paths (per project convention: static rendering on the read path).

**RAM-safe batch script pattern for the 3.7GB VPS (181Mi free / ~1.0Gi available observed):**
- Process images **sequentially in a `for` loop with `await`**, not `Promise.all()` — bounds memory to one image in flight at a time. 172 scanned score JPGs one at a time is fast enough (seconds each) that parallelism buys nothing but RAM risk.
- Call `sharp.cache(false)` at the top of the script to disable libvips' operation cache (default cache can retain decoded pixel buffers across calls, unwanted for a one-shot batch job).
- Call `sharp.concurrency(1)` to stop libvips from spinning up a thread pool per image — irrelevant when running sequentially anyway, but prevents accidental thread-pool memory growth if the loop is later parallelized.
- Use `.jpeg({ quality: 82, mozjpeg: true })` as a starting point — `mozjpeg: true` gives meaningfully smaller files than baseline libjpeg encoding at the same visual quality (verified via Context7 sharp docs), which matters more than raw quality number for preserving thin notation lines/text legibility. Test a handful of the densest scores (most ledger lines / smallest print) manually before running the full batch — pick the lowest quality that still reads clearly on a phone screen, don't blindly trust a single quality number across all 172 scans.
- **Back up originals first, unconditionally, before the script runs** — copy the existing JPG directory to a sibling `*-originals-backup/` on the same Docker named volume (or off-volume) as a plain `cp -r`, not as part of the sharp script itself. Keep this a manual pre-step, not code, so a script bug can never delete the only copy.
- Run the script standalone via `tsx scripts/compress-tune-images.ts`, not through `npm run dev`/`build` — avoids competing with the Next.js dev/build process for the ~1GB available RAM.

**What NOT to use:** Don't reach for `imagemin` or its plugin ecosystem (`imagemin-mozjpeg` etc.) — that whole toolchain is in maintenance mode, pulls in more transitive dependencies than `sharp` alone, and `sharp` already does everything needed (resize + mozjpeg-quality JPEG re-encode) with one already-installed package.

### 3. Inline changelog authoring — Drizzle table + Markdown, not a CMS

**No CMS. No rich-text editor library.** This is one admin (the site owner) writing occasional short posts — the existing `/dev/melisma-editor` precedent in this codebase (a custom Postgres-table-backed page, not a generic admin panel) is the right model to repeat, and PROJECT.md already explicitly ruled out a general admin CMS (Directus/NocoDB) as out of scope.

**Recommended shape:**
- New Drizzle table, e.g. `changelogPosts` (`id`, `slug`, `title`, `bodyMarkdown` text, `publishedAt` timestamp nullable, `createdAt`, `updatedAt`) — same style as the other ~28 tables already in `src/db/schema.ts`.
- Public `/changelog` page: Server Component queries published posts, renders `bodyMarkdown` through `react-markdown` + `remark-gfm`.
- Inline authoring: on the same `/changelog` route, if `getSessionOr401()` (reused from `src/lib/precent-auth.ts`) succeeds and `session.user.role === 'admin'`, render an "Edit"/"New post" affordance that swaps the rendered Markdown for a `<textarea>` bound to the raw `bodyMarkdown`, with a "Preview" toggle that re-uses the same `react-markdown` renderer client-side. Save via a Server Action or a small route handler that does an authenticated `db.update`/`db.insert` — mirrors the existing `precenting_sets` admin-gated mutation pattern already in the codebase.

**Why not a WYSIWYG editor (Tiptap/Lexical/Slate):** Only one person authors changelog posts, and Markdown syntax for a short "what changed" post (bullets, bold, a link) is trivial to hand-write. A WYSIWYG editor is real added complexity (selection/serialization state, SSR-safety concerns similar to what abcjs already requires client-only handling for) for a feature that will be used a handful of times per milestone. If post volume or author count grows later, `@uiw/react-md-editor` (split-pane Markdown editor+preview, ~single component, no schema/plugin system) is the next reasonable step up — not a full editor framework.

**RAM/footprint:** `react-markdown` + `remark-gfm` only run where used (public changelog page + admin preview), not globally — negligible server RAM impact since Markdown parsing is cheap and per-request.

### 4. SoundCloud embed — no package, direct iframe (oEmbed optional)

**No SDK needed.** SoundCloud's widget iframe URL is a stable, documented, unauthenticated public pattern:
```
https://w.soundcloud.com/player/?url=<url-encoded-track-url>&color=%23ff5500&auto_play=false&show_comments=true
```
This can be built directly from a stored SoundCloud track URL (new nullable column on `tunes`, e.g. `soundcloudUrl`) with zero server-side fetch, which fits the project's static-rendering convention (`generateStaticParams`, no runtime DB queries on the read path) — the iframe `src` is just string interpolation at build time.

**oEmbed is an optional enhancement, not a requirement:** `https://soundcloud.com/oembed?format=json&url=<track_url>` (no auth/API key, CORS-enabled) returns metadata (title, the same iframe `html`, dimensions) if the "embed player" trigger wants to show a track title without hand-entering it. If used, fetch it once at data-entry time (e.g. when the admin pastes a SoundCloud URL) and cache the returned title in the `tunes` row — never fetch oEmbed at page-render time, that would violate the static-rendering rule and add an external-network dependency to every page load.

**What NOT to use:** Skip `react-soundcloud-embed`/`react-soundcloud-widget`-style npm wrappers — they're thin, sparsely maintained wrappers around exactly the iframe URL pattern above, and add a dependency for something that's three lines of template-string code.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `resend` Audiences/Broadcasts for changelog subscribers | Self-managed subscriber table + `resend.emails.send` in a loop | If subscriber count ever needs custom segmentation logic beyond what one Audience supports, or if you want subscriber data queryable in your own Postgres for other features. For a beta with 2-3 testers, Resend's built-in Audience is simpler and handles unsubscribe compliance for free. |
| Plain HTML template strings for emails | `@react-email/components` + `@react-email/render` | If email templates grow to need shared headers/footers/branding across many email types — worth the extra dependency once there are 4+ distinct emails, not for 2. |
| In-memory rate limiter (hand-rolled) | `@upstash/ratelimit` + Upstash Redis | Only if the app moves to multi-instance/serverless deployment where in-memory state can't be shared across instances. Single PM2 process on one VPS doesn't need this. |
| `react-markdown` + `remark-gfm` render-only | `@uiw/react-md-editor` (editor + live preview in one component) | If changelog authoring UX needs a proper split-pane editor rather than textarea+toggle — reasonable upgrade later, not needed for MVP. |
| Direct SoundCloud widget iframe URL | SoundCloud oEmbed fetch per page render | Only if you need SoundCloud-hosted metadata (title, waveform image) to always stay in sync automatically rather than being cached at data-entry time. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| A headless CMS (Directus, Sanity, Payload, Contentful) for the changelog | Massive overkill for one admin writing occasional short posts; PROJECT.md already explicitly scoped a general admin UI out for this exact reason (`/dev/melisma-editor` precedent) | One Drizzle table (`changelogPosts`) + Markdown textarea gated by existing Better Auth admin role check |
| Tiptap / Lexical / Slate rich-text editors | Adds significant client-side state/serialization complexity and SSR-safety handling (similar burden to abcjs) for a feature used a handful of times per milestone by one author | `react-markdown` (render) + plain `<textarea>` (edit) |
| `imagemin` + plugin ecosystem for JPEG compression | Maintenance-mode project, more transitive dependencies than needed; `sharp` (already installed) does the same job with mozjpeg quality | `sharp` with `.jpeg({ quality, mozjpeg: true })` |
| `@upstash/ratelimit` or any Redis-backed rate limiter | Requires provisioning external infra (Upstash account or a Redis container) for a single-process, low-traffic feedback form | Hand-rolled in-memory sliding-window Map in the route handler |
| `react-soundcloud-embed` / similar npm iframe wrappers | Thin, sparsely-maintained wrappers around a documented public iframe URL pattern | Direct `https://w.soundcloud.com/player/?url=...` iframe `src` string |
| Fetching SoundCloud oEmbed at page-render time | Violates the project's static-rendering convention (no runtime fetches on the read path) and adds an external network dependency to every page load | Cache track metadata (or just the URL) in Postgres at data-entry time; build the iframe URL statically |
| Promise.all() over all 172 images in the compression script | Risks a RAM spike decoding many large scanned JPGs concurrently on a VPS with ~1GB available RAM | Sequential `for` loop with `await`, one image in flight at a time |

## Stack Patterns by Variant

**If the VPS Node version is below 20 at deploy time:**
- `resend@6.18.1` requires Node `>=20`. Check `node -v` on the VPS before adding the dependency — if it's on an older Node LTS, either upgrade Node for the psalter PM2 process first, or pin to an older `resend` major version compatible with the installed Node (check `npm view resend@<version> engines` for the last version supporting your Node).

**If changelog volume grows beyond occasional short posts:**
- Move from raw `<textarea>` to `@uiw/react-md-editor` for a nicer split-pane authoring experience, still without a full editor framework.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `resend@6.18.1` | Node `>=20` | Confirmed via `npm view resend engines`. Verify VPS Node version before install. |
| `react-markdown@10.1.0` | `react >=18` | Confirmed via `npm view react-markdown peerDependencies`; satisfied by installed React 19.2.4. |
| `resend@6.18.1` | `@react-email/render` (optional peer, not installed) | Confirmed via `npm view resend peerDependenciesMeta` — `{ optional: true }`. Safe to omit; only needed if switching from HTML strings to JSX email templates later. |
| `sharp@^0.34.5` (installed) → `0.35.3` (latest) | Node-API native module, no React/Next coupling | Devdependency only; never imported in `src/app/` runtime code. |

## Sources

- Context7 `/websites/resend` — audiences/create, contacts/create, broadcasts/create, Next.js App Router send examples, rate limiting note (5 req/s default per team)
- Context7 `/lovell/sharp` — `.jpeg()` options (`quality`, `mozjpeg`, `chromaSubsampling`), `sharp.concurrency()`, `sharp.cache()`, `limitInputPixels`
- `npm view resend / react-markdown / remark-gfm / sharp` — exact current versions and peer/engine requirements (2026-07-29)
- https://resend.com/docs/knowledge-base/account-quotas-and-limits (via WebFetch) — free tier: 100/day, 3,000/mo transactional; unlimited sends to up to 1,000 marketing contacts, same account, separate quota mechanisms — MEDIUM-HIGH confidence (fetched directly, cross-checked against WebSearch summaries of Resend's pricing page)
- https://developers.soundcloud.com/docs/oembed (via WebFetch) — oEmbed endpoint shape, no auth required, CORS-enabled — HIGH confidence, official docs
- Codebase inspection: `package.json`, `src/lib/precent-auth.ts`, `src/app/api/feedback/route.ts`, `src/db/schema.ts` — existing patterns to reuse (Better Auth session gating, DB-first-then-email-best-effort pattern, Drizzle table conventions)

---
*Stack research for: CPRC Psalter v2.0 Public Beta — email, image compression, changelog authoring, audio embed*
*Researched: 2026-07-29*
