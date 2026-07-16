---
quick_task: 260715-s7b
status: complete
subsystem: notation
tags: [abcjs, mobile, staff-view, lyric-alignment, viewport-fit, melisma]
requires: []
provides:
  - splitWLineByNoteCounts (src/components/notation/splitWLineByNoteCounts.ts)
  - detectRepeatedPitchContinuations (src/lib/detect-repeated-pitch-continuations.ts)
affects:
  - src/components/notation/NotationRenderer.tsx (buildUnifiedAbc, subdivision logic, chromeless viewarea wrapper)
  - src/lib/abc-melisma.ts (buildWLineFromSolfa passing-note selection)
  - src/components/AbcPlayer.tsx (height-fit-scale trigger, data-notation-fit-slot lookup)
tech-stack:
  added: []
  patterns:
    - "Weight syllable distribution across sub-staves by real note-head count (countNoteHeads), not equal token count"
    - "Prefer repeated-pitch note runs (psalm 'reciting note' convention) as melisma continuation candidates before falling back to shortest-duration heuristics"
    - "Reuse the split-leaf height-fit-scale mechanism (measure natural SVG height vs a `[data-notation-slot]`/`[data-notation-fit-slot]` ancestor, apply CSS transform:scale) for other chromeless view modes"
    - "Don't force a defensive layout workaround (mobile phrase-splitting) uniformly across all tunes — check whether tunes that bypass it already prove the workaround is unnecessary for most content"
key-files:
  created:
    - src/components/notation/splitWLineByNoteCounts.ts
    - src/components/notation/__tests__/splitWLineByNoteCounts.test.ts
    - src/lib/detect-repeated-pitch-continuations.ts
    - src/lib/detect-repeated-pitch-continuations.test.ts
  modified:
    - src/components/notation/NotationRenderer.tsx
    - src/lib/abc-melisma.ts
    - src/lib/abc-melisma.test.ts
    - src/components/AbcPlayer.tsx
decisions:
  - "splitWLineByNoteCounts replaces splitWLineIntoChunks only in the needsProportionalSplit branch; forceMatchMeterShape's word-splitting fallback is left in place for cases detectRepeatedPitchContinuations can't resolve"
  - "buildWLineFromSolfa's repeated-pitch preference only activates when musicForPhrase is passed — omitting it (existing callers, if any) preserves the old duration-heuristic-only behavior exactly"
  - "Removed the chromeless<1280 branch of the forced mobile phrase-subdivision rule entirely, rather than special-casing it per meter or per tune — verified broadly (not just for CM) that tunes with DB melisma_positions already bypass this code path and render correctly without it"
  - "Kept the pre-existing !chromeless && viewportW<480 forced-subdivision-2 rule untouched (a separate, non-chromeless-specific rule for /tunes/[id] etc., out of scope)"
metrics:
  duration: "~4 hours across 5 rounds (2026-07-15 to 2026-07-16)"
  completed: 2026-07-16
---

# Quick Task 260715-s7b: Fix inline Staff notation layout broken on mobile — Summary

Fixed three distinct, compounding bugs in the chromeless mobile Staff notation view (the default `/psalms/[id]` singing view), surfaced by iterative user testing on a real device against St Agnes, Durham (Psalm 62) and confirmed fixed by comparison against known-good tunes (Psalm 63 / Wetherby).

## What Was Built

**Round 1 — wrong syllable distribution across sub-staves.** When a phrase's music gets sub-divided for mobile (e.g. a 7-note + 1-note split at a held final note), the old code (`splitWLineIntoChunks`) distributed syllables by *equal token count* across the two sub-staves regardless of how many notes each actually had. New `splitWLineByNoteCounts(payload, noteCounts)` (`src/components/notation/splitWLineByNoteCounts.ts`) weights the split by each sub-staff's real note-head count, restoring 1:1 syllable-to-note alignment.

**Round 2 — misdiagnosis, no-op.** Deployed round 1, user re-tested on their phone and it was still broken. Investigated the wrong function (`syllabifyForAbc`/`forceMatchMeterShape`) and built `detectRepeatedPitchContinuations` around a wrong theory. This tune actually renders via the solfège-driven `buildWLineFromSolfa` path (since it has `solfegeOcrText`), which never reaches the patched code — the fix was correct in isolation but never executed in production.

**Round 3 — the real alignment bug.** Installed Playwright on the VPS for direct self-verification (see "Infrastructure" below), instrumented the live page with a temporary `console.log` of the exact ABC string fed to `abcjs.renderAbc`, and found the actual cause: `buildWLineFromSolfa`'s Step-4 duration heuristic (in `src/lib/abc-melisma.ts`) marks the *shortest-duration* note as a melisma "passing" continuation, tie-broken by *earliest array index*. St Agnes' first phrase opens with three tied-duration repeated notes (a "reciting note" figure) — the heuristic picked note 0 (which needs its own syllable, "My") instead of a later repeat, shifting every subsequent syllable one note late.

Fix: `buildWLineFromSolfa` now accepts the phrase's ABC music and, before falling back to the duration heuristic, prefers `detectRepeatedPitchContinuations`' repeated-pitch-run positions as passing-note candidates. Verified via direct DOM inspection of the rendered `abcjs-lyric` SVG text elements (not just screenshots): `"My"` now lands on note 0, a blank continuation on note 1, `"soul"`/`"with"` correctly following.

