---
sketch: 005
name: desktop-fullscreen-layout
question: "How should a fullscreen tune view work on desktop with score and lyrics?"
winner: null
tags: [fullscreen, desktop, layout, navigation, two-column]
---

# Sketch 005: Desktop Fullscreen Layout

## Design Question

When a precentor enters fullscreen mode on desktop to lead worship, what's the best way to arrange the score and lyrics? Should they be side-by-side for simultaneous reference, stacked for focus, or score-primary with inline lyrics?

## How to View

Open in browser: `.planning/sketches/005-desktop-fullscreen-layout/index.html`

Or hosted at: `psalter.gsdlabs.dev/sketches/005/`

## Variants

- **A: Two-Column Layout** — Score on left, lyrics scrolling on right. Constant visibility of both.
- **B: Stacked Layout** — Score above, lyrics below. Requires scrolling but clear separation.
- **C: Score Focused** — Large centered score with inline lyrics below. Score is the visual anchor.

## What to Look For

1. **Precentor Workflow**: Which layout lets you see the score and lyrics most naturally during leading worship?
2. **Scrolling**: How much do you need to scroll in each variant? Is that acceptable?
3. **Focus**: Does the score feel appropriately emphasized?
4. **Controls**: Are zoom in/out and navigation buttons in logical places?
5. **Two-Column Responsiveness**: In variant A, is the two-column layout appropriate for wide desktop screens?
6. **Toggle Interaction**: Does hiding the score work well to focus on lyrics alone?

## Design Insights

_To be filled after feedback_

## Implementation Notes

- All three variants include fullscreen header (title, metadata), zoom controls, Lyrics Only toggle, and navigation
- Variant A mimics a print hymnal experience (score + lyrics simultaneously)
- Variant B is vertical scrolling friendly for long psalms with many verses
- Variant C optimizes for visual readability of the musical notation
- Navigation shows "Verse X of Y" and Previous/Next buttons for moving through the psalm

## Next Steps

- Choose winning variant based on precentor feedback
- Test layout with psalms that have 8+ verses
- Consider keyboard navigation (arrow keys to prev/next)
- Explore how this layout adapts to landscape mobile (see sketch 006)
