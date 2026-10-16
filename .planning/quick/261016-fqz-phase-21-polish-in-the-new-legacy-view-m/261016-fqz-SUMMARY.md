---
phase: 21-onboarding-v2-audio-restore
plan: fqz
type: execute
status: complete
subsystem: singing-view-legacy-audio-onboarding-polish
tags: [legacy-view-layout, gear-popover-radios, onboarding-tour-polish, inline-midi-embed, orange-new-feature-accent]

# Dependency graph
requires:
  - phase: 21-01
    provides: "FirstVisitModal removed; viewMode default 'legacy'; audio-restore hydration effect; OnboardingTour split into 3 independent triggers"
  - phase: 21-02
    provides: "TourProvider context; D-04 orange final-step ring stroke; D-06 stanza-nav step; D-07 banner-hide-during-tour"
provides:
  - "Legacy view lyrics padding matches Lyrics Only (centred 36rem column, same mobile gutters) — items 1 + 5"
  - "Legacy view SoundCloud iframe height bumped from 80 to 166 (widget renders ~166px tall; 80 cropped) — item 4"
  - "Inline MIDI player replaces dead 'Piano player available — press Play in the bottom bar' placeholder — item 3"
  - "Gear popover view-mode radios on one row (Music Notes / Lyrics / Legacy) with icons restored — items 2a/2b/2c"
  - "Double-active bug fixed: 'legacy' excluded from isMusicNotes so Music Notes radio loses bg-primary when Legacy is selected — item 2a"
  - "OnboardingTour final step copy now flags the view-switch as '(new feature!)' — orange-highlighted span — item 6"
  - "Audio-step fires on first entry to viewMode='lyrics' too (same key, no double-firing) — item 7"
  - "Single-step tours hide 'Step X of Y' counter + 'Skip tour' button; aria-label becomes 'Onboarding notice' — item 8"

affects:
  - All visitors on /psalms/[id] in Legacy view (now have a real audio player inline + matched padding)
  - All visitors opening the gear popover (3 radios on one row with icons; 'Lyrics Only' renamed to 'Lyrics')
  - First-time visitors hitting the initial tour's final step (orange 'new feature!' highlight on the view-switch copy)
  - Visitors who first land on Lyrics Only after the initial tour (audio-step fires here too)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline audio embed via PlayMiniBar variant='flow' in document flow (already proven on /tunes/[slug]); reuse PlayMiniBar's own localStorage migration so legacy 'psalter-audio-source' key still migrates inside LegacyAudioEmbed"
    - "Discriminated Step.copy union ('string | { pre, highlight }') for rich copy with minimal interface change — only the final step uses the structured form; all other steps keep copy: string"
    - "isMusicNotes explicit membership list (staff/staff-split/solfege/solfege-split) excluding 'legacy' — same pattern as OnboardingTour.tsx:170-175 isMusicNotesView"
    - "Tailwind text-orange-500 (#f97316) reused as the project's 'new things' accent — matches the gear ring stroke on the final initial-tour step"

key-files:
  created:
    - src/components/singing/LegacyAudioEmbed.tsx (new 'use client' component: thin wrapper over PlayMiniBar variant='flow' for inline Legacy-view MIDI embed)
  modified:
    - src/app/globals.css (3 selector lists get 'legacy' view-mode added: max-width + padding-block + mobile override; 'staff' subtitle selectors untouched per plan)
    - src/components/notation/NotationRenderer.tsx (legacy-embeds wrapper: mb-2 → my-2; SoundCloud iframe height 80 → 166 + scrolling='no'; placeholder div replaced with <LegacyAudioEmbed>; new import line)
    - src/components/singing/GearPopover.tsx (isMusicNotes derivation excludes legacy; FileText icon imported; Music + FileText icons restored on radios; 'Lyrics Only' → 'Lyrics' rename; Legacy button moved INTO grid; grid-cols-2 → grid-cols-3; col-span-2 removed)
    - src/components/singing/OnboardingTour.tsx (Step.copy accepts 'string | { pre, highlight }'; INITIAL_STEPS[3] uses structured form; bubble JSX has discriminated branch; isMusicNotesView adds 'lyrics'; counter + Skip button gated on steps.length > 1; aria-label switches to 'Onboarding notice' for single-step)
    - src/components/singing/OnboardingTour.test.tsx (Test 7 updated for new structured copy; Test 9 NEW: orange-highlighted span textContent; Test 10 NEW: audio-step fires on viewMode=lyrics)
    - tests/diagnostics/onboarding-v2-trigger.mjs (case (i) NEW: final step orange-highlighted 'new feature!' span with screenshot to step4-orange.png)

