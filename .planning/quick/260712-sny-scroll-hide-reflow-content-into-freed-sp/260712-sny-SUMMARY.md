---
phase: 260712-sny
plan: 01
subsystem: singing-view
tags: [scroll-hide, mobile, layout-reflow, singing-view]
dependency-graph:
  requires: [260712-kd1]
  provides: [mobile-only-scroll-hide-gate, notation-region-reflow]
  affects: [src/components/singing/SingingView.tsx]
tech-stack:
  added: []
  patterns:
    - "window.matchMedia('(max-width: 767px)') gate inside a scroll-listener effect, with a `change` listener for breakpoint-crossing safety"
    - "negative margin-top + grown height (not transform) to collapse in-flow sticky chrome space without introducing a window scrollbar"
key-files:
  created: []
  modified:
    - src/components/singing/SingingView.tsx
decisions:
  - "Scroll-hide gate implemented as an early-return inside handleScroll (`if (!mql.matches) return`) rather than conditionally attaching the listener — simpler, and the existing WeakMap/capture-phase logic is untouched"
  - "Reflow uses inline style with `undefined` fallback (not conditional className) so resting Tailwind classes, including `md:` desktop variants, remain the source of truth when not hidden"
metrics:
  duration: ~10 min
  completed: 2026-07-12
---

# Phase 260712-sny Plan 01: Scroll-hide reflow + mobile-only gate Summary

Gated the mobile scroll-hide effect to `<768px` and made the notation `<main>` region reflow (grow) into the space vacated by hidden bars, instead of leaving a blank gap.

## What was built

**Task 1 — Mobile-only gate (bug b):** In the scroll-hide `useEffect` keyed on `[abc]` (`src/components/singing/SingingView.tsx`), added `const mql = window.matchMedia('(max-width: 767px)')` and an early `if (!mql.matches) return` at the top of `handleScroll`, so desktop scrolling is a complete no-op — the WeakMap direction-tracking, capture-phase listener, and CR-03 reset are untouched. Added a `change` listener (`handleMql`) that force-resets `topBarHidden`/`bottomBarHidden`/`miniBarAutoHidden` to `false` whenever the viewport crosses from mobile to desktop while chrome is hidden (handles resize-while-scrolled). Both the scroll listener and the `mql` change listener are cleaned up in the effect's return.

**Task 2 — Reflow `<main>` (bug a):** Added `transition-[height,margin-top,padding-bottom] duration-200 ease-out motion-reduce:transition-none` to the notation `<main data-notation-region>` className (kept all existing resting classes, including `md:` desktop variants), and an inline `style` prop:
```tsx
style={{
  height: topBarHidden ? '100dvh' : undefined,
  marginTop: topBarHidden ? '-104px' : undefined,
  paddingBottom: bottomBarHidden ? '0px' : undefined,
}}
```
`undefined` when not hidden means the resting Tailwind classes (and the desktop `md:` variants, which are never triggered since `topBarHidden`/`bottomBarHidden` are always `false` on desktop after Task 1) apply unchanged. The PlayMiniBar dynamic-height spacer `<div style={{ height: effectiveMiniBarVisible ? miniBarHeight : 0 }} .../>` was left untouched and composes on top of the reflow.

## Deviations from Plan

None — plan executed exactly as written. Both edits landed in the exact locations and with the exact interface shapes specified in the plan's `<interfaces>` block.

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `50bdbdc` | fix(260712-sny): gate scroll-hide effect to mobile-only (<768px) |
| 2 | `f8cd992` | feat(260712-sny): reflow notation region into freed space on bar-hide |

## Verification performed this session

