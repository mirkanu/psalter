---
sketch: 001
name: hymnal-layout-variants
question: "How should staff notation, inline lyrics, and verse text coexist across desktop and mobile?"
winner: A
tags: [layout, responsive, hymnal, desktop, mobile]
---

# Sketch 001: Hymnal Layout Variants

## Design Question

How should we arrange staff notation, inline lyrics beneath the notes, and the full verse text on both desktop and mobile viewports? What layout pattern best matches hymnal book conventions while working across screen sizes?

## How to View

Open in browser: `.planning/sketches/001-hymnal-layout-variants/index.html`

Or hosted at: `psalter.gsdlabs.dev/dev/sketches/001/`

## Variants

- **A: Sidebar Layout ★** — Score takes main area (left), verses in right sidebar. All content visible at once. Natural for desktop reading with constant verse reference.
- **B: Centered Layout** — Score centered, verses in two-column below. Score is focal point, verses require scrolling. Better for full-width responsive but less ideal for constant reference.
- **C: Mobile Stack** — Score at top, verses below on small viewport. Natural mobile scroll pattern but requires scrolling to see verses while reading.

## What to Look For

1. **Visual Hierarchy**: Which layout makes the score the clear focal point?
2. **Verse Reference**: How easy is it to see both the score AND the verse text at the same time?
3. **Scrolling Burden**: On mobile, do you have to scroll too much?
4. **Desktop Usage**: Would a precentor during worship prefer A or B?
5. **Responsive**: How does each layout break at tablet (768px) and mobile (375px)?

## Design Insights

**Winner: Variant A (Sidebar)**

The sidebar pattern is the strongest:
- **Constant verse visibility**: Precentor can see both score and verses without scrolling (desktop)
- **Hymnal convention**: Matches physical hymnal layouts with score and text side-by-side
- **Mobile adaptation**: At narrow widths, sidebar can collapse into Variant C (stacked) pattern
- **Reading flow**: Natural left-to-right flow from score to verse reference

**Variant B is secondary**: Centered layout works but requires more scrolling on mobile and breaks the hymnal parallel.

**Variant C is mobile fallback**: Necessary for <768px, but not ideal as primary pattern.

## Implementation Notes

- On desktop (1024px+): Use Variant A (sidebar) as default
- On tablet (768-1024px): Sidebar can be smaller or collapsible
- On mobile (<768px): Automatically switch to Variant C (stacked)
- A+/A- size controls affect both staff and verse text sizing

## Next Steps

- Refine the sidebar width breakpoints
- Test with actual verse counts (some psalms have many verses)
- Explore full-screen mode adaptation of this layout
- Test the dynamic sizing interaction with A+/A- buttons