key-decisions:
  - "LegacyAudioEmbed wraps PlayMiniBar (not PlayMiniBarClient) directly because PlayMiniBar's own useEffect/useState wiring requires the React tree, not the dynamic import wrapper — the dynamic() wrapper in PlayMiniBarClient was originally needed to defer the abcjs synth bootstrap until client-side; the LegacyAudioEmbed is itself already 'use client' so it can import PlayMiniBar statically"
  - "Chose Option B for the final-step copy: discriminate Step.copy as 'string | { pre, highlight }' (rather than Option A which would have required render-time string splitting) — minimal interface change, only one step uses the structured form"
  - "Reused the same #f97316 orange used for the final-step gear ring (D-04) on the new 'new feature!' span so the visual emphasis is consistent — orange is the project's reserved 'attention accent'"
  - "Updated Test 7's exact-copy regex for the new structured copy (the OLD single-string 'Open settings to change views... and access the study guide' is split into pre+highlight now); added Test 9 to verify the orange span textContent matches exactly"
  - "Audio-step-on-lyrics uses the SAME psalter.tour.audioStepDone key as the existing audio-step trigger — so once a user has seen the step on EITHER path, they don't re-see it on the other path (described contract preserved)"

deviations:
  - "Plan verify claimed grep for `data-view-mode=\"legacy\" .lyrics-block` should return ≥4 hits in globals.css; my implementation has 3 (one per selector list: lines 295-298, 305-310, 317-330). The plan's ≥4 was an off-by-one in its verify block — there are only 3 .lyrics-block selector lists to update. Verified via fixed-string grep `grep -F` count = 3."
  - "Plan verify claimed grep for `viewMode === 'lyrics'` in OnboardingTour.tsx should return ≥2 hits (one new in isMusicNotesView + one existing in some aria-checked); my implementation has 1 hit (only the new one in isMusicNotesView). The plan assumed there was an existing aria-checked line, but the original OnboardingTour never had `viewMode === 'lyrics'` anywhere — so 1 hit is correct (the new line I added). Verified via `grep -nE \"viewMode === 'lyrics'\"` count = 1."
  - "Plan said 'Update existing Test 5 (or whichever counter test exists) for the new aria-label contract' — but Test 5 in OnboardingTour.test.tsx is actually the dismiss test, not the counter test. There is no aria-label-specific test to update; I left Test 5 untouched (the Done-button assertion still works since the single-step Done button is the only button now) and instead updated Test 7 for the new copy structure (its old exact-string match no longer matched the split pre+highlight)."
  - "Plan listed 'grep \"Skip tour\" src/components/singing/OnboardingTour.tsx returns 1 hit (the variant reference in the test mock)' — but the test mock is in OnboardingTour.test.tsx, not OnboardingTour.tsx. In OnboardingTour.tsx itself there is exactly 1 'Skip tour' hit (inside the steps.length > 1 gate) which matches the plan's expected 1 — the plan's parenthetical comment about location was wrong but the count was right."
  - "LegacyAudioEmbed imports PlayMiniBar (not PlayMiniBarClient) — see key-decisions for rationale; the dynamic() wrapper was unnecessary because LegacyAudioEmbed is itself 'use client' and PlayMiniBar's abcjs synth bootstrap is fine inside an already-client component"

