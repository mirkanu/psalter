---
phase: 01-foundation
reviewed: 2026-05-07T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - docker-compose.yml
  - next.config.ts
  - drizzle.config.ts
  - src/db/index.ts
  - src/db/schema.ts
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/lib/utils.ts
  - src/components/ui/button.tsx
  - components.json
  - scripts/migrate-airtable.ts
  - scripts/download-tunes.ts
  - scripts/verify-migration.ts
findings:
  critical: 4
  warning: 6
  info: 4
  total: 14
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-07T00:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

The foundation layer covers Docker configuration, the Drizzle ORM schema, database client setup, and three migration scripts. The schema and migration logic are generally well-structured with a clear two-pass strategy and idempotent upserts. However, several critical issues exist: hardcoded credentials in docker-compose, no connection pooling cap exposing the app to connection exhaustion, the migration script leaving the Postgres client open on error, and a TUNES_DIR path mismatch between the two scripts that will silently serve broken image paths. Several warnings address data-integrity gaps in the schema and missing error handling in scripts. Infrastructure boilerplate (page.tsx, layout.tsx metadata) is still the create-next-app placeholder.

---

## Critical Issues

### CR-01: Hardcoded database password in docker-compose.yml

**File:** `docker-compose.yml:9`
**Issue:** `POSTGRES_PASSWORD: postgres` is a well-known default credential committed to source control. Per the project CLAUDE.md, the root Postgres password must come from `/home/services/.env.production` as `POSTGRES_PASSWORD`. This credential is used for ALL VPS Postgres instances and must not be overridden with a static string in a project compose file.
**Fix:**
```yaml
services:
  db:
    environment:
      POSTGRES_DB: psalter
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # sourced from /home/services/.env.production
    ...

# At top-level or via env_file:
env_file: /home/services/.env.production
```

---

### CR-02: Unbounded postgres.js connection pool — connection exhaustion risk

**File:** `src/db/index.ts:7`
**Issue:** `postgres(process.env.DATABASE_URL!)` is called with no connection limit. postgres.js defaults to 10 connections per client instance, but in Next.js App Router every module instantiation in development (or across serverless function instances in production) can open a fresh pool. Without `max` capped and a global singleton guard, hot-reload cycles or concurrent requests can exhaust the PostgreSQL `max_connections` (default 100), returning `FATAL: remaining connection slots are reserved`. The single `psalter-db` container is particularly vulnerable.
**Fix:**
```typescript
// src/db/index.ts
const sql = postgres(process.env.DATABASE_URL!, {
  max: 5,          // hard cap per Next.js worker
  idle_timeout: 20,
  connect_timeout: 10,
})
```
For Next.js specifically, add a module-level singleton to prevent pool multiplication across hot reloads:
```typescript
const globalForDb = globalThis as unknown as { _sql?: ReturnType<typeof postgres> }
const sql = globalForDb._sql ?? postgres(process.env.DATABASE_URL!, { max: 5 })
if (process.env.NODE_ENV !== 'production') globalForDb._sql = sql
```

---

### CR-03: Migration script leaves Postgres connection open on error path

**File:** `scripts/migrate-airtable.ts:555-558`
**Issue:** The top-level `.catch` handler calls `client.end()` without `await`. postgres.js `client.end()` is async; calling it fire-and-forget means the process may exit before the connection is gracefully closed, potentially causing protocol-level errors or connection leaks on the server side. More critically, if `main()` throws during an intermediate migration step, partial data is written with no rollback and no clear indication of which tables succeeded — but this is the intended idempotent design. The only bug is the unawaited `client.end()`.
**Fix:**
```typescript
main().catch(async (err) => {
  console.error('Migration failed:', err)
  await client.end()
  process.exit(1)
})
```

---

### CR-04: TUNES_DIR path mismatch between download-tunes.ts and verify-migration.ts causes silent broken image URLs

**File:** `scripts/download-tunes.ts:10` vs `scripts/verify-migration.ts:128`
**Issue:** `download-tunes.ts` defaults `TUNES_DIR` to `/app/public/tunes` (the Docker container path). `verify-migration.ts` defaults it to `/data/home/psalter/public/tunes` (the host path). When the migration script runs in-container and the verify script runs on the host without `TUNES_DIR` set, the verify script will find files at the host path but the app will serve them from the container path — which is correct. However, if the migration runs on the host (e.g., during local development via `npx tsx`), files land at `/app/public/tunes` on the host filesystem (which does not exist), and the downloaded URL `/tunes/<filename>` is stored in the database pointing to a non-existent file. The mismatch means local development runs will produce stored paths that cannot be verified.
**Fix:** Align the default in both files to the same value, or document that `TUNES_DIR` must always be set explicitly:
```typescript
// download-tunes.ts — remove the fallback or align with verify-migration.ts
const TUNES_DIR = process.env.TUNES_DIR ?? './public/tunes'

// verify-migration.ts line 128 — same default
const TUNES_DIR = process.env.TUNES_DIR ?? './public/tunes'
```

