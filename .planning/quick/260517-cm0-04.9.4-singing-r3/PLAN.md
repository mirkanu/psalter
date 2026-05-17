---
quick_id: 260517-cm0
slug: 04.9.4-singing-r3
created: 2026-05-17
status: in-progress
---

# Quick Task: 04.9.4 singing-view round 3 polish

User feedback after round 2 surfaces 14 sub-items across 4 categories.
Implementation order chosen to keep each commit atomic + Playwright-checkable.

## Tasks

### Phase A — Audio playback bugs (1a, 1b, 1c, 1d)

1. **1d: default BPM 100 → 151** (`AbcAudioControls.tsx`, `parseBpmFromAbc` fallback).
   Quick win — also lands before audio rework so retests use the new default.
2. **1b: first-press-play doesn't actually play.** Likely cause: when the user
   taps the GlassBottomBar Play button, `handlePlayToggle` flips `isPlaying`
   from `false→true`. But the mini-bar mounts **simultaneously**, and
   `AbcAudioControls`' controlled `useEffect` fires *before* the hidden ABC
   visualObj has finished rendering, so `onPlay()` short-circuits via
   `setAudioError('Audio not available for this tune.')`. Fix by:
   - Waiting for `visualObjRef.current` to be ready in the controlled-mode
     effect (retry with `useEffect` keyed on visualObj presence).
   - Don't clear audioError on auto-trigger — log + soft-retry once.
3. **1a: double playback / lag on play-pause-play.** Likely cause: synthRef
   is not nulled on pause; second play creates a fresh synth but the old
   one's `synth.pause()` only pauses (doesn't stop). Fix: replace
   `synth.pause()` with `synth.stop()` and null synthRef/timingRef on pause.
4. **1c: highlight lost on the visible staff. → DEFERRED this round.**
   Root cause confirmed below. Tickets a separate refactor task.

   <!-- Root cause for posterity: `AbcAudioControls`
   renders its own hidden visualObj (`hiddenRef` at `left:-9999`) and the
   abcjs TimingCallbacks fire on that visualObj — so the highlight is on
   the offscreen render, not the visible staff inside `NotationRenderer`.
   Fix is bigger: we need either to (a) feed `AbcAudioControls` the visible
   visualObj from NotationRenderer, or (b) make AbcAudioControls render a
   *visible* mini-staff that drives the highlight. (a) is cleaner but
   requires a ref-handoff. Punt to **option (a) lite**: keep the offscreen
   visualObj but additionally call abcjs cursorControl on the *visible*
   AbcPlayer's container via the `class="abcjs-note_selected"` mechanism
   abcjs already supports — by adding `eventCallback` that toggles
   `data-abc-current-note` on matching DOM elements in the visible staff.
   *If this proves too invasive in one session, revert to a smaller
   acknowledgement: add a visible highlight on the GlassBottomBar's
   stanzas-indicator while playing, and mark 1c as deferred.*

### Phase B — Lyrics/Solfège views (1f, 4a, 4b, 4c)

5. **1f + 4c: Play button & SoundCloud embed in lyrics/solfege views.**
   When `viewMode === 'lyrics'` or `'solfege'`, the GlassBottomBar Play
   button should play the SoundCloud embed (if available) instead of the
   abcjs synth. Add SoundCloud embed rendering inside the lyrics/solfege
   viewAreas and a `data-singing-soundcloud-toggle` hook for the bottom bar.
   - Reuse `psalms.soundcloudUrl` already in the schema (per State.md
     Phase 02-04 entry: "soundcloudUrl ignored in Phase 2 — all 27 DB
     values are placeholder text"). Surface only if non-placeholder.
6. **4a: lyrics-only / solfege default font size + padding.** Audit the
   current `viewMode === 'lyrics'` viewArea — likely `text-base p-0`.
   Bump to `text-lg sm:text-xl` with `pt-4 pl-4` padding.
7. **4b: hide stanza prev/next in lyrics/solfege views.** In `SingingView`,
   pass `currentStanza={null}` / `totalStanzas={null}` to GlassBottomBar when
   `viewMode !== 'staff'` (so `showStanza` falsy → indicator hidden).
8. **4c: A+/A− on Solfège JPG.** Already exists in glass bar — verify it
   scales the JPG via the CSS var. If not, add an explicit `--solfege-scale`
   var driven by baseSize. **Also reduce default embedding size** —
   constrain the `<img>` to `max-w-[75%] max-h-[60vh]` (so user can see
   surrounding lyrics) and remove the rounded border for cleaner look.

### Phase C — Tour redesign (2A–2F)

9. **2A: lighter backdrop.** Reduce backdrop opacity (currently dark).
10. **2B: highlighted UI should be just as bright as tour window.** Cut a
    "hole" in the backdrop over the target — already partially attempted
    via the cutout rect, but the current implementation darkens the entire
    overlay including the target. Fix: use `mask` or box-shadow trick for
    the cutout, OR add a brighter "spotlight" layer behind the target.
11. **2C: combine prev/next arrows into one step.** STEPS[0].target stays
    `prev-next` (both arrows share this target — verify; if not, update
    PsalmTopBar to give both arrows the same target attribute). Copy:
    "Navigate to next/previous psalm".
12. **2D: insert new step 2 for psalm-label.** Step now references
    `psalm-label`: "Tap to quickly switch to any psalm".
13. **2E: update step 3 (gear) copy.** New copy: "Open settings to change
    views (e.g. lyrics only) and access the study guide".
14. **2F: remove the play-button step.** STEPS array drops the last item;
    tour is now 3 steps.

### Phase D — PsalmTopBar stanza-range titles (3)

15. **3: "Psalm 119" → "Ps 119:45-85"** for Psalm 119 versifications.
    Look up the active versification's stanza range and render. If the
    stanza-range string overflows the available width, downsize the
    text from `text-base` to `text-sm` (and still don't break to 2 lines).

## Validation (Playwright)

For each phase, a focused audit script under `/tmp/audit-singing-r3-{phase}.js`
plus updates to `scripts/uat/test-04.9.4-quick.js` and `-full.js`. New
assertions (e.g. SC10/SC11/SC12):

- SC10: default BPM in collapsed mini-bar shows `151` for psalms without
  explicit Q: header.
- SC11: after `Play → Pause → Play`, only one `[data-abc-audio-controls]`
  active synth is producing sound (verifiable via single `data-singing-play[aria-label="Pause"]` and DOM count).
- SC12: in lyrics/solfege view, `[data-stanzas-indicator]` is hidden or
  empty.
- SC13: tour STEPS array has 3 items; step 2 targets `psalm-label`.

## Out of scope (this round)

- Real-time waveform / lyrics-sync display.
- Reworking the underlying AbcPlayer's TimingCallbacks.
- Adding playback controls beyond what already exists in PlayMiniBar.
