---
sketch: 003
name: fullscreen-navigation
question: "How to maximize staff readability in full-screen mode while keeping Prev/Next navigation always accessible on mobile?"
winner: A
tags: [fullscreen, mobile, navigation, landscape]
---

# Sketch 003: Full-Screen Navigation

## Design Question

When a user enters full-screen mode (especially on mobile), how should Prev/Next verse buttons be placed to remain accessible without blocking the staff notation? What's the right pattern for different device orientations?

## How to View

Open in browser: `.planning/sketches/003-fullscreen-navigation/index.html`

Or hosted at: `psalter.gsdlabs.dev/dev/sketches/003/`

## Variants

- **A: Sticky Bottom Bar ★** — Prev/Next stay at bottom, always reachable. Content scrolls above them. Most common mobile UX pattern.
- **B: Overlay Top Navigation** — Nav buttons float on top (semi-transparent). Maximizes staff space. Risk of obscuring staff.
- **C: Landscape Side Navigation** — Side nav panel for landscape/tablet. Efficient use of horizontal space, poor for portrait.

## What to Look For

1. **Staff Visibility**: Does the navigation block the staff reading?
2. **Navigation Reachability**: Can you tap Prev/Next without scrolling?
3. **Portrait vs Landscape**: Which variant is best for each orientation?
4. **Verse Scrolling**: Can you scroll verses while keeping nav buttons visible?
5. **Exit Button**: Can you easily exit full-screen?

## Design Insights

**Winner: Variant A (Sticky Bottom Bar)**

Sticky bottom is the strong winner because:
- **Proven mobile pattern**: Used by YouTube, Kindle, Apple Music — tested and intuitive
- **Always reachable**: No scrolling required to tap Prev/Next
- **Content scrolls independently**: Verse text can scroll while nav stays fixed
- **Portrait primary**: Most users read in portrait during worship
- **Responsive**: Works at all widths (mobile, tablet, landscape)

**Variant B (Overlay)** maximizes space but requires careful opacity tuning. Semi-transparent overlay can obscure staff notes.

**Variant C (Landscape)** is good for tablets but unnecessary on phones where portrait is primary.

## Implementation Notes

- Sticky bottom nav uses `position: sticky` with `bottom: 0`
- Nav bar height ~48px (3 buttons: Prev, Exit, Next)
- Staff area `flex: 1` to fill remaining space
- Verse text `overflow-y: auto` to scroll independently
- On landscape (>900px viewport width), consider switching to Variant C layout
- Exit button (⤡ symbol) closes full-screen and returns to normal view

## Responsive Breakpoints

| Viewport | Orientation | Recommendation | Pattern |
|----------|---|---|---|
| <375px | Portrait | Portrait only | Variant A |
| 375-768px | Portrait | Default | Variant A (sticky bottom) |
| 375-768px | Landscape | Optional | Variant B (overlay) |
| >768px | Portrait/Landscape | Optional feature | Variant C (side nav) |

## Interaction States

**Entering Full-Screen:**
1. User taps "Full" or "⛶" button in normal view
2. UI animates to full-screen (fade/slide)
3. Score maximizes, nav bar appears (sticky)

**Verse Navigation:**
1. User taps Prev/Next
2. Staff and lyrics update to new verse
3. Nav bar remains at bottom

**Exiting Full-Screen:**
1. User taps "Exit" button
2. UI returns to normal layout
3. Preserves current verse position

## Next Steps

- Implement full-screen mode in AbcPlayer component
- Test A+/A- size controls in full-screen
- Verify verse navigation (Prev/Next) updates both staff and lyrics
- Test gesture support (swipe left/right for Prev/Next on mobile)
- Handle device rotation (portrait ↔ landscape)
