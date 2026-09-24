# Architecture Research — v2.0 Public Beta Integration

**Domain:** Feature integration into an existing production Next.js App Router app (CPRC Psalter)
**Researched:** 2026-07-29
**Confidence:** HIGH (all findings grounded in direct inspection of the current `src/` tree — no external ecosystem research needed for this milestone)

## Scope Note

This supersedes the original 2026-05-07 `ARCHITECTURE.md` written before v1.0/v1.1 shipped (that doc's proposed schema is now stale — the real `src/db/schema.ts` has diverged substantially). This is a **subsequent-milestone integration** doc for v2.0 Public Beta, not greenfield architecture. Every recommendation below anchors to a specific file already in the repo. Line numbers are current as of this research date and will drift as code changes — treat them as pointers, not permanent citations.

---

## System Overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Public (unauthenticated)                                                 │
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ /psalms   │  │ /tunes     │  │ /changelog    │  │ SiteFooter       │    │
│  │ PsalmTabs │  │ TuneTable  │  │ (NEW)         │  │ feedback form    │    │
│  └─────┬─────┘  └─────┬──────┘  └──────┬────────┘  └────────┬─────────┘    │
│        │  NotationRendererClient (Staff/Solfège + meter-mismatch banner)  │
├────────┼──────────────┼────────────────┼───────────────────┼──────────────┤
│        │              │                │                   │             │
│  ┌─────┴──────────────┴────────────────┴───────────────────┴─────────┐   │
│  │                    API Routes (src/app/api/**)                     │   │
│  │  /api/feedback (MODIFIED — + Resend)                                │   │
│  │  /api/changelog/subscribe (NEW)                                     │   │
│  │  /api/admin/changelog (NEW, session-gated)                          │   │
│  │  /api/precent/** (existing, unchanged)                              │   │
│  └─────┬──────────────────────────────────────────────────┬───────────┘   │
├────────┼──────────────────────────────────────────────────┼───────────────┤
│  Auth (session-gated)                                       │             │
│  ┌─────┴─────┐  ┌────────────────┐                          │             │
│  │ /precent  │  │ /admin-only     │  ← changelog admin surface joins here  │
│  │ SetItemRow│  │ /feedback (RO)  │                                        │
│  └───────────┘  └────────────────┘                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  src/lib/ (pure utils)             src/db/queries/ (Drizzle reads)        │
│  meter-mismatch.ts (NEW)           tunes.ts (MODIFIED — sort, columns)    │
│  resend.ts (NEW)                   changelog.ts (NEW)                    │
│  rate-limit.ts (NEW)               precent-auth.ts / admin-auth.ts (NEW) │
│  tune-jpg-urls.ts (slug fn reused) │                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Drizzle schema.ts)          External: Resend, Airtable(RO) │
│  + changelog_posts, changelog_subscribers, tunes.* backup/historical    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | New / Modified |
|-----------|-----------------|-----------------|
| `src/lib/resend.ts` | Single Resend client instance + `sendFeedbackNotification()`, `sendChangelogBroadcast()` | NEW |
| `src/lib/rate-limit.ts` | In-memory IP+route rate limiter (single PM2 process, no Redis in stack) | NEW |
| `src/db/schema.ts` — `changelogPosts`, `changelogSubscribers` | Changelog content + email list persistence | NEW tables |
| `src/db/queries/changelog.ts` | Read/write query module for changelog domain | NEW |
| `src/app/changelog/page.tsx` + client editor | Public changelog feed; inline admin authoring when `session.user.role === 'admin'` | NEW |
| `src/app/api/admin/changelog/**` | Create/update/delete changelog posts, session+role gated | NEW |
| `src/app/api/changelog/subscribe/route.ts` | Public subscribe endpoint, writes `changelog_subscribers` | NEW |
| `src/lib/meter-mismatch.ts` | Single `isMeterMismatch(psalmMeter, tuneMeter)` predicate | NEW (extracted) |
| `src/components/precent/SetItemRow.tsx` | Consumes extracted predicate instead of inline check | MODIFIED |
| `src/components/notation/NotationRenderer.tsx` | Renders warning banner using same predicate + existing `stanzaMeter`/`tuneMeter` props | MODIFIED |
| `scripts/migrate-tune-backup-historical.ts` | One-off Airtable→Postgres backfill for the 4 real fields | NEW (mirrors `migrate-double-length.ts`) |
| `src/db/queries/tunes.ts` | Extend `fetchTunesByMeter`/`fetchAllTunes` with backup/historical columns; multi-tier sort | MODIFIED |
| `src/components/TuneTable.tsx` | Extend `psalmId`-aware sort block (lines ~183–190) to 3-tier Backup→Historical→meter ordering | MODIFIED |
| `src/lib/tune-jpg-urls.ts` — `tuneNameToSlug()` | Already-existing slug function, reused (not reinvented) for routing | REUSED, no change needed |
| `src/app/tunes/[id]/` → `src/app/tunes/[slug]/` | Slug-based tune routing with numeric-id redirect | MODIFIED (directory rename + logic) |

---

## Recommended Project Structure (deltas only)

```
src/
├── app/
│   ├── changelog/
│   │   ├── page.tsx                 # NEW — public feed + inline admin authoring
│   │   └── loading.tsx              # NEW — skeleton, matches /tunes, /psalms convention
│   ├── api/
│   │   ├── changelog/
│   │   │   └── subscribe/route.ts   # NEW — public POST, rate-limited
│   │   ├── admin/
│   │   │   └── changelog/
│   │   │       ├── route.ts         # NEW — POST create (admin-gated)
│   │   │       └── [id]/route.ts    # NEW — PATCH/DELETE (admin-gated)
│   │   └── feedback/route.ts        # MODIFIED — + Resend send + rate-limit
│   └── tunes/
│       └── [slug]/                  # RENAMED from [id]/ — page.tsx, loading.tsx
├── components/
│   ├── ChangelogEditor.tsx          # NEW — client component, inline edit affordances
│   ├── ChangelogSubscribeForm.tsx   # NEW
│   ├── MeterMismatchBanner.tsx      # NEW — public-facing banner variant (reuses lib predicate)
│   ├── TuneTable.tsx                # MODIFIED — sort tiers, slug hrefs, exportCsv columns
│   └── precent/SetItemRow.tsx       # MODIFIED — imports lib/meter-mismatch
├── db/
│   ├── schema.ts                    # MODIFIED — 2 new tables + tunes/serviceItems columns
│   └── queries/
│       ├── changelog.ts             # NEW
│       └── tunes.ts                 # MODIFIED — new columns, new sort logic
├── lib/
│   ├── resend.ts                    # NEW
│   ├── rate-limit.ts                # NEW
│   ├── meter-mismatch.ts            # NEW
│   ├── admin-auth.ts                # NEW — extracted from ad hoc checks in admin-only/feedback/page.tsx
│   └── tune-jpg-urls.ts             # UNCHANGED — tuneNameToSlug() reused by tune slug routing
└── scripts/
    └── migrate-tune-backup-historical.ts   # NEW — one-off, mirrors migrate-double-length.ts
```

### Structure Rationale

- **`src/lib/` stays flat** — the existing convention (35+ files, no subfolders) is deliberate; don't introduce `src/lib/email/` as a nested dir. Follow suit: `resend.ts`, `rate-limit.ts`, `meter-mismatch.ts`, `admin-auth.ts` sit alongside `auth.ts`, `precent-auth.ts`.
- **`src/lib/admin-auth.ts` is a new extraction, not a new pattern.** Today, admin-gating is inlined ad hoc in `src/app/admin-only/feedback/page.tsx` (`if (!session || session.user.role !== 'admin') redirect('/login')`). Once the changelog admin surface needs the *same* check (both as a page guard and inside 2+ API routes), inline duplication becomes a real DRY violation — extract now, matching the existing `getSessionOr401`/`canAccessSet` shape already established in `src/lib/precent-auth.ts` (which is scoped to the precenting-sets domain and shouldn't be stretched to cover changelog).
- **`src/app/tunes/[id]/` → `src/app/tunes/[slug]/` is a rename, not a new route family.** Next.js dynamic segments accept any string; the existing `generateStaticParams`/`generateMetadata`/page shape is preserved, only the param source and lookup change.

---

## Architectural Patterns

### Pattern 1: Extract-then-consume for the meter-mismatch check

**What:** Pull the 4-line inline boolean out of `SetItemRow.tsx` into a pure, unit-testable function; both existing precentor UI and new public notation UI import it.

**Current inline logic** (`src/components/precent/SetItemRow.tsx:66-69`):
```typescript
const isMismatch =
  psalmMeter != null &&
  item.tune?.meter != null &&
  psalmMeter.trim().toUpperCase() !== item.tune.meter.trim().toUpperCase()
```

**Recommended `src/lib/meter-mismatch.ts`:**
```typescript
export function isMeterMismatch(
  psalmMeter: string | null | undefined,
  tuneMeter: string | null | undefined,
): boolean {
  if (!psalmMeter || !tuneMeter) return false
  return psalmMeter.trim().toUpperCase() !== tuneMeter.trim().toUpperCase()
}
```

**Why this is a clean extraction, not a redesign:** `src/components/notation/NotationRenderer.tsx` **already receives both `stanzaMeter` and `tuneMeter` as props** (`NotationRendererProps`, lines 47-63) — the data is already threaded through to exactly the two public consumer surfaces that need the banner (`src/components/PsalmTabs.tsx` and `src/components/singing/SingingView.tsx`, both of which already import `NotationRendererClient`). No new prop plumbing is required — only a banner render using the same predicate.

**Trade-off:** The existing check silently returns `false` when either meter is `null` (SetItemRow's `!= null` guards) — preserve that exact semantic in the extracted function so behavior doesn't change for the precentor portal.

### Pattern 2: One-off Airtable backfill script (established convention)

**What:** `scripts/migrate-double-length.ts` is the canonical template for a single-field Airtable→Postgres backfill: fetch all records from one Airtable table, `db.update(...).where(eq(tunes.airtableId, airtableId))` per record, log a summary count at the end. `scripts/migrate-tune-backup-historical.ts` should follow this exact shape for the 4 real fields (2 field pulls from `Tunes`, plus `Psalm & Tune CPRC` for the lookup pair).

**When to use:** Any remaining Airtable-sourced field that hasn't made it into Postgres yet (there will likely be more after this milestone — Backlog Phase 999.1 is explicit about this).

**Verification required before writing schema:** The milestone brief describes "CPRC 2024 backup" / "CPRC historical" as **lookups** on the `Psalm & Tune CPRC` (→ `serviceItems`) join table. In Airtable, a "lookup" field type is a read-only mirror of a field on a *linked* record — it is not new data, it's a display convenience. Before adding columns to `serviceItems`, inspect the live Airtable field config (`r.get('CPRC 2024 backup')` in a throwaway script, check what table it's actually linked to) to confirm whether this lookup mirrors a `Tunes`-level field (in which case no new `serviceItems` column is needed — join at query time instead) or introduces genuinely per-service-item data. Don't assume the schema from the field name alone; `migrate-double-length.ts`'s `console.log` diagnostic pattern is the right way to confirm before committing to a column design.

### Pattern 3: Admin-role-gated inline content editing (new pattern, no strong precedent)

**What:** The closest existing precedent for "edit content on the same page you view it" is `/dev/melisma-editor` (`MelismaEditorClient.tsx`), but that surface is gated by URL obscurity (`/dev/*`) rather than Better Auth session, and it's a heavy dedicated editor UI, not inline-on-a-public-page editing.

**Recommended shape for `/changelog`:** Server component `page.tsx` fetches session server-side (`auth.api.getSession`) alongside the published posts, passes `isAdmin: boolean` down to a client component (`ChangelogEditor.tsx` or inline in a `ChangelogFeed.tsx`). When `isAdmin`, render editable affordances (edit/delete buttons per post, an "add post" composer) that call the new `/api/admin/changelog/**` routes. When not admin, render the same feed read-only. This avoids a route split (`/changelog` vs `/admin-only/changelog`) since the milestone explicitly asks for *inline* authoring on the public page, and keeps SEO/static-friendliness for the 99% of visitors who aren't admin.

**Trade-off:** Because `/changelog` needs to know `isAdmin` at request time, it cannot be a purely static-rendered page (breaks the "Static rendering" hard rule in CLAUDE.md for *fully public* pages, but that rule is scoped to psalm/tune pages specifically — `/changelog` should follow the same `force-dynamic` pattern already used by `/admin-only/feedback/page.tsx` and `/api/feedback/route.ts`).

### Pattern 4: Pure-derivation slugs, not stored slug columns (established convention)

**What:** `src/lib/psalm-slugs.ts` derives psalm slugs from data at request time (`deriveVersionSlug`) rather than storing a `slug` column. `src/lib/naves-slugs.ts` does the same for Nave's topics, with a `Map<id, slug>` + `-<id>` disambiguation suffix for collisions. `src/lib/tune-jpg-urls.ts` **already has `tuneNameToSlug()`** and it's already load-bearing — it's how the existing JPG asset filenames on disk were derived (`{slug}-staff-0.jpg`).

**For tune slug routing, reuse `tuneNameToSlug()` directly rather than inventing a second slug function or a stored column.** This guarantees the URL slug and the JPG filename slug never drift apart — a correctness win, not just a convenience.

**Recommended `src/app/tunes/[slug]/page.tsx` shape:**
```typescript
export default async function TunePage({ params }: PageProps) {
  const { slug } = await params
  if (/^\d+$/.test(slug)) {
    // Legacy numeric link — resolve id, then redirect to canonical name slug
    const tune = await fetchTuneDetail(Number(slug))
    if (!tune) notFound()
    redirect(`/tunes/${tuneNameToSlug(tune.name)}`)  // uses next/navigation redirect(), already imported elsewhere in the codebase (e.g. admin-only/feedback/page.tsx)
  }
  const tune = await fetchTuneBySlug(slug)  // NEW query: matches tuneNameToSlug(name) === slug
  if (!tune) notFound()
  // ...unchanged rendering
}
```

**`generateStaticParams` becomes slug-based:** replace `fetchTuneIds()` with a slug-producing equivalent (e.g. `fetchAllTunes().then(rows => rows.map(t => ({ slug: tuneNameToSlug(t.name) })))`), guarding against the theoretical (but with 172 unique tune names, low-probability) case of two names collapsing to the same slug — apply the same `-<id>` disambiguation suffix pattern from `naves-slugs.ts` if a collision is detected, rather than assuming uniqueness.

**Every call site building `/tunes/${tune.id}` must be updated to use the slug instead** — confirmed exhaustive list from the current tree:
- `src/components/GlobalSearch.tsx:73`
- `src/components/PsalmTabs.tsx:314` and `:430`
- `src/components/TuneGrid.tsx:171`
- `src/components/TuneTable.tsx:114` (Enter-key navigation) and `:513` (row link)

`next.config.js` static redirects are not viable here — the redirect logic needs a DB lookup to map numeric id → canonical name slug, which static `redirects()` config can't do. Keep it inline in the page component as shown above.

### Pattern 5: Transactional vs. broadcast email — two different sending shapes through one client

**What:** Feedback-notify is single-recipient, fire-and-forget, triggered synchronously inside an existing POST handler. Changelog-subscriber broadcast is one-to-many, triggered from an admin action (publish/edit a post), and needs the subscriber list from `changelog_subscribers`.

**Recommended `src/lib/resend.ts` shape:**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.PSALTER_RESEND_API_KEY)

export async function sendFeedbackNotification(input: { message: string; name: string | null; email: string | null; pageUrl: string | null }) {
  await resend.emails.send({
    from: 'CPRC Psalter <noreply@...>',        // verified sending domain required
    to: process.env.PSALTER_ADMIN_EMAIL!,       // already exists in .env — reuse, don't hardcode
    subject: 'New feedback submission',
    html: /* ... */,
  })
}

