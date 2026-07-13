---
phase: quick-260712-tmm
plan: 01
subsystem: ui
tags: [nextjs, react, tailwind, drizzle, abcjs-adjacent-jpg-view]

requires:
  - phase: 04.9.14
    provides: split-leaf layout (staff + solfège), SingingView chrome, TuneOption/AlternateTune type
provides:
  - Desktop Solfège split-leaf JPG capped at <=50% viewport height (parity with mobile)
  - Per-tune staffPages/solfegePages threaded through fetchTunesByMeter so client-side tune switch shows the correct multi-page scan
affects: [singing-view, precent-portal, psalms-study-page]

tech-stack:
  added: []
  patterns:
    - "renderSplitLeaf(notationSlot, stanzaSlot, capBothHalvesOnDesktop) — boolean flag differentiates Solfège (capped) from Staff (uncapped) desktop geometry inside one shared helper"
    - "Server-derived fs data (deriveTuneJpgPages) attached per-row inside the shared DB query (fetchTunesByMeter) rather than per-caller, so every consumer (including out-of-plan callers) gets correct values via object spread"

key-files:
  created: []
  modified:
    - src/components/notation/NotationRenderer.tsx
    - src/db/queries/tunes.ts
    - src/components/singing/SingingView.tsx
    - src/app/psalms/[id]/page.tsx
    - src/app/precent/[id]/sing/[pos]/page.tsx

key-decisions:
  - "Solfège split-leaf desktop cap achieved by dropping the md:h-auto/md:max-h-none escape hatch entirely for the Solfège variant (not by adding a new max-h override) — percentage max-heights only resolve against a resolved parent height, so h-full must apply at all widths"
  - "staffPages/solfegePages made REQUIRED fields on AlternateTune and centralised inside fetchTunesByMeter (not per-caller) so the out-of-plan /psalms/[id]/study chain stays type-safe with zero edits"

patterns-established:
  - "When an fs-derived server-only helper needs to be available per-row to multiple RSC callers of a shared DB query, compute it inside the query function itself (map after filter) rather than duplicating the computation in each caller"

requirements-completed: [QUICK-260712-tmm-a, QUICK-260712-tmm-b]

duration: 8min
completed: 2026-07-12
---

# Phase quick-260712-tmm: Solfège split-leaf JPG cap + tune-switch fix Summary

**Desktop Solfège split-leaf JPG now capped at <=50% viewport height (was ~85%); per-tune staffPages/solfegePages now travel with each TuneOption so client-side tune switching correctly updates the displayed scan on both /psalms/[id] and /precent/[id]/sing/[pos].**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-12T21:36:09Z
- **Completed:** 2026-07-12T21:39:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Bug (a) fixed: `renderSplitLeaf()` in NotationRenderer.tsx gained a `capBothHalvesOnDesktop` flag; Solfège split-leaf call sites (both chromeless and non-chromeless) now pass `true`, dropping the `md:h-auto`/`md:max-h-none`/`md:overflow-visible`/`md:flex-none` desktop escape hatch so the 50/50 cap holds at every width. Staff split-leaf desktop geometry is untouched (defaults to `false`, byte-identical markup).
- Bug (b) fixed: `AlternateTune` now declares required `staffPages`/`solfegePages` arrays; `fetchTunesByMeter` populates them centrally via `deriveTuneJpgPages` (filter-then-map), so every consumer — `/psalms/[id]`, `/precent/[id]/sing/[pos]`, and the out-of-plan `/psalms/[id]/study` chain — receives real per-tune arrays with no per-caller duplication. `SingingView` now derives `activeStaffPages`/`activeSolfegePages` from `activeTune` (not stale page-level props), so a client-side `?tune=` switch or in-app tune-switcher selection immediately shows the newly selected tune's Solfège JPG and multi-page thumbnail strip.

## Task Commits

Each task was committed atomically:

