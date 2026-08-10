---
phase: 12-psalm-selector-polish
plan: 07
subsystem: ui
tags: [react, nextjs, tailwind, psalm-selector, meter-tag, layout, testing]

# Dependency graph
requires:
  - phase: 12-06
    provides: expanded multi-version panel forces showMeter=true on every version row (made Gap 4b visible on every expansion)
provides:
  - Measured, written root-cause diagnosis for both Gap 4 symptoms (both CONFIRMED, both pre-existing bugs Phase 12 merely surfaced)
  - Meter text rendered exclusively in normal document flow (the absolutely-positioned overlay mechanism is deleted from the codebase, not bypassed)
  - Three-way grid column sizing (3.5rem / 5.5rem / 7rem) so "Show meter" alone gets a measured middle column width instead of the full first-line/snippet width
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Column-width decisions derived from live-measured canvas text widths (maxLabelWidthPx + maxAbbrevWidthPx + margin), not estimated, with one documented outlier allowed to wrap rather than drive the whole column set wider"

key-files:
  created:
    - src/components/PsalmNumberBox.test.tsx
  modified:
    - src/components/PsalmNumberBox.tsx
    - src/components/PsalmListingGrid.tsx
    - src/components/PsalmListingGrid.test.tsx

key-decisions:
  - "METER_COL = 5.5rem (88px), chosen from Task 1's live measurements: maxLabelWidthPx (21px) + second-widest abbreviation width (33px, '66 66 D') + 20px margin = 74px, which fits 5.5rem/88px but not 4.5rem/72px. The single widest outlier ('10 10 10 10 10' at 62px measured) is deliberately excluded from the column-width decision and allowed to wrap onto a second line inside the now-flow-layout box, per the plan's explicit outlier-tolerance rule."
  - "Both Gap 4 root causes are pre-existing bugs (commits 1583e3af 2026-06-15 and f2e85d39 2026-07-19), not Phase 12 regressions. Phase 12 Plan 06 made Gap 4b visible on every expanded group (not just when the 'Show meter' checkbox happened to be on) by forcing showMeter=true inside the expanded panel, but did not introduce either underlying defect."

patterns-established:
  - "G7-G11 live-overlap/clipping verification pattern: compute rect-intersection via the same non-intersection formula in both Task 1 diagnosis and Task 3 re-measure, so before/after numbers are directly comparable rather than re-derived with different logic."

requirements-completed: [PSEL-02]

# Metrics
duration: 17min
completed: 2026-08-10
---

# Phase 12 Plan 07: Diagnose and fix Gap 4 (meter sizing/overlay bugs) Summary

**Measured both hypothesized root causes as CONFIRMED (both pre-existing bugs, not Phase 12 regressions), then closed them by moving meter text into normal document flow with the overlay span deleted outright, and by adding a measured middle grid-column width (5.5rem) so "Show meter" alone no longer jumps straight to the first-line-sized 7rem columns.**

## Performance

- **Duration:** ~17 min
- **Completed:** 2026-08-10T12:33:12Z
- **Tasks:** 3/3 completed
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Diagnosed both Gap 4 symptoms with real Playwright measurements before touching any code, and wrote a `regressionVerdict` tracing each cause to the specific pre-Phase-12 commit that introduced it
- Deleted the absolutely-positioned meter span from `PsalmNumberBox.tsx` entirely (the overlay mechanism no longer exists in the file, not merely bypassed by a new condition)
- Added a measured three-way column-sizing ternary (`3.5rem` / `5.5rem` / `7rem`) to `PsalmListingGrid.tsx`, applied identically to the top-level grid and the expanded multi-version panel's inner grid
- 46/46 tests green (5 new `PsalmNumberBox.test.tsx`, 4 new Gap-4 tests appended to `PsalmListingGrid.test.tsx`, all pre-existing tests still passing)
- Live re-measured all 5 gates (G7-G11) against the real dev server: zero overlaps found in 39 collapsed boxes and 2 expanded boxes, no clipping, true 44px touch targets, 3-column grid (was 2) with lower wasted space (93% vs 95%), and PSEL-03's alignment gates from Plan 05 still pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Diagnose Gap 4a and 4b with measurements before changing anything** - no commit (diagnosis-only, `git status --short src/` confirmed empty per the plan's own acceptance criterion; findings written to `/tmp/gap4-findings.json`)
2. **Task 2: Render meter in document flow and size the columns from the measurements** - `ff71ce8` (fix)
3. **Task 3: Regression tests plus a live re-measure of both symptoms** - `10811e4` (test)