export async function sendChangelogBroadcast(post: { title: string; bodyHtml: string }, subscriberEmails: string[]) {
  // Resend batch send (or looped single sends under Resend's rate limits — check
  // current Resend API for batch endpoint support before implementing)
}
```

**Environment variable naming:** per the global VPS convention (`PROJECT_` prefix for project-scoped secrets), this should be `PSALTER_RESEND_API_KEY` — a **new key**, added to `/home/services/.env.production` and referenced in `.env`/`.env.example`, following the Stack Registry rule (check `server/gsd/provisioning/stackRegistry.js` in the dashboard repo before wiring — Resend is a known registry service per the naming pattern already listed there, `{PROJECT}_RESEND_API_KEY`).

**Failure isolation:** the feedback route currently does `db.insert(...)` then returns `{ ok: true }`. Wrap the new `sendFeedbackNotification` call so a Resend failure (e.g. API outage, quota) **does not** fail the user-facing submission — log and swallow, matching the existing `console.error` pattern in `route.ts:39` for DB failures, but don't let email delivery block the DB write path that already works.

### Pattern 6: Simple in-process rate limiting (no new infra)

**What:** The stack has no Redis/KV store and the app runs as a single PM2 process on the VPS (3.7GB RAM budget, memory-constrained per global CLAUDE.md). A dependency like `@upstash/ratelimit` would be overkill and adds an external service dependency for a personal-use, low-traffic (2-3 beta testers) app.

**Recommended:** an in-memory `Map<ip, timestamps[]>` sliding-window limiter in `src/lib/rate-limit.ts`, applied inside `/api/feedback` and `/api/changelog/subscribe`. This resets on every deploy/restart, which is an acceptable trade-off at this traffic scale — flag this explicitly as a known limitation rather than hiding it, since it's a real one if this ever needs to survive a bot attack.

**Anti-pattern to avoid:** don't reach for a new Postgres table (`rate_limit_hits`) for this — it adds write load and migration surface for a problem that in-memory state solves adequately at this scale. Reconsider only if the app moves to multi-instance/serverless deployment (not currently planned per CLAUDE.md's single-Docker-container-on-VPS deployment model).

---

## Data Flow

### Feedback-notify flow (modified)
```
SiteFooter form (client)
    ↓ POST /api/feedback
