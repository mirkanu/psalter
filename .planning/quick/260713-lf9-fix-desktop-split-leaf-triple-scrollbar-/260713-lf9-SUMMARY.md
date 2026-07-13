---
phase: quick-260713-lf9
plan: 01
subsystem: ui
tags: [css, flexbox, overflow, scroll, ios, react, tailwind]

# Dependency graph
requires:
  - phase: quick-260713-kkg
    provides: asymmetric split-leaf sizing (notation flex-none content-sized/capped at 50%, lyrics flex-1 absorbs remaining space)
  - phase: quick-260712-tmm
    provides: solfège JPG capped at 50% viewport height on desktop
  - phase: quick-260712-kov
    provides: desktop staff-split byte-identical-to-inline guarantee
provides:
  - Desktop solfège split-leaf now has exactly one scroll owner (the lyrics StanzaList) instead of three nested scrollable regions
  - Solfège JPG is fully contained (object-contain) inside its capped notation slot on all axes, no crop/scroll, no 16px horizontal bleed
  - Mobile scroll-hide handler clamps scrollTop to the valid range and thresholds sub-4px deltas to absorb iOS Safari rubber-band overscroll jitter
affects: [singing-view, notation-renderer, mobile-chrome]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scroll-ownership containment: outer flex slots use overflow-hidden (non-scrolling), only the innermost content wrapper gets overflow-y-auto — prevents nested double-scroll"
    - "object-contain + flex-1 min-h-0 centering wrapper for images that must shrink-to-fit both axes inside a flex-column-capped parent"
    - "Clamp-and-threshold pattern for scroll event handlers exposed to platform-specific overscroll physics (iOS Safari rubber-band)"

key-files:
  created: []
  modified:
    - src/components/notation/NotationRenderer.tsx
    - src/components/singing/SingingView.tsx

key-decisions:
  - "capBothHalvesOnDesktop notation slot changed from overflow-y-auto to overflow-hidden + flex flex-col — it is a sizing/clipping container, not a scroll owner; the JPG is instead shrunk with object-contain"
  - "Lyrics slot changed from overflow-y-auto to overflow-hidden at the outer level — the inner StanzaList wrapper (h-full overflow-y-auto) is the sole scroll owner, eliminating the double-nested scroll"
  - "The md:h-auto md:max-h-[80vh] desktop escape hatch is dropped ONLY for the chromeless-split solfège stanzaBlock (which has a fixed-height ancestor via SingingView's md:h-[calc(100dvh-116px)]); non-chromeless callers (/tunes, /study) keep the escape hatch since they have no such ancestor"
  - "-mx-4 horizontal bleed now applies only to the full-page chromeless (non-split) solfège view; the split-leaf case never bleeds outside its slot, killing the prior 16px horizontal overflow"
  - "iOS scroll-hide fix uses clamp-then-threshold (not clamp-then-ignore-out-of-range) so that legitimate scrolls that end at the boundary still register correctly, while rubber-band overshoot beyond the boundary collapses to a stable clamped value with near-zero delta"

requirements-completed: [LF9-01, LF9-02]

# Metrics
duration: 3min
completed: 2026-07-13
---

# Phase quick-260713-lf9: Fix desktop split-leaf triple scrollbar + iOS scroll-hide bounce Summary

**Killed the double-nested scroll in the desktop solfège split-leaf view (3 scrollbars → 1) by making the outer notation/lyrics slots non-scrolling containers and contain-fitting the JPG; clamped + thresholded the mobile scroll-hide handler against iOS Safari rubber-band overscroll oscillation.**

## Performance

- **Duration:** ~3 min (two atomic edits, both self-contained CSS/logic changes)
- **Started:** 2026-07-13T15:39:00Z
- **Completed:** 2026-07-13T15:40:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Desktop solfège split-leaf: notation slot and lyrics slot are now `overflow-hidden` (non-scrolling); only the inner `StanzaList` wrapper scrolls — reduces 3 nested scrollable regions to exactly 1
- Solfège JPG in the chromeless split-leaf case is now `object-contain` inside a `flex-1 min-h-0` centering wrapper — shrinks to fit both height and width of the capped notation slot, no crop, no scroll, no horizontal bleed
- `-mx-4` negative-margin bleed (previously leaking 16px horizontally in the split-leaf slot) is now scoped only to the full-page non-split chromeless view, where edge-to-edge is intentional
- Mobile scroll-hide handler (`SingingView.tsx`) clamps `scrollTop` to `[0, scrollHeight - clientHeight]` and ignores deltas under 4px, so iOS Safari rubber-band bounce frames collapse to a stable boundary value instead of flipping the hidden/visible state rapidly

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix desktop solfège split-leaf triple scrollbar (bug 1)** - `9e3f7d2` (fix)
2. **Task 2: Clamp iOS rubber-band overscroll in the mobile scroll-hide handler (bug 2)** - `74ebf5c` (fix)

