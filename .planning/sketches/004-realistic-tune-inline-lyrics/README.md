---
sketch: 004
name: realistic-tune-inline-lyrics
question: "How should a realistic 2-line tune display with 3 stanzas of inline lyrics and a Lyrics Only toggle?"
winner: null
tags: [tune, lyrics, toggle, inline, realistic]
---

# Sketch 004: Realistic Tune with Inline Lyrics

## Design Question

How do we present a complete, realistic tune (2-line score) with multiple stanzas of lyrics displayed inline below the score? What's the best way to implement a "Lyrics Only" toggle that lets users focus on just the text?

## How to View

Open in browser: `.planning/sketches/004-realistic-tune-inline-lyrics/index.html`

Or hosted at: `psalter.gsdlabs.dev/sketches/004/`

## Variants

- **A: Basic Layout** — Standard spacing and typography, readable and balanced
- **B: Compact Spacing** — Tighter margins and smaller fonts, fits more content on screen
- **C: Large Typography** — Larger fonts and line spacing, optimized for worship/precentor reading

## What to Look For

1. **Inline Lyrics Readability**: Do the stanzas display clearly below the score without feeling cramped?
2. **Toggle Interaction**: Does the "Lyrics Only" button feel natural and do what you expect?
3. **Visual Hierarchy**: Is the score clearly the primary focus with lyrics supporting it?
4. **Typography**: Which text sizing feels best for a precentor reading during worship?
5. **Spacing**: Is there enough breathing room between stanzas?
6. **Score Representation**: Is the simple ABC notation adequate for testing the layout, or should it look more realistic?

## Design Insights

_To be filled after feedback_

## Implementation Notes

- Score is shown as a simplified ABC notation mockup (will be replaced with actual abcjs SVG render)
- Each stanza is numbered and separated for clarity
- Toggle switches between "Score + Lyrics" and "Lyrics Only" modes
- All three variants are functional with the toggle working across each

## Next Steps

- Choose winning variant based on readability and precentor workflow
- Test with psalms that have many more verses (8+)
- Refine the toggle button styling and placement
- Consider keyboard shortcuts for toggling (e.g., spacebar or 'L' key)
