---
phase: 12-psalm-selector-polish
plan: 06
subsystem: ui
tags: [react, nextjs, psalm-selector, meter-tag, testing]

# Dependency graph
requires:
  - phase: 12-04
    provides: D-GAP3 decision (stays-hidden) recorded in 12-DECISIONS.md
  - phase: 12-05
    provides: D-GAP2 tabs-off implementation (unrelated file region, no conflict)
provides:
  - Collapsed multi-version toggle boxes never render a meter tag, in either state of the "Show meter" checkbox (closes 12-VERIFICATION.md Gap 3)
  - Expanded multi-version panels always show each version's own meter, independent of the checkbox
  - data-expanded-panel test marker on the expanded panel wrapper for future plans/tests to target
affects: [12-07 (PsalmNumberBox — inherits the now-visible Gap 4b overlay on every expanded group)]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/components/PsalmListingGrid.tsx
    - src/components/PsalmListingGrid.test.tsx

key-decisions:
  - "Built the D-GAP3 stays-hidden branch: deleted the meterTag const, the [data-meter-tag] block, the groupMeterTag import, and simplified the toggle title to the plain 'Psalm N – tap to expand' form — collapsed boxes now never show a tag regardless of the checkbox"
  - "Forced showMeter={true} on every version row inside the expanded panel (was showMeter={showMeter}); the flat renderGrid and the single-version box in renderBookGrid still follow the checkbox unchanged"

patterns-established: []

requirements-completed: [PSEL-02]

# Metrics
duration: 10min
completed: 2026-08-10
---

# Phase 12 Plan 06: Gate collapsed meter tag off, force meter on in expanded panel Summary

**Closed 12-VERIFICATION.md Gap 3 by implementing the D-GAP3 "stays-hidden" branch: collapsed multi-version toggle boxes never show a meter tag under any Advanced Filters state, and expanding a group is now the only way a psalm's meter becomes visible.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-08-10T12:15:07Z
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- Removed the always-visible collapsed meter tag that Plan 02 shipped per the (now-superseded) 12-UI-SPEC.md §1 "Visibility" wording
- Made the expanded panel unconditionally show each version's meter, so opening a multi-version group is the sole way its meter information appears
- Rewrote the five PSEL-02 tests that encoded the old always-visible behaviour; the suite now fails if that behaviour ever regresses

## Task Commits

Each task was committed atomically:

1. **Task 1: Gate the collapsed tag and force meter on inside the expanded panel** - `762b12f` (fix)
2. **Task 2: Rewrite the PSEL-02 visibility tests to the corrected spec** - `c758059` (test)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/components/PsalmListingGrid.tsx` - Deleted the `meterTag` const, the `[data-meter-tag]` block, and the now-dead `groupMeterTag` import; simplified the collapsed toggle's `title` attribute; added `data-expanded-panel={id}` to the expanded panel wrapper; forced `showMeter={true}` on the expanded panel's version rows
- `src/components/PsalmListingGrid.test.tsx` - Replaced the PSEL-02 `describe` block's five tests with: no tag when collapsed+off, plain title when no tag, never a tag when collapsed+on (covers psalms 6/119/136), meter visible in expanded panel when off, meter visible in expanded panel when on

## Decisions Made

**D-GAP3 branch built: `stays-hidden`.** Per `.planning/phases/12-psalm-selector-polish/12-DECISIONS.md`, the developer's corrected spec ("re-appears when checked - but only for the individual versification (when expanded), no meter shown when collapsed") reduces to `stays-hidden`, not `reappears` — the collapsed/closed toggle box shows no meter tag regardless of the "Show meter" checkbox state. Only the expanded panel's individual version rows show meter, and now do so unconditionally (independent of the checkbox) rather than only when the checkbox happened to be on.

## Deviations from Plan

None - plan executed exactly as written. Both branch selections (Edit 1's `stays-hidden` deletion path, Edits 2-3's shared "both branches" path) matched the plan's instructions verbatim.

## Known Side Effect — Flagged for Plan 07

**Forcing `showMeter={true}` inside the expanded panel makes 12-VERIFICATION.md Gap 4b (the raw meter string overlaying the psalm number in a 56px `PsalmNumberBox`) visible on every expanded multi-version group now, instead of only when "Show meter" was separately ticked.** This is intentional sequencing per this plan's `<context>`: Plan 07 owns Gap 4 and `PsalmNumberBox.tsx`, and lands immediately after this plan on top of this exact code. This plan deliberately did not touch `PsalmNumberBox.tsx`, the expanded panel's grid column sizing, or any box height — `git diff --stat src/components/PsalmNumberBox.tsx` is empty, confirmed in verification. Plan 07 should expect Gap 4b to be reproducible on every expanded group (e.g. Psalm 6, 119, 136) as its starting state, not just under the old checkbox-gated condition.

## Verification Results

- `npx vitest run src/components/PsalmListingGrid.test.tsx src/lib/meter-abbrev.test.ts` — 37/37 passed (15 + 22)
- `npx tsc --noEmit` — zero errors in `PsalmListingGrid.tsx`
- `grep -nE 'TODO|FIXME|XXX|HACK|PLACEHOLDER' src/components/PsalmListingGrid.tsx` — no matches
- `git diff --stat src/components/PsalmNumberBox.tsx` — empty (untouched, confirmed out of scope for this plan)
- `git diff --stat src/lib/meter-abbrev.test.ts src/lib/meter-abbrev.ts` — empty (abbreviation library untouched, 22/22 still green)

## Self-Check: PASSED

- FOUND: src/components/PsalmListingGrid.tsx (modified, contains `data-expanded-panel`)
- FOUND: src/components/PsalmListingGrid.test.tsx (modified, contains 2 `data-expanded-panel` references)
- FOUND commit 762b12f in git log
- FOUND commit c758059 in git log

## Next Steps

Plan 12-07 addresses 12-VERIFICATION.md Gap 4 (including Gap 4b, now visible on every expanded group by design) inside `PsalmNumberBox.tsx`.