**Round 4 — viewport-fit gap (initially over-corrected).** Separately, the whole tune required a page scroll on mobile even though the project's stated design goal (ROADMAP Phase 4) is that "all renders fit dynamically to screen." The height-fit-scale mechanism built earlier for chromeless split-leaf (`260712-szw`, measures the natural SVG height against a `[data-notation-slot]` ancestor and applies a CSS `transform: scale`) was gated to split-leaf only — inline (non-split) Staff, the actual default view, had none. Extended the same mechanism to inline Staff (new `data-notation-fit-slot` marker, kept distinct from split-leaf's `data-notation-slot` so the existing split-leaf diagnostic script is unaffected).

**Round 5 — the real layout bug, found via user comparison.** User compared the round-4 result against known-good tunes (Ps 63/Wetherby, which were "already perfect" and untouched) and correctly flagged it as *worse in a sense*: St Agnes now showed 8 cramped systems with wasted side margins (the transform-scale shrinking an already-wrong 8-system layout uniformly in both dimensions), instead of Wetherby's clean 4. Root cause: a blanket rule (`baseSubdivisions`) forces every phrase to split in half on any chromeless mobile viewport — but tunes *with* DB `melisma_positions` (like Wetherby) bypass this rule entirely via a separate rendering branch and already render 1 clean system per phrase. St Agnes has no melisma data, so it hit the forced-split rule and got doubled to 8 systems.

Removed the `chromeless && viewportW < 1280` branch of the forced subdivision rule (the design doc it cited, `mobile-psalm-display-design.md`, actually specifies "4 staff systems" for CM — this rule had been *doubling* that, not achieving it). Per explicit user approval (asked, "full fix, verify broadly" chosen over a narrower CM-only or band-aid fix), verified across ~10 tunes spanning CM/LM/SM/other meters, with and without melisma data, via Playwright — all now render at 1-system-per-phrase, no scroll, no lost lyrics.

## Infrastructure: Playwright self-verification

Set up the shared `playwright-daemon` PM2 service for real self-verification (it had never had a working Chromium binary):
- Found and fixed a broken `/home/claude/.cache` symlink (dangling — target directory didn't exist).
- Found the daemon's PM2 process environment didn't have `PLAYWRIGHT_BROWSERS_PATH` set (differs from the interactive shell), causing chromium to install to the wrong location on a prior attempt.
- Installed Chromium + OS deps (`npx playwright install chromium`) to the daemon's actual lookup path.
- Used it extensively: DOM/SVG inspection (not just screenshots) for the alignment fix, `scrollHeight`/`clientHeight` measurement for the viewport-fit fix, and a ~10-tune broad regression sample for the subdivision fix.

## Tasks Completed (chronological)

1. **Round 1**: `splitWLineByNoteCounts` + tests (TDD) — commits `de711d7`, `a8431fc`, `d4fae83`.
2. **Round 2**: `detectRepeatedPitchContinuations` + wiring into `wLineForSyllables` — commit `0d41763` (later found to be a no-op for this tune's actual code path, but harmless/correct in itself and still exercised by other non-solfège tunes).
3. **Round 3**: Playwright infra setup (untracked, VPS-level) + `buildWLineFromSolfa` fix using `detectRepeatedPitchContinuations` — commit `53748e9`.
4. **Round 4**: Extended height-fit-scale to inline Staff — commit `3a3f257`.
5. **Round 5**: Removed forced mobile phrase-subdivision for tunes lacking melisma data — commit `0b773a3`.

## Verification

- Unit tests: `splitWLineByNoteCounts.test.ts` (5/5), `detect-repeated-pitch-continuations.test.ts` (7/7), `abc-melisma.test.ts` (9/11, 2 pre-existing unrelated failures confirmed present before any of this work).
- Full suite (`npx vitest run`): stable at 18 pre-existing failures throughout all 5 rounds (confirmed via `diff` against a pre-change baseline each time) — zero new failures introduced.
- `npx tsc --noEmit`: clean on all touched files at every round.
- `npx next build`: clean at every round (several rebuild retries needed in round 5 due to memory contention from other concurrent processes/sessions on the shared VPS — not a code issue).
- Live verification via Playwright daemon (not just visual screenshots): DOM/SVG text inspection for syllable alignment, `scrollHeight`/`clientHeight` equality for viewport fit, `.abcjs-staff` count for system count, across St Agnes/Ps 62, Wetherby/Ps 63, and ~10 other sampled tunes.
- **User confirmed fixed** on their own mobile device after round 5's deploy.

## Deviations from Plan

Substantial — the original plan (round 1) correctly fixed one real bug but did not anticipate rounds 2–5. This reflects the genuine iterative-diagnosis nature of the underlying problem (three separate, compounding bugs across the mobile notation rendering pipeline), not scope creep from a single misdiagnosis. Each round was driven by direct user re-testing on a real device and a specific, concrete regression report, not speculative expansion.

## Known Pre-Existing Issues Found (Out of Scope)

Found while broadly sampling tunes in round 5's regression check; confirmed present in the pre-round-5 build too (via a stash-and-rebuild comparison), so **not** introduced by this task:
- **Tune 12 ("Bays of Harris", CM)**: `abc_notation` in the DB is truncated — only 2 of the expected 4 CM phrases are stored (`% PHRASE_BREAK` markers present, but the ABC ends immediately after the second one with no music for phrases 3–4).
- **Tune 136 ("Clarkeville", meter "66 66 88")**: lyrics render correctly for phrase 1 only; phrases 2–6 show only `·` placeholder dots, even though `lyrics_structured` has text for all stanza lines. Likely a phrase-index/cycle-mapping issue specific to 6-line meters, unrelated to the mobile-subdivision changes in this task.

Both would need their own investigation/fix as separate quick tasks.
