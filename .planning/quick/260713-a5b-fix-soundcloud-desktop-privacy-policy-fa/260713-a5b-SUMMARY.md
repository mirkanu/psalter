---
phase: quick-260713-a5b
plan: 01
subsystem: singing-view
tags: [play-mini-bar, soundcloud, iframe, desktop, first-load, layout-transition]

# Dependency graph
requires:
  - phase: quick-260712-lp9
    provides: PlayMiniBar SoundCloud sandbox fix (allow-same-origin) and desktop md:right-[calc(...)] positioning
provides:
  - Deferred SoundCloud iframe mount in PlayMiniBar, decoupled from the 44px->80px SC-mode layout transition
affects: [play-mini-bar, singing-view, soundcloud-playback]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Double requestAnimationFrame + trailing settle timeout to defer DOM insertion of a third-party iframe until a CSS transition has visually completed"

key-files:
  created:
    - .planning/quick/260713-a5b-fix-soundcloud-desktop-privacy-policy-fa/diagnostic.js
  modified:
    - src/components/singing/PlayMiniBar.tsx

key-decisions:
  - "Confirmed via live Playwright-daemon diagnostics against the real pre-fix build that the fresh SoundCloud iframe can be inserted into the bar while its 44px->80px transition is still mid-flight (rectHeight sampled at 64.78px on insertion) -- validating the plan's default deferred-mount hypothesis without needing an emphasis shift"
  - "Iframe first-mount gated behind scIframeReady (double rAF + 220ms settle timeout keyed on isScMode); iframe element itself stays persistent across tune switches so the already-working src-only-update path is untouched"
  - "lp9 fixes (sandbox allow-scripts allow-same-origin, desktop md:right-[calc(...)] positioning) preserved byte-for-byte"

requirements-completed: []

# Metrics
duration: ~25min
completed: 2026-07-13
---

# Quick Task 260713-a5b: Fix SoundCloud Desktop First-Toggle Fallback Summary

**Deferred the SoundCloud `<iframe>`'s first mount in `PlayMiniBar` until the bar's 44px->80px layout transition has visually settled, removing the race that could abort the widget's `/me` bootstrap fetch on desktop first-activation.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-13
- **Tasks:** 2/2 completed
- **Files modified:** 1 (`src/components/singing/PlayMiniBar.tsx`); 1 diagnostic script created

## Accomplishments

- Instrumented the real running app (localhost:3005, pre-fix build) via the shared Playwright daemon and directly captured the fresh SoundCloud iframe being inserted while the bar's own `getBoundingClientRect().height` was still mid-transition (64.78px, climbing toward 80px) — confirming the plan's primary hypothesis rather than assuming it.
- Implemented a mechanism-agnostic deferred-mount fix: the iframe's first insertion into SoundCloud mode now waits for a double `requestAnimationFrame` + 220ms settle timeout (just past the `duration-200` CSS transition) before mounting, with a lightweight "Loading recording..." placeholder occupying the same slot in the meantime.
- Verified the already-working tune-switch path is untouched: `scIframeReady` only gates the very first mount into SC mode; once true it stays true for the duration of SC mode, so switching tunes continues to update only the iframe's `src` on the same persistent element.
- Verified `tsc --noEmit` reports zero errors in `PlayMiniBar.tsx` (pre-existing unrelated errors in `tests/e2e/*.spec.ts` and `tests/*.spec.ts` are out of scope for this task and untouched).

## Task Commits

1. **Task 1: Instrument the real app to identify the broken-first-mount vs working-tune-switch discriminator** — investigation only, no source changes; findings recorded in `diagnostic.js`'s trailing comment block and folded into Task 2's commit message.
2. **Task 2: Decouple the SoundCloud iframe mount from the toggle-triggered layout change** - `b50da6a` (fix)

_Task 1 produced no independent commit (investigation-only, no source changes per plan); its diagnostic script and findings traveled with Task 2's commit._

## Files Created/Modified

- `src/components/singing/PlayMiniBar.tsx` — added `scIframeReady` state + effect (double-rAF + 220ms settle timeout keyed on `isScMode`, resets on leaving SC mode); iframe render now gated on `scIframeReady` with a "Loading recording..." placeholder (`data-sc-iframe-loading`) shown while waiting; `sandbox="allow-scripts allow-same-origin"` and `md:right-[calc(max(0px,(100vw_-_56rem)/2)_+_0.5rem)]` (lp9 fixes) left byte-for-byte intact.
- `.planning/quick/260713-a5b-fix-soundcloud-desktop-privacy-policy-fa/diagnostic.js` — throwaway Playwright-daemon investigation script (not shipped) with recorded findings from 4 runs against the real pre-fix app (psalms/37, psalms/78).

