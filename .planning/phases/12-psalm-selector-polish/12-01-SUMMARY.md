---
phase: 12-psalm-selector-polish
plan: 01
subsystem: frontend
tags: [psalm-selector, localStorage, sticky-header, ui-fix, jsdom-tests]
requirements: [PSEL-01, PSEL-03]
dependency-graph:
  requires: []
  provides:
    - "PsalmListingGrid.expandedIds is session-only (no cross-visit persistence)"
    - "PsalmListingGrid.stickyRightPad — isGrouped/hideExport-aware right gutter for #psalms-sticky-header"
    - "data-version-toggle test hook on multi-version toggle buttons"
  affects:
    - "src/components/PsalmListingGrid.tsx"
tech-stack:
  added: []
  patterns:
    - "jsdom vitest component tests with @vitest-environment jsdom header + next/navigation mock, matching TieredTuneRowList.test.tsx convention"
key-files:
  created:
    - src/components/PsalmListingGrid.test.tsx
  modified:
    - src/components/PsalmListingGrid.tsx
decisions:
  - "expandedIds switched from useLocalStorage to plain useState — the only behavioral change needed to stop cross-visit persistence; the other five useLocalStorage keys are untouched"
  - "stickyRightPad centralizes the sticky header's right-edge gutter logic so no two pr-*/px-* Tailwind utilities can ever collide on #psalms-sticky-header; px-4 was replaced with pl-4 so the right side is owned entirely by stickyRightPad"
  - "PSEL-03 comment near stickyRightPad was reworded to avoid repeating the literal pr-10 md:pr-0 string, so the acceptance-criteria grep count (3) matches actual occurrences instead of the 4 the plan's own verbatim comment text would have produced"
metrics:
  duration: "~25 min"
  completed: "2026-08-10"
---

# Phase 12 Plan 01: Psalm Selector Collapse-State + Sticky-Header Gutter Fix Summary

Removed cross-visit localStorage persistence of multi-version psalm-group expand state and gave the sticky search/filter header the same 40px right-edge gutter the grid below it already reserves for the fixed Book I–V nav tabs, backed by 6 new jsdom regression tests.

## What Was Built

**Task 1 — PSEL-01 (session-only expand state):** `expandedIds` in `PsalmListingGrid.tsx` no longer uses `useLocalStorage('psalms.expandedIds', {})`. It is now a plain `useState<Record<number, boolean>>({})`, so every fresh mount (reload, re-navigation, or a freshly opened `PsalmPickerModal`) starts with every multi-version group collapsed. In-session toggling (click to expand/collapse) is unaffected. A `data-version-toggle={id}` attribute was added to the toggle `<button>` as a stable test/query hook, since `aria-expanded` alone collides with the unrelated Advanced Filters button.

**Task 2 — PSEL-03 (sticky header gutter):** A new `stickyRightPad` expression, derived from `hideExport` and `isGrouped` immediately after the existing `isGrouped` declaration, resolves to:
- `pr-10 md:pr-0` in the modal (`hideExport`) branch when grouped — matches the grid wrapper's existing 40px inset.
- `pr-14 md:pr-4` in the full-page branch when grouped — 16px (existing bleed offset) + 40px (tab gutter), reverting to the original `pr-4` at `md:`.
- `''` / `pr-4` respectively when the grid is ungrouped (search active, tabs not rendered).

`#psalms-sticky-header`'s `className` now composes `stickyRightPad` via an array-join instead of a hardcoded `px-4`, and the full-page branch's `-mx-4 px-4` became `-mx-4 pl-4` so the right side is owned entirely by `stickyRightPad` — no competing `pr-*`/`px-*` utilities can land on the element.

Both tasks followed TDD: a failing jsdom test was written and committed first (RED), then the minimal fix landed to make it pass (GREEN). Final state: 6/6 tests passing in `src/components/PsalmListingGrid.test.tsx`.

