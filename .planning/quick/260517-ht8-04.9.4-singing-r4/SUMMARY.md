---
quick_id: 260517-ht8
slug: 04.9.4-singing-r4
created: 2026-05-17
completed: 2026-05-17
status: complete
---

# Summary: 04.9.4 singing-view round 4 polish

All 4 items fixed and Playwright-verified.

## Root causes + fixes

### #2 — first-press Play silently no-ops

**Root cause:** in `AbcAudioControls`, the previous "guard" effect for controlled
mode initialised `prevControlledRef = useRef(isPlaying)`. When the mini-bar
mounted after a Play tap, `isPlaying` was already `true` on first render —
so on the first effect run `prev === isPlaying` and the function returned
early without ever calling `onPlay()`. Both buttons flipped to the Pause icon
(because parent state and synced internal state already said "playing") but
no synth was ever created.

**Fix:** initialise `prevControlledRef = useRef(undefined)`. The first effect
run now sees a real transition (`undefined → true`) and dispatches `onPlay()`.

### #3 — mobile bar "just as thick as before"

The r3 reduction (h-14 → h-12) only shaved 8px. On a real mobile with
safe-area-inset-bottom adding ~26-30px, the perceptual change was tiny.
**Fix:** drop to h-11 (44px, minimum tap target) and bump the safe-area
clamp to `max(env(...)-12px, 0px)`. Buttons reduced from min-h-11 to
min-h-10. Total mobile bar = 44px content + 0-22px safe-area instead of
56-90px pre-r3.

### #4 — mini-bar bleeds into lyrics/solfège

**Fix:** SingingView watches `viewMode` and on transition away from `'staff'`,
sets `isPlaying=false` and `miniBarVisible=false`. The TuneAudioPlayer is now
the sole player in non-staff views.

### #1a — tour 4 steps

`STEPS` array re-grown to include "Tap to switch to a different tune"
between `psalm-label` and `view-controls`.

### #1b — individual arrow spotlights

`measure()` now returns `Rect[]` (one per matching element). Overlay
switched from box-shadow to `<svg><mask>` with one `<rect fill="black">`
cutout per element. The Next arrow's `data-tour-target="prev-next"` (added in r3)
plus the Prev arrow's gives the SVG mask two distinct cutouts, painting two
separate spotlights instead of one wide region.

## Validation

- `/tmp/audit-r4.js` — 14/14 assertions pass:
  - #3 mobile glass bar height = 44px
  - #1a tour has 4 steps with the right copy per step
  - #1b step 1 SVG mask has 2 cutouts
  - #2 main + mini-bar both show Pause after first press, no audio error
  - #4 after switching to lyrics: main button back to Play, mini-bar hidden
- Existing UATs all PASS after updating SC2 back to "Step 1 of 4" and adding
  SC12 (2 cutouts), SC13 (44px mobile bar), SC14 (view-change reset).
- `npm run build` clean.

## Commits

- `28f0936` — fix(04.9.4-r4): first-play, tour reorder, slimmer mobile, view-change reset
- `f998ddc` — test(04.9.4-r4): tour back to 4 steps, add SC12/SC13/SC14
