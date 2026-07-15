---
quick_task: 260715-s7b
subsystem: notation
tags: [abcjs, mobile, staff-view, lyric-alignment]
requires: []
provides:
  - splitWLineByNoteCounts (src/components/notation/splitWLineByNoteCounts.ts)
affects:
  - src/components/notation/NotationRenderer.tsx (buildUnifiedAbc needsProportionalSplit branch)
tech-stack:
  added: []
  patterns:
    - "Weight syllable distribution across sub-staves by real note-head count (countNoteHeads), not equal token count"
key-files:
  created:
    - src/components/notation/splitWLineByNoteCounts.ts
    - src/components/notation/__tests__/splitWLineByNoteCounts.test.ts
  modified:
    - src/components/notation/NotationRenderer.tsx
decisions:
  - "splitWLineByNoteCounts replaces splitWLineIntoChunks only in the needsProportionalSplit branch (mobile sub-division of non-melisma, single-metrical-line phrases); the old equal-count splitWLineIntoChunks closure is left in place, unused, per plan's out-of-scope note"
metrics:
  duration: "~20 min"
  completed: 2026-07-15
---

# Quick Task 260715-s7b: Fix inline Staff notation layout broken on mobile Summary

Fixed mobile-only lyric misalignment in inline Staff notation for tunes whose final phrase note is a long held note in its own measure (e.g. St Agnes, Durham — psalm 62) by weighting syllable distribution across sub-staves by each sub-staff's actual note-head count instead of an equal token-count split.

## What Was Built

**`splitWLineByNoteCounts(payload, noteCounts)`** (`src/components/notation/splitWLineByNoteCounts.ts`) — a pure helper that splits a syllabified `w:` line payload into `noteCounts.length` chunks, consuming tokens cumulatively so chunk `i` gets exactly `noteCounts[i]` tokens, with the last chunk absorbing any leftover tokens (never dropping a syllable) and empty-string chunks when tokens run out early.

Wired into `buildUnifiedAbc`'s `needsProportionalSplit` branch in `NotationRenderer.tsx`: `subNoteCounts` is now computed once per phrase via `musicSubLines.map((m) => countNoteHeads(m))`, and `splitWLineByNoteCounts(syllabified, subNoteCounts)` replaces the old `splitWLineIntoChunks(syllabified, actualSubdivisions)` equal-split call. Surrounding logic (`chunks[sub]`, empty guard, `padWLineToNoteCount`) is unchanged.

This restores strict 1:1 syllable-to-note alignment on mobile (viewport <768px, chromeless), matching desktop's already-correct single-staff rendering. Desktop (`subdivisions=1`) never enters this branch and is unaffected. The melisma-positions branch, split-leaf branches, structured multi-line `else` branch, and `splitMusicIntoSubLines` were not touched.

## Tasks Completed

1. **Task 1 — TDD helper + tests** (`test` commit `de711d7`, `feat` commit `a8431fc`): Wrote 5 failing tests first (confirmed RED — module didn't exist), then implemented `splitWLineByNoteCounts` to GREEN. All 5 cases pass, including the St Agnes P0 case (`'a b c d e f g h'`, `[7, 1]` → `['a b c d e f g', 'h']`).
2. **Task 2 — wire into NotationRenderer.tsx** (commit `d4fae83`): Added import, computed `subNoteCounts` once per phrase, swapped the call site in the `needsProportionalSplit` branch only.

## Verification

- `npx vitest run src/components/notation/__tests__/splitWLineByNoteCounts.test.ts` — 5/5 pass.
- `npx tsc --noEmit` — clean on all files touched by this task (`NotationRenderer.tsx`, `splitWLineByNoteCounts.ts`). Pre-existing unrelated errors in `tests/e2e/*.spec.ts` (Playwright type/global-redeclaration issues) confirmed present before this change via `git stash` diff (51 errors both before and after) — out of scope, not introduced by this work.
- `npx next build` — succeeds (Turbopack compile + TypeScript check both pass; page-data collection required `DATABASE_URL`, which was missing in this worktree — copied `.env` from `/home/services/psalter/.env`, an out-of-scope environment fix, not committed since `.env` is gitignored).
- Full `npx vitest run` suite: 495 pass, 18 pre-existing failures (DB/auth/session-scope dependent tests unrelated to notation — `precent-auth`, `tune-detail` DB fixtures, `StanzaList` unrelated RENDER-03 test, etc.), none touching `NotationRenderer.tsx` or the new helper.

## Deviations from Plan

None — plan executed exactly as written. The `.env` copy for `next build` verification was a local environment fix only (not a code change, not committed).

## Checkpoint: Human Verification Required

The plan's final task is `checkpoint:human-verify`, which requires visually inspecting a real mobile viewport. Per execution constraints, this was **not** waited on interactively. Automated checks above (unit tests, tsc, build) all pass. A human still needs to:

1. Rebuild and restart the psalter container (standard deploy for this project).
2. Hard-refresh `https://psalter.gsdlabs.dev/psalms/62` on a mobile device or DevTools device toolbar at 375px width, Staff view.
3. Confirm each lyric syllable sits under its own note — the final held note of each phrase line should carry exactly ONE syllable, no cluster, no stray `·` placeholder dots.
4. Confirm desktop (wide window) still renders perfectly (unchanged).
5. Spot-check one or two other CM tunes on mobile via the tune switcher to confirm no regression.

This plan should be treated as code-complete but **not yet visually verified in production**. Flag for follow-up verification after deploy.

## Self-Check: PASSED

- FOUND: src/components/notation/splitWLineByNoteCounts.ts
- FOUND: src/components/notation/__tests__/splitWLineByNoteCounts.test.ts
- FOUND: commit de711d7 (test)
- FOUND: commit a8431fc (feat)
- FOUND: commit d4fae83 (fix, NotationRenderer.tsx wiring)
