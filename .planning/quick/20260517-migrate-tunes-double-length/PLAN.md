---
quick_id: 260517-u35
slug: migrate-tunes-double-length
date: 2026-05-17
files_modified:
  - src/db/schema.ts
  - drizzle/0XXX_double_length.sql (generated)
  - scripts/migrate-double-length.ts (new, throwaway)
---

# Quick Task: Migrate Airtable `Double length` → `tunes.double_length`

## Why

Phase 4.9.5 surfaced this as the #1 upstream prerequisite for the alignment-implementation seed. Without a `double_length` boolean on `tunes`, the rendering engine cannot detect DCM tunes (Old 44th, Petersham, etc.) and the live DCM mis-render bug cannot be fixed.

## Steps

1. **Schema:** add `doubleLength: boolean('double_length').default(false).notNull()` to `tunes` in `src/db/schema.ts`.
2. **Migration:** `npx drizzle-kit generate` → review SQL → `npx drizzle-kit migrate` (or equivalent push command, depending on project convention).
3. **Backfill script:** `scripts/migrate-double-length.ts` — fetches all Tunes from Airtable (base `appY3dB1EHtex0fUJ`), reads the `Double length` field, updates each `tunes` row by `airtable_id`. Idempotent.
4. **Verify:** count of `tunes.double_length=true` in Postgres == count of `Double length=true` rows in Airtable. List the DCM-flagged tune names for user spot-check.

## Acceptance

- New column exists in `tunes` table.
- Postgres row count with `double_length=true` matches Airtable.
- Old 44th and Petersham (the doc's named DCM candidates) are flagged `true` — sanity check.
- Migration committed atomically; script can be re-run safely.
