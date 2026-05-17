---
quick_id: 260517-bmz
slug: 04.9.4-singing-chrome-polish
created: 2026-05-17
status: in-progress
---

# Quick Task: 04.9.4 singing chrome polish (round 2)

User feedback after the chrome-dedup fix surfaced 6 further refinements:

## Tasks

### 1. GlassBottomBar — slimmer layout
- (1a) Remove the Staff / Lyrics / Solfège radiogroup entirely (already in GearDrawer).
- (1b) Reorder: Left A−/A+ | centre stanza nav | Play | Gear (Gear at far right).
- (1d) Remove "Play" / "Pause" text label from the main play button (icon only).
- Result: more room for the stanza indicator + chevrons; mobile no longer crowded.

### 2. PlayMiniBar / AbcAudioControls — fit on one line at 375
- (1c) Single row at 375px: Play, Key F dropdown, BPM −/+ all on one line.
- Shrink Key trigger to natural width (drop fixed `w-20`, give it ~16-20px per char).
- Reduce padding/gap; controls all share `h-9` (same as Play with `size="sm"` = h-9).
- Remove `flex-wrap` from `AbcAudioControls`; use `flex-nowrap` + horizontal scroll fallback on mini-bar.

### 3. GearDrawer — restart tour button
- (1e) Add a "Restart tour" button (under View, before About) that clears the dismissal flag and triggers the tour to remount.
- Wire via parent — SingingView owns a `tourKey` state; restart bumps the key.

### 4. NotationRenderer — Solfège back button only in study view
- (1f) `BackToNotationButton` in Solfège view: hide when `chromeless={true}` (the GlassBottomBar / GearDrawer already provide view switching).

## Acceptance (validated by Playwright)

- 375/768/1024: glass bar contains only A−/A+, stanza prev/indicator/next, Play icon, Gear (in that order).
- 375/768/1024: glass bar's Play/Pause button has no visible text.
- 375 with mini-bar open: all controls (Play, Key, BPM −/+) fit on one row inside [data-play-mini-bar]; no flex-wrap.
- GearDrawer at 375: contains "Restart tour" button. Clicking it dismisses the drawer AND the tour overlay reappears.
- /psalms/1 → switch to Solfège (via Gear): [data-testid="back-to-notation"] is NOT present.
- /psalms/1/study → Solfège tab: [data-testid="back-to-notation"] IS present (regression check).
- All three existing UAT scripts still PASS after updates.

## Out of scope

- Restyling AbcAudioControls in places other than PlayMiniBar (the study view's
  AbcPlayer continues to use its own audio block).
- Touching the tour UI itself beyond exposing a restart mechanism.