**Plan metadata:** pending (docs: complete plan)

## Root-Cause Diagnosis (Task 1, measured)

### H-4a (oversized boxes when "Show meter" is checked) — CONFIRMED

`hasExpanded` included `showMeter`, switching the grid straight to `minmax(7rem,1fr)` columns, while `PsalmNumberBox.hasContent` did NOT include `showMeter`, so each box stayed in the compact branch (`h-12`, one centred number). Measured at 390x844, Book I, first box:

| State | Columns × box width | Number width | Wasted fraction |
|---|---|---|---|
| `showMeter=true` (before fix) | **2 × 155px** | 7px | **95.5%** |
| `showMeter=false` | 5 × 57px | 7px | — |

### H-4b (meter overlaying the psalm number in an expanded group) — CONFIRMED

The expanded panel's inner grid was hardcoded `minmax(3.5rem,1fr)` (~56px boxes) and the compact branch rendered the raw, unabbreviated meter string in an absolutely positioned span (`top-1 right-1.5`), which contributes zero height. Measured on psalm 6's expanded panel, first box:

- `overlap: true`
- `position: absolute` (computed style of the meter span)
- `meterText: "LM (long meter, 88 88)"` (the raw DB string, not an abbreviation)

### Regression verdict: pre-existing, not a Phase 12 regression

- The `hasExpanded`-includes-`showMeter` column-sizing line traces to commit `f2e85d39` (2026-07-19T18:58:13Z, "feat(260719-q3k): make PsalmListingGrid modal-safe").
- The absolutely-positioned compact-branch meter span traces to commit `1583e3af` (2026-06-15T07:32:29Z, "feat(05-03): make PsalmListingGrid, PsalmNumberBox, TuneGrid reusable in modals").
- Phase 12's first commit is `2752560a` (2026-08-10T08:19:09Z) — both defects predate Phase 12 by weeks. Plan 06 (12-06) made Gap 4b visible on *every* expanded group (not just when the checkbox happened to be on) by forcing `showMeter={true}` inside the expanded panel, but it did not introduce either underlying bug.

## METER_COL Arithmetic (Task 2)

