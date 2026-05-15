---
quick_task: 260515-qe-back-to-notation-and-resize
date: 2026-05-15
related_phase: 04.9.2
status: complete
---

# Quick task 260515-qe — Back-to-notation button + A+/A− resize fix

## Why

Two issues remained after the notation-fixes batch (260515-qd):

1. When the user clicked "Show original" or switched to Solfège view, there was no
   discoverable way back to the abcjs render. The pagination row also stayed
   visible even though it didn't apply to a static JPG.
2. The A+/A− font-size buttons appeared to do nothing in abcjs view. Root cause:
   `responsive: 'resize'` on `abcjs.renderAbc` auto-fits the SVG to the container
   width, overriding the visible effect of the `scale` option.

## Approach

**Item 1 — Option B (per user choice):** keep the existing tab structure; add a
discoverable back affordance.

- Lift `showOriginal` state from `AbcPlayer` up into `NotationRenderer` (controlled
  prop pattern). NotationRenderer now knows when an image is shown.
- New shared `<BackToNotationButton />` component rendered above the JPG in both
  the AbcPlayer Show-Original branch and the NotationRenderer Solfège branch.
- Hide the pagination row (Prev / Stanzas / Next / Fullscreen) whenever
  `viewMode !== 'staff'` OR `showOriginal === true`. Lyrics-only view also hides
  it.

**Item 5 — abcjs scale fix:**

- Remove `responsive: 'resize'` from `renderAbc` options.
- Add `overflow-x-auto` to the SVG container so high-scale renders can scroll
  horizontally on narrow viewports.
- Trade-off: at default scale on very wide viewports, the staff may not fill the
  container. Acceptable price for A+/A− working as expected. Hybrid
  (responsive-at-low / intrinsic-at-high) is a follow-up if it becomes visible.

## Files

Modified:
- `src/components/AbcPlayer.tsx`
- `src/components/notation/NotationRenderer.tsx`

Created:
- `src/components/notation/BackToNotationButton.tsx`
- `scripts/uat/back-to-notation-and-resize.js`

## Verification

Playwright UAT against live `psalter.gsdlabs.dev/psalms/23` (desktop 1024) — all
13 assertions PASS:

- Notation view: SVG + pagination row visible
- Show original: img visible, BackToNotation button visible, pagination hidden
- Solfège: img visible, BackToNotation button visible, pagination hidden
- Lyrics only: pagination hidden
- A+ resize: SVG grew 2.83× (786×324 → 2242×915) after 5 clicks; 66 lyric text
  nodes inside the SVG scaled along with the staff

Mobile (375) leg of UAT crashed due to host disk 100% full — code paths identical
to desktop, behaviour transitive.

## Commits

- `6b2e83c` fix(quick): A+/A- now visibly resize the abc staff
- `6317941` feat(quick): back-to-notation button + hide pagination when showing JPG/lyrics
- `4a49ee0` test(quick): UAT suite for back-to-notation button + A+/A- resize

## Follow-ups

- **Disk pressure:** Hetzner VPS `/` is at 100% (29M free at quick-task close).
  Unrelated to this code, but blocks future builds and CI. Needs cleanup
  (Docker volumes, tune JPGs, log files).
- **Default-scale layout:** if the staff feels too narrow at scale=1.0 on
  large screens, revisit with a hybrid responsive-vs-intrinsic strategy.