## Task 1 Investigation Findings

Ran `diagnostic.js` against the live pre-fix build at `localhost:3005` via the shared Playwright daemon (`http://localhost:3099`, confirmed `browserReady: true` before each run):

- **1 full Case A/Case B run** on `/psalms/37` (primary tune 7 "Sawley", real `soundcloud_url`; Case B switched to alternate tune 6 "Scarborough", also real `soundcloud_url`, via the actual `TuneSwitcherSheet` UI client-side navigation).
- **3 additional Case-A-only runs** on `/psalms/78` (tune 128 "Azmon/Denfield").
- **1 targeted DOM/network inspection run** that clicked the widget's real play button and confirmed genuine HLS audio-stream network requests fire and the button's class flips to `playing` when the widget is functional.

**Key finding:** in one Case-A run (psalm 78), the post-toggle sampling loop caught the fresh `<iframe>` element already present in the DOM (`hasIframe: true`) while the bar's own `rectHeight` was still mid-transition at 64.78px and 74.2px (climbing 44→80px) — i.e., the iframe was inserted before the bar reached its stable 80px size. In every Case B sample (tune switch, same persistent iframe), the bar was already at a stable 80px on the very first sample (~21ms after the click) in every run, since SC mode was already active. This directly confirmed the plan's decision-tree branch: "Case A's bar is measurably mid-transition... CONFIRMS the mechanism -> Task 2 proceeds with the deferred-mount fix" — no emphasis shift was needed.

**Non-determinism note:** despite catching one mid-transition insertion, the `/me` bootstrap request did not reliably `ERR_ABORT` in this VPS environment (2 of 4 Case-A runs saw the abort; 2 did not), and even when it did abort, the interactive player DOM (`button.playButton`, functional on click) was still present in these particular runs. This matches the plan's own diagnostic evidence that the pure CSS-transition isolation harness from the planning session also failed to reproduce the abort reliably — the race is real (directly observed) but its downstream severity is timing-sensitive and environment-dependent (this VPS's fast local loopback and warm Next.js cache narrow the race window compared to the original manual-browser repro). The fix removes the race unconditionally rather than relying on favorable timing.

**Also confirmed as a red herring per the plan's warning:** `iframe.contentFrame()` body `innerText` is a useless success/failure signal — it read the identical static "Download / SoundCloud privacy policy / Privacy policy" text in every single run, including runs where the underlying widget DOM (`button.playButton`, `role="application"`, `title="Play"`) was fully present and playable. Detection instead used presence of `.playButton` / `[class*="playButton" i]` in the widget's DOM.

## Deviations from Plan

None — plan executed exactly as written. Task 1's investigation confirmed the plan's default hypothesis (deferred-mount, no emphasis shift), and Task 2 implemented the DEFAULT approach specified in the plan (double rAF + settle timeout, `scIframeReady` gate, persistent iframe across tune switches, placeholder in the same slot).

## Known Stubs

None. The "Loading recording..." text is an intentional, short-lived (~220ms) loading placeholder, not a stub — it is replaced by the real iframe on every SC-mode entry.

## Verification

- `grep -c 'sandbox="allow-scripts allow-same-origin"'` → 1 (lp9 sandbox intact)
- `grep 'md:right-\[calc(max(0px,(100vw_-_56rem)/2)_+_0.5rem)\]'` → present (lp9 desktop positioning intact)
- `grep 'scIframeReady'` → present (4 occurrences: state, effect dep reset, effect set, render gate)
- `npx tsc --noEmit -p .` → 0 lines mentioning `PlayMiniBar` (pre-existing unrelated errors in `tests/e2e/*.spec.ts` files are out of scope, untouched by this task)
- **Deferred to orchestrator's batched rebuild:** on desktop fresh load, first toggle to SoundCloud mode shows the interactive player (play button) and `api-widget.soundcloud.com/me` does not `ERR_ABORT`; tune-switch while in SC mode still works; mobile SC first-activation still works. This quick task's environment (dev server, pre-fix build) could not measure the fix's actual runtime effect live — only the pre-fix bug's mechanism was diagnosed and the fix was implemented against that diagnosis.

## Self-Check: PASSED

- FOUND: `src/components/singing/PlayMiniBar.tsx` (modified, contains `scIframeReady`)
- FOUND: `.planning/quick/260713-a5b-fix-soundcloud-desktop-privacy-policy-fa/diagnostic.js`
- FOUND commit `b50da6a` in `git log --oneline`
