---
status: flagged
phase: 21
files_reviewed: 14
critical: 0
warning: 1
info: 2
total: 3
reviewed_at: "2026-10-16"
reviewer: gsd-code-reviewer (standard depth)
---

# Phase 21 Code Review — onboarding-v2-audio-restore

## Summary

Phase 21 cleanly reverses the Phase 20 modal pattern, ships the audio-restore hydration fix as a ref-guarded localStorage read, and adds a defensive TourProvider context that wraps everything `useTour()` might consume. All 11 must-haves pass on the live build per VERIFICATION.md. At standard depth I found **no critical bugs**, **one warning** (a defense-in-depth issue in the new TourProvider show/dismiss effect that can let `isOpen` become stale across navigation), and two low-severity observations. The implementation is shippable; the warning is offered as an additive improvement, not a blocker.

## Files Reviewed

| # | Path | Status |
|---|------|--------|
| 1 | `/home/services/psalter/src/app/layout.tsx` | OK |
| 2 | `/home/services/psalter/src/app/psalms/[id]/page.tsx` | OK |
| 3 | `/home/services/psalter/src/components/DesktopOptimisedBanner.tsx` | OK |
| 4 | `/home/services/psalter/src/components/DesktopOptimisedBanner.test.tsx` | OK |
| 5 | `/home/services/psalter/src/components/TourProvider.tsx` | OK (one Info observation) |
| 6 | `/home/services/psalter/src/components/TourProvider.test.tsx` | OK |
| 7 | `/home/services/psalter/src/components/singing/NotationRenderer.tsx` (lines 2479-2483, 2617-2621 reviewed for WR-02/WR-03 closure) | OK |
| 8 | `/home/services/psalter/src/components/singing/GearPopover.tsx` (lines 155-158 reviewed for IN-01 closure) | OK |
| 9 | `/home/services/psalter/src/components/singing/GlassBottomBar.tsx` (D-06 markers) | OK |
| 10 | `/home/services/psalter/src/components/singing/OnboardingTour.tsx` | One finding (Warning) |
| 11 | `/home/services/psalter/src/components/singing/OnboardingTour.test.tsx` | OK |
| 12 | `/home/services/psalter/src/components/singing/SingingView.tsx` (D-01, D-03 changes) | OK |
| 13 | `/home/services/psalter/tests/components/audio-persistence.test.tsx` | OK |
| 14 | `/home/services/psalter/tests/diagnostics/onboarding-v2-trigger.mjs` | OK |

## Findings

### WR-01 — TourProvider `isOpen` can become stale-true if OnboardingTour unmounts mid-tour

**File:** `/home/services/psalter/src/components/singing/OnboardingTour.tsx:296-298`
**Severity:** Warning
**Category:** bug (defense-in-depth)
**Summary:** The new `useEffect` that publishes the tour's open-state to `TourProvider` only calls `tour.show()` when `activeTrigger !== null`; it never explicitly calls `tour.dismiss()`. If `OnboardingTour` ever unmounts while the tour is rendered (e.g. user closes the tab, hits a parent error boundary, or a future feature lets them navigate while the overlay is up) without going through the `dismiss` callback, `isOpen` stays `true` in the layout-level provider. The `DesktopOptimisedBanner` (which gates on `isTourOpen` *before* the dismissed flag) then stays hidden even though no tour is active.

