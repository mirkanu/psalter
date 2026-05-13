---
title: Hymnal layout design for ABC + inline lyrics
trigger_condition: Before implementing Phase 4.9.2 tasks 3, 4, 5 (sizing, buttons, full-screen)
planted_date: 2026-05-13
---

# Hymnal Layout Design Sketch

## Trigger

Phase 4.9.2 implementation blocked until visual layout direction is clear.

## Context

Phase 4.9.2 includes interconnected tasks around how ABC staff notation, inline lyrics, and verse text coexist on screen:

- Task #3: Dynamically fit ABC score + inline lyrics to screen (auto-scale based on viewport width)
- Task #4: A+/A- buttons adjust base size, auto-fit scales proportionally
- Task #5: Full-screen mode for staff and solfege, with Prev/Next verse navigation

These are layout-dependent and need visual exploration before coding.

## Design Direction

Inspiration: **Hymnal books** — staff notation with lyrics printed inline beneath notes, verses displayed alongside or below.

## Unknowns to Explore

1. **Desktop layout:** 
   - Staff + inline lyrics on left, verse text on right?
   - Staff centered, verses below?
   - Other arrangement?

2. **Mobile layout:**
   - Vertical stack of staff, then verses?
   - Single-column with scrolling?

3. **Verse text sizing:**
   - Cap at 4 lines of verse text visible inline?
   - How does this interact with viewport height and A+/A- size?

4. **Full-screen mode:**
   - Maximizes staff for readability on mobile (landscape orientation)?
   - Retains Prev/Next verse buttons where?

## Next Action

Use `/gsd-sketch` to create throwaway HTML mockups of:
- Desktop hymnal layout (staff + verses)
- Mobile hymnal layout
- Full-screen verse navigation on mobile

Once design direction is clear, proceed to Phase 4.9.2 planning.
