---
sketch: 006
name: mobile-fullscreen-layout
question: "How should a fullscreen tune view work on mobile (portrait and landscape) with score and lyrics?"
winner: null
tags: [fullscreen, mobile, layout, responsive, tabs]
---

# Sketch 006: Mobile Fullscreen Layout

## Design Question

On mobile devices, screen space is precious. When a user enters fullscreen mode for worship, should we show tabs to switch between score and lyrics, stack them, or prioritize lyrics with the score optional?

## How to View

Open in browser: `.planning/sketches/006-mobile-fullscreen-layout/index.html`

Best viewed on mobile device or with browser DevTools set to a narrow viewport (375px or narrower).

Or hosted at: `psalter.gsdlabs.dev/sketches/006/`

## Variants

- **A: Tabbed Interface** — Score and Lyrics in separate tabs. User taps to switch. Clean, focused view.
- **B: Stacked View** — Score above, lyrics below with both visible. Requires scrolling but shows context.
- **C: Lyrics Focus** — Lyrics large and primary, score optional via toggle. Best for singing/reading-heavy flow.

## What to Look For

1. **One-Handed Operation**: Can you interact with this while holding the device with one hand?
2. **Tab Switching**: In variant A, is switching between score and lyrics quick and intuitive?
3. **Scrolling**: In variant B, does scrolling feel natural with two sections sharing space?
4. **Lyrics Readability**: Which variant makes the lyrics largest and easiest to read?
5. **Safe Areas**: Do controls avoid notches, rounded corners, and bottom safe areas on modern phones?
6. **Landscape**: How does each variant adapt when the phone is turned sideways?
7. **Toggle Interaction**: Does hiding the score work well on a small screen?

## Design Insights

_To be filled after feedback_

## Implementation Notes

- All variants respect safe area insets (notches, rounded corners, home indicators)
- Controls are vertically stacked and sized for thumb-reachable tap targets
- Font sizes adapted for smaller screens (text-xs, text-sm)
- Bottom navigation always sticky for quick prev/next navigation
- Tabs and toggles work together (can't tab between hidden sections)
- Landscape mode optimizes by reducing vertical padding and header size

## Next Steps

- Test on actual mobile devices or with realistic mobile browsing experience
- Choose winning variant based on one-handed usability
- Consider gesture interactions (swipe left/right for prev/next)
- Test with psalms that have many verses (scrolling load)
