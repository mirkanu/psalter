---
phase: quick-260717-mwv
plan: 01
subsystem: ui
tags: [nextjs, react, abcjs, notation, singing-view]

requires:
  - phase: 04.9.15-04
    provides: staffInlineApproved gating helpers (src/lib/inline-staff-gating.ts)
provides:
  - Split-Leaf Staff respects tune-approval status (shared renderScannedPages helper)
  - "Not recommended versification" messaging distinct from generic "no notation" message
  - Forced Lyrics Only + working SoundCloud audio for tunes with zero notation data
affects: [singing-view, notation-renderer, play-mini-bar]

tech-stack:
  added: []
  patterns:
    - "renderScannedPages(pages, fallbackUrl, altText) shared helper in NotationRenderer.tsx reused by solfege-split and staff-split JPG-fallback branches"
    - "hasAnyNotation (staffAvailable || solfegeSplitAvailable) as the single source of truth for whether a tune has any renderable notation"

key-files:
  created: []
  modified:
    - src/components/notation/NotationRenderer.tsx
    - src/components/singing/SingingView.tsx
    - src/components/singing/PlayMiniBar.tsx
    - src/app/psalms/[id]/page.tsx
    - src/app/precent/[id]/sing/[pos]/page.tsx

key-decisions:
  - "staffInlineApproved threaded straight through to NotationRendererClient (Task 1) so Split-Leaf Staff can reuse the exact same JPG-fallback mechanism Split-Leaf Solfège already used"
  - "hasAnyNotation guards both the mount-hydration viewMode restore and the existing shouldFallbackToSplit effect, with a new dedicated forced-Lyrics-Only effect taking priority for zero-notation tunes"
  - "PlayMiniBar's audioSource state now lazy-initializes to 'soundcloud' when hasAbc is false, plus a defensive re-force effect, so a fresh mount into an audio-only tune never attempts broken ABC audio controls"

requirements-completed: []

duration: ~35min (through checkpoint)
completed: 2026-07-17
---

# Quick Task 260717-mwv: Fix three notation-fallback bugs Summary

**Split-Leaf Staff now respects tune-approval status via a shared JPG-fallback helper; non-recommended versifications get accurate messaging; tunes with zero notation data force Lyrics Only with a working SoundCloud Play button.**

## Performance

- **Tasks:** 2 auto-fix tasks completed and committed; final checkpoint task in progress (rebuild + PM2 restart done, awaiting human visual verification)
- **Files modified:** 5

## Accomplishments

- **Bug 1 (Split-Leaf Staff JPG fallback):** Extracted the scanned-image rendering already used by Split-Leaf Solfège into a shared `renderScannedPages(pages, fallbackUrl, altText)` helper in `NotationRenderer.tsx`, and reused it for Split-Leaf Staff whenever `staffInlineApproved` is false. Previously only inline Staff was gated by tune-approval status (Plan 04.9.15-04); Split-Leaf Staff always rendered live abcjs regardless of approval.
- **Bug 2 ("not recommended" messaging):** `SingingView.tsx` now shows "Please select a tune. Note that this versification of this psalm is not recommended." instead of the generic "No notation available for this psalm." message, when no tune is active on a non-recommended versification. `isRecommendedVersion` is computed in both `src/app/psalms/[id]/page.tsx` and `src/app/precent/[id]/sing/[pos]/page.tsx` from `psalterNumber.includes('Recommended')` and threaded into `SingingView`.
- **Bug 3 (zero-notation tunes force Lyrics Only):** Added `hasAnyNotation` (staff ABC/SATB OR solfège JPG/pages) as the deciding signal. When false, a new effect forces `viewMode = 'lyrics'` with a one-time toast, taking priority over the existing Split-Leaf fallback effect (now guarded with `if (!hasAnyNotation) return`). The top-level render and `PlayMiniBar` gate now key off `activeTune` / `(abc || soundcloudUrl)` instead of `abc` alone, so Lyrics Only + `StanzaList` + a working SoundCloud Play button are reachable even when `abc` is empty. `PlayMiniBar` now lazy-initializes and re-forces its `audioSource` to `'soundcloud'` whenever `hasAbc` is false, and hides the abc/SoundCloud toggle when there's nothing to toggle back to.

## Task Commits

1. **Task 1: Split-Leaf Staff falls back to the staff JPEG for non-approved tunes (Bug 1)** - `c943597` (fix)
2. **Task 2: Non-recommended-versification messaging + forced Lyrics Only for zero-notation tunes (Bugs 2 & 3)** - `e81bc5a` (fix)

**Checkpoint:** App rebuilt (`npm run build`, no new tsc errors) and `pm2 restart psalter` executed — process online with fresh uptime. All three live URLs (Ps 42, 45a, 45b) return HTTP 200. Awaiting human visual/functional verification.

## Files Created/Modified

- `src/components/notation/NotationRenderer.tsx` - Added `staffInlineApproved` prop, extracted `renderScannedPages()` shared JPG-rendering helper, added `forceStaffJpgFallback` branch for Split-Leaf Staff
- `src/components/singing/SingingView.tsx` - Added `isRecommendedVersion` prop, `staffAvailable`/`solfegeSplitAvailable`/`hasAnyNotation` derivations, guarded the existing Split-Leaf fallback effect, added the forced-Lyrics-Only effect, restructured top-level render + PlayMiniBar gate
- `src/components/singing/PlayMiniBar.tsx` - Added `hasAbc`, lazy audioSource initializer, re-force effect, updated `showScToggle`/`showDisclaimer`/render gating
- `src/app/psalms/[id]/page.tsx` - Computes and passes `isRecommendedVersion`
- `src/app/precent/[id]/sing/[pos]/page.tsx` - Computes and passes `isRecommendedVersion`

## Decisions Made

- Reused the exact `renderScannedPages` extraction shape specified in the plan (pure refactor, byte-identical output for the existing Solfège caller) rather than any broader restructuring.
- Kept the pre-existing `react-hooks/set-state-in-effect` ESLint pattern consistent with the rest of `PlayMiniBar.tsx` (that rule is already violated elsewhere in the same file, unrelated to this task's scope) rather than restructuring effects project-wide.

## Deviations from Plan

None - plan executed exactly as written for both auto-fix tasks.

## Issues Encountered

None during Task 1/2 execution. `npx eslint` flagged a handful of pre-existing `react-hooks/set-state-in-effect` / `react-hooks/preserve-manual-memoization` warnings in `SingingView.tsx` and `PlayMiniBar.tsx` — confirmed via `git stash` comparison that these are pre-existing (unrelated to this task's changes) except for one new instance in the new PlayMiniBar re-force effect, which follows the identical pattern already used elsewhere in the same file. Out of scope per Scope Boundary rule; not fixed.

## User Setup Required

None - no external service configuration required.

## Checkpoint Status

**PENDING HUMAN VERIFICATION.** See below for what to check live at https://psalter.gsdlabs.dev.

---
*Phase: quick-260717-mwv*
*Completed: pending checkpoint approval*
