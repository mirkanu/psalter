---
quick_id: 260516-vi4
slug: 04.9.4-chrome-dedup
created: 2026-05-16
status: in-progress
---

# Quick Task: Fix 04.9.4 chrome dedup

## Problem

Phase 04.9.4 shipped a new `GlassBottomBar` to own all staff-view controls,
but `NotationRenderer.tsx` lines 888-893 still render `chromelessSizeRow`
(A−/A+) and `chromelessStanzaNav` (`Stanzas N/M` with prev/next) inside the
`chromeless={true}` branch. Result: duplicate A−/A+ and a redundant stanza
nav band sit between the staff and the new bottom bar.

Additionally, the new `GlassBottomBar` centre indicator is text-only —
removing the legacy stanza nav would strip stanza pagination entirely.

The 04.9.4 UAT scripts asserted presence of new elements but not absence
of legacy ones, so the regression slipped through verification.

## Tasks

### Task 1 — Suppress legacy chromeless controls + add stanza nav to GlassBottomBar

Files:
- `src/components/notation/NotationRenderer.tsx` — remove (or guard with new
  prop) the `chromeless &&` block at lines 888-893 that renders
  `chromelessSizeRow` and `chromelessStanzaNav`. Expose stanza pagination
  state to parent via the existing `onStanzaChange` callback (already in
  place) and add `currentStanzaPage` / `totalStanzaPages` / `onStanzaPageChange(delta)`
  props so SingingView can drive pagination from outside.
- `src/components/singing/GlassBottomBar.tsx` — add prev/next buttons
  flanking the existing `data-stanzas-indicator` text. New props:
  `onStanzaPrev`, `onStanzaNext`, `canStanzaPrev`, `canStanzaNext`. Wire to
  the indicator so users can still page through stanzas.
- `src/components/singing/SingingView.tsx` — own `stanzaPage` state, pass
  prev/next callbacks to GlassBottomBar, and pass controlled stanza-page
  prop down to NotationRendererClient → NotationRenderer.

Acceptance:
- Visual audit at 375/768/1024 shows exactly ONE A−/A+ pair (in
  GlassBottomBar) and ONE stanza indicator (in GlassBottomBar).
- Stanza pagination still works (clicking prev/next in GlassBottomBar
  advances the staff view exactly as the legacy nav did).

### Task 2 — Harden the UAT scripts

Files:
- `scripts/uat/test-04.9.4-quick.js`
- `scripts/uat/test-04.9.4-full.js`

Add assertions that on `/psalms/[id]`:
- There is exactly ONE button with `aria-label="Decrease size"` and ONE
  with `aria-label="Increase size"` (no duplicate A−/A+).
- There is no `[data-chromeless-size-row]` element visible.
- There is no `[data-chromeless-stanza-nav]` element visible.
- The single `[data-stanzas-indicator]` lives inside the
  `[data-glass-bottom-bar]` (or `[aria-label="Psalm view controls"]`)
  ancestor.
- New: assert clicking GlassBottomBar's stanza-next button advances the
  indicator text from `Stanza 1 / N` to `Stanza 2 / N`.

Acceptance:
- All three updated scripts PASS against `http://localhost:3005` with the
  fresh build from Task 1.
- Reverting Task 1 (temporarily) causes the new assertions to FAIL,
  proving they actually guard against the regression.

## Out of scope

- Larger refactors to NotationRenderer's internal layout
- Onboarding tour adjustments
- Any /psalms/[id]/study changes