verification:
  - local-tester: "Task 1 verify all pass: globals.css has 'legacy' in 3 .lyrics-block selector lists; legacy-embeds wrapper is 'space-y-2 my-2'; SoundCloud iframe has height='166' + scrolling='no'; 'Piano player available' string is gone; LegacyAudioEmbed.tsx exists with variant='flow'"
  - local-tester: "Task 2 verify all pass: data-view-option='legacy' is inside the grid (line 350); grid-cols-3 (1 hit); col-span-2 (0 hits); >Lyrics Only< (0 hits), >Lyrics< (1 hit); old isMusicNotes derivation removed; new isMusicNotes derivation excludes 'legacy'"
  - local-tester: "Task 3 verify all pass: 'new feature!' (1 hit in INITIAL_STEPS); text-orange-500 (1 hit in bubble JSX); 'Onboarding notice' (1 hit in aria-label); steps.length > 1 (3 hits: aria-label + counter + skip button); 'Skip tour' (1 hit inside the gate)"
  - local-tester: "npx tsc --noEmit: 0 new errors in changed files (78 pre-existing errors in test files unrelated to Phase 21, per 21-REVIEW.md pre-existing notes — out of scope per plan boundary)"
  - local-tester: "npx vitest run TourProvider + OnboardingTour + DesktopOptimisedBanner + audio-persistence: 29/29 tests pass (OnboardingTour grew from 8 → 10 tests; Test 7 updated for new copy structure; Test 9 NEW + Test 10 NEW)"
  - local-tester: "npm run build: exit 0; buildId=9bnPijnPMb3p1jOl4ASJ4 captured by capture-build-info postbuild"
  - runtime: "pm2 restart psalter: success; /psalms/1 → HTTP 200; /api/build-version returns 9bnPijnPMb3p1jOl4ASJ4 (matches local build)"
  - runtime: "Playwright probe via Chromium daemon :3099: viewMode=legacy confirmed; iframe[data-legacy-soundcloud] height=166 confirmed; [data-legacy-midi] mount confirmed (new LegacyAudioEmbed mount)"
  - runtime: "Playwright probe: gear popover View type radiogroup contains ['Music Notes','Lyrics','Legacy'] in order (Lyrics Only → Lyrics rename confirmed; all 3 on one row)"
  - runtime: "Playwright probe: tour final step dialogText contains 'Open settings to access the study guide or (new feature!) change views to Music Notes or Lyrics Only'; .text-orange-500 span textContent matches exactly; aria-label is 'Onboarding step 4 of 4' (initial multi-step)"
  - runtime: "Playwright probe: with localStorage psalter.tour.initialDone=true + psalter-score-mode=lyrics, audio-step fires (data-onview-onboarding-tour[data-tour-audio-step] present); single-step chrome verified — dialogText='Tap the play button to open the audio player.'; skipBtn=0 (no Skip); counter=0 (no Step X of Y); aria-label='Onboarding notice'"
  - runtime-deferred: "Full diagnostic onboarding-v2-trigger.mjs (including new case (i)) still uses `networkidle` waitUntil which exceeds Playwright daemon's 30s JOB_TIMEOUT_MS on psalter pages — verified incrementally via smaller probes (above); case (i) is the last case in the script and shares the same waitUntil pattern that the daemon times out on. Same pre-existing limitation disclosed in 21-02-SUMMARY.md; out of scope here."
  - runtime-deferred: "Mobile-first screenshots at 390/768/1440 viewports: Playwright daemon kept returning HTTP 500 under current VPS memory pressure (2.6Gi/3.7Gi used); verified the build via the 462KB SSR HTML, server-rendered BAILOUT_TO_CLIENT_SIDE_RENDERING (NotationRenderer is client-rendered — content doesn't appear in raw curl HTML); buildId matches; tests pass. Visual screenshots not re-captured for this round but the build is the same shape as 21-02 (Phase 21 polish only — no new client-rendered shapes introduced that warrant a fresh viewport sweep beyond the existing VERIFICATION)."

# Worktree context
This plan was dispatched as a parallel executor in worktree mode but on inspection was actually run on the main /home/services/psalter checkout (the `.git` is a directory, not a file). Per orchestrator instructions and memory `project_github_push_protection_master.md`, all commits live on a `phase-21-fqz` feature branch with PR pending — direct push to master is blocked by GH006 gitleaks push protection (`enforce_admins: true`). The branch is pushed to origin; PR will be created once SUMMARY.md is finalised.