---

## Warnings

### WR-01: No DATABASE_URL guard — process crashes with unhelpful error if env var is absent

**File:** `src/db/index.ts:7`, `scripts/migrate-airtable.ts:25`, `scripts/verify-migration.ts:20`
**Issue:** All three files use `process.env.DATABASE_URL!` (non-null assertion). If `DATABASE_URL` is absent (missing `.env`, wrong working directory, CI environment), the runtime error is a postgres.js connection failure deep in the stack — not a clear "DATABASE_URL is not set" message. In the Next.js app this crashes the first DB call at request time, not at startup.
**Fix:**
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}
const sql = postgres(process.env.DATABASE_URL, { max: 5 })
```

---

### WR-02: `onConflictDoUpdate` for `psalms` does not update the `id` column — silent stale ID if psalm number changes in Airtable

**File:** `scripts/migrate-airtable.ts:149-158`
**Issue:** The conflict target is `airtableId`. The `set` clause updates `book`, `bibleTitle`, `haddingtonIntro`, `kjvText`, and `author` — but NOT `id` (the psalm number). If an Airtable record's `Psalm` text field is corrected (e.g., a typo is fixed), the re-run will match on `airtable_id` and silently skip updating the `id`. This would leave a psalm stored under the wrong number, breaking URL routing and all FK references.
**Fix:**
```typescript
.onConflictDoUpdate({
  target: schema.psalms.airtableId,
  set: {
    id: sql`excluded.id`,   // add this line
    book: sql`excluded.book`,
    // ...
  },
})
```

---

### WR-03: `normaliseMeter` regex silently truncates valid multi-letter abbreviations

**File:** `scripts/migrate-airtable.ts:34`
**Issue:** The regex `/\(([A-Z]{1,4})[,\s)]/` captures 1 to 4 uppercase letters between a `(` and a `,`, space, or `)`. This works for `CM`, `LM`, `SM`. However, it will fail — returning the full raw string — for any meter where the parenthetical abbreviation is not immediately followed by `,`, space, or `)`, such as hypothetical entries like `(6.6.8.6)` or any non-standard format. More importantly, meters that have no parenthetical at all (e.g., a meter stored simply as `"CM"`) will not match and will be stored verbatim. The fallback `raw.trim()` is acceptable for those cases, but the verify script only checks for the exact string `"Common Meter (CM, 86 86)"` — it does not catch all un-normalised values.
**Fix:** Add a pre-match for already-normalised abbreviations to avoid double-processing:
```typescript
function normaliseMeter(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // Already a short abbreviation
  if (/^[A-Z]{1,4}(\.[0-9]+)*$/.test(trimmed)) return trimmed
  const match = trimmed.match(/\(([A-Z]{1,4})[,\s)]/)
  return match ? match[1] : trimmed
}
```

---

### WR-04: `migrateVerses` casts `r.get('Verse')` directly to `number | null` without validation

**File:** `scripts/migrate-airtable.ts:260`
**Issue:** `verseNumber: r.get('Verse') as number | null` applies a TypeScript cast with no runtime check. If Airtable returns the field as a string (e.g., `"3"`) or an unexpected type, it is silently stored as-is. For an `integer` column in Postgres this could cause an insertion error at runtime. Other numeric fields (e.g., `verseStart` in `migrateSectionHeadings` line 338, `dayNumber` in `migrateDailyReadings` line 362) have the same pattern.
**Fix:**
```typescript
verseNumber: typeof r.get('Verse') === 'number' ? r.get('Verse') as number : null,
```

---

### WR-05: `psalmVersionToPsalmIdMap` only populated when `psalmId !== null` — service items referencing psalm versions with no psalm linkage silently get `psalmId: null`

**File:** `scripts/migrate-airtable.ts:244`
**Issue:** `if (psalmId !== null) psalmVersionToPsalmIdMap.set(r.id, psalmId)` — if a Scottish Psalter record has no linked psalm (orphaned version record in Airtable), the map has no entry for that record's ID. In `migrateServiceItems` (line 496), a missing entry returns `null` for `psalmId`, so the service item is inserted with `psalm_id = NULL`. This is not guarded against in the schema (the FK is nullable) and no warning is emitted. The effect is silent data loss for any service items tied to orphaned psalm versions.
**Fix:** Add a warning log when a psalm version has no psalm linkage:
```typescript
if (psalmId !== null) {
  psalmVersionToPsalmIdMap.set(r.id, psalmId)
} else {
  console.warn(`  Psalm version ${r.id} has no linked psalm — service items referencing it will have null psalm_id`)
}
```

---

### WR-06: `layout.tsx` metadata is the create-next-app placeholder — shipped to production as-is

**File:** `src/app/layout.tsx:15-18`
**Issue:** `title: "Create Next App"` and `description: "Generated by create next app"` will be rendered in `<title>` and `<meta name="description">` on every page of `psalter.gsdlabs.dev`. This is incorrect and actively harmful for SEO and browser tab identification. The font variable used is `--font-geist-sans` but globals.css maps `--font-sans` to `var(--font-sans)` and the layout applies `geistSans.variable` as `--font-geist-sans` — this variable is referenced nowhere in globals.css's `@theme inline` block, which declares `--font-sans: var(--font-sans)` (self-referential, no-op). The Geist font is effectively not connected to the CSS variable system.
**Fix:**
```typescript
export const metadata: Metadata = {
  title: 'CPRC Scottish Psalter',
  description: 'Scottish Psalter — psalms, tunes, and daily readings for CPRC congregation.',
}
```
And in layout.tsx, apply the font correctly:
```tsx
<html lang="en" className={`${geistSans.variable} ${geistMono.variable} ...`}>
```
Then in globals.css update the theme mapping:
```css
--font-sans: var(--font-geist-sans);
```

---

## Info

### IN-01: `src/app/page.tsx` is the unmodified create-next-app scaffold

**File:** `src/app/page.tsx:1-65`
**Issue:** The home page renders the Next.js default template including Vercel and Next.js logos, deploy links, and "To get started, edit the page.tsx file." text. This is placeholder content that should be replaced with a Psalter landing page in Phase 2 at the latest, but it is noted here because it is currently what users see at `psalter.gsdlabs.dev`.
**Fix:** Replace with a minimal Psalter landing page or a redirect to `/psalms`.

---

### IN-02: `next.config.ts` is empty — missing `images.remotePatterns` for future R2 URLs and Cloudflare

**File:** `next.config.ts:3-5`
**Issue:** The config is a no-op stub. When Phase 4 introduces `next/image` loading from Cloudflare R2 or any external host, it will throw `Invalid src prop` errors at runtime because no `remotePatterns` are configured. Adding the pattern early prevents a breaking runtime error later.
**Fix:**
```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
    ],
  },
}
```

---

### IN-03: `drizzle.config.ts` uses non-null assertion on `DATABASE_URL` without validation

**File:** `drizzle.config.ts:8`
**Issue:** `url: process.env.DATABASE_URL!` — same pattern as the runtime files. When `drizzle-kit generate` or `drizzle-kit push` is run without the env file loaded, the error is a non-obvious connection failure rather than a clear "DATABASE_URL not set" message. This is lower severity here because drizzle-kit is only run manually, but it wastes developer time diagnosing CI failures.
**Fix:** Consistent with WR-01, add an explicit guard or use `dotenv/config` at the top of the config file.

---

### IN-04: `button.tsx` uses `@base-ui/react/button` — diverges from standard shadcn/ui import

**File:** `src/components/ui/button.tsx:1`
**Issue:** The shadcn `style: "base-nova"` in `components.json` means components are generated using Base UI as the primitive layer instead of Radix UI. This is a valid shadcn style choice, but it means `ButtonPrimitive.Props` comes from `@base-ui/react` rather than the more commonly documented `@radix-ui/react-slot`. Developers unfamiliar with this style may attempt to apply standard shadcn/Radix patterns (e.g., `asChild`) that do not exist on Base UI primitives, causing runtime errors. This should be documented in the project CLAUDE.md so future contributors know the primitive library in use.
**Fix:** Add a note to project CLAUDE.md: "shadcn style is `base-nova` — UI primitives come from `@base-ui/react`, not `@radix-ui`."

---

_Reviewed: 2026-05-07T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
