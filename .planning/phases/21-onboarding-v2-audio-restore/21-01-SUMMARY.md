---
phase: 21
plan: 01
subsystem: singing-view-onboarding-v2
tags: [d-01-legacy-default, d-02-firstvisitmodal-removal, d-03-audio-restore-hydration, d-08-review-leftovers, gsd-tour-ungated, view-mode-default, mobile-first-default]

# Dependency graph
requires:
  - phase: 20-01
    provides: "FirstVisitModal + OnboardingTour 3-trigger split + restartTour clear-all"
  - phase: 20-02
    provides: "audioPlayerOpen + audioLastSelected persistence keys + PlayMiniBarClient mount gate"
provides:
  - "FirstVisitModal removed entirely — fresh visitors land directly on Legacy view without modal interruption"
  - "viewMode default changed from 'staff' to 'legacy' for fresh visitors (readStoredViewMode fallback + useState initial)"
  - "Audio player UI genuinely restores across psalm navigation (miniBarMounted/miniBarVisible seeded from localStorage on mount)"
  - "Audio restore edge case handled: audioPlayerOpen=true but no lastSelected → icon shows inverted colour, no player UI until source picked"
  - "Phase 20 review leftovers closed (WR-02 NotationRenderer forceStaffJpgFallback simplified, WR-03 duplicated comment collapsed, IN-01 void-row comment)"
  - "New Playwright runtime diagnostic covering legacy default + stored mode preserved + audio restore + edge case + mobile-first overflow check"
  - "OnboardingTour firstVisitAccepted prop dropped — initial tour fires on first visit without the deleted modal gate"
affects:
  - Phase 21-02 (Wave 2 tour rework: orange gear step + Desktop stanza-nav replacement + TourProvider for banner-hide interaction — depends on firstVisitAccepted already being gone)
  - Phase 21-02 (Wave 2 desktop "swipe" step → "Tap < and > to navigate between stanzas" — reuses the same tourSwipe key, no schema change required)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "one-shot audio-restore effect with audioRestoreAppliedRef guard (ref-based debounce to avoid clobbering user toggles via handlePlayToggle)"
    - "direct localStorage read inside the restore effect (avoids React effect-order race with the audio-hydrate effect on first mount)"
    - "PlayMiniBarClient mock that surfaces mounted + visible as data-* attributes for assertion-friendly tests"