_No plan-metadata commit created by this executor — orchestrator handles STATE.md/ROADMAP.md/PLAN.md doc commits separately per task instructions._

## Files Created/Modified
- `src/components/notation/NotationRenderer.tsx` - Three edits confined to the solfège `capBothHalvesOnDesktop` split-leaf path: (A) `renderSplitLeaf` branch slots switched to `overflow-hidden` (notation slot also gains `flex flex-col`); (B) solfège `stanzaBlock` drops the `md:h-auto md:max-h-[80vh]` escape hatch only for chromeless-split; (C) solfège `mainImageBlock` JPG switched to `object-contain` with `max-h-full max-w-full` in a `flex-1 min-h-0` wrapper, `-mx-4` scoped to non-split chromeless only
- `src/components/singing/SingingView.tsx` - `handleScroll` now clamps `scrollTop` to the valid scroll range and ignores sub-4px deltas before computing `scrollingDown`, absorbing iOS rubber-band overscroll oscillation

## Decisions Made
See `key-decisions` in frontmatter above — all decisions were pre-specified in the plan's `<interfaces>` section and implemented verbatim; no new architectural decisions were required during execution.

## Deviations from Plan

None — plan executed exactly as written. All three sub-edits in Task 1 (Edit A/B/C) and the Task 2 handler replacement match the plan's `<interfaces>`/`<action>` blocks verbatim. `cn` was already imported (verified before editing per the plan's note).

## Issues Encountered

None. Both `grep` assertions and `npx tsc --noEmit -p .` (filtered to each file, excluding `tests/e2e` and pre-existing unrelated errors) passed cleanly with zero attributed errors for both `NotationRenderer.tsx` and `SingingView.tsx`.

## Verification Performed (this executor)

**Task 1 (grep + tsc only — no live rebuild in this environment):**
```
grep -n "overflow-hidden flex flex-col" NotationRenderer.tsx        → line 1098 (match)
grep -n "flex-1 min-h-0 flex items-start justify-center" ...        → line 1187 (match)
grep -n "max-h-full max-w-full w-auto h-auto object-contain" ...    → line 1199 (match)
grep -c "chromeless && !isSplit ? '-mx-4'" ...                      → 1 (match)
npx tsc --noEmit -p . | grep NotationRenderer                       → no errors
```

**Task 2 (grep + tsc only):**
```
grep -n "el.scrollHeight - el.clientHeight" SingingView.tsx  → line 390 (match)
grep -n "Math.abs(delta) < 4" SingingView.tsx                → line 397 (match)
grep -c "if (!mql.matches) return" SingingView.tsx           → 1 (mobile gate still first, unchanged)
npx tsc --noEmit -p . | grep SingingView                     → no errors
```

**NOT performed by this executor (per task constraints):**
- No `npm run build` / rebuild was run — the orchestrator performs one rebuild + live Playwright verification of Task 1 next.
- No blanket eslint gate was run on `NotationRenderer.tsx` — that file has pre-existing unrelated eslint errors (per the 260713-kkg precedent); the grep + tsc assertions above are the intentional substitute verification method for this file, as directed by the task instructions.
- **Task 2 (iOS rubber-band fix) has NO automated verification and none was attempted or claimed.** The shared Playwright daemon runs desktop-class Chromium only and cannot simulate iOS Safari's elastic/touch-based overscroll physics. The fix is justified purely by code-level reasoning against documented iOS Safari behavior (rubber-band bounce reports `scrollTop` outside `[0, scrollHeight - clientHeight]`; clamping collapses that to a stable boundary value with near-zero delta, and the 4px threshold absorbs residual jitter). **This fix requires confirmation on a real iOS device** — a human must scroll to the bottom of the lyrics list on iOS Safari (mobile Safari specifically, not desktop Chromium DevTools device emulation, which does not reproduce true rubber-band physics) and confirm the top/bottom/mini bars no longer flicker during the rubber-band bounce.

## Next Phase Readiness

- Task 1 (desktop triple scrollbar) is ready for the orchestrator's one-rebuild + live Playwright verification pass against `/psalms/78`, desktop 1200x900, Solfège + Split-Leaf — per the plan's `<verification>` section (scroll-owner count = 1, no horizontal overflow on `[data-notation-slot]`, JPG fully contained and ≤50% height, kov/kkg/tmm regression guards intact).
- Task 2 (iOS bounce fix) cannot be closed out from this environment. It remains open pending a real-device iOS Safari check by a human tester. Recommend the orchestrator/user flag this quick task as "code-complete, pending iOS device verification" rather than fully closed, until that check happens.

## Self-Check: PASSED

- FOUND: src/components/notation/NotationRenderer.tsx
- FOUND: src/components/singing/SingingView.tsx
- FOUND: .planning/quick/260713-lf9-fix-desktop-split-leaf-triple-scrollbar-/260713-lf9-SUMMARY.md
- FOUND: commit 9e3f7d2
- FOUND: commit 74ebf5c
