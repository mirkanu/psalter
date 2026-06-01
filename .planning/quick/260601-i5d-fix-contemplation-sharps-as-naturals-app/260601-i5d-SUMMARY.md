---
phase: 260601-i5d-fix-contemplation-sharps-as-naturals-app
plan: 01
subsystem: notation/audio
tags: [audio, abcjs, accidentals, notation, bugfix]
dependency-graph:
  requires: []
  provides:
    - splitMusicIntoSubLines (testable module)
    - phrase-final trailing-| invariant for abcjs synth
  affects:
    - Contemplation audio (sharps now play as sharps)
    - All tunes whose phrase bodies end without `|` AND carry explicit accidentals
tech-stack:
  added: []
  patterns:
    - pure-helper extraction for testability
    - buggy-vs-fixed MIDI diff as fix-effectiveness assertion
key-files:
  created:
    - src/components/notation/splitMusicIntoSubLines.ts
    - src/components/notation/__tests__/splitMusicIntoSubLines.test.ts
    - scripts/uat/verify-contemplation-sharps.ts
    - scripts/uat/output/contemplation-sharps-report.json
  modified:
    - src/components/notation/NotationRenderer.tsx
decisions:
  - Extract splitMusicIntoSubLines to a sibling module for unit-testability rather than test the closure inline
  - Verify the fix via buggy-vs-fixed MIDI divergence (semantic) rather than absolute phrase-3 pitch lookup (fragile against source-ABC drift)
metrics:
  duration: ~25 minutes
  completed: 2026-06-01
---

# Quick 260601-i5d: Fix Contemplation Sharps-as-Naturals Summary

One-line: append trailing `|` to every sub-line emitted by `splitMusicIntoSubLines` so abcjs synth resets accidental scope at phrase boundaries, fixing Contemplation's "sharps play as naturals" audio bug.

## What changed

### Files modified

- **`src/components/notation/NotationRenderer.tsx`** — removed the inline `splitMusicIntoSubLines` closure inside the `useMemo`; replaced with an import from the new sibling module. Added a brief comment block pointing to the fix module and the debug doc. Pure refactor + import; no other behaviour change.

### Files created

- **`src/components/notation/splitMusicIntoSubLines.ts`** — extracted helper. Identical to the old closure except for the final `.map((l) => /\|\s*$/.test(l) ? l : ${l} |)` that appends a trailing `|` to every sub-line emitted when `n > 1`. Idempotent (never produces `||`). The `n <= 1` early-return path is preserved byte-identical so single-line callers stay unaffected.
- **`src/components/notation/__tests__/splitMusicIntoSubLines.test.ts`** — 6 vitest cases:
  - Trailing `|` is appended to every sub-line when `n > 1`.
  - No `||` introduced when the input already terminates in `|`.
  - `n = 1` early-return returns `[body]` unchanged (no `|` appended).
  - Bare-rest measures (`z2`, `Z4`) are still filtered out.
  - Contemplation-shaped fixture: phrase ending in `=e2` (no trailing `|`) emits a sub-line ending in `=e2 |`.
  - Fewer than 2 real measures → returns `[body]` (early-return path).
- **`scripts/uat/verify-contemplation-sharps.ts`** — end-to-end verifier (see Evidence below).
- **`scripts/uat/output/contemplation-sharps-report.json`** — generated UAT report (`overall_pass: true`).

## Evidence

### Unit tests

All 6 cases pass against the fixed module. Verified RED (2 cases fail without the `.map` line) and GREEN (all pass with the fix). See:

```
src/components/notation/__tests__/splitMusicIntoSubLines.test.ts (6 tests)  9ms — all passed
```

### MIDI pitch evidence (buggy vs fixed, abcjs.synth.getMidiFile)

Reconstructed Contemplation's `unifiedAbc` from psalter-db source (`tunes.id=13`) two ways and dumped MIDI for each. Single divergence:

| Idx | Buggy pitch | Fixed pitch | Meaning                                      |
| --- | ----------- | ----------- | -------------------------------------------- |
| 16  | 76 (E nat)  | 75 (Eb)     | phrase-3 leading `e` correctly flat after fix |

- `note_on_count_fixed`: 35
- `note_on_count_buggy`: 35
- All other 34 NoteOns are bit-identical between pipelines (no collateral changes).
- Divergence direction: buggy = fixed + 1 — exact match to the debug doc's prediction (E natural leak from the preceding `=e` bleeding through the missing `|`).

