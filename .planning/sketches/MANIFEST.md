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
| 004 | Realistic Tune with Inline Lyrics | How should a realistic 2-line tune display with 3 stanzas of inline lyrics and a Lyrics Only toggle? | pending | tune, lyrics, toggle, inline, realistic |
| 005 | Desktop Fullscreen Layout | How should a fullscreen tune view work on desktop with score and lyrics? | pending | fullscreen, desktop, layout, navigation, two-column |
| 006 | Mobile Fullscreen Layout | How should a fullscreen tune view work on mobile (portrait and landscape) with score and lyrics? | pending | fullscreen, mobile, layout, responsive, tabs |
| 007 | Swipe Tutorial (Tour Extension) | How should the swipe gesture be depicted inside the existing OnboardingTour bubble/spotlight, as one more step in that same tour? | **C: Hand + dot-indicator preview** | tutorial, gesture, onboarding, landscape, mobile |
