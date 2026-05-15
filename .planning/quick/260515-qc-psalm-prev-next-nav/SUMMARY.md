---
slug: 260515-qc-psalm-prev-next-nav
date: 2026-05-15
type: quick
status: complete
---

# Psalm Prev/Next Navigation

## Why

Single-psalm pages had no way to step between psalms without going back to the
list. Precentors flipping through consecutive psalms during prep had to round-trip
through `/psalms` each time. A simple prev/next pair (with arrow-key shortcuts)
removes that friction.

## Approach

- **Server helper** `getPsalmNeighbors(slug)` builds the canonical ordered slug
  list using the same query as `generateStaticParams` (single source of truth).
  Module-scope cache; multi-version psalms contribute only their versioned slug
  to the order, while bare numeric backward-compat slugs (`/psalms/45`) still
  resolve via a numeric->canonical fallback map.
- **Client component** `PsalmNav` renders responsive button row:
  - Desktop (>=md): outline `sm` buttons with `ChevronLeft` + "Ps {N}" / "Ps {N}" + `ChevronRight`
  - Mobile (<md): 3 icon-only `icon-lg` buttons -- back, list (mobile-only), forward
  - At boundaries (Ps 1 / Ps 150) the disabled side renders a `<span>` with
    `aria-disabled="true"`, `tabIndex={-1}`, `opacity-40`, `pointer-events-none`
    (keeps layout stable, no jumping)
  - `rel="prev"` / `rel="next"` on the active links
  - Global `keydown` listener for ArrowLeft/ArrowRight; bails out when focus is
    in `<input>` / `<textarea>` / `[contenteditable]` or when modifiers are held
- **Wired into** `src/app/psalms/[id]/page.tsx`: title block + nav now in a
  `flex justify-between` row. `min-w-0 flex-1` on the title block lets long
  bible titles ellipsize without squeezing the nav.

## Files

- `src/lib/psalm-navigation.ts` (new, server-only helper)
- `src/components/PsalmNav.tsx` (new, client component)
- `src/app/psalms/[id]/page.tsx` (wire-up: import + fetch neighbors + flex row)
- `scripts/uat/psalm-prev-next-nav.js` (new, Playwright UAT)
- `scripts/uat/screenshots/psalm-{23,1,150}-prev-next-*.png` (UAT artefacts)

## Commits

- `5f43d66` -- feat(quick): add psalm prev/next navigation helper
- `5637b90` -- feat(quick): add PsalmNav client component
- `48b34cd` -- feat(quick): wire PsalmNav into psalm detail page

## UAT

All 7 Playwright checks pass against `http://localhost:3005`:

- List button visible @375 / hidden @768 / hidden @1024 (md:hidden works)
- Click "Next" on Ps 23 lands on `/psalms/24`
- ArrowRight on Ps 23 lands on `/psalms/24`
- Ps 1: prev button has `aria-disabled="true"`
- Ps 150: next button has `aria-disabled="true"`

Screenshots captured for visual review:

- `psalm-23-prev-next-{375,768,1024}.png` -- 3 viewports
- `psalm-1-prev-next-1024.png` -- first-psalm boundary
- `psalm-150-prev-next-1024.png` -- last-psalm boundary

Production build (`npm run build`) is green: all 196 `/psalms/[id]` pages SSG
successfully with the new helper.

## Follow-ups

- (out of scope) Wrap-around from Ps 150 -> Ps 1 -- currently boundaries disable
- (out of scope) Same prev/next pattern could be added to `/tunes/[id]`
