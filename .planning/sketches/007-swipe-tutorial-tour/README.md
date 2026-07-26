---
sketch: 007
name: swipe-tutorial-tour
question: "How should the swipe gesture be depicted inside the existing OnboardingTour bubble/spotlight, as one more step in that same tour?"
winner: "C"
tags: [tutorial, gesture, onboarding, landscape, mobile]
---

# Sketch 007: Swipe Tutorial (Tour Extension)

## Design Question

For Phase 04.9.15.1 (MOBILE-10), first-time users need a one-time explainer
that swipe left/right moves between stanza-sets. The explore-session decision
was to match the *existing* `OnboardingTour.tsx` spotlight system exactly
(same backdrop, bubble, Step N of M, Skip/Done buttons — restartable via the
existing Gear menu "Restart tour" entry) rather than build a standalone hero
overlay. This sketch answers: given that constraint, how should the *gesture
itself* be depicted within that existing visual language?

Grounded directly in the real component (`src/components/singing/OnboardingTour.tsx`):
SVG-mask spotlight with a 30%-alpha backdrop and rounded-rect cutout around
the target, a tip bubble (`bg-background`, `border-border`, `rounded-lg`,
`shadow-lg`) with step counter, copy, and Skip tour / Next→ (or Done) buttons.
This would be a new step appended to `STEPS` (or a new conditional array,
mirroring how `SCROLL_HIDE_STEPS` is already conditionally appended today),
gated to contexts where there's more than one stanza-set — spotlighting the
notation area itself rather than a specific button.

Note: this sketch's CSS approximates the app's *current* shadcn/Tailwind
tokens (light mode, system-ui font), not the older Georgia-serif hymnal theme
from the 001-006 sketch series — fidelity to the real, already-shipped
`OnboardingTour` component mattered more here than that earlier mood.

## How to View
open .planning/sketches/007-swipe-tutorial-tour/index.html

## Variants
- **A: Static text + arrows** — the bubble copy is accompanied by a plain `‹ swipe ›` glyph line, no animation. Cheapest to build, most consistent with the tour's current plain-text style, but least visceral — doesn't show the physical motion.
- **B: Animated swipe hand** — same bubble, but the spotlighted notation area itself shows a looping hand icon sliding left-right with a dotted trail, demonstrating the actual gesture physically.
- **C: Hand + dot-indicator preview** — variant B plus a small live preview of the new page-dot indicator (pulsing) in the corner of the spotlight, since the dots are a *new* UI element appearing at the same moment as the gesture — this variant teaches both "how to move" and "what tells you where you are."

## What to Look For
- Does the animated hand (B/C) feel like a natural extension of the existing tour's restrained style, or does it feel like a tonal mismatch (too playful/kinetic vs. the app's calm, hymnal-adjacent chrome)?
- In C, is showing the dot-indicator alongside the gesture clarifying or is it too much for one step — should the dots get their own separate tour step instead?
- Bubble copy length/wording — does "the dots show where you are" (C) read naturally, or is it better split into two sentences?
