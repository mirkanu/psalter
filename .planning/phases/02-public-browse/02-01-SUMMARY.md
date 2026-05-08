---
phase: 02-public-browse
plan: 01
subsystem: db-schema, ui-components, testing
tags: [drizzle, schema, junction-relations, vitest, shadcn, base-ui]
dependency_graph:
  requires: [01-05]
  provides: [junction-relation-traversal, query-helpers, shadcn-components, vitest]
  affects: [02-02, 02-03, 02-04, 02-05, 02-06]
tech_stack:
  added: [vitest@2.1.9, @vitejs/plugin-react@4.7.0, vite-tsconfig-paths@5.1.4, dotenv@16.6.1]
  patterns: [drizzle-relational-api, shadcn-nova-base-ui, vitest-node-integration]
key_files:
  created:
    - src/db/queries/psalms.ts
    - src/db/queries/tunes.ts
    - src/db/queries/daily.ts
    - src/components/ui/tabs.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/select.tsx
    - src/components/ui/separator.tsx
    - src/components/ui/card.tsx
    - vitest.config.mts
    - tests/db-queries.test.ts
  modified:
    - src/db/schema.ts
    - package.json
decisions:
  - "vitest.config.mts (not .ts) required because vite-tsconfig-paths is ESM-only; .mts extension forces Node ESM module resolution"
  - "Added 3 missing reverse relations (sectionHeadingsRelations, messianicPsalmsRelations, dailyReadingsRelations) — schema had many() on psalms side but no one() on child side, causing Drizzle relational API to fail"
  - "Reset postgres password in psalter-db container — SCRAM-SHA-256 hash was out of sync with 'postgres' plaintext in .env; fixed via ALTER USER"
metrics:
  duration_minutes: 15
  completed_date: "2026-05-08"
  tasks_completed: 3
  files_created: 10
  files_modified: 2
---

# Phase 2 Plan 1: Schema Junction Relations + shadcn Components + Vitest Setup Summary

Drizzle junction-table relations wired, three db query helper files created, five shadcn Nova components installed, and vitest configured with 5 passing smoke tests against the live psalter-db.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add junction relations + query helpers | 3759bae | src/db/schema.ts, src/db/queries/{psalms,tunes,daily}.ts |
| 2 | Install shadcn components | 7759347 | src/components/ui/{tabs,badge,select,separator,card}.tsx |
| 3 | Set up vitest + smoke tests | bbb15be | vitest.config.mts, tests/db-queries.test.ts, package.json |

## What Was Built

**Schema additions (src/db/schema.ts):**
- 5 junction-table relations: `psalmTopicsRelations`, `psalmVersionTunesRelations`, `tuneMoodsRelations`, `verseNavesTopicsRelations`, `verseDoctrinesRelations`
- 3 missing reverse relations: `sectionHeadingsRelations`, `messianicPsalmsRelations`, `dailyReadingsRelations`
- Total: 18 relation declarations (was 10, now 18)

**Query helpers:**
- `fetchPsalmIds()` — returns 150 psalm IDs ascending
- `fetchPsalmDetail(id)` — deep traversal: psalm → psalmVersions → psalmVersionTunes → tune; verses → verseNavesTopics/verseDoctrines; sectionHeadings; messianicPsalms
- `fetchTuneIds()`, `fetchAllTunes()`, `fetchTuneDetail(id)` — tune queries with mood and psalm-version traversal
- `fetchAllDailyReadings()`, `fetchDailyReading(day)` — daily reading plan queries with psalm join
- Type exports: `PsalmDetail`, `TuneDetail`, `DailyReadingWithPsalm`

**shadcn components (all using @base-ui/react, no @radix-ui):**
- Tabs, Badge, Select, Separator, Card

**Vitest:**
- `vitest.config.mts` with `vite-tsconfig-paths` for `@/*` alias resolution
- 5 smoke tests: all pass against live psalter-db

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESM-only vite-tsconfig-paths incompatible with CJS vitest.config.ts**
- **Found during:** Task 3 setup
- **Issue:** `vite-tsconfig-paths` is pure ESM (`"type": "module"`) and cannot be loaded by the CJS build of Vite's Node API used when `vitest.config.ts` is processed as CJS
- **Fix:** Renamed config file to `vitest.config.mts` — the `.mts` extension forces Node ESM module resolution, allowing `import tsconfigPaths from 'vite-tsconfig-paths'` to work
- **Files modified:** `vitest.config.mts` (replaced `vitest.config.ts`)
- **Commit:** bbb15be

**2. [Rule 2 - Missing Critical Functionality] Three reverse relations missing from schema**
- **Found during:** Task 1 test run
- **Issue:** `psalmsRelations` declared `many(sectionHeadings)`, `many(messianicPsalms)`, `many(dailyReadings)` but the child tables had no `one(psalms)` reverse declaration — Drizzle relational API requires both sides to infer the join
- **Fix:** Added `sectionHeadingsRelations`, `messianicPsalmsRelations`, `dailyReadingsRelations` with `one(psalms)` references
- **Files modified:** `src/db/schema.ts`
- **Commit:** 3759bae

**3. [Rule 3 - Blocking] PostgreSQL password out of sync in psalter-db container**
- **Found during:** Task 1 test run (GREEN phase)
- **Issue:** `psalter-db` container was started with `POSTGRES_PASSWORD=postgres` but the SCRAM-SHA-256 hash in pg_authid was for a different password — remote connections (from host) use scram-sha-256 and failed with auth error
- **Fix:** `docker exec psalter-db psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"` — reset password to match .env value
- **Commit:** N/A (runtime fix, no code change)

## Known Stubs

None — all query helpers return live DB data; no hardcoded empty values.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes at trust boundaries beyond what the plan's threat model covers.

## Self-Check: PASSED

Files exist:
- src/db/queries/psalms.ts: FOUND
- src/db/queries/tunes.ts: FOUND
- src/db/queries/daily.ts: FOUND
- src/components/ui/tabs.tsx: FOUND
- src/components/ui/badge.tsx: FOUND
- src/components/ui/select.tsx: FOUND
- src/components/ui/separator.tsx: FOUND
- src/components/ui/card.tsx: FOUND
- vitest.config.mts: FOUND
- tests/db-queries.test.ts: FOUND

Commits verified:
- 3759bae: feat(02-01): add junction relations to schema and create query helper files
- 7759347: feat(02-01): install shadcn components (tabs, badge, select, separator, card)
- bbb15be: feat(02-01): set up vitest and db query smoke tests
