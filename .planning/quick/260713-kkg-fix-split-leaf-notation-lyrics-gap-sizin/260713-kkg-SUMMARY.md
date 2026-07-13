---
phase: quick-260713-kkg
plan: 01
subsystem: ui
tags: [nextjs, tailwind, flexbox, abcjs, singing-view, gear-popover]

# Dependency graph
requires:
  - phase: quick-260712-sny
    provides: scroll-hide reflow of <main> to 100dvh in chromeless split-leaf singing view
  - phase: quick-260712-tmm
    provides: solfege split-leaf JPG capped at 50% viewport height on desktop
  - phase: quick-260712-kov
    provides: desktop staff-split renders byte-identical to desktop staff-inline
  - phase: quick-260712-u4q
    provides: inline solfege disabled entirely (viewMode 'solfege' unreachable via new selections)
provides:
  - Asymmetric split-leaf sizing (notation content-sized and capped at <=50%, lyrics flex-grow to absorb >=50%) eliminating the blank gap after scroll-hide reflow
  - Solfege notation button in GearPopover always routes to solfege-split and is gated purely on solfegeSplitAvailable (never grayed out while Staff+Inline is selected)
affects: [singing-view, notation-renderer, gear-popover]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Content-sized flex slot (flex-none + max-h-[50%] + overflow-y-auto) paired with a flex-1 sibling with no max-height cap, so the sibling absorbs whatever space the content-sized slot doesn't use — instead of two flex-1 slots splitting space 50/50 regardless of content height."
    - "Width-based image sizing (w-full h-auto) delegates height capping to a definite-height flex ancestor's max-h-[50%]+overflow-y-auto, avoiding fixed dvh guesses that break across resting vs. reflowed viewport states."

key-files:
  created: []
  modified:
    - src/components/notation/NotationRenderer.tsx
    - src/components/singing/GearPopover.tsx

key-decisions:
  - "Notation slot uses flex-none (not flex-1) so it shrink-wraps to its actual SVG/JPG content height, capped at max-h-[50%]; lyrics slot keeps flex-1 with no max-height so it grows to fill whatever space the notation slot doesn't use."
  - "Chromeless solfege-split JPG sized by width (w-full h-auto) rather than a fixed dvh constant, since the outer notation slot's max-h-[50%] resolves correctly against its definite-height ancestor chain in both the resting (~38-43dvh) and reflowed (~50dvh) states."
  - "Removed solfegeAvailableForCurrentLayout derivation entirely; Solfege notation button gating now mirrors the Staff button (availability based only on whether the tune has the asset), decoupling it from current layout."

requirements-completed: [KKG-01, KKG-02]

# Metrics
duration: ~12min
completed: 2026-07-13
---

# Quick Task 260713-kkg: Fix Split-Leaf Notation/Lyrics Gap + Solfege Button Gating Summary

**Asymmetric flex sizing (notation content-sized + capped 50%, lyrics flex-grow) kills the scroll-hide reflow gap; Solfege notation button now routes unconditionally to solfege-split instead of graying out on Staff+Inline.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-13T15:02:00Z (approx)
- **Completed:** 2026-07-13T15:14:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed the growing blank gap between notation and lyrics in chromeless split-leaf singing view that appeared after scroll-hide reflowed `<main>` to `100dvh`. Root cause was both slots using `flex-1` (grow 1), splitting available height 50/50 regardless of the notation's actual content height. Notation slot is now `flex-none` (content-sized, capped `max-h-[50%]`), lyrics slot keeps `flex-1` with no cap so it absorbs the freed space.
- Fixed the chromeless solfège-split JPG sizing to match: switched from `max-h-full object-contain` (which stopped capping anything once the parent slot became content-sized) to width-based `w-full h-auto`, delegating the height cap to the outer notation slot's `max-h-[50%] overflow-y-auto`, which resolves correctly in both resting and reflowed states without a fixed dvh guess.
- Fixed the Solfege notation button in GearPopover to always be enabled whenever the tune has a solfège JPG (`solfegeSplitAvailable`), regardless of current layout, and to always route to `solfege-split` (auto-switching layout to Split-Leaf when currently Inline) — it no longer grays out while Staff+Inline is selected.

