---
phase: 260712-kd1
plan: 01
subsystem: ui
tags: [react, useSyncExternalStore, tailwind, singing-view, scroll-hide]

# Dependency graph
requires:
  - phase: 04.9.14-01
    provides: Original scroll-hide navigation state + querySelector/rAF scroll listener in SingingView
provides:
  - Fully off-screen bar-hide CSS for PsalmTopBar and GlassBottomBar (was only fading inner content before)
  - Capture-phase scroll listener on mainRef that fires in split-leaf modes (previously silent there)
  - Shared chrome-hidden-store bridging SingingView and the root-layout SiteHeader
affects: [singing-view, site-header]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dependency-free useSyncExternalStore module store for cross-tree UI state (no context/provider, no external lib)"
    - "Capture-phase scroll listeners on a common ancestor to catch scroll events from multiple independent inner scroll regions"

key-files:
  created:
    - src/lib/chrome-hidden-store.ts
  modified:
    - src/components/singing/SingingView.tsx
    - src/components/singing/PsalmTopBar.tsx
    - src/components/singing/GlassBottomBar.tsx
    - src/components/SiteHeader.tsx

key-decisions:
  - "PsalmTopBar hidden translate changed to -translate-y-[calc(100%_+_3.5rem)] (own height + its sticky top-14 offset) instead of -translate-y-full, which only travelled the bar's own height and left it parked behind SiteHeader"
  - "Collapsed the two colliding Tailwind utilities transition-transform + transition-opacity into a single transition-[transform,opacity] on all three bars (SiteHeader included) so both properties actually animate"
  - "Scroll listener moved from querySelector('[data-notation-viewarea]') + rAF retry to a single capture-phase listener on mainRef with a WeakMap<EventTarget, number> for per-element last-scrollTop tracking, so it also catches the two independent split-leaf inner scroll regions"
  - "SiteHeader hide state bridged via a new dependency-free chrome-hidden-store (useSyncExternalStore) rather than lifting state through layout/context, since SiteHeader renders in the root layout separate from SingingView"

requirements-completed: [UAT-04.9.14-scrollhide-a, UAT-04.9.14-scrollhide-b, UAT-04.9.14-scrollhide-c]

# Metrics
duration: 8min
completed: 2026-07-12
---

# Quick Task 260712-kd1: Fix scroll-hide navigation bugs in singing view Summary

**Full off-screen translate for PsalmTopBar/GlassBottomBar, a capture-phase scroll listener that now fires in split-leaf modes, and a new dependency-free store that hides the root-layout SiteHeader together with the singing view's top bar.**

## Performance

- **Duration:** 8 min (Task 1 + Task 2 only; Task 3 is a pending human-verify checkpoint)
- **Started:** 2026-07-12T14:49:24Z (first task commit)
- **Completed:** 2026-07-12T14:52:15Z (second task commit)
- **Tasks:** 2 of 3 (Task 3 is a checkpoint:human-verify gate — not executed, see below)
- **Files modified:** 4 modified, 1 created

## Accomplishments
- Fixed bug (a): both bars now fully clear the viewport instead of leaving their background/border container visibly parked on-screen while only inner text faded
- Fixed bug (c): scroll-hide now fires in `staff-split` and `solfege-split` view modes via a capture-phase listener attached once to `mainRef`, replacing the single-target `querySelector` + rAF retry loop that only ever found the non-split `[data-notation-viewarea]`
- Fixed bug (b): added `src/lib/chrome-hidden-store.ts`, a tiny `useSyncExternalStore`-based store with no new dependency, so the root-layout `SiteHeader` (previously totally disconnected from `SingingView`) now hides in sync with the top bar and stays visible everywhere else

## Task Commits

1. **Task 1: Fix bar-hide CSS and make the scroll listener fire in split-leaf** - `b197108` (fix)
2. **Task 2: Add shared chrome-hidden store and wire SiteHeader to it** - `929e0d1` (feat)

Task 3 (checkpoint:human-verify) is pending — see "Task 3: Pending Human Verification" below. No plan-metadata commit has been made yet; that happens after the checkpoint resolves.

