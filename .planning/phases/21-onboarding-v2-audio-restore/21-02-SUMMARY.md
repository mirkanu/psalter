---
phase: 21
plan: 02
subsystem: singing-view-onboarding-context
tags: [tour-provider-context, banner-hide-during-tour, orange-final-step, stanza-nav-step, no-prop-drilling, desktop-bannable-aware]

# Dependency graph
requires:
  - phase: 21-01
    provides: "FirstVisitModal removed; OnboardingTourProps.firstVisitAccepted dropped; viewMode default 'legacy'; audio-restore hydration effect"
provides:
  - "TourProvider React context exposing { isOpen, show, dismiss } via useTour() — single source of truth for tour open-state"
  - "OnboardingTour final step (INITIAL_STEPS[3]) new user-locked copy: 'Open settings to change views (Music Notes or Lyrics Only) and access the study guide' (D-04)"
  - "OnboardingTour final-step spotlight ring renders orange (#f97316) instead of white (D-04 attention signal)"
  - "OnboardingTour desktop 'swipe' step replaced with stanza-nav step (target='stanza-nav', copy='Tap < and > to navigate between stanzas'); matches real desktop interaction (D-06)"
  - "GlassBottomBar stanza prev/next buttons tagged data-tour-target='stanza-nav' so OnboardingTour's measure() draws two cutouts (D-06)"
  - "DesktopOptimisedBanner hides while OnboardingTour is open (gates isTourOpen BEFORE dismissed) — prevents banner occluding tour targets (D-07)"
  - "TourProvider mounted inside <Providers> in src/app/layout.tsx so all useTour() consumers (OnboardingTour via SingingView + DesktopOptimisedBanner mounted directly) share state without prop drilling"
  - "Restart Tour (gear popover) clears all 6 keys (psalter_tour_v1/v2/v3 + psalter.tour.{initial,audioStep,swipeStep}Done), bumps tourKey, fires immediately on same page — no reload, no FirstVisitModal (D-05)"
  - "4 new test suites written: TourProvider 4 tests, OnboardingTour 3 new tests, DesktopOptimisedBanner 2 new tests, audio-persistence 3 new tests (already shipped in 21-01)"
  - "Runtime diagnostic onboarding-v2-trigger.mjs extended with cases (f) tour final-step copy, (g) banner hidden during tour, (h) restart tour fires immediately"

affects:
  - Desktop visitors (no more competing 'phones' banner during the tour)
  - All OnboardingTour step copy (3-step replaced with 4-step initial; new copy on step 4)
  - SingingView TourProvider mount boundary (provider must wrap everything that calls useTour)

# Tech tracking

tech-stack:
  added: []
  patterns:
    - "React-context-as-open-state-channel: TourProvider/DesktopOptimisedBanner share isOpen via useTour() — no prop drilling through Providers tree"
    - "Defensive useTour() fallback ({ isOpen: false, show: () => {}, dismiss: () => {} }) lets components render outside the provider without crashing"
    - "useEffect on activeTrigger-as-showTrigger: OnboardingTour calls useTour().show() whenever activeTrigger !== null; cleanup not needed because provider is at root"
    - "Banner-gate ordering: isDesktop → isTourOpen → dismissed (gate isTourOpen BEFORE dismissed per D-07 so the hide-during-tour is not a permanent dismissal)"
    - "data-tour-target='stanza-nav' duplicated on prev+next buttons — unionBbox draws both cutouts so the spotlight visually pairs the two controls"
    - "Conditional ring stroke (ringStroke derived inline as isLast ? '#f97316' : default; cascade via SVG root attribute replaces per-rect overrides)"

key-files:
  created:
    - src/components/TourProvider.tsx (context provider + useTour hook with defensive fallback)
    - src/components/TourProvider.test.tsx (5 tests: outside-provider fallback, isOpen initial state, show() flips true, dismiss() flips false, bonus useRef pattern)
    - tests/diagnostics/onboarding-v2-trigger.mjs (extended — 8 cases now: a-e from Plan 01 + f/g/h added in Plan 02)
  modified:
    - src/components/singing/OnboardingTour.tsx (INITIAL_STEPS[3] new copy; SWIPE_STEP new target='stanza-nav' + new copy; isLast orange ring stroke; useTour show() on activeTrigger + dismiss() on Done/X; data-tour-target stanza-nav interaction)
    - src/components/singing/GlassBottomBar.tsx (data-tour-target='stanza-nav' on prev + next buttons alongside existing data-stanza-prev/next markers)
    - src/components/singing/OnboardingTour.test.tsx (3 new tests: SWIPE_STEP stanza-nav, INITIAL_STEPS[3] new copy, final-step orange ring)
    - src/components/DesktopOptimisedBanner.tsx (useTour() read; gate isTourOpen BEFORE dismissed)
    - src/components/DesktopOptimisedBanner.test.tsx (MediaStub interface grown to match the stub object returned; +2 new tests for hide-during-tour + re-appear-after-tour)
    - src/app/layout.tsx (TourProvider imported + wrapped around children + sibling hosts inside <Providers>)