1. **Task 1: Cap the Solfège split-leaf JPG at 50% viewport height on desktop (Bug a)** - `1e26a8f` (fix)
2. **Task 2: Thread per-tune page arrays so tune switch updates the Solfège JPG (Bug b)** - `7f781cd` (fix)

**Plan metadata:** (pending — orchestrator commits SUMMARY.md/STATE.md/PLAN.md separately per constraints)

## Files Created/Modified
- `src/components/notation/NotationRenderer.tsx` - `renderSplitLeaf` gains `capBothHalvesOnDesktop` param; Solfège call sites (both `isSplit` branches) pass `true`
- `src/db/queries/tunes.ts` - `AlternateTune` gains required `staffPages`/`solfegePages`; `fetchTunesByMeter` maps `deriveTuneJpgPages(t.name)` onto every filtered row
- `src/app/psalms/[id]/page.tsx` - `alternateTunes` map reads arrays off `t` (drops redundant local `deriveTuneJpgPages` call); `primaryTune` IIFE adds `staffPages`/`solfegePages` fields; removed the stale page-level `activeTunePages` computation and its `staffPages`/`solfegePages` props on `<SingingView>`
- `src/app/precent/[id]/sing/[pos]/page.tsx` - same `alternateTunes` map simplification; `buildTuneOption()` adds `staffPages`/`solfegePages` fields
- `src/components/singing/SingingView.tsx` - removed `staffPages`/`solfegePages` props from `Props` interface and destructure; added `activeStaffPages`/`activeSolfegePages` derived from `activeTune`; passed to `NotationRendererClient` and used in `GearPopover`'s `solfegeAvailable`

## Decisions Made
- Kept `deriveTuneJpgPages` imports in both `page.tsx` files because each still needs it for the `primaryTune`/`buildTuneOption` builders, which construct a `TuneOption` from a raw DB tune row (not via `fetchTunesByMeter`) and therefore cannot rely on the centralised population.
- Did not touch `/psalms/[id]/study/page.tsx` per the plan's explicit note — its `alternateTunes = rawAlternateTunes.map(...)` already carries `staffPages`/`solfegePages` forward via its existing spread, and its `NotationRendererClient` usage doesn't consume page arrays, so behaviour is unchanged and type-safe automatically.

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched the plan's diagnosed root causes and prescribed fixes precisely; no Rule 1-4 auto-fixes were needed.

## Issues Encountered

None. Pre-existing, unrelated TypeScript errors exist in several `tests/e2e/*.spec.ts` and `tests/*.spec.ts` files (duplicate block-scoped variable declarations across sibling spec files — confirmed present before this plan's changes via `git stash` comparison) and pre-existing ESLint `react-hooks` errors in `SingingView.tsx` (unrelated hooks, also confirmed pre-existing via `git stash` comparison). Both are out of scope per the deviation rules' scope boundary and were not touched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `npx tsc --noEmit` reports zero errors in all 5 modified files (NotationRenderer.tsx, tunes.ts, psalms/[id]/page.tsx, precent/[id]/sing/[pos]/page.tsx, SingingView.tsx).
- LIVE UAT is deferred per orchestrator instruction: the orchestrator is batching one production rebuild after all pending 260712 quick-fix tasks complete. After that rebuild, live verification via the Playwright daemon should confirm: (1) desktop Solfège split-leaf `<img>` bounding-box height <= ~50% of available vertical space (was 672.5px of ~787px; expect <= ~394px) at /psalms/78, and (2) switching to a different multi-page tune via the tune switcher updates the Solfège JPG `src` to the new tune's `-solfege-0.jpg`, on both desktop and mobile (375-wide) viewports, on both `/psalms/[id]` and `/precent/[id]/sing/[pos]`.

---
*Phase: quick-260712-tmm*
*Completed: 2026-07-12*

## Self-Check: PASSED

All 5 modified source files and the SUMMARY.md confirmed present on disk; both task commit hashes (1e26a8f, 7f781cd) confirmed present in git log.
