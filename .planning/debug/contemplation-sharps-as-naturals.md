---
slug: contemplation-sharps-as-naturals
status: investigating
trigger: "Contemplation tune: sharps in ABC play as naturals during abcjs audio playback, while other tunes' sharps play correctly. Investigate ABC source for Contemplation vs a working comparator, check key signature, accidental scope, and abcjs synth handling."
created: 2026-06-01
updated: 2026-06-01
phase: 04.11
---

# Debug: Contemplation sharps play as naturals

## Symptoms

- **Expected:** Sharps notated in Contemplation's ABC should sound as sharps during abcjs synth playback (e.g. F# should sound as F#).
- **Actual:** Sharps play as naturals (F# sounds as F natural). Audio output ignores the accidental.
- **Scope:** Tune-specific. Other tunes containing sharps play their sharps correctly via the same abcjs synth pipeline.
- **Surface:** abcjs audio playback. Visual rendering not reported as broken.
- **Timeline:** Surfaced during Phase 04.11 Plan 05 (manual melisma editor work, 2026-05-30 / 2026-06-01). Deferred as Task #29 in HANDOFF.json.

## Reproduction

1. Navigate to a psalm/tune view that uses Contemplation as the tune.
2. Play audio via the abcjs synth controls (Play button on AbcAudioControls or AbcPlayer).
3. Listen for sharp notes — they sound a semitone lower than written.

## Hypotheses to test

- H1: Contemplation's `abc_notation` is missing or has a malformed `K:` (key signature) header, so abcjs treats the piece as C major / no accidentals.
- H2: Sharps in Contemplation are written as explicit `^X` accidentals on individual notes, but a downstream transform (PHRASE_BREAK injection, line regrouping, line merge in `collapse empty measures + merge embedded-w music lines`) drops the `^` before reaching the synth.
- H3: Contemplation uses `K:` with sharps in the signature but the synth path uses a different ABC variant (e.g. `abc_satb` vs `abc_notation`, or `solfege_soprano_edited`) that lost the key signature.
- H4: Re-render from solfège (recent OCR pipeline work) produced ABC without `^` markers where they were needed, or stripped the key signature.
- H5: abcjs synth bug with specific key signatures (less likely given other tunes work).

## Current Focus

- hypothesis: H1 or H3 — Contemplation's K: header is absent, malformed, or the wrong ABC variant feeds the synth.
- next_action: Pull Contemplation's `abc_notation`, `abc_satb`, and `solfege_soprano_edited` from psalter-db. Compare K: header and accidental notation against a known-working sharps tune (e.g. one in a sharp key from the same Phase 04.11 batch). Render with abcjs in a test harness and inspect what the synth visitor receives.
- test: Diff Contemplation's K: header and inline accidentals vs a comparator. Inspect which ABC variant the SingingView / AbcAudioControls path actually feeds to synth.
- expecting: Either a missing/incorrect K: header OR a stripped `^` accidental somewhere in the post-processing pipeline (collapse measures, PHRASE_BREAK injection, line regroup).

## Evidence

- Contemplation is in K:Eb with frequent explicit `=e`, `=B`, `=a` naturals (overriding key signature) at phrase ends.
- `splitMusicIntoSubLines` in `src/components/notation/NotationRenderer.tsx` (~L733) emits the final measure of each phrase **without a trailing `|`** because the source phrase body lacks a closing bar.
- abcjs 6.6.3 synth scopes accidentals to the next `|` barline only — `w:` lyric lines and music-line breaks do NOT reset accidental scope.
- MIDI pitch dump via `tune.setUpAudio` at phrase 3 opening note `e2`:
  - Single-line ABC (all bars present): pitch 75 (Eb) ✓
  - Current `unifiedAbc` (no trailing bar on phrase-final lines): pitch 76 (E natural) ✗
  - With trailing `|` appended to phrase-final lines: pitch 75 (Eb) ✓ — fix verified
- Visual SVG render is unaffected: abcjs layout treats each music line as its own staff system with implicit visual reset.

## Eliminated

- H1 (missing/malformed K: header): K:Eb is present and well-formed.
- H3 (wrong ABC variant feeding synth): single-variant test reproduces with the exact ABC the player consumes.
- H4 (re-render from solfège stripped accidentals): accidentals are present in source; bug is in line-splitting downstream.
- H5 (abcjs synth bug with key signatures): abcjs behaviour is spec-correct — accidentals scope to next `|`, which is musically standard.

## Resolution

- **Root cause:** `splitMusicIntoSubLines` emits phrase-final music lines without a trailing `|`. Explicit accidentals on the last note(s) of a phrase bleed forward across the `w:` line into the next phrase's leading notes during synth playback, because abcjs scopes accidentals to the next `|` rather than the next music line.
- **Manifestation as "sharps play as naturals":** in K:Eb, a phrase-ending `=e` (E natural) overrides the key-sig Eb, then bleeds into the next phrase where `e` should sound as Eb — so the next phrase's `e` plays as E natural (a semitone *higher* than written, perceived as "too sharp").
- **General scope:** affects any tune whose phrase bodies don't end in `|` AND have explicit `^/_/=` accidentals on pitches that recur in the next phrase's leading notes. Contemplation hits this; most other corpus tunes don't.
- **Fix:** in `splitMusicIntoSubLines`, normalise emitted music lines so every line ends with `|`:
  ```ts
  return lines.map((l) => /\|\s*$/.test(l) ? l : l + ' |')
  ```
- **Files:** `src/components/notation/NotationRenderer.tsx` only.
- **Verification plan:** MIDI pitch dump on Contemplation phrase 3 first note (expect 75 = Eb); Playwright load of `/p/{contemplation-psalm}` and play audio; visual render diff (should be byte-identical SVG).
- **Status:** ROOT CAUSE FOUND, fix authored, not yet applied — proceeding via `/gsd-quick`.
