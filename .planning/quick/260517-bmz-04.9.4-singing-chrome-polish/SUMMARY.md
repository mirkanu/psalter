---
quick_id: 260517-bmz
slug: 04.9.4-singing-chrome-polish
created: 2026-05-17
completed: 2026-05-17
status: complete
---

# Summary: 04.9.4 singing chrome polish (round 2)

Six refinements to the singing-view chrome based on direct user feedback
after the prior chrome-dedup fix (260516-vi4):

## Changes

| # | Issue | Where | Fix |
|---|-------|-------|-----|
| 1a | Staff/Lyrics/Solfège buttons in glass bar were redundant with GearDrawer | `GlassBottomBar.tsx` | Removed entire view radiogroup |
| 1b | Gear placement | `GlassBottomBar.tsx` | Reordered: `[A−/A+] · [< Stanza N/M >] · [Play] · [Gear]` |
| 1c | PlayMiniBar wrapped to 3 rows at 375 (Key+Play on one row, BPM on next) | `AbcAudioControls.tsx`, `PlayMiniBar.tsx` | Drop `flex-wrap`; all controls `h-9`; Key dropdown uses `w-auto`; tighter gaps + collapse-chevron narrowed |
| 1d | Main Play button rendered "Play"/"Pause" text label | `GlassBottomBar.tsx` | Icon-only |
| 1e | No way to replay the onboarding tour | `GearDrawer.tsx`, `SingingView.tsx`, `OnboardingTour.tsx` | Added `[data-restart-tour]` button in GearDrawer; SingingView owns `tourKey` and remounts the tour on restart |
| 1f | "Back to notation" rendered in chromeless Solfège view (only needed in study view) | `NotationRenderer.tsx` | Guarded with `!chromeless && (<BackToNotationButton />)` |

The `data-tour-target="view-controls"` hook was moved from the deleted view radiogroup to the Gear button (where view selection now lives), and the tour copy updated to "Open settings to switch between notation, lyrics, or solfège".

## Validation

- `/tmp/audit-polish.js` — all 6 user-visible assertions pass at 375/768/1024:
  - 1a no view-options in glass bar (count=0)
  - 1b last child is gear, 2nd-to-last is play
  - 1c PlayMiniBar children on a single row at 375 (rows=1)
  - 1d Play button text empty (icon-only)
  - 1e GearDrawer has restart button; clicking re-mounts `[data-onboarding-tour]`
  - 1f chromeless Solfège — no `[data-testid="back-to-notation"]`
- Existing UATs (`test-04.9.4-quick`, `test-04.9.4-full`, `test-04.9.4-study-regression`): **all PASS** with the new SC7/SC8/SC9 assertions added.
- `npm run build` clean (1523 static pages compiled).

## Commits

- `078480c` — fix(04.9.4-singing-chrome-polish): tighten glass bar + mini-bar; restart-tour; solfege back-button gate
- `fcee037` — test(04.9.4-singing-chrome-polish): add SC7/SC8/SC9 assertions