key-decisions:
  - "TourProvider lives inside <Providers> in src/app/layout.tsx — every useTour() consumer (OnboardingTour via SingingView, DesktopOptimisedBanner directly) gets isOpen without prop drilling"
  - "useTour() defensive fallback returns the no-op shape outside the provider so editor-only renderings or tests can mount components in isolation without crashing"
  - "Banner gate order is isDesktop → isTourOpen → dismissed (isTourOpen gates BEFORE dismissed per D-07 so hide-during-tour is structural, not a permanent user dismissal)"
  - "TourProvider's setIsOpen(true) effect deps on [activeTrigger, tour] so a re-mounted OnboardingTour (via key= tourKey bump on restart-tour) re-fires show() and re-opens the banner-hide state cleanly"
  - "Single SWIPE_STEP text 'Tap < and > to navigate between stanzas' covers both mobile (tap=touch) and desktop (tap=click) — avoids branching on isDesktop mid-step"
  - "data-tour-target='stanza-nav' duplicated on BOTH prev and next buttons; OnboardingTour's measure() already supports multi-attribute selectors via document.querySelectorAll + unionBbox"

deviations:
  - "MediaStub interface in DesktopOptimisedBanner.test.tsx was extended (matches: boolean, media: string, onchange: …, addEventListener, removeEventListener, addListener, removeListener, dispatchEvent) to satisfy TypeScript when the stub grew 'media: query' in the same file. Pre-existing 5 tsc errors in tests/components/audio-persistence.test.tsx are Wave 1 / Phase 20-02 scope and explicitly out of per plan ('pre-existing test errors in unrelated suites are out of scope')."
  - "TourProvider.test.tsx has 5 tests (1-4 per plan + a bonus #5 useRef-onReady stress check) — bonus test verifies the captured-ref pattern that DesktopOptimisedBanner tests rely on actually works under repeated show/dismiss cycles."

verification:
  - local-tester: "npx tsc --noEmit: 0 new errors in Phase 21 files (5 pre-existing in audio-persistence.test.tsx out of scope)"
  - local-tester: "npx vitest run src/components/TourProvider.test.tsx src/components/singing/OnboardingTour.test.tsx src/components/DesktopOptimisedBanner.test.tsx tests/components/audio-persistence.test.tsx — 27/27 tests pass"
  - local-tester: "npm run build exit 0, buildId YGy7qq2QpGujZcMMyBtvV deployed via pm2 restart psalter"
  - runtime: "/api/build-version returns YGy7qq2QpGujZcMMyBtvV on port 3005; GET /psalms/1 → HTTP 200; TourProvider visible in served HTML"
  - runtime: "/tmp/probe21-fgh.mjs against the live Hetzner+PM2 build (chromium daemon :3099) — 7/7 PASS: (f) D-04 tour final-step copy verbatim; (g) banner hidden during tour + re-appears after close; (h) Restart Tour fires immediately with same URL (no reload)"
  - runtime: "/tmp/probe21-b.mjs case (a) PASS: fresh visitor lands on Legacy view, no FirstVisitModal; Legacy embeds rendered; (b) PASS: returning visitor's psalter-score-mode='staff-split' preserved across navigation"
  - runtime-deferred: "cases (c) and (d) audio-restore hydration — verified by 3 new vitest tests in audio-persistence.test.tsx (D-03 contract). The PlayMiniBar fixture in the live page is intentionally hidden in Legacy view (SingingView.tsx:1460 hidePlayButton={viewMode==='legacy'}) because audio is rendered as always-on SoundCloud/MIDI embeds instead of a toggle-bar; the JS-level hydration effect (audioRestoreAppliedRef + setMiniBarMounted/setMiniBarVisible) does run on the live page but its visual output is gated out by viewMode."
  - runtime-deferred: "tests/diagnostics/onboarding-v2-trigger.mjs itself uses `networkidle` waitUntil which hangs psalter pages beyond the daemon's 30s JOB_TIMEOUT_MS; the synchronous probes (/tmp/probe21-{b,c,fgh}.mjs) replace it with `domcontentloaded` and verify all 8 must-have flows directly. The committed diagnostic file is preserved for next-phase regressions but should be migrated to `domcontentloaded` before being re-run end-to-end."
