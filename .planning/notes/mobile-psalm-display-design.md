---
name: Mobile psalm display — Phase 4.9.3 design decisions
description: Layout spec and UI decisions for the mobile-first singing view, captured from explore session
type: note
date: 2026-05-16
context: Phase 4.9.3 exploration
---

## The Problem

The current psalm detail page is UI-first: tabs, metadata, controls, then notation. For a precentor or congregation member pulling out their phone to sing, this is backwards. The music should be immediate — everything else is secondary.

## Reference Layout

See screenshot: Psalm 31 / St. Stephen (Abridge) in the split-leaf psalter app. The entire viewport is staff + integrated lyrics across 4 systems. Only a slim header and audio bar are visible.

## Agreed Layout

### Top bar (always visible)
`← Psalm 23 →` — left/right arrows navigate prev/next psalm; tapping the psalm label opens the /psalms selector. Space-constrained: use "Ps 23" if needed.

### Sub-bar (always visible)
`Tune (C.M.): Crimond [Edit]` — shows current tune's name and meter; [Edit] or tapping the tune name opens tune switcher.

### Body (fills remaining viewport)
Full-width abcjs render with integrated lyrics — 4 staff systems like the reference screenshot. No tabs, no metadata, no controls visible here. This IS the page.

### FAB (bottom-right, always visible)
Single action button. Expands (bottom sheet or speed dial) to reveal:
- **View switcher** — toggle between Staff / Lyrics-only / Solfège
- **Audio player** — play tune audio if available
- **Metadata / Topics** — Nave's topics, metre, attribution, scripture refs

Fullscreen mode removed — the new default IS effectively fullscreen.

## ABC Overflow Fix

**Root cause:** Default staffwidth/font too large for narrow mobile viewports. Zooming in (A+) compounds overflow. Currently only fixed by clicking A- enough times.

**Fix approach:**
1. Derive `staffwidth` from the container's actual `offsetWidth` at render time (pass to `ABCJS.renderAbc` options)
2. Lower default font/scale for mobile breakpoints
3. Hard-clamp container: `max-width: 100%; overflow-x: hidden` — notation physically cannot escape viewport regardless of zoom level
4. On resize/orientation change, re-render with new derived width

## GSD Workflow Plan

- `/gsd-ui-phase` before planning — produce UI-SPEC.md with layout contracts, component hierarchy, interaction states
- `/gsd-discuss-phase` to surface technical questions (abcjs staffwidth API, resize handling, FAB pattern)
- `/gsd-plan-phase` once spec is locked
- `/gsd-verify-work` + Playwright UAT after execution
