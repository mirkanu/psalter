---
title: Single psalm view UX overhaul — precentor feedback round
date: 2026-10-15
context: Captured during /gsd-explore on 2026-10-15. Decisions below are locked; next step is to add as Phase 20 and run /gsd-discuss-phase + /gsd-plan-phase.
---

# Single psalm view UX overhaul — precentor feedback round

## Why

A non-tech-savvy precentor beta-tested the live psalter and complained because "it's changed!". When we dug in, the actual feedback was:

- He wants the SoundCloud embed **prominently at the top** of the single-psalm view (like the old site had it)
- He doesn't care about the lyrics
- He couldn't figure out how to play the tune
- He didn't pay attention to the tour that opens on first psalm open

Other users will be similarly non-tech-savvy. The fix is to (1) add a third top-level view mode optimised for the precentor use case, (2) fix a confusing bottom-right play button, (3) redesign first-visit onboarding so users land on the right view without having to remember a tour.

## What changes (6 items)

### 1. Legacy view (third top-level mode)

Adds a third option alongside Music Notes and Lyrics Only. Differences from Lyrics Only:

- (a) SoundCloud and MIDI embeds are embedded directly into the viewport above the lyrics (SoundCloud at top), always visible — no popout needed
- (b) Bottom-right play button is **hidden** (not needed since embeds are always shown)

### 2. Bottom-right play button bug fixes

(a) **Button is an open/close toggle, not play/pause.** Pressing opens the embed player (MIDI or SoundCloud, whichever user last selected). Visual: play symbol with **inverted colors** when open. Pressing again closes the embed. Subtle behaviour:

- SoundCloud: audio auto-stops when hidden (iframe behaviour, no code change needed)
- MIDI: needs explicit stop in code on close
- View-mode switch: player stays open across view changes, **EXCEPT switching TO Legacy which stops all playback**

(b) **Empty embed URLs.** If SoundCloud URL is missing but user selected SoundCloud → notice: *"Sung recording not available for this tune. Try switching to the piano player by pressing the piano button on the left."* Empty MIDI gets the mirror notice: *"Piano player not available for this tune. Try switching to the sung recording by pressing the sung recording button on the left."*

### 3. Audio state persistence across psalms

New localStorage keys:

- `psalter.audioPlayerOpen: boolean` — whether the bottom-right player is open
- `psalter.audioLastSelected: 'midi' | 'soundcloud'` — which embed the user last picked

Both persist across psalm navigation. **Cross-view-mode in the same psalm: resets to closed** (entering Legacy forces embeds always-on; leaving Legacy resets to the stored closed state).

### 4. Tour — context-aware multi-trigger

Tour is no longer a single linear sequence. Splits into three independent triggers:

- **Initial tour** (fires once after the modal Accept in item 5): standard steps EXCEPT audio player step (since play button isn't visible in Lyrics Only or Legacy on first visit)
- **Audio player step** (single-step tour): fires once on first Music Notes or Staff Inline view entry, ONLY if initial tour done. Skipped in Legacy view (no play button there)
- **Swipe step** (single-step tour): fires once on first Staff Inline view entry, ONLY if initial tour done

### 5. First-visit modal

- Triggers automatically on first visit to `/psalms/[id]` ONLY (NOT `/psalms` index, NOT `/psalms/[id]/study`)
- Modal shows the view-mode selector from the gear menu (excluding Study and Restart-tour buttons)
- Selection in the modal updates the displayed view in the background (live preview)
- Modal stays open with an **Accept** button. **Re-opens on every /psalms/[id] visit until Accept is clicked** (no choice is persisted unless Accept is pressed; closing via X or browser back does not save)
- On Accept: choice persisted to localStorage; modal never auto-opens again. Initial tour then fires.

### 6. Force cache refresh on deploy (standalone public mechanism)

Goal: every existing user re-triggers the new first-visit flow on next psalm visit.

Approach: build a NEW public `/api/build-version` endpoint that returns only `{ buildId: "..." }` (no commit/message metadata, to avoid leaking internal repo structure). Plus a tiny effect on psalm pages: read localStorage `psalter.lastSeenBuildId`, compare to current buildId, hard-reload on mismatch, write new value.

- Per-load cost: ~10–100µs (localStorage read + string compare)
- Deploy-boundary cost: one hard reload per user
- Standalone from admin-only DeployStatus; does NOT fix the existing `data-build-id="unknown"` staleness issue (separate concern)

## Key decisions made in this conversation

| Decision | Choice | Why |
|----------|--------|-----|
| Cross-view audio state | Resets to closed when leaving Legacy | Clean separation between "always-on" Legacy and the rest |
| SoundCloud close behaviour | Auto-stops on hide (iframe behaviour) | No extra code; matches user expectation |
| MIDI close behaviour | Explicit stop on close | MIDI keeps playing in background unless stopped |
| View-switch with player open | Player stays open across view switches | Continuity; switching TO Legacy is the only stop trigger |
| Tour architecture | Context-aware multi-trigger (3 independent trigger points) | Each step fires only when its feature is first encountered |
| Empty embed handling | Mirror notices for both SoundCloud and MIDI | Symmetry; both states need user guidance |
| Modal trigger scope | `/psalms/[id]` only, NOT index or `/study` | First psalm detail view is the natural on-ramp |
| Modal dismissal | Re-opens until Accept | No silent saves; user must commit |
| Cache-bust mechanism | NEW `/api/build-version` (public, buildId only) | Existing `/api/deploy-info` is admin-only and would expose repo metadata if made public |
| DeployStatus fix scope | OUT of scope | Standalone cache-bust for this feature; existing DeployStatus issues are separate |

## Phase packaging

**User decision (2026-10-15): single planned phase, all 6 items together.** Do NOT split.

## Related context

- `.planning/phases/15.2-.../15.2-FINAL-ANALYSIS.md` — Phase 15.2 shipped dynamic-import wrappers for `OnboardingTourClient`, `GearPopoverClient` (will be relevant to item 5)
- Memory [[psalter data-build-id="unknown" pre-existing]] — explains why we DON'T reuse DeployStatus for item 6; that mechanism is admin-gated and has known staleness issues
- Memory [[psalter NEXT_PUBLIC_ env convention]] — relevant if `/api/build-version` reads from an env var
- Memory [[iOS bfcache stale state]] — existing inline guard in layout.tsx compares data-build-id to localStorage; item 6's effect is a related but distinct mechanism

## Next steps

1. Add this work as **Phase 20** in `ROADMAP.md`
2. Run `/gsd-discuss-phase 20` to gather any remaining implementation context
3. Run `/gsd-plan-phase 20` to create PLAN.md with task breakdown
4. `/gsd-execute-phase 20` after plan verification