Live-measured inputs from Task 1 (390x844, real DB meter values from the "Filter by meter" dropdown, canvas `measureText` at the meter span's actual computed font `10px / 10px Geist, "Geist Fallback"`):

| Raw meter | Abbreviation | Measured width (px) |
|---|---|---|
| `10 10 10 10 10` | `10 10 10 10 10` | 62 (outlier — excluded, allowed to wrap) |
| `66 66 D` | `66 66 D` | 33 (second-widest — drives the decision) |
| `87 87` | `87 87` | 25 |
| `66 66 88` | `HM` | 16 |
| `CM` | `CM` | 16 |
| `SM` | `SM` | 16 |
| `LM (long meter, 88 88)` | `LM` | 15 |

Widest psalm-number label on the page: `21px`.

Required column width (excluding the one documented outlier, which the flow-layout box is now free to wrap onto a second line): `maxLabelWidthPx (21) + secondWidestAbbrevWidthPx (33) + 20px margin = 74px`.

Candidates: `4.5rem` (72px) — fails (74 > 72). `5.5rem` (88px) — passes (74 ≤ 88). `6.5rem` (104px) — not needed.

**Chosen: `5.5rem`**, applied identically to `PsalmListingGrid.tsx`'s top-level `gridCols` ternary and the expanded panel's inner grid.

## Before/After Measurement Table (Task 1 vs Task 3, live browser, 390x844, showMeter=true)

| Gate | Metric | Before (Task 1) | After (Task 3) | Status |
|---|---|---|---|---|
| G7 | Overlap in collapsed Book I boxes | not measured (bug not yet fixed) | 39 boxes checked, 0 overlaps | PASS |
| G8 | Overlap in expanded panel (psalm 6) | `overlap: true` | 2 boxes checked, 0 overlaps | PASS |
| G9 | Expanded box clipping / touch target | not measured | 0 clipped (`scrollHeight <= clientHeight+1`), 0 boxes under 44px (`offsetHeight: 44` — see measurement note below) | PASS |
| G10 | Book I grid columns / box width / wasted fraction | `2 cols × 155px`, wastedFraction `0.9548` (95.5%) | `3 cols × 101px`, wastedFraction `0.9305` (93.0%) | PASS (more columns, less waste) |
| G11 | PSEL-03 alignment (Plan 05 gates) | n/a (unrelated to this plan) | `inputRight=334`, `gridRight=334` (diff 0 ≤ 1), no tabs shown at this viewport | PASS |

**Measurement note (G9):** `clientHeight` excludes the element's own 1px border under `box-sizing: border-box`, so a box with `min-h-[44px]` computed exactly to spec reads `clientHeight: 42`, not 44. The actual rendered/tappable size — what 12-UI-SPEC.md's 44px touch-target floor is about — is `offsetHeight` / `getBoundingClientRect().height`, which measured `44` on both expanded boxes. `min-h-[44px]` itself was not touched by this plan.

## Files Created/Modified
- `src/components/PsalmNumberBox.tsx` — imports `abbreviateMeter`; `meterLabel` computed once and gates `hasContent`; deleted the absolutely-positioned compact-branch meter span outright; content-branch meter span now carries `data-meter`, wraps (`break-words`, `min-w-0`) instead of overflowing, and the sibling number span gained `shrink-0`
- `src/components/PsalmListingGrid.tsx` — `hasExpanded` no longer includes `showMeter`; `gridCols` is now a three-way ternary (`3.5rem` / `5.5rem` / `7rem`) with all three classes written out literally for Tailwind JIT; the expanded panel's inner grid uses the same `5.5rem` value
- `src/components/PsalmNumberBox.test.tsx` (new) — 5 tests: no meter when off, abbreviation rendered with raw string never appearing, meter span never absolutely positioned, meter-alone makes the box content-bearing, HM/long numeric patterns render intact without truncation
- `src/components/PsalmListingGrid.test.tsx` — new `Gap 4 column sizing` describe block: 4 tests covering the middle/wide/narrow column states and the expanded panel's column width

## Decisions Made

See `key-decisions` in frontmatter: METER_COL = 5.5rem (arithmetic above), and the pre-existing (not Phase 12 regression) verdict for both symptoms, both settled by measurement before any code was touched, per the plan's explicit instruction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - measurement bug] Task 3's own G9 script used the wrong DOM property for the touch-target check**
- **Found during:** Task 3 live re-measure
- **Issue:** The verification script's first draft checked `clientHeight >= 44`, which reads `42` on a box with `min-h-[44px]` satisfied exactly, because `clientHeight` excludes the element's 1px `border` under `box-sizing: border-box`. This produced a false "too short" failure on every expanded box even though the actual rendered/tappable size was correct.
- **Fix:** Switched the `>=44` check to `offsetHeight` (confirmed via a targeted probe: `boxSizing: border-box`, `border: 1px`, `clientHeight: 42`, `offsetHeight: 44`, `getBoundingClientRect().height: 44`), which is what a user actually taps and what 12-UI-SPEC.md's 44px floor is about. `clientHeight` was kept for the no-clipping (`scrollHeight <= clientHeight + 1`) check since both sides of that comparison share the same content+padding box.
- **Files modified:** none (verification script only, not committed to the repo per this plan's own instruction to keep `/tmp/gap4-verify.mjs`-equivalent scripts out of the repo)
- **Verification:** Re-ran 3 times after the fix, all 3 runs showed `g9.pass: true` with `offsetHeight: 44` on both expanded boxes.

**2. [Not a code defect — plan verify-script false positive] Task 2's compound `GAP4_WIRED` grep collided with an unrelated, intentionally-unchanged line**
- **Found during:** Task 2 verification
- **Issue:** The plan's single-line verify command includes `! grep -q 'showFirstLine || showMeter ||' $G`, intended to confirm `hasExpanded` no longer includes `showMeter`. The same substring also appears in the pre-existing, unrelated `hasAdvancedFilter` computation (`const hasAdvancedFilter = showFirstLine || showMeter || showRecommendedTune || meterFilter !== 'all'`), which this plan's Edit 4 correctly left untouched — the Advanced Filters panel legitimately still needs to auto-open when "Show meter" is checked.
- **Fix:** No code change. Verified every other acceptance-criteria bullet individually instead of relying on the compound one-liner: `absolute top-1 right-1.5` count is 0, `psalm.meter}` (raw string render) count is 0, exactly three distinct `minmax(...)` values (`3.5rem`, `5.5rem`, `7rem`) present with `5.5rem` appearing twice, and `npx tsc --noEmit` reports zero errors in both files. All confirmed passing; `hasExpanded` itself (the actual variable the criterion cares about) no longer includes `showMeter`, confirmed by direct source read.
- **Files modified:** none.
- **Verification:** Manual grep of each individual acceptance-criteria bullet, all passing; documented here rather than silently ignored.

No other deviations — the plan's `<action>` edits (1-5) were applied exactly as specified, with H-4a and H-4b both CONFIRMED so the plan's own prescribed fix (not an alternate diagnosis-driven fix) applied directly.

## Live-Browser Verification (Task 1 diagnosis + Task 3 re-measure)

Both used the shared Playwright daemon (`http://localhost:3099`, `require('/home/services/playwright-daemon/client.js')`) against a verification dev server on port 3100 (`PORT=3100 npm run dev`), never `chromium.launch()`. Port 3100 confirmed free (`ss -ltn | grep 3100` → no output) at the end of both tasks.

## Verification Results

- `npx vitest run src/components/PsalmNumberBox.test.tsx src/components/PsalmListingGrid.test.tsx src/lib/meter-abbrev.test.ts` — 46/46 passed (5 + 19 + 22)
- `npx tsc --noEmit` — zero errors in `PsalmNumberBox.tsx` and `PsalmListingGrid.tsx`
- `git diff --stat src/lib/meter-abbrev.ts` — empty (Plan 02's verified library reused, not modified)
- `grep -c 'absolute top-1 right-1.5' src/components/PsalmNumberBox.tsx` — 0
- `grep -c 'psalm.meter}' src/components/PsalmNumberBox.tsx` — 0
- `grep -nE 'TODO|FIXME|XXX|HACK|PLACEHOLDER' src/components/PsalmNumberBox.tsx src/components/PsalmListingGrid.tsx` — no matches
- Live re-measure: G7-G11 all PASS (table above)

## Self-Check: PASSED

- FOUND: src/components/PsalmNumberBox.tsx
- FOUND: src/components/PsalmListingGrid.tsx
- FOUND: src/components/PsalmNumberBox.test.tsx
- FOUND: src/components/PsalmListingGrid.test.tsx
- FOUND commit ff71ce8 in git log
- FOUND commit 10811e4 in git log

## Next Steps

Phase 12's four gap-closure plans (12-04 through 12-07) are now all implemented. A fresh human re-check of the four original 12-VERIFICATION.md gaps, followed by re-running `/gsd-verify-phase 12`, is the remaining step before Phase 12 can be marked fully validated.