key-files:
  created:
    - tests/diagnostics/onboarding-v2-trigger.mjs (Playwright diagnostic: 5 cases — legacy default, stored mode preserved, audio restore, edge case, mobile-first overflow)
  modified:
    - src/components/singing/SingingView.tsx (viewMode default 'legacy', readStoredViewMode fallback 'legacy', audioRestoreAppliedRef + new one-shot restore effect, firstVisitAccepted state/imports/OnboardingTourClient prop/comment refs removed, handleRestartTour firstVisitAccepted plumbing removed)
    - src/components/singing/OnboardingTour.tsx (firstVisitAccepted prop + interface field + shouldFireInitial simplification to mounted && !tourInitialSeen + comment update)
    - src/components/singing/OnboardingTour.test.tsx (defaultProps + 5 test invocations: firstVisitAccepted dropped; describe label updated)
    - src/app/psalms/[id]/page.tsx (FirstVisitModalClient import + JSX mount deleted)
    - src/components/notation/NotationRenderer.tsx (forceStaffJpgFallback simplified to 2-line form with 1-line explanatory comment; WR-03 duplicated comment collapsed)
    - src/components/singing/GearPopover.tsx (1-line comment above the HIDDEN void row explaining keepalive purpose)
    - tests/components/audio-persistence.test.tsx (PlayMiniBarClient mock exposes data-mounted/data-visible attrs; 3 new audio-restore tests added; baseProps gets a primaryTune so the bar's outer render gate opens)
  deleted:
    - src/components/singing/FirstVisitModal.tsx (CR-01 fix had collapsed the storage-key mismatch but the modal itself is no longer needed)
    - src/components/singing/FirstVisitModalClient.tsx (dynamic ssr:false wrapper for the deleted modal)
    - src/components/singing/FirstVisitModal.test.tsx (Phase 20 WR-01 tautological test — file deletion is the WR-01 closure)
    - tests/diagnostics/first-visit-modal-trigger.mjs (asserted the now-deleted modal opens — replaced by onboarding-v2-trigger.mjs)

key-decisions:
  - "D-01 default-rank: 'legacy' as fresh-visitor default is consistent with readStoredViewMode's new-visit fallback — both paths agree (was 'staff' / 'staff' pre-Phase-21)."
  - "D-01 viewMode union: 'legacy' added to the readStoredViewMode valid-union check alongside staff/solfege/staff-split/solfege-split/lyrics, so a previously-stored 'legacy' value round-trips through hydrate cleanly — previously it would have silently fallen through to the new 'legacy' default by accident."
  - "D-03 implementation: read localStorage directly inside the new effect (not the hydrated audioPlayerOpen state) — React's effect order isn't guaranteed to give us the freshly-hydrated value before the audioRestoreAppliedRef guard latches on first mount. Re-reading localStorage is a single useEffect call and guarantees we see the same source-of-truth the audio-hydrate effect did."
  - "D-03 audioRestoreAppliedRef: a useRef<boolean>(false) guard ensures the restore runs exactly once after mount. Subsequent re-runs (driven by handlePlayToggle updating audioPlayerOpen via user clicks) must NOT clobber the user's in-memory miniBarMounted/miniBarVisible — handlePlayToggle has its own logic for these (setMiniBarMounted(true) + setMiniBarVisible(true) on open, etc.)."
  - "D-03 edge case semantics: a visitor with audioPlayerOpen='true' but no lastSelected source lands with miniBarMounted=true (so the bottom-right icon flips to inverted 'open' colour AND the next toggle unhides the bar without a fresh click) but miniBarVisible=false (no player UI rendered until they pick a source). CONTEXT.md specifics called this acceptable; implementation matches."
  - "OnboardingTour shouldFireInitial simplification: 'mounted && firstVisitAccepted && !tourInitialSeen' → 'mounted && !tourInitialSeen'. The firstVisitAccepted gate was the modal's job; without a modal, the initial tour fires on first visit by default. Returning visitors who completed the tour still skip it (their tourInitialSeen key is 'true' from the prior session)."
  - "Test infrastructure: baseProps for audio-persistence.test.tsx now includes a primaryTune with abcNotation + staffPages array. Phase 21 D-01 made the default viewMode 'legacy', which would have hidden the bar in tests with no other state set (PlayMiniBar's outer render gate is 'viewMode !== \"legacy\" && (abc || soundcloudUrl)'). Without a tune, the new mock's data-mounted/data-visible attrs can never be observed. The pre-existing 2 audio-persistence tests pass unchanged because they assert on GlassBottomBar (which always renders), not PlayMiniBar."

patterns-established:
  - "ref-guarded one-shot effect: when an effect must run exactly once after hydration but the user-facing code path also touches the same state, use a useRef flag rather than relying on dependency arrays alone. The ref prevents the user's own mutations from triggering the restore again."
  - "localStorage read inside effect: when an effect depends on a value another effect populates, prefer reading the source-of-truth (localStorage) directly in the dependent effect rather than depending on the populated state — immune to React effect ordering."

requirements-completed: []

# Metrics
duration: "approx 25 minutes wall-clock (Task 1 ~6 min, Task 2 ~12 min including test infra iteration, Task 3 ~7 min)"
tasks_completed: 3
files_created: 1
files_modified: 7
files_deleted: 4
commits: 3
merged_via: "pending — direct push to master blocked by GH006 gitleaks push protection; pushed to phase-21-01 feature branch for orchestrator PR"
completed_date: 2026-10-16
---

# Phase 21 Plan 01: FirstVisitModal Removal + Legacy Default + Audio Restore Summary

**Phase 20's "ask first-time visitors to choose a view" pattern is reversed: FirstVisitModal is deleted, fresh visitors land directly on Legacy view (matching the old softr site most returning visitors remember), and the audio-player-restore hydration bug from the Phase 20 audit is fixed so a returning visitor's open audio player genuinely re-renders the player UI on the next page, not just the bottom-right icon's inverted colour state. The four Phase 20 review leftovers are also closed.**

## Performance

- **Duration:** ~25 min wall-clock (Task 1 ~6 min, Task 2 ~12 min including test-infrastructure iteration, Task 3 ~7 min including diagnostic authoring)
- **Started:** 2026-10-16T08:34:00Z
- **Completed:** 2026-10-16T08:48:00Z
- **Tasks:** 3 (all `auto`)
- **Files:** 1 created + 7 modified + 4 deleted = 12 total
- **Commits:** 3 (`234c7d7f`, `31877575`, `0ba1bf49`)
- **Tests:** 27/27 across 6 suites (audio-persistence 5/5 incl. 3 new D-03 cases, SingingView 4/4, OnboardingTour 5/5, PlayMiniBar 3/3, GlassBottomBar 3/3, DesktopOptimisedBanner 7/7)
- **Build:** `npm run build` exit 0, buildId `4gkfUBXZ7kC8GyPmt42pL`
- **Deploy:** `pm2 restart psalter` succeeded; live HTTP 200 on `/psalms/1` and `/psalms/23`; `/api/build-version` returns new buildId

## Accomplishments

- **FirstVisitModal is fully removed** (`src/components/singing/FirstVisitModal.tsx`, `FirstVisitModalClient.tsx`, `FirstVisitModal.test.tsx` deleted). Psalm page no longer imports or mounts it; SingingView no longer carries `firstVisitAccepted` state, the `psalter.firstVisitModalAccepted` storage constant, the hydrate `setFirstVisitAccepted` block, the `handleRestartTour` removeItem+setFirstVisitAccepted(false) line, or the OnboardingTourClient `firstVisitAccepted={...}` prop.
- **Fresh visitors land on Legacy view** without modal interruption (D-01). Two code paths changed in lock-step: `useState<ViewMode>('staff')` → `useState<ViewMode>('legacy')` at SingingView.tsx line 221, and `readStoredViewMode`'s new-visit fallback `return 'staff'` → `return 'legacy'` at line 138. The viewMode union check inside `readStoredViewMode` also gets the `'legacy'` literal added so previously-stored legacy values round-trip through hydrate (previously they silently fell through to the new default by accident).
- **Returning visitors with a stored viewMode are preserved**: a visitor who picked 'staff-split' (or any other mode) on a previous visit continues to land on that mode on the next visit. The hydrate read happens before the persist write, so the stored value wins over the new default — D-01 doesn't clobber existing preferences.
- **OnboardingTour no longer requires the modal gate**: `shouldFireInitial` simplified from `mounted && firstVisitAccepted && !tourInitialSeen` to `mounted && !tourInitialSeen`. First-time visitors see the initial tour immediately; returning visitors who completed it still skip (their `psalter.tour.initialDone='true'` key persists across sessions).
- **Audio player UI genuinely restores across psalm navigation (D-03 bug fix)**: a new post-hydration useEffect in SingingView.tsx seeds `miniBarMounted` and `miniBarVisible` from localStorage the first time `mounted === true`. An `audioRestoreAppliedRef` useRef guard prevents subsequent re-runs from clobbering the user's in-memory state — handlePlayToggle's own logic (which sets both states on open/close clicks) continues to drive the bar correctly.
- **Audio restore edge case handled cleanly**: a visitor with `psalter.audioPlayerOpen === 'true'` but no `psalter.audioLastSelected` source lands with `miniBarMounted=true` (bottom-right icon shows inverted 'open' colour, next toggle unhides without a fresh click) but `miniBarVisible=false` (no player UI until they pick a source). CONTEXT.md "specifics" called this acceptable; implementation matches.
- **Three Phase 20 review leftovers closed (D-08)**: WR-02 simplified `forceStaffJpgFallback` to the documented 2-line form with a 1-line explanatory comment linking to the `project-staff-split-leaf-disabled` memory; WR-03 collapsed the paste-error-duplicated 7-line comment above `baseSize={baseSize}` to one coherent 4-line block; IN-01 added a 1-line keepalive comment above the `void isMusicNotes; void isStaff; ...` row in GearPopover.
- **New Playwright runtime diagnostic** (`tests/diagnostics/onboarding-v2-trigger.mjs`) replaces the obsolete `first-visit-modal-trigger.mjs`. Covers 5 cases: legacy default (no modal), stored viewMode preserved, audio restore mounts, audio restore edge case (icon only), mobile-first overflow at 3 viewport sizes.
- **Live build verified**: `npm run build` produced `4gkfUBXZ7kC8GyPmt42pL`; `pm2 restart psalter` succeeded; `/api/build-version` returns the new buildId; `/psalms/1` and `/psalms/23` return HTTP 200.

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete FirstVisitModal + remove firstVisitAccepted plumbing (D-02)** — `234c7d7f` (feat) — 7 files changed, 27 insertions(+), 350 deletions(-)
2. **Task 2: Default viewMode='legacy' + audio-restore hydration effect (D-01, D-03)** — `31877575` (feat) — 2 files changed, 152 insertions(+), 5 deletions(-)
3. **Task 3: Phase 20 review leftovers + new diagnostic (D-08/WR-02 + WR-03 + IN-01)** — `0ba1bf49` (feat) — 4 files changed, 206 insertions(+), 157 deletions(-)

## Files Created/Modified

**Deleted (4 files):**

- `src/components/singing/FirstVisitModal.tsx` — the view-selector modal itself; CR-01 fix had already aligned the storage key with SingingView's read, but the modal is no longer needed
- `src/components/singing/FirstVisitModalClient.tsx` — `dynamic({ ssr: false })` wrapper for the deleted modal
- `src/components/singing/FirstVisitModal.test.tsx` — 5 tests, 1 of which (Test 4) was tautological per Phase 20 review WR-01 (file deletion is the WR-01 closure)
- `tests/diagnostics/first-visit-modal-trigger.mjs` — Playwright diagnostic that asserted the now-deleted modal opens; replaced by the new diagnostic

**Created (1 file):**

- `tests/diagnostics/onboarding-v2-trigger.mjs` — Playwright runtime diagnostic covering 5 Phase 21 outcomes (see "New diagnostic" section)

**Modified (7 files):**

- `src/components/singing/SingingView.tsx` — viewMode default 'legacy', readStoredViewMode fallback 'legacy' + union includes 'legacy', new audio-restore useEffect with audioRestoreAppliedRef guard, firstVisitAccepted state/imports/OnboardingTourClient prop/comment refs removed, handleRestartTour firstVisitAccepted plumbing removed
- `src/components/singing/OnboardingTour.tsx` — firstVisitAccepted prop + interface field + OnboardingTourProps destructure deleted; shouldFireInitial simplified to `mounted && !tourInitialSeen`
- `src/components/singing/OnboardingTour.test.tsx` — defaultProps + 5 test invocations: firstVisitAccepted dropped; describe label updated
- `src/app/psalms/[id]/page.tsx` — FirstVisitModalClient import + JSX mount deleted
- `src/components/notation/NotationRenderer.tsx` — forceStaffJpgFallback simplified to 2-line form with 1-line explanatory comment (WR-02); duplicated comment above `baseSize={baseSize}` collapsed to 4-line coherent block (WR-03)
- `src/components/singing/GearPopover.tsx` — 1-line comment above the HIDDEN void row explaining keepalive purpose (IN-01)
- `tests/components/audio-persistence.test.tsx` — PlayMiniBarClient mock exposes `data-mounted`/`data-visible` attrs; 3 new D-03 audio-restore tests added; baseProps gets a primaryTune so the bar's outer render gate opens in tests

## Decisions Made

- **audioRestoreAppliedRef + localStorage read instead of state deps**: The plan's literal expression `setMiniBarMounted(audioPlayerOpen)` + dependency on `audioPlayerOpen` doesn't work — React's effect order isn't guaranteed to give us the freshly-hydrated `audioPlayerOpen=true` value before the ref guard latches on first mount. Initial implementation followed the plan literally and produced a failing test (D-03a expected `data-mounted="true"`, got `"false"` because the effect ran once with the initial `audioPlayerOpen=false`, set the ref, and never ran again). Fix: read `localStorage.getItem(STORAGE_AUDIO_PLAYER_OPEN)` directly inside the new effect, depend only on `[mounted]`. Single useEffect call; immune to React effect ordering. Plan's stated intent (audioPlayerOpen hydrate must drive miniBarMounted/miniBarVisible) is fully preserved.
- **baseProps gains a primaryTune for the new audio tests**: Phase 21 D-01 made the default viewMode 'legacy', which would have hidden the bar in tests with no other state set (PlayMiniBar's outer render gate is `viewMode !== "legacy" && (abc || soundcloudUrl)`). Without a tune, the new mock's data-mounted/data-visible attrs can never be observed. The pre-existing 2 audio-persistence tests pass unchanged because they assert on GlassBottomBar (which always renders), not PlayMiniBar.
- **Implementation reads localStorage directly inside the restore effect (not the hydrated audioPlayerOpen state)** — see above. This deviates from the plan's literal text but matches its stated intent and is the only configuration that passes the D-03a test.
- **description label retained in OnboardingTour.test.tsx describe()**: `'OnboardingTour (Phase 20-01, D-15/D-16; Phase 21 D-02 drops firstVisitAccepted)'` — keeping the historical context in the suite name is more useful for future readers than removing the `firstVisitAccepted` mention. Pure labelling choice, no behavioural effect.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Audio-restore effect was reading stale state**
- **Found during:** Task 2 verification (first vitest run of audio-persistence.test.tsx after D-03 implementation)
- **Issue:** Initial implementation followed the plan literally: `useEffect(..., [audioPlayerOpen, audioLastSelected, mounted])` with `setMiniBarMounted(audioPlayerOpen)` based on the state value. The audio-hydrate effect (declared immediately above) and this new effect both run in the same effect phase after first render. React's effect order isn't guaranteed to give us the freshly-hydrated `audioPlayerOpen=true` value before the ref guard latches, so the effect ran with the initial `audioPlayerOpen=false`, set the ref to `true`, and never re-ran when `audioPlayerOpen` later became `true`. D-03a test failed: `data-mounted="false"` (expected `"true"`).
- **Fix:** Read `localStorage.getItem(STORAGE_AUDIO_PLAYER_OPEN)` directly inside the new effect instead of consuming the state. Changed dependency array from `[audioPlayerOpen, audioLastSelected, mounted]` to `[mounted]`. Single useEffect call, guarantees we see the same source-of-truth the audio-hydrate effect did.
- **Files modified:** `src/components/singing/SingingView.tsx`
- **Verification:** All 5 audio-persistence tests pass (2 original + 3 new D-03 cases); 14/14 tests pass across audio-persistence + SingingView + OnboardingTour; 27/27 across the plan's full verification suite.
- **Committed in:** `31877575` (Task 2 commit)

**2. [Rule 3 - Test infra] baseProps needed a primaryTune for the new audio tests**
- **Found during:** Task 2 verification (D-03 audio tests)
- **Issue:** Phase 21 D-01 made the default viewMode 'legacy'. PlayMiniBar's outer render gate `viewMode !== 'legacy' && (abc || soundcloudUrl)` would always be false in tests with the previous baseProps (primaryTune=null), so the new mock's data-mounted/data-visible attrs could never be observed. First test run failed: `querySelector('[data-testid="mock-play-mini-bar"]')` returned null.
- **Fix:** Added a `testPrimaryTune` constant with `abcNotation` + `staffPages` array and assigned it to `baseProps.primaryTune`. The pre-existing 2 audio-persistence tests pass unchanged because they assert on GlassBottomBar (always rendered), not PlayMiniBar.
- **Files modified:** `tests/components/audio-persistence.test.tsx`
- **Verification:** All 5 audio-persistence tests pass.
- **Committed in:** `31877575` (Task 2 commit)

**3. [Rule 2 - Edge case] Audio restore tests also need to seed psalter-score-mode**
- **Found during:** Task 2 verification (D-03 audio tests after primaryTune fix)
- **Issue:** Even with a primaryTune, the new audio tests would render `viewMode='legacy'` because the test never set `psalter-score-mode` in localStorage and the viewMode default is now 'legacy'. PlayMiniBar would still be hidden by the gate. Second test run failed.
- **Fix:** All three new D-03 tests now also `localStorage.setItem('psalter-score-mode', 'staff-split')` so the hydrate reads a non-legacy value and the bar's outer render gate opens. The plan's existing tests don't need this fix because they assert on GlassBottomBar.
- **Files modified:** `tests/components/audio-persistence.test.tsx`
- **Verification:** All 5 audio-persistence tests pass.
- **Committed in:** `31877575` (Task 2 commit)

## Issues Encountered

- **`npx tsc --noEmit` shows 79 pre-existing TS errors across the repo** — none introduced by this plan. All errors are in test files (`tests/components/SingingView.test.tsx`, `tests/components/audio-persistence.test.tsx`, `src/components/DesktopOptimisedBanner.test.tsx`, `src/components/singing/GearPopover.points-2-3.test.tsx`, `src/db/queries/daily.test.ts`, `src/lib/changelog-broadcast.test.ts`, `src/app/api/changelog/[id]/route.test.ts`, `src/app/api/changelog/route.test.ts`). Confirmed pre-existing by stashing changes and re-running tsc against the base commit (`8309b6c2`); the same errors appear at the same files (different line numbers due to my new content). Per scope-boundary rules, not fixed.
- **GH006 gitleaks push protection on direct push to master** — `git push origin master` was rejected: "Required status check 'scan' is expected." The gitleaks workflow only fires on push events, but the protection hook rejects the push before dispatching the workflow. Per the project's `project_github_push_protection_master.md` memory and the orchestrator's `parallel_execution` rules, this is expected: master merges happen via PR (Phase 20-01 went through PR #116, Phase 20-02 through #118, etc.). All three commits pushed to the `phase-21-01` feature branch instead; orchestrator creates the squash-merge PR centrally.
- **Local gitleaks confirms zero findings** — `/tmp/gitleaks detect --source . --config .gitleaks.toml` exits 0 against the working tree, confirming the GH006 rejection is a status-check-not-yet-run condition rather than an actual secret leak. The orchestrator's PR will trigger the `scan` workflow and pass.

## New diagnostic

`tests/diagnostics/onboarding-v2-trigger.mjs` — 5-case Playwright runtime diagnostic using the shared Chromium daemon at `:3099`:

1. **(a) Fresh visitor lands on Legacy view, no FirstVisitModal popup** — clears localStorage, visits `/psalms/1`, asserts `data-view-mode="legacy"` AND `[data-first-visit-modal]` count is 0
2. **(b) Stored viewMode preserved** — sets `psalter-score-mode='staff-split'`, visits `/psalms/1`, asserts `data-view-mode="staff-split"` (proves D-01 doesn't clobber existing preferences)
3. **(c) Audio player restores across psalm navigation** — seeds `psalter.audioPlayerOpen='true'` + `psalter.audioLastSelected='midi'`, visits `/psalms/1` then navigates to `/psalms/23`, asserts `[data-play-mini-bar]` mounted with `data-visible="true"`
4. **(d) Audio restore edge case** — seeds only `psalter.audioPlayerOpen='true'` (no lastSelected), navigates to `/psalms/23`, asserts `data-play-toggle="open"` AND `[data-play-mini-bar]` count is 0
5. **(e) Mobile-first overflow check** — re-runs case (a) at 390/768/1440 viewports, asserts no horizontal overflow at any width; saves screenshots to `tests/diagnostics/out/onboarding-v2-trigger/{mobile-390,tablet-768,desktop-1440}.png`

## User Setup Required

None — no external service configuration. The phase changes are entirely client-side (localStorage state, view-mode default, audio-restore hydration) and don't require any new secrets, dashboard configuration, or environment variables.

## Next Phase Readiness

- **Plan 21-02 (Wave 2)** — OnboardingTour final step gear-button orange highlight + new text, desktop "swipe" → "Tap < and > to navigate between stanzas" (reuses `tourSwipeDone` key), DesktopOptimisedBanner-hides-while-tour-open via new `TourProvider` context. All depends on `firstVisitAccepted` plumbing being gone (this plan delivers it), and on the existing `tourSwipeSeen` / `tourInitialSeen` / `tourAudioSeen` priority cascade remaining intact (preserved).
- **Wave 2 prep confirmed present**: Plan 21-02's `<OnboardingTourClient key={tourKey} ... />` mount with the dropped `firstVisitAccepted` prop line is now in the right shape for Wave 2 to add new props (e.g., `onTourOpenChange={showTour}` for the banner interaction) without re-introducing the deleted modal gate.

---

*Phase: 21-onboarding-v2-audio-restore*
*Plan: 01*
*Completed: 2026-10-16*

## Self-Check: PASSED

- `tests/diagnostics/onboarding-v2-trigger.mjs` — FOUND
- `.planning/phases/21-onboarding-v2-audio-restore/21-01-SUMMARY.md` — FOUND
- `src/components/singing/FirstVisitModal.tsx` — ABSENT (deleted per D-02)
- `src/components/singing/FirstVisitModalClient.tsx` — ABSENT (deleted per D-02)
- `src/components/singing/FirstVisitModal.test.tsx` — ABSENT (deleted per D-02 + WR-01 closure)
- `tests/diagnostics/first-visit-modal-trigger.mjs` — ABSENT (deleted; replaced by onboarding-v2-trigger.mjs)
- Commit `234c7d7f` — FOUND (Task 1: delete FirstVisitModal + drop firstVisitAccepted plumbing)
- Commit `31877575` — FOUND (Task 2: default viewMode='legacy' + audio-restore hydration effect)
- Commit `0ba1bf49` — FOUND (Task 3: Phase 20 review leftovers + new diagnostic)