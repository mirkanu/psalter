---
sketch: 002
name: dynamic-sizing-interaction
question: "How do A+/A- buttons, auto-fit, and verse text visibility interact across viewport widths?"
winner: B
tags: [sizing, controls, responsive, interaction]
---

# Sketch 002: Dynamic Sizing Interaction

## Design Question

When a user adjusts the A+/A- buttons to change the base font size, how should the layout respond? How much verse text should be visible at each size? How does this interact with viewport width?

## How to View

Open in browser: `.planning/sketches/002-dynamic-sizing-interaction/index.html`

Or hosted at: `psalter.gsdlabs.dev/dev/sketches/002/`

## Variants

- **A: Small Base Size (12px)** — Compact view. More verses visible on screen. Staff detail reduced. Good for seeing many verses at once.
- **B: Medium Base Size (14px) ★** — Default, balanced. Good readability. 2-3 verses visible at typical viewport. Staff size reasonable.
- **C: Large Base Size (16px)** — Accessibility focus. High readability for readers with vision needs. Fewer verses visible, more scrolling.

## What to Look For

1. **Staff Detail**: Does the small staff remain readable? Is the large staff too big?
2. **Verse Visibility**: How many verses should be visible by default (B)?
3. **Responsive Scaling**: At 768px and 375px, how does the layout shift with each size?
4. **Content Balance**: Which size feels right for a precentor during worship?
5. **Accessibility**: Does size C work well for older readers?

## Design Insights

**Winner: Variant B (Medium 14px)**

Medium is the default because it:
- **Balances readability and content**: Staff is clear, verses are scannable
- **Works across viewports**: Responsive without excessive scrolling
- **Sensible defaults**: A+ and A− then become meaningful adjustments
- **Matches web conventions**: Similar to typical body text sizing (14-16px)

**Variant A (Small)** works for users who want to see many verses, but staff becomes too small for detailed note reading.

**Variant C (Large)** is good for accessibility but creates burden of scrolling for typical usage.

## Implementation Notes

- A+ and A− buttons should provide ±2px increments (12px → 14px → 16px → 18px)
- The entire stack (staff + lyrics + verses) scales together
- Verse text should reflow into 2 columns at wide viewports (>900px), 1 column below
- On mobile, verses naturally become single-column below the staff
- CSS custom properties (--staff-base-size) make this easy: just change one variable and everything scales

## Responsive Breakpoints

| Viewport | Variant B (14px) | Staff Height | Verse Columns |
|----------|---|---|---|
| 1024px+ | Medium | 80px | 2 columns |
| 768px | Medium | 80px | 1 column |
| 375px | Medium | 80px | 1 column (single verse) |

## Next Steps

- Confirm A+/A− button placement and styling
- Test with psalm text that has many verses (Psalm 119)
- Verify fullscreen mode respects base size setting
- Design button states (A− disabled when at minimum size)