**Context inherited, not part of this plan:** the file's base commit (`e86aa74`) already contained Phase 11 leftover work — the fixed Book I–V tabs no longer gated on `!hideExport`, and a `scrollToSection()` helper for scrolling inside modal scroll containers. This plan built on top of that unchanged; it is not described as Phase 12 work anywhere in these commits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's own acceptance-criteria grep count was inconsistent with its own verbatim action text**
- **Found during:** Task 2 verification
- **Issue:** The plan's `<action>` block specifies an exact comment to add above `stickyRightPad` that itself contains the literal string `` `pr-10 md:pr-0` `` (in backticks, referencing the results bar and grid wrapper). Combined with the ternary's own `'pr-10 md:pr-0'` literal and the two pre-existing occurrences (results bar, grid wrapper), the verbatim code produces 4 matches for `grep -c "pr-10 md:pr-0"`, but the plan's acceptance criteria explicitly expects `3` ("the new sticky-header value plus the two pre-existing ones").
- **Fix:** Reworded the comment to say "the same 40px mobile-only gutter" instead of repeating the literal Tailwind class string, preserving the comment's meaning while making the grep count land on 3 as the plan intended.
- **Files modified:** `src/components/PsalmListingGrid.tsx`
- **Commit:** 31174ab

No other deviations — all other acceptance criteria matched the plan exactly on first implementation.

## Known Stubs

None — this plan touches no data-fetching paths; both fixes are pure client-state-lifetime and CSS-class changes.

## Threat Flags

None — this plan's changes exactly match the threat model's disposed items (T-12-01 mitigated by removing the `useLocalStorage` call; no new network/auth/schema surface introduced).

## Verification

- `npx vitest run src/components/PsalmListingGrid.test.tsx` — 6/6 tests pass.
- `npx tsc --noEmit` — 57 pre-existing errors confirmed unrelated (all in `tests/e2e/*.spec.ts`, same count before and after this plan's changes; zero errors in either file this plan touched).
- `grep -c "psalms.expandedIds" src/components/PsalmListingGrid.tsx` → `0`.
- `grep -c "useState<Record<number, boolean>>({})" src/components/PsalmListingGrid.tsx` → `1`.
- `grep -c "useLocalStorage(" src/components/PsalmListingGrid.tsx` → `5`.
- `grep -c "data-version-toggle={id}" src/components/PsalmListingGrid.tsx` → `1`.
- `grep -c "const stickyRightPad = hideExport" src/components/PsalmListingGrid.tsx` → `1`.
- `grep -c "pr-14 md:pr-4" src/components/PsalmListingGrid.tsx` → `1`.
- `grep -c "pr-10 md:pr-0" src/components/PsalmListingGrid.tsx` → `3` (after the comment-wording fix above).
- `grep -c '"sticky top-14 z-20 bg-background py-2 -mx-4 pl-4 space-y-2"' src/components/PsalmListingGrid.tsx` → `1`.
- `grep -c -- "-mx-4 px-4" src/components/PsalmListingGrid.tsx` → `0`; `grep -c "px-4"` → `1` (the untouched Advanced Filters panel).
- `npx eslint src/components/PsalmListingGrid.tsx` — one pre-existing error (line 106, unrelated `setSelectedIndex` effect) and one pre-existing warning confirmed present before this plan's changes via `git stash` diff — no new lint issues introduced.

## TDD Gate Compliance

Both tasks followed the full RED → GREEN cycle with dedicated commits:
- Task 1: `test(12-01)` 2752560 (RED, 3 tests failing) → `fix(12-01)` 51c3570 (GREEN, 3 tests passing)
- Task 2: `test(12-01)` 245f0ad (RED, 3 new tests failing, 3 old tests still passing) → `fix(12-01)` 31174ab (GREEN, all 6 tests passing)

No REFACTOR commits were needed — both GREEN implementations were already minimal.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 2752560 | test | Add failing regression tests for PSEL-01 collapse-on-load (RED) |
| 51c3570 | fix | Stop persisting multi-version expand state across visits (GREEN) |
| 245f0ad | test | Add failing regression tests for PSEL-03 sticky header gutter (RED) |
| 31174ab | fix | Reserve the Book-tab gutter on #psalms-sticky-header (GREEN) |

## Self-Check: PASSED

- FOUND: src/components/PsalmListingGrid.tsx
- FOUND: src/components/PsalmListingGrid.test.tsx
- FOUND: .planning/phases/12-psalm-selector-polish/12-01-SUMMARY.md
- FOUND: commit 2752560
- FOUND: commit 51c3570
- FOUND: commit 245f0ad
- FOUND: commit 31174ab
