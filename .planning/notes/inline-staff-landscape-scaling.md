---
title: Inline Staff Landscape Scaling Bug + Stanza-Set Pagination Precedent
date: 2026-07-23
context: /gsd-explore session, pre-planning for Phase 04.9.15.1
---

# Inline Staff Landscape Scaling — Root Cause + Existing Precedent

## Symptom (confirmed via Playwright against psalter.gsdlabs.dev)

On a phone in landscape (915×412 viewport, Android UA), Psalm 1's inline Staff
view renders an SVG **566px tall** into a notation viewarea that's only
**412px tall** — a ~37% vertical overflow forcing scroll. The reporter
describes it as "maybe 1.5 lines on the screen, requires loads of scrolling."

## Root cause

`NotationRenderer.tsx` already has a "mobile compact fit" system —
`compactSplitMobile` and `staffWidthFactor` — that shrinks/tightens notation
specifically to avoid scrolling on mobile. Both are gated purely on:

```
chromeless && viewportW < 768
```

This correctly identifies narrow portrait phones, but a phone in **landscape**
is wide (768–926px, reads as "desktop" by this check) while having almost no
height (390–430px). The exact fit-to-screen system that would fix this
already exists — it's just blind to orientation, checking width alone.

This is the same category of gap fixed twice already this session (chrome
auto-hide, split-leaf beside-layout): code that assumes "narrow width ⟺
constrained mobile screen," which breaks specifically for landscape phones.
The fix should reuse this session's existing phone/orientation detection
(`isPhoneDevice()` in `src/lib/device.ts`, `phoneLandscapeChromeHide` in
`SingingView.tsx`) rather than inventing a new gate.

## Important clarification from the explore conversation

Inline Staff is **already paginated** into "stanza sets" (confirmed: fits one
set — up to 3 stanzas — on screen without scrolling, in portrait and on
desktop, today). This is NOT a request to invent pagination from scratch —
it's a request to fix the scaling/fit calculation so the *same* existing
per-set-fits-on-screen behavior also works when the viewport is landscape
shaped. Don't conflate this with split-leaf's separate `CYCLES_PER_PAGE`
pagination (`NotationRenderer.tsx` `cyclePage`/`totalStanzaPages`) — inline
Staff's stanza-set mechanism is a related but distinct system (notation +
embedded `w:` lyrics fused per system, not a separately-paginated stanza
list).

## Scope boundary agreed in exploration

- Landscape-phone fit-to-screen fix: Android + iOS, not iOS-only.
- Swipe left/right between stanza-sets: **universal** — any device/orientation
  with more than one stanza-set, additive alongside the existing bottom-bar
  stanza display (desktop keeps its buttons; no touch, no swipe).
- Page-dot indicator: **only** replaces the bottom-bar stanza display in the
  specific case where the bar is auto-hidden (`phoneLandscapeChromeHide` —
  Android always in landscape, iOS only when home-screen-installed). Everywhere
  else, the existing bar display is untouched.
- One-time swipe tutorial: design direction undecided — reuse `OnboardingTour`
  spotlight system vs. a standalone animated-hand overlay. Routed to
  `/gsd-sketch`.

See [[phase-04.9.15.1-inline-staff-landscape-swipe]] (ROADMAP.md) for the
phase this feeds, and REQUIREMENTS.md MOBILE-09/MOBILE-10.