**Failure scenario:**
1. Fresh visitor on `/psalms/1` desktop view → OnboardingTour hydrates → `activeTrigger='initial'` → `tour.show()` fires → provider `isOpen=true` → DesktopOptimisedBanner hidden.
2. User closes the tab *without* dismissing the tour.
3. User opens a new tab on `/psalms/23` (or any psalm). OnboardingTour mounts again. localStorage shows `psalter.tour.initialDone='true'` (set during the previous tab's dismiss? — in this scenario no, because user never dismissed), so… actually if the user never dismissed, the new tab also fires the initial tour and `show()` re-sets `isOpen=true` (no-op).
4. But consider: user *did* dismiss the tour in tab 1 (tourInitialSeen=true, isOpen=false set by dismiss callback), then in the SAME tab navigated to a non-psalm page that doesn't mount OnboardingTour (e.g. `/precent/...` or `/`). isOpen stays at `false`. Comes back to a psalm — activeTrigger=null, show effect doesn't fire, isOpen stays false. **Banner can show.** No bug there.

The real narrow window is: `OnboardingTour` unmounts while activeTrigger is non-null (tour was open), without dismiss being called. With the current overlay consuming all clicks (`pointer-events-auto` on the outer div), normal user navigation mid-tour is impossible — but error boundaries, HMR, or a future "skip overlay clicks" feature would expose it. The fix is cheap and surgical.

**Recommendation:** Make the effect symmetric:
```tsx
useEffect(() => {
  if (activeTrigger !== null) {
    tour.show()
  } else {
    // Defensive: reset provider state when no tour is firing so a
    // stale isOpen=true (from OnboardingTour unmounting mid-tour)
    // never keeps DesktopOptimisedBanner hidden between visits.
    tour.dismiss()
  }
}, [activeTrigger, tour])
```

Why this is warning not info: the production happy-path is correct (overlay traps the user until dismiss, which sets isOpen=false). The bug needs a non-normal exit (tab close, error, future nav-during-tour feature) to surface. Given the OnboardingTour is the canonical state authority, having it own reset logic is the right home for the fix.

### IN-01 — `useTour()` no-op fallback allocates a fresh object per call

**File:** `/home/services/psalter/src/components/TourProvider.tsx:44-46`
**Severity:** Info
**Category:** quality
**Summary:** When `useTour()` is called outside the provider, the fallback returns a new object literal `{ isOpen: false, show: () => {}, dismiss: () => {} }` on every render. The provider's actual context value is `useMemo`-stable across renders when state is unchanged, so consumers inside the provider get referential stability; outside-provider consumers do not. In practice no consumer is supposed to be outside the provider (layout wraps everything that calls `useTour()`), so this is asymmetric but not incorrect.

**Recommendation (optional):** Hoist the fallback into a module-scope constant for symmetry:
```tsx
const NOOP_TOUR_VALUE: TourContextValue = {
  isOpen: false,
  show: () => {},
  dismiss: () => {},
}
```

### IN-02 — `show`/`dismiss` effect re-runs on every `tour` identity change (cosmetic echo)

**File:** `/home/services/psalter/src/components/singing/OnboardingTour.tsx:296-298`
**Severity:** Info
**Category:** quality
**Summary:** The provider's context value is `useMemo`-keyed on `[isOpen, show, dismiss]`. Every `isOpen` toggle changes the memoized value's identity, which is reflected in the `tour` reference and therefore re-runs the `[activeTrigger, tour]` effect. `setIsOpen(true)` when already `true` is a React no-op, so the echo has no observable cost — but a reader might wonder why the effect fires when only `tour` changes. The cleaner pattern is to depend on the callbacks directly: `useEffect(() => { activeTrigger !== null ? tour.show() : tour.dismiss() }, [activeTrigger, tour.show, tour.dismiss])`. Same behaviour, smaller change surface.

**Recommendation (optional):** Switch deps to `tour.show`/`tour.dismiss` (both `useCallback([])` — stable). If WR-01's fix is applied, the explicit `else` branch will also document the symmetric intent.

## Spot-checks (no findings, just confirmation)

- **D-03 audio-restore effect (SingingView.tsx:350-372):** Correct. Uses `audioRestoreAppliedRef` to guard against re-runs; reads `localStorage` directly to sidestep React effect ordering race (disclosed in 21-01 SUMMARY.md "Auto-fixed Issues #1"). 3 new vitest tests pass.
- **D-04 final-step orange ring (OnboardingTour.tsx:321-322):** `ringStroke` derived inline as `isLast && activeTrigger === 'initial' ? '#f97316' : 'var(--tour-ring, #ffffff)'`; applied via SVG root `stroke` attribute that cascades to child `<rect>`s. Clean.
- **D-06 SWIPE_STEP stanza-nav (OnboardingTour.tsx:53-56 + GlassBottomBar.tsx:171,194):** `target='stanza-nav'` matched via `document.querySelectorAll('[data-tour-target="stanza-nav"]')` returning both prev/next; `unionBbox` draws two cutouts (matches existing prev/next pattern).
- **D-07 TourProvider mount (layout.tsx:95,128):** Wraps all `useTour()` consumers (DesktopOptimisedBanner at layout, OnboardingTour via SingingView). Banner-gate order `isDesktop → isTourOpen → dismissed` is correct (isTourOpen gates BEFORE dismissed so hide is structural, not a permanent dismissal).
- **WR-02 (NotationRenderer.tsx:2479-2483):** `forceStaffJpgFallback` correctly simplified to `(tunePageMode && !abc.trim()) || isSplit` with the in-line re-activation comment.
- **WR-03 (NotationRenderer.tsx:2617-2621):** Comment collapsed to one coherent 4-line block. Verified exactly one occurrence of the opening sentence ("baseSize drives AbcPlayer's dynamic lyric solver").
- **IN-01 (GearPopover.tsx:155):** "Keep these references alive" comment correctly placed immediately above the `void` row.
- **D-02 FirstVisitModal deletions:** Confirmed no surviving references in `src/app/psalms/[id]/page.tsx`, `SingingView.tsx`, or `OnboardingTour.tsx`. `firstVisitAccepted` prop fully removed; `shouldFireInitial` simplified to `mounted && !tourInitialSeen`.
- **D-05 Restart Tour:** `handleRestartTour` (SingingView.tsx:716-739) clears all 6 keys + bumps `tourKey`; the `key={tourKey}` mount remounts OnboardingTourClient cleanly.
- **No SSR/hydration breakage:** All `'use client'` boundaries intact. TourProvider and useTour no-op fallback are SSR-safe (state defaults to false server-side, no window access during render of `if (!ctx)` path).

## Pre-existing notes (out of Phase 21 scope)

- **TSC errors:** Per 21-01 SUMMARY.md and VERIFICATION.md, the working tree has ~78 pre-existing `tsc --noEmit` errors, none introduced by Phase 21. Distribution: 5 in `tests/components/audio-persistence.test.tsx` (lines 27, 35, 43, 101, 117 per Phase 21 plan note), 73 across `tests/components/SingingView.test.tsx`, `tests/components/DesktopOptimisedBanner.test.tsx`, `tests/components/singing/GearPopover.points-2-3.test.tsx`, `src/db/queries/daily.test.ts`, `src/lib/changelog-broadcast.test.ts`, `src/app/api/changelog/[id]/route.test.ts`, `src/app/api/changelog/route.test.ts`, `tests/precent-*.spec.ts`, `tests/e2e/*.spec.ts`. Confirmed pre-existing by `git stash` re-run per the SUMMARY. **Out of scope per plan boundary.**
- **Diagnostic `networkidle` timeout (non-blocking):** `tests/diagnostics/onboarding-v2-trigger.mjs` line 104, 125, 150, 177, 197, 216, 256, 292 use `waitUntil: 'networkidle'` which can exceed the Playwright daemon's 30s `JOB_TIMEOUT_MS`. Synchronous probes (`/tmp/probe21-{b,fgh}.mjs`) replace it with `domcontentloaded` per VERIFICATION.md. **Already disclosed in 21-02 SUMMARY; not blocking.**
- **PlayMiniBar visually gated in Legacy view:** Per CONTEXT.md "specifics" + VERIFICATION.md, `SingingView.tsx:1460` `hidePlayButton={viewMode==='legacy'}` hides the bar in Legacy view because audio is delivered as always-on embeds. D-03 hydration effect still runs, but the visual output is gated out. **Documented contract.**
- **Mobile-first default view-mode change (D-01):** Fresh visitors now land on Legacy view instead of 'staff'. If any external link/shared URL relied on default-`staff` rendering, those visits will see the scan-based legacy layout first. Documented in SUMMARY as intentional. **Not a bug.**

---

_Reviewed: 2026-10-16_
_Reviewer: gsd-code-reviewer (standard depth)_
_Depth: standard_
