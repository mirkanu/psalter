---
phase: 05-precentor-portal
plan: 01
subsystem: precentor-portal
tags: [schema, dependencies, nav, test-stubs, dnd-kit, drizzle]
dependency_graph:
  requires: []
  provides:
    - precenting_sets table in psalter-db
    - set_items table in psalter-db
    - dnd-kit packages installed
    - shadcn Calendar component
    - Precent nav item
    - Wave 0 vitest stubs (RED) for PREC-01, PREC-02, PREC-03
    - Wave 0 Playwright fixme stubs for PREC-03, PREC-04, PREC-05, PREC-06
  affects:
    - src/db/schema.ts (new tables + relations)
    - src/components/SiteHeader.tsx (Precent nav link)
    - package.json (dnd-kit, drizzle-kit, date-fns, react-day-picker)
tech_stack:
  added:
    - "@dnd-kit/core@6.3.1"
    - "@dnd-kit/sortable@10.0.0"
    - "@dnd-kit/utilities@3.2.2"
    - "react-day-picker@^10.0.1 (transitive via shadcn Calendar)"
    - "date-fns@^4.4.0 (transitive via shadcn Calendar)"
    - "drizzle-kit@0.31.10 (dev, reinstalled — was missing due to NODE_ENV=production)"
  patterns:
    - Drizzle pgTable with FK cascade for set_items → precenting_sets
    - Drizzle relations API (one/many)
    - Wave 0 test stubs: vitest RED + Playwright fixme pattern
key_files:
  created:
    - src/components/ui/calendar.tsx
    - src/app/api/precent/route.test.ts
    - src/app/api/precent/[id]/items/route.test.ts
    - src/app/api/precent/[id]/reorder/route.test.ts
    - tests/precent-reorder.spec.ts
    - tests/precent-detail.spec.ts
    - tests/precent-sing.spec.ts
  modified:
    - src/db/schema.ts (precentingSets + setItems tables + relations appended)
    - src/components/SiteHeader.tsx (Precent nav link added)
    - package.json (dnd-kit + drizzle-kit + calendar deps)
    - package-lock.json
decisions:
  - "drizzle-kit was in package.json devDependencies but not installed on disk — NODE_ENV=production suppresses dev dep installation; fixed by running npm install --include=dev"
  - "shadcn Calendar added react-day-picker and date-fns as transitive production dependencies"
metrics:
  duration_seconds: 1015
  completed_date: "2026-06-15"
  tasks_completed: 3
  files_created: 7
  files_modified: 4
---

# Phase 05 Plan 01: Precentor Portal Foundation Summary

**One-liner:** Phase 5 foundation established — dnd-kit + shadcn Calendar installed, precenting_sets + set_items pushed to live psalter-db, Precent nav link added, and all 6 Wave 0 test stubs created (3 vitest RED + 3 Playwright fixme).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install dnd-kit + shadcn Calendar | 58ca76e | package.json, package-lock.json, src/components/ui/calendar.tsx |
| 2 | Add precenting_sets + set_items schema + DB push | 6117315 | src/db/schema.ts, package.json, package-lock.json |
| 3 | Precent nav item + Wave 0 test stubs | d50083a | SiteHeader.tsx, 6 test files |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] drizzle-kit not installed despite being in package.json**
- **Found during:** Task 2 — `npx drizzle-kit push` failed with "Cannot find module 'drizzle-kit'"
- **Issue:** `NODE_ENV=production` in the shell environment suppresses devDependency installation. drizzle-kit was listed in devDependencies but npm skipped it on all prior installs.
- **Fix:** Ran `npm install drizzle-kit@0.31.10 --include=dev` to force installation under the production NODE_ENV. Also added drizzle-kit entry to devDependencies in package.json (it was already there; lock file updated).
- **Files modified:** package.json, package-lock.json
- **Commit:** 6117315

## Known Stubs

The following Wave 0 stub files are intentionally incomplete — they will be wired in later plans:

| File | Type | Turns GREEN in |
|------|------|----------------|
| src/app/api/precent/route.test.ts | vitest RED | Plan 02 |
| src/app/api/precent/[id]/items/route.test.ts | vitest RED | Plan 03 |
| src/app/api/precent/[id]/reorder/route.test.ts | vitest RED | Plan 04 |
| tests/precent-reorder.spec.ts | Playwright fixme | Plan 04 |
| tests/precent-detail.spec.ts | Playwright fixme | Plan 03 |
| tests/precent-sing.spec.ts | Playwright fixme | Plan 05 |

These are intentional Wave 0 scaffolds — the 3 vitest files will fail on module import until their owning plan creates the route handlers. The 3 Playwright files use `test.fixme` and do not fail the suite.

## Threat Flags

No new security-relevant surface introduced. T-05-00 and T-05-04 from the plan's threat model are addressed:
- DDL is additive-only (two new tables, no drops or modifications to existing tables)
- `onDelete: 'cascade'` on set_items.set_id prevents orphan rows

## Self-Check: PASSED

- [x] src/components/ui/calendar.tsx exists
- [x] src/db/schema.ts contains `export const precentingSets = pgTable('precenting_sets'`
- [x] src/db/schema.ts contains `export const setItems = pgTable('set_items'`
- [x] `SELECT to_regclass('precenting_sets')` returns non-null
- [x] `SELECT to_regclass('set_items')` returns non-null
- [x] src/components/SiteHeader.tsx contains `href: "/precent"`
- [x] All 6 Wave 0 stub files exist
- [x] tests/precent-sing.spec.ts contains 2 test.fixme blocks
- [x] Commits 58ca76e, 6117315, d50083a all present in git log
