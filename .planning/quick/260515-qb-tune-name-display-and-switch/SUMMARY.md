---
quick_task: 260515-qb-tune-name-display-and-switch
date: 2026-05-15
related_phase: 04.9.2
---

# Tune Name Display + Switch — Quick Task

## Why

Two coupled issues surfaced after 04.9.2:

1. The abcjs `T:` header (e.g. "Crimond, CM") was rendering as a title above every
   staff on both `/psalms/[id]` and `/tunes/[id]`. The surrounding page UI
   already carries the tune name (H1 on tune pages, header row on psalm pages
   pre-04.9.2), so the staff title duplicates information.
2. The legacy `PsalmNotationPlayer` carried a "Tune (meter): <name> pencil" header
   above the staff on the psalm Sing tab. When that component was deleted in
   04.9.2, the affordance to switch to an alternate tune was lost on psalms
   that already had a recommended tune (only the "no recommendation" branch
   still exposed it).

## Approach

1. **Header strip** — `NotationRenderer.unifiedAbc` now filters out
   `T:`-prefixed lines from `split.header` before composing the unified ABC
   body. All other header lines (`X:`, `M:`, `L:`, `Q:`, `K:`, `V:`) are preserved.
2. **Sing tab tune header** — `PsalmTabs.makeSingPanel` now wraps the
   recommended-tune branch in a `<div>` that renders, above the
   `NotationRendererClient`:
   `Tune (<meter>): <linked tune name> <pencil>`. The pencil opens a
   `ChangeTuneDialog` filtered by the psalm's stanza meter. Selecting an
   alternate tune sets `overrideTune` (existing state) and re-renders the
   staff with the new ABC. Lyrics and stanza meter come from `primaryVersion`
   (psalm-bound), so swapping tunes preserves Psalm 23's lyrics regardless
   of the chosen tune.

A separate `changeTuneOpen` state was added (rather than reusing
`noRecDialogOpen`) to keep the two dialog paths independent.

## Files

- `src/components/notation/NotationRenderer.tsx` — strip `T:` from header in
  `unifiedAbc`
- `src/components/PsalmTabs.tsx` — add tune-header row + `ChangeTuneDialog`
  in the recommended-tune branch; add `changeTuneOpen` state
- `scripts/uat/quick-tune-header.js` — UAT script

## Commits

- `eee0bb3` feat(quick): strip T: title from staff render
- `7612ea7` feat(quick): restore tune-header + change-tune in psalm Sing tab

## Verification

- `npx tsc --noEmit` — clean for `src/` (pre-existing errors in
  `tests/e2e/abc-player.spec.ts` and `tests/tune-notation.spec.ts` unrelated)
- `npm run build` — green
- Playwright UAT:
  - `/psalms/23` at 375 / 768 / 1024 — staff SVG text does NOT contain
    "Crimond" or ", CM"; header row reads "Tune (CM):"
  - `/tunes/30` at 375 / 768 / 1024 — staff SVG text does NOT contain
    "Crimond" or ", CM"; H1 still "Crimond"
  - Click pencil on `/psalms/23` desktop → dialog opens (258 alt-tune
    buttons) → click "Abbeyville (CM)" → staff re-renders with new tune,
    header updates, syllabified lyrics still contain "she-pherd"
    (Psalm 23 lyric persists across tune swap)

## Screenshots

`/data/home/psalter/scripts/uat/screenshots/`:
- `psalm-23-{mobile-375,tablet-768,desktop-1024}.png` (overwritten)
- `tune-30-{mobile-375,tablet-768,desktop-1024}.png` (overwritten)
- `psalm-23-changed-tune-desktop-1024.png` (new — post-Abbeyville swap)

## Follow-ups

- `ChangeTuneDialog` is rendered twice (mobile + desktop Sing panels)
  because `makeSingPanel` is called twice. Playwright surfaces an
  `aria-hidden inert` conflict between the two portals; the test works
  around it with a JS `.click()`. Worth deduping the dialog mount.
- Pre-existing TS errors in `tests/e2e/abc-player.spec.ts` and
  `tests/tune-notation.spec.ts` — out of scope.