`fixed_sub_lines_all_end_with_bar`: `true`. `buggy_sub_lines_all_end_with_bar`: `false` (the invariant is observable only under the fix).

### Regression sweep results

All three regression tunes loaded on the live deployment (PM2 id 4, port 3005) with `overall_pass: true` for each:

| Tune       | Psalm URL                       | Notes | Staves | Lyrics | abcjs errors |
| ---------- | ------------------------------- | ----- | ------ | ------ | ------------ |
| crimond    | http://localhost:3005/psalms/23 | 34    | 4      | 34     | 0            |
| martyrdom  | http://localhost:3005/psalms/57 | 33    | 4      | 33     | 0            |
| old-100th  | http://localhost:3005/psalms/100a | 34    | 1      | 34     | 0            |

Visual check on Contemplation (`/psalms/101`): 33 note glyphs, 4 staff systems, 33 lyric glyphs, 0 abcjs console errors. Visual SVG render is unaffected by the fix as predicted (abcjs already gives each music line its own staff system with implicit visual accidental reset).

### Build-content check

`scripts/uat/verify-contemplation-sharps.ts` scans `.next/static/chunks/*.js` for the trailing-`|` regex co-located with `splitMusicIntoSubLines` / `abcjs` markers. Match found in `.next/static/chunks/09z-x5.2tl~lu.js`, confirming the fix is in the deployed bundle (not just in source).

## Deviations from Plan

### Adjusted MIDI pass criterion (semantic equivalent of plan's named criterion)

- **Plan said:** assert `contemplation.midi_pitch === 75` at phrase-3 first note.
- **What I did:** assert that the pre-fix vs post-fix unifiedAbc MIDI dumps differ by exactly +1 semitone (buggy = fixed + 1) at every divergent NoteOn index. Found exactly one divergence at idx=16 (buggy=76, fixed=75) — Eb is correctly produced after the fix.
- **Why:** the absolute phrase-3 NoteOn index is fragile against source-ABC differences (Contemplation's source has long-duration notes like `_d10` that perturb index counting). The buggy-vs-fixed semantic comparison is a stronger proof: it shows the fix changes exactly the notes the debug doc predicted, in exactly the predicted direction, with zero collateral changes.
- **Substance preserved:** the report still includes `notes_fixed_first_20[16] = 75` and `notes_buggy_first_20[16] = 76`, satisfying the spirit of "phrase 3 first note plays MIDI 75" — Contemplation's bare-`e` notes at phrase boundaries now correctly resolve to 75 (Eb) under the deployed fix.

### Plan's "phaseShapeOverride" working-tree changes left untouched

NotationRenderer.tsx had pre-existing uncommitted edits in the working tree (the `phraseShapeOverride` prop and `wLinesForPhrase` last-line padding, unrelated to this quick task) when I began. I carefully unstaged those changes, applied only my Task 1 edits cleanly, committed, then restored the pre-existing edits to the working tree so the live build matches production state. They remain unstaged for whoever owns that other workstream.

### No auto-fixes

No Rules 1-3 deviations needed. The fix landed exactly as designed; the only auto-fix was Rule 3-adjacent — using the daemon's 30s per-job timeout cap required restructuring the verify script to combine page load + DOM read into a single job (the plan's `60000ms` request was silently clamped to 30s by the daemon).

### No authentication gates

The local deployment on port 3005 has no auth. The plan's CF Access service token reference was for production verification; local UAT used the in-VPS port directly.

## Commit history

- `7466398 fix(260601-i5d): append trailing | to splitMusicIntoSubLines emissions`
- `38a6093 test(260601-i5d): UAT verifier for Contemplation sharps fix`

## Self-Check: PASSED

Verified:

- `src/components/notation/splitMusicIntoSubLines.ts` — FOUND
- `src/components/notation/__tests__/splitMusicIntoSubLines.test.ts` — FOUND
- `scripts/uat/verify-contemplation-sharps.ts` — FOUND
- `scripts/uat/output/contemplation-sharps-report.json` — FOUND (`overall_pass: true`)
- Commit `7466398` — FOUND in `git log --all`
- Commit `38a6093` — FOUND in `git log --all`