route.ts: validate → rate-limit check (NEW) → db.insert(feedbackSubmissions)
    ↓ (fire-and-forget, errors swallowed)
resend.ts: sendFeedbackNotification() → Resend API → PSALTER_ADMIN_EMAIL inbox
```

### Changelog broadcast flow (new)
```
Admin edits/publishes post on /changelog (ChangelogEditor, session.user.role === 'admin')
    ↓ POST/PATCH /api/admin/changelog(/[id])
route.ts: getAdminSessionOr403 (NEW, admin-auth.ts) → db.upsert(changelogPosts)
    ↓ on publish transition specifically (not every edit — avoid re-spamming subscribers on typo fixes)
resend.ts: sendChangelogBroadcast() → db.select(changelogSubscribers) → Resend batch send
```

### Meter-mismatch flow (unified)
```
Precentor set list (SetItemRow)         Public notation view (NotationRenderer)
    psalmMeter, item.tune.meter               stanzaMeter, tuneMeter (already props)
              ↓                                          ↓
        lib/meter-mismatch.ts::isMeterMismatch()  ← SAME function, both call sites
              ↓                                          ↓
     inline tooltip badge (existing)          new warning banner (new render branch)
```

### Tune sort flow (new tiering)
```
Airtable "Manuel CPRC backup" / "CPRC historical tune usage" / "Weighted..." (Tunes table)
    ↓ scripts/migrate-tune-backup-historical.ts (one-off, run after schema push)
