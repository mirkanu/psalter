# Sketch Manifest — Phase 4.9.2: Dynamic ABC Polish

## Design Direction

Live ABC notation with hymnal-inspired layout: staff notation paired with inline lyrics beneath notes, verses displayed alongside or below depending on viewport. Responsive sizing via A+/A- buttons that adjust base font/staff size, with auto-fitting to screen width. Full-screen mode for focused reading during worship.

## Reference Points

- **Hymnal books** (e.g., Church Hymnary, Scottish Psalter printed editions) — staff + inline lyrics + verse text
- **MuseScore** — score rendering with viewport-aware sizing
- **MobileSheetMusic apps** — full-screen, landscape-optimized rendering with quick navigation

## Sketches

| # | Name | Design Question | Winner | Tags |
|---|------|-----------------|--------|------|
| 001 | Hymnal Layout Variants | How should staff, inline lyrics, and verse text coexist on desktop vs mobile? | **A: Sidebar Layout** | layout, responsive, hymnal |
| 002 | Dynamic Sizing Interaction | How do A+/A- buttons, auto-fit, and verse text interact? | **B: Medium 14px (Default)** | sizing, controls, responsive |
| 003 | Full-Screen Navigation | How to maximize staff readability while retaining Prev/Next navigation on mobile? | **A: Sticky Bottom Bar** | fullscreen, mobile, navigation |