- `npx tsc --noEmit -p .` — no new errors attributable to `SingingView.tsx` (confirmed after Task 1, after Task 2, and again after final full-project run). The full-project run does show pre-existing errors in unrelated `tests/e2e/*.spec.ts` and `tests/precent-*.spec.ts` files (duplicate `chromium`/`BASE` declarations, missing `playwright` module types) — these are out of scope, pre-existing, and untouched by this plan.
- Grep-based structural checks (from the plan's `<verify>` blocks) all passed:
  - `matchMedia('(max-width: 767px)')` present
  - `if (!mql.matches) return` present
  - `marginTop: topBarHidden ? '-104px'` present
  - `paddingBottom: bottomBarHidden ? '0px'` present
  - `transition-[height,margin-top,padding-bottom]` present
  - PlayMiniBar spacer (`effectiveMiniBarVisible ? miniBarHeight`) still intact
- `git status --short` clean aside from pre-existing unrelated untracked directories (`.next-backup-before-worktree/`, `.planning/quick/20260709-db-wait-on-start/`) — not touched by this plan.

## Task 3 — pending rebuild + human verification

Task 3 is a `checkpoint:human-verify` gate. Per explicit session instructions, this executor did **not** rebuild, did not attempt live Playwright measurements against the stale `localhost:3005` instance, and did not extend `tests/e2e/split-leaf.spec.ts` (that requires live measurements against a fresh build). A single rebuild is being batched after 4 more pending quick-fix tasks complete in this session.

**Exact steps remaining (from the plan's Task 3 `<what-built>` and `<how-to-verify>`), to run after the batched rebuild:**

1. `cd /home/services/psalter && npm run build` — must succeed (only pre-existing warnings allowed).
2. Restart the instance Playwright will hit so it serves the fresh build (restart the :3005 process/container, or start a throwaway `PORT=3010 npm start &` and point tests at `TEST_BASE_URL=http://localhost:3010`). Confirm the served build is fresh before measuring.
3. Extend `tests/e2e/split-leaf.spec.ts` (plain Node script using `require('/usr/lib/node_modules/playwright')`, not `@playwright/test` — see file's header note; prefer the shared daemon at `http://localhost:3099` if convenient) with two checks against a psalm with ABC + lyrics (e.g. `/psalms/23`):
   - **(a) Reflow, mobile 375px:** record `[data-notation-region]` boundingBox `{ y, height }` at rest, scroll down past 100px, wait ~300ms, record again — assert `y` decreased toward ~0 (~100px drop) and `height` increased. Scroll up, wait ~300ms, assert return to resting values.
   - **(b) Mobile-only, desktop 1200px:** load same psalm, scroll down past 100px, wait, assert `[data-singing-topbar]` and `<header>` do NOT gain `data-scroll-hidden`, and `[data-notation-region]` boundingBox `y`/`height` are unchanged.
4. Report measured before/after numbers (region `y` and `height` at rest vs. hidden, mobile) to prove real content-area growth.

**Manual on-device verification (`<how-to-verify>`), once the above automated pass is green:**

1. Fullscreen reflow (mobile, 375px or real phone) on `/psalms/23`: scroll notation area down — content should visibly grow into the vacated top strip and bottom-bar strip (no blank gap), not just bars sliding over a fixed box. Scroll up — bars return and content smoothly shrinks over ~200ms (no jump/snap, no leftover gap).
2. Split-leaf (mobile): repeat in Gear → Staff (split) / Solfège (split) — reflow should still feel like real fullscreen growth.
3. Mobile-only (desktop ≥768px): scroll the notation area — confirm nothing hides (SiteHeader, top bar, bottom bar all stay put) and the content area does not resize/jump.
4. Resize safety: on mobile, scroll down until bars hide, then widen the window across 768px — all chrome should reappear and content return to resting size.
5. Regression: 260712-kd1 behaviour (bars fully sliding off, restore on scroll-up, SiteHeader visible on non-singing pages like `/tunes`) must still hold.

This plan cannot be marked fully complete until Task 3's rebuild + measurements + manual on-device check are done in the batched-rebuild session.

## Self-Check: PASSED

- FOUND: `src/components/singing/SingingView.tsx` (modified, verified via Read + grep)
- FOUND commit `50bdbdc` in `git log --oneline`
- FOUND commit `f8cd992` in `git log --oneline`
- No missing items.