tunes.backup_tune_id / tunes.historical_usage / tunes.weighted_historical_frequency (Postgres)
    ↓
db/queries/tunes.ts: fetchTunesByMeter() / fetchAllTunes() select the new columns
    ↓
components/TuneTable.tsx: psalmId-aware sort block extended —
    tier 1: tune.backupFor === psalmId
    tier 2: sort desc by weightedHistoricalFrequency
    tier 3: existing meter/name sort (unchanged)
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Duplicating the meter-mismatch check instead of extracting it

**What people do:** Copy the 4-line inline boolean from `SetItemRow.tsx` into `NotationRenderer.tsx` with slightly different null-handling, because it's "just a few lines."
**Why it's wrong:** The requirement explicitly names this as shared logic; two near-identical-but-subtly-different implementations is exactly the kind of drift that causes "why does the portal say mismatch but the public page doesn't" bug reports later.
**Do this instead:** Extract to `src/lib/meter-mismatch.ts` first (this is explicitly the correct build-order step before touching `NotationRenderer.tsx` — see Build Order below), unit test it once, import everywhere.

### Anti-Pattern 2: Building the Backup/Historical sort against guessed Airtable field shapes

**What people do:** Design the `serviceItems`/`tunes` schema columns from the English field names alone ("CPRC historical" → add a boolean column) without opening Airtable to check the actual field type (lookup vs. real data, link vs. text, single vs. multi).
**Why it's wrong:** `migrate-double-length.ts` shows the established discipline — log the raw Airtable value, confirm the shape, *then* design the column. Guessing wrong here means a second migration script and a schema patch mid-milestone.
**Do this instead:** Write a 10-line throwaway inspection script (`base('Tunes').select({maxRecords: 3}).firstPage()` + `console.log(record.fields)`) before writing `migrate-tune-backup-historical.ts` for real.