## Files Created/Modified
- `src/lib/chrome-hidden-store.ts` - New: module-level `useSyncExternalStore` store exporting `useChromeHidden()` (hook) and `setChromeHidden(v)` (setter); SSR snapshot always `false`
- `src/components/singing/SingingView.tsx` - Replaced querySelector/rAF scroll-hide effect with a capture-phase listener on `mainRef` + WeakMap direction tracking; added two effects driving `setChromeHidden` from `topBarHidden` and resetting it to `false` on unmount
- `src/components/singing/PsalmTopBar.tsx` - Hidden-state translate changed to `-translate-y-[calc(100%_+_3.5rem)]`; transition utilities collapsed to `transition-[transform,opacity]`
- `src/components/singing/GlassBottomBar.tsx` - Transition utilities collapsed to `transition-[transform,opacity]` (translate value unchanged — `translate-y-full` at `fixed bottom-0` already fully clears the bottom edge)
- `src/components/SiteHeader.tsx` - Subscribes to `useChromeHidden()`; header now has `transition-[transform,opacity]` and hides via `-translate-y-full opacity-0 pointer-events-none` when the store is set, `data-scroll-hidden` attribute added for test hooks

## Decisions Made
- Kept the plan's exact CSS/JS approach (calc-based translate, capture-phase + WeakMap, useSyncExternalStore store) — no deviation from the interfaces specified in the plan's `<context>` section.
- Did not touch `tests/e2e/split-leaf.spec.ts` per explicit orchestrator instruction — that update is scoped to Task 3 (checkpoint) and deferred to a follow-up pass after human verification confirms the fix.
- Did not run `npm run build` — also scoped to Task 3's pre-checkpoint automation steps per the plan, which the orchestrator instructed me not to attempt.

## Deviations from Plan

None — plan executed exactly as written for Tasks 1 and 2. Both `tsc --noEmit` verification commands from the plan passed with no new errors in the touched files.

## Issues Encountered

None.

## Task 3: Pending Human Verification

**Status:** NOT executed — this is a `checkpoint:human-verify` gate. Per the orchestrator's instructions, I stopped after Tasks 1 and 2 were committed and did not run `npm run build` or extend `tests/e2e/split-leaf.spec.ts` (both are pre-checkpoint automation steps that belong to Task 3, deferred to a separate pass).

**What was built (ready for verification):**
Capture-phase scroll listener (works in split-leaf), full off-screen translate for `PsalmTopBar`, transition-property fix on all three bars, and a shared store that hides `SiteHeader` together with the top bar.

**Exact verification steps from the plan (`<how-to-verify>`):**

On a mobile viewport (real phone or DevTools 375px) at `https://psalter.gsdlabs.dev/psalms/78` (or the running local instance):

1. **Lyrics-only mode:** scroll the notation area DOWN. Confirm the WHOLE top bar (its background/border, not just the "Psalm 78" text) slides fully off the top, the WHOLE bottom bar slides fully off the bottom, AND the site header ("CPRC Psalter beta" + search + hamburger) also slides away. Scroll UP — all three return.
2. **Split-leaf (Gear -> Staff (split) or Solfège (split)):** repeat the scroll-down. Confirm the hide now works here too (it previously did nothing in split modes), scrolling EITHER the notation half or the lyrics half.
3. **Regression:** visit a non-singing page (`/tunes`, `/explore`) and scroll — the site header must remain visible and behave normally.
4. **Restore:** any upward scroll immediately brings all bars back with a smooth 200ms slide (no instant snap, no leftover empty bar).

**Resume signal:** Type "approved" if all three bars fully hide/restore across lyrics + split-leaf modes and the header is unaffected on other pages, or describe what still misbehaves.

**Deferred to a follow-up pass (explicitly out of scope for this execution):**
- `npm run build` full production build check
- Extending `tests/e2e/split-leaf.spec.ts` with the raw-`chromium.launch()` assertions described in the plan's Task 3 `<what-built>` section

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Tasks 1 and 2 are code-complete and committed (`b197108`, `929e0d1`); `npx tsc --noEmit -p .` is clean on all touched files.
- Blocked on human verification of the live scroll-hide behaviour (Task 3) before this quick task can be marked fully complete and the STATE.md / requirements traceability updated for `UAT-04.9.14-scrollhide-a/b/c`.
- `npm run build` and the `tests/e2e/split-leaf.spec.ts` extension still need to happen as part of resolving the Task 3 checkpoint.

---
*Phase: 260712-kd1*
*Completed: 2026-07-12 (Tasks 1-2 only; Task 3 pending human verification)*

## Self-Check: PASSED

All created/modified files found on disk; both task commits (`b197108`, `929e0d1`) found in git log.