## Task Commits

Each task was committed atomically:

1. **Task 1: Asymmetric split-leaf sizing (notation content-sized, lyrics absorb the rest)** - `dd59bcf` (fix)
2. **Task 2: Solfege notation button always routes to solfege-split (never layout-gated)** - `6830030` (fix)

**Plan metadata:** handled by orchestrator after this summary

_Note: No TDD tasks in this plan._

## Files Created/Modified

- `src/components/notation/NotationRenderer.tsx` - `renderSplitLeaf`'s two chromeless branches: notation slot `flex-1` -> `flex-none` (kept `max-h-[50%] overflow-y-auto`), lyrics slot dropped its `max-h-[50%]` cap while remaining `flex-1`. Chromeless solfège-split `<img>` className changed from `max-h-full w-auto object-contain mx-auto` to `w-full h-auto` (non-chromeless `/tunes`, `/study` grid path unchanged).
- `src/components/singing/GearPopover.tsx` - Removed `solfegeAvailableForCurrentLayout` derivation; `handleNotationChange` now gates solfege selection on `solfegeSplitAvailable` only and always computes `newMode = 'solfege-split'` for solfege regardless of `isSplit`; Solfege `<button>` `disabled`/className conditions switched from `solfegeAvailableForCurrentLayout` to `solfegeSplitAvailable`.

## Decisions Made

- Kept the desktop (`md:`) escape-hatch classes (`md:max-h-none md:overflow-visible md:flex-none`) exactly as before on both slots in the default (staff) branch, so the 260712-kov guarantee (desktop staff-split byte-identical to staff-inline) is preserved — only the mobile/reflowed base classes changed.
- Left `capBothHalvesOnDesktop` branch's `max-h-[50%]` cap on the notation slot unconditional (all widths), preserving the 260712-tmm guarantee that solfège JPG never exceeds ~50% of viewport height at any width.
- Did not touch `inlineLayoutDisabled`, the Inline layout button's disabled/title/toast wiring, `handleLayoutChange`, or `handleMainMusicNotes` — u4q's inline-solfège-disabled behavior is fully preserved; `viewMode: 'solfege'` remains unreachable via any GearPopover button.

## Deviations from Plan

None - plan executed exactly as written. The plan's verify step for Task 1 explicitly instructed skipping a blanket `npx eslint` gate on `NotationRenderer.tsx` (4 pre-existing, unrelated `react-hooks/set-state-in-effect` errors at lines 332/337/441/461) in favor of grep assertions + `npx tsc --noEmit -p .`; this was followed as specified, and `tsc` confirmed zero NotationRenderer-attributed errors (all remaining tsc errors are in pre-existing `tests/e2e/*.spec.ts` files, unrelated to this task's scope).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Both fixes are code-complete and committed. Orchestrator will perform one rebuild + full live Playwright verification covering: split-leaf staff resting/reflowed states (no gap), split-leaf solfège resting/reflowed states (JPG capped ~50%, scrolls if taller), Solfege button enabled on Staff+Inline and routing to solfege-split, Inline layout button still showing "coming soon" when Solfège is active, and desktop staff-split still stacked identically to staff-inline.

---
*Phase: quick-260713-kkg*
*Completed: 2026-07-13*

## Self-Check: PASSED

- FOUND: src/components/notation/NotationRenderer.tsx
- FOUND: src/components/singing/GearPopover.tsx
- FOUND: .planning/quick/260713-kkg-fix-split-leaf-notation-lyrics-gap-sizin/260713-kkg-SUMMARY.md
- FOUND commit: dd59bcf
- FOUND commit: 6830030