### Anti-Pattern 3: Making `/changelog` fully static when admin state is involved

**What people do:** Reflexively apply the CLAUDE.md "Static rendering... no runtime DB queries on the read path" rule to every public page, including `/changelog`.
**Why it's wrong:** That rule is scoped to psalm/tune pages in CLAUDE.md specifically because they use `generateStaticParams`. `/changelog` needs a live session check to decide whether to render admin affordances — this is architecturally the same shape as `/admin-only/feedback/page.tsx`, which is already `force-dynamic`.
**Do this instead:** Mark `/changelog` `export const dynamic = 'force-dynamic'` (matching the existing convention in `admin-only/feedback/page.tsx` and `api/feedback/route.ts`), and don't fight the framework to force static rendering on a page with session-dependent content.

### Anti-Pattern 4: A second slug-generation function for tunes

**What people do:** Write a fresh `slugifyTuneName()` in a new file because the tune-slug work "feels like" a routing concern, separate from the JPG-asset concern in `tune-jpg-urls.ts`.
**Why it's wrong:** Two slug functions for the same 172 tune names will eventually diverge (different punctuation-stripping edge cases), breaking the JPG↔route correspondence that currently holds by construction.
**Do this instead:** Import and reuse `tuneNameToSlug` from `src/lib/tune-jpg-urls.ts` for routing too. If it needs to move to a more neutrally-named file for cleanliness, that's a rename, not a rewrite — but even the rename is optional; reuse first.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Resend | New `src/lib/resend.ts` client, `PSALTER_RESEND_API_KEY` env var (add to `/home/services/.env.production` + local `.env`) | Verify sending domain in Resend dashboard before first send or emails land in spam/get rejected. Check Stack Registry (`stackRegistry.js` in gsddashboard) for existing per-project Resend key pattern before creating a new key. |
| Airtable (read-only, migration only) | Reuse existing `airtable` npm package + `AIRTABLE_PAT`/`AIRTABLE_BASE_ID` env vars already in `.env`, following `migrate-double-length.ts` pattern | This is a one-off script run, not a runtime dependency — no new ongoing Airtable coupling introduced by this milestone. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `src/lib/meter-mismatch.ts` ↔ `SetItemRow.tsx` / `NotationRenderer.tsx` | Direct function import, pure predicate | No new prop plumbing needed for `NotationRenderer` — `stanzaMeter`/`tuneMeter` props already exist. |
| `src/lib/resend.ts` ↔ `api/feedback/route.ts` / `api/admin/changelog/**` | Direct async function call, errors caught and logged, never thrown back to the HTTP response for feedback (email is best-effort); for changelog broadcast, consider whether a failed broadcast should surface to the admin UI (recommend: yes, surface a toast, since the admin explicitly triggered it) | Different failure-handling philosophy per call site — be deliberate, not uniform. |
| `src/lib/admin-auth.ts` (NEW) ↔ `admin-only/feedback/page.tsx` (existing, should be refactored to use it) / `api/admin/changelog/**` (new) | Shared session+role check, mirrors `precent-auth.ts`'s `getSessionOr401` shape | Refactoring `admin-only/feedback/page.tsx` to use the new helper is optional cleanup, not required — but doing it avoids a 3rd inline copy of the same check. |
| `scripts/migrate-tune-backup-historical.ts` ↔ `src/db/schema.ts` | Script runs against Drizzle schema; **schema push (`npm run db:push`) must happen before the script runs**, and the script must happen before `TuneTable.tsx`/`fetchTunesByMeter` consume the new columns | Hard sequencing dependency — see Build Order. |
| `src/app/tunes/[slug]/page.tsx` ↔ all `/tunes/${tune.id}` call sites | Every hardcoded numeric-id link becomes a slug-based link; the redirect logic in the page component is the *only* place old numeric bookmarks are handled | Missing even one call site (e.g. `GlobalSearch.tsx`) means an internal link still redirects unnecessarily — not broken, but adds a hop. Worth grep-verifying after the change: `grep -rn '/tunes/\${' src`. |

