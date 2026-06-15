---
phase: 05-precentor-portal
plan: 05
subsystem: precent
tags: [precenting-mode, precentingbar, playwright, singing-view, amber-nav]
dependency_graph:
  requires: [05-01, 05-02, 05-03, 05-04]
  provides: [precenting-mode-route, precentingbar-component, wave0-specs-green]
  affects: [src/app/precent, src/components/precent, tests/precent-*.spec.ts]
tech_stack:
  added: []
  patterns: [RSC-force-dynamic, amber-boundary-nav, playwright-node-script]
key_files:
  created:
    - src/components/precent/PrecentingBar.tsx
    - src/app/precent/[id]/sing/[pos]/page.tsx
    - src/app/precent/[id]/sing/[pos]/loading.tsx
  modified:
    - tests/precent-detail.spec.ts
    - tests/precent-reorder.spec.ts
    - tests/precent-sing.spec.ts
    - src/components/ui/calendar.tsx
decisions:
  - "Wave 0 specs converted from @playwright/test (not installed) to Node.js scripts matching tune-notation.spec.ts pattern — no test runner change needed"
  - "SET_ID=9 fixture set created with psalm 23 + psalm 100 (2 items) for deterministic boundary-arrow assertions"
  - "buildTuneOption typed as returning AlternateTune (not a superset) — phraseShapeOverride accessed by SingingView via its own type cast, not in AlternateTune"
metrics:
  duration: 35
  completed: "2026-06-15"
  tasks: 2
  files: 7
---

# Phase 05 Plan 05: Precenting Mode + Wave 0 Playwright Specs GREEN Summary

Precenting mode route (PREC-05 + PREC-06): amber PrecentingBar + /precent/[id]/sing/[pos] RSC page replicating the /psalms/[id] data pipeline, with boundary-aware navigation and abcjs play control; all three Wave 0 Playwright specs converted to passing Node.js assertions.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | PrecentingBar + RSC page + loading | b4def2e | PrecentingBar.tsx, sing/[pos]/page.tsx, sing/[pos]/loading.tsx |
| 2 | Build, deploy, Wave 0 specs GREEN | b9d90f2 | 3 test specs, calendar.tsx fix |

## What Was Built

**PrecentingBar** (`src/components/precent/PrecentingBar.tsx`): `'use client'` component with amber `h-10 bg-amber-100` bar. ChevronLeft/Right arrows navigate `prev/next` psalm in the set. Boundary arrows use `invisible pointer-events-none` (not `hidden`) to preserve layout width at first/last positions.

**Precenting-mode RSC page** (`src/app/precent/[id]/sing/[pos]/page.tsx`): `force-dynamic`, no `generateStaticParams`. Fetches the set with ordered items, resolves 1-based URL `pos` to 0-based index, calls `notFound()` on missing set or item. Replicates the full `/psalms/[id]/page.tsx` data pipeline: `fetchPsalmDetail` → active version selection (first/primary, no slug letters) → `buildTuneOption` → `fetchTunesByMeter` → `getEditoriallyLinkedTuneIdsForPsalm` → `fetchPsalmListRows` → lyrics/lyricsStructured/stanzaMeter/versePartLabel. Tune override: if `item.tuneId` is set, prefers assigned tune from `alternateTunes`. Renders `<PrecentingBar>` above `<SingingView>` with `prevSlug={null}` / `nextSlug={null}` to disable psalm-level navigation (amber bar owns set navigation).

**Loading skeleton** (`src/app/precent/[id]/sing/[pos]/loading.tsx`): amber `h-10 bg-amber-50 animate-pulse` bar prepended above the standard `PsalmDetailLoading` skeleton structure.

**Playwright specs** — all three converted from `test.fixme` stubs:
- `precent-detail.spec.ts`: asserts heading, ≥1 row, "Add Psalm" button, "Start Precenting" link — 4/4 pass
- `precent-reorder.spec.ts`: asserts ≥2 rows + `aria-label="Drag to reorder"` handles — 2/2 pass
- `precent-sing.spec.ts`: asserts "Precenting Mode" label, "1 / 2" counter, `invisible` back arrow at pos=1, `data-notation-body`, `data-singing-play`; also verifies pos=2 shows "2 / 2" with invisible forward arrow — 7/7 pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing `calendar.tsx` build error**
- **Found during:** Task 2 `npm run build`
- **Issue:** `src/components/ui/calendar.tsx` line 90 used key `table` which does not exist in `react-day-picker v10` `ClassNames` type — correct key is `month_grid`
- **Fix:** Renamed `table:` to `month_grid:` on line 90
- **Files modified:** `src/components/ui/calendar.tsx`
- **Commit:** b9d90f2

**2. [Rule 3 - Pattern] Converted specs from `@playwright/test` to Node.js script pattern**
- **Found during:** Task 2 spec writing — `@playwright/test` package is not installed; existing `tune-notation.spec.ts` uses raw `playwright` Node.js script pattern
- **Fix:** Wrote all three specs as Node.js scripts using `require('/usr/lib/node_modules/playwright')`, matching project convention
- **No files modified from plan** — same test file paths, functionally equivalent assertions

## Known Stubs

None — the precenting-mode route is fully wired with live DB data.

## Threat Flags

None — `/precent/[id]/sing/[pos]` adds no new trust boundary beyond what was already introduced by `/precent/[id]` in plan 04. `setId` and `position` receive `parseInt` + `isNaN` + `notFound()` guards (T-05-11 mitigated).

## Self-Check: PASSED
- `src/components/precent/PrecentingBar.tsx` — FOUND
- `src/app/precent/[id]/sing/[pos]/page.tsx` — FOUND
- `src/app/precent/[id]/sing/[pos]/loading.tsx` — FOUND
- Commit b4def2e — FOUND
- Commit b9d90f2 — FOUND
- All 3 Playwright specs pass (13 assertions, 0 failures)
