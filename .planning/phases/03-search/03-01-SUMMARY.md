---
phase: 03-search
plan: "01"
subsystem: database
tags: [fts, gin-index, schema, migration, shadcn, test-scaffold]
dependency_graph:
  requires: []
  provides: [topics-data-correct, gin-indexes, schema-topicType-description, shadcn-input, shadcn-skeleton, test-scaffolds]
  affects: [03-02, 03-03, 03-04]
tech_stack:
  added: []
  patterns: [GIN full-text index, onConflictDoUpdate idempotent migration, TDD scaffold stubs]
key_files:
  created:
    - tests/search.test.ts
    - tests/explore.test.ts
    - tests/tune-grid.test.ts
    - src/components/ui/input.tsx
    - src/components/ui/skeleton.tsx
  modified:
    - scripts/migrate-airtable.ts
    - src/db/schema.ts
decisions:
  - "migrate-airtable.ts uses r.get('Topic (Psalm)') not r.get('Name') — verified via Airtable Meta API; correct field name is 'Topic (Psalm)'"
  - "GIN indexes created with COALESCE(col, '') so NULL values become empty-string tsvectors, avoiding NULL exclusion from FTS results"
  - "Test imports use 'as any' cast to allow dynamic import of not-yet-created query modules — RED scaffolds compile but fail at runtime when module is absent"
metrics:
  duration: "~5 min (work was pre-committed before this executor run)"
  completed: "2026-05-08"
  tasks_completed: 2
  files_changed: 7
---

# Phase 03 Plan 01: Wave 0 Prerequisites Summary

Wave 0 prerequisites complete: GIN FTS indexes on psalms and psalm_versions, 88 topics rows migrated with correct field name, topics schema extended with topicType and description, shadcn Input and Skeleton installed, and three TDD scaffold test files created.

## Tasks Completed

### Task 1: Fix topics migration, extend schema, create GIN indexes

**Commit:** `088e4a9`

- `scripts/migrate-airtable.ts` topics block updated to use `r.get('Topic (Psalm)')` (correct Airtable field name, not `r.get('Name')`)
- `topicType` and `description` fields added to migration upsert payload
- `src/db/schema.ts` topics table already extended with `topicType: text('topic_type')` and `description: text('description')`
- `npx drizzle-kit push` applied schema changes to live psalter-db
- GIN indexes created:
  - `idx_psalms_kjv_fts` on `psalms` using `to_tsvector('english', COALESCE(kjv_text, ''))`
  - `idx_psalm_versions_lyrics_fts` on `psalm_versions` using `to_tsvector('english', COALESCE(lyrics, ''))`
- Topics migration re-run — 88 rows now have non-null names

### Task 2: Install shadcn Input and Skeleton, create test scaffolds

**Commit:** `f5bf53e`

- `src/components/ui/input.tsx` — shadcn Input component installed via `npx shadcn add input`
- `src/components/ui/skeleton.tsx` — shadcn Skeleton component installed via `npx shadcn add skeleton`
- `tests/search.test.ts` — FTS query integration test stubs for SRCH-01 and SRCH-02 (RED state; `@/db/queries/search` not yet created)
- `tests/explore.test.ts` — Explore query integration test stubs for SRCH-03 (RED state; `@/db/queries/explore` not yet created)
- `tests/tune-grid.test.ts` — Pure function filter logic tests (4 tests, all GREEN immediately)

## Verification Results

```
topics WHERE name IS NOT NULL: 88  ✓
idx_psalms_kjv_fts present:        ✓
idx_psalm_versions_lyrics_fts:     ✓
topic_type column in topics:       ✓
description column in topics:      ✓
input.tsx exists:                  ✓
skeleton.tsx exists:               ✓
tune-grid tests: 4/4 passed        ✓
npx tsc --noEmit: exit 0           ✓
```

## Deviations from Plan

None - plan executed exactly as written.

The schema changes (`topicType`, `description`) and migration fix (`r.get('Topic (Psalm)')`) were already present in the codebase when this executor ran, having been committed in a prior session. All verification checks passed. No additional changes required.

## Known Stubs

- `tests/search.test.ts` line 8: `expect(true).toBe(true)` placeholder for SRCH-01 psalm number validation — will be replaced in Plan 03-02 when `PsalmSearchWidget` exposes `validatePsalmNumber`
- `tests/search.test.ts` lines 16-34: dynamic import of `@/db/queries/search` — RED state until Plan 03-02 creates this module
- `tests/explore.test.ts` lines 6-38: dynamic import of `@/db/queries/explore` — RED state until Plan 03-02 creates this module

These stubs are intentional — they define the expected contract for Plan 02 to implement.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundaries introduced. GIN indexes are database-internal. Migration re-run is idempotent with data from trusted Airtable source (T-03-01: accepted).

## Self-Check: PASSED

- `088e4a9` exists in git log ✓
- `f5bf53e` exists in git log ✓
- `tests/tune-grid.test.ts` 4/4 tests pass ✓
- `topics WHERE name IS NOT NULL` = 88 ✓
- Both GIN indexes present ✓
- `topic_type` and `description` columns in topics table ✓
- `input.tsx` and `skeleton.tsx` exist ✓
- TypeScript compiles clean ✓