---

## Recommended Build Order

Given the dependencies surfaced above, the sensible sequencing is:

1. **`src/lib/meter-mismatch.ts` extraction** (Pattern 1) — zero external dependencies, unblocks both the `SetItemRow.tsx` refactor and the new notation-view banner. Do this first; it's low-risk and immediately useful as a foundation for item 2.
2. **Meter-mismatch banner in `NotationRenderer.tsx`** — depends on (1). No schema or migration dependency, can ship independently of everything else.
3. **Airtable field inspection + schema design** (Pattern 2's verification step) — a short throwaway script to confirm actual Airtable field types for the 4 backup/historical fields **before** writing `schema.ts` changes. This gates step 4.
4. **`schema.ts` changes + `db:push`** for the new `tunes`/`serviceItems` columns — depends on (3)'s findings.
5. **`scripts/migrate-tune-backup-historical.ts`** — depends on (4) (columns must exist to write into).
6. **`fetchTunesByMeter`/`fetchAllTunes` query updates + `TuneTable.tsx` 3-tier sort** — depends on (5) (real data must exist, or the sort has nothing to sort by — this is the explicit dependency named in the milestone brief).
7. **Numeric→name tune slug migration** (routes, redirect, all call-site updates) — independent of the backup/historical work, but touches the *same* `TuneTable.tsx` file (row links) and `fetchTuneDetail`/`fetchTuneIds` in `tunes.ts` — sequencing it **after** step 6 avoids two separate rounds of merge conflicts/re-review in the same files. Not a hard dependency, but a practical one given file overlap.
8. **`changelog_posts`/`changelog_subscribers` schema + `db/queries/changelog.ts`** — independent of everything else above; can run in parallel with steps 1-7 if using separate phases/agents.
9. **`/changelog` page + inline admin editor + admin API routes** — depends on (8).
10. **`src/lib/admin-auth.ts` extraction** — do this alongside (9), since it's the first point a *second* admin-gated surface exists (justifying the extraction) — retrofit `admin-only/feedback/page.tsx` to use it in the same pass if convenient, but not required.
11. **`src/lib/resend.ts` + feedback-notify wiring** — independent of changelog schema; can happen any time after `PSALTER_RESEND_API_KEY` is provisioned. Low risk, no dependents.
12. **`src/lib/rate-limit.ts` + wiring into `/api/feedback` and `/api/changelog/subscribe`** — depends on (9) existing (the subscribe route) for the second call site, but the limiter itself and the feedback wiring can land as soon as (11) does.
13. **Changelog-subscriber broadcast on publish** — depends on (8) [subscriber table], (9) [publish action to hook into], and (11) [Resend client] all being in place. This is the last piece to land since it's the union of the other three tracks.

**Two independent tracks can run in parallel:** {1, 2} and {3-7} (meter-mismatch + backup/historical/slug work, both centered on `TuneTable.tsx`/notation) vs. {8-13} (changelog + email, centered on new tables and new routes). Sequencing within each track matters; between tracks it mostly doesn't, except that both tracks touch `TuneTable.tsx` (track A for sort+slug, track B not at all) — no actual cross-track file conflict, they're safe to interleave.

---

## Scaling Considerations

Not meaningfully applicable — this is a personal/congregation project with 2-3 beta testers at this milestone (per PROJECT.md), single Docker container on a 3.7GB VPS. The in-memory rate limiter (Pattern 6) and single-instance assumptions throughout this doc are correct choices *at this scale* and should be revisited only if the project's traffic profile changes materially (not currently anticipated).

## Sources

- Direct inspection of `/home/services/psalter/src/**` (schema.ts, db/queries/tunes.ts, components/TuneTable.tsx, components/precent/SetItemRow.tsx, components/notation/NotationRenderer.tsx, lib/psalm-slugs.ts, lib/naves-slugs.ts, lib/tune-jpg-urls.ts, lib/precent-auth.ts, lib/auth.ts, app/api/feedback/route.ts, app/admin-only/feedback/page.tsx, app/tunes/**)
- `scripts/migrate-double-length.ts` (established one-off Airtable migration pattern)
- `.planning/PROJECT.md` (milestone goal, requirements, current state)
- `package.json` (confirms no existing Resend/rate-limit dependency; `@aws-sdk/client-s3` present for R2 but not relevant to this milestone's runtime paths)
- `.env` key inventory (confirms `PSALTER_ADMIN_EMAIL` already exists and should be reused, not hardcoded, for feedback-notify recipient)
- Global CLAUDE.md (`/home/claude/.claude/CLAUDE.md`) — Stack Registry rule, project-scoped env var naming convention, VPS memory constraints informing the rate-limit design choice

---
*Architecture research for: CPRC Psalter v2.0 Public Beta milestone*
*Researched: 2026-07-29*
