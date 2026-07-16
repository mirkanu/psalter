---
phase: quick-260716-dtm
plan: 01
subsystem: lyrics-syllabification
tags: [abcjs, staff-notation, lyrics, bugfix]
dependency-graph:
  requires: []
  provides:
    - "Case-preserving syllabifyForAbc (src/lib/lyrics.ts)"
  affects:
    - "src/lib/abc-melisma.ts:buildWLineFromSolfa (inline-staff/solfège w:-line path)"
    - "src/lib/lyrics.ts:buildAbcWithSyllables (Staff view w:-line path)"
tech-stack:
  added: []
  patterns:
    - "Parallel-letter-walk case restoration: copy each source letter's case onto the corresponding output letter by walking stripped/joined alphabetic characters in lockstep, skipping non-letters (digits, punctuation, hyphens, spaces) on both sides"
key-files:
  created: []
  modified:
    - src/lib/lyrics.ts
    - src/lib/lyrics.test.ts
decisions:
  - "Case restoration applied via a parallel alphabetic-character walk rather than simply capitalizing the first letter of the output — correctly handles digit-glued verse prefixes (e.g. '1Before' -> '1Be- fore') and any internal capitals, since both strings share the identical ordered letter sequence (syllabizing only inserts separators)."
metrics:
  duration: "25 min"
  completed: "2026-07-16"
---

# Phase quick-260716-dtm Plan 01: Fix verse-initial letters not capitalizing under staff notation Summary

**One-liner:** `syllabifyForAbc`'s multi-syllable branch now restores per-letter source casing (parallel alphabetic-char walk) instead of returning the lowercased join, fixing capitalized verse-initial words like "Before"/"Because"/"According" that were rendering lowercase under the staff in every abcjs `w:`-line path.

## What Was Built

Root cause (from the plan, confirmed by reproduction): `syllabifyForAbc` in `src/lib/lyrics.ts` lowercases every word before syllabifying. Only the single-syllable early-return branch preserved original case (`return stripped + trailing`). The multi-syllable branch joined the lowercased syllable array and returned it directly, discarding capitalization — which is why the bug looked intermittent: single-syllable verse openers ("Lord", "Praise") stayed capitalized, but multi-syllable ones ("Before", "Because", "According", "Threescore") did not.

### Task 1 (TDD, RED → GREEN)

- **RED:** Updated/added tests in `src/lib/lyrics.test.ts` asserting the correct (case-preserved) output for "Prayer", "Righteous", the digit-glued `buildAbcWithSyllables` fixture, "LEADETH", and a new `describe` block covering "Before thou ever", "Because a thousand", "According as the", digit-glued `"1Before"`, and regression checks (lowercase input stays lowercase; single-syllable case untouched). Verified these 9 assertions fail against the pre-fix code (`git stash` the implementation change, ran the suite, confirmed the exact expected failures), then committed the test-only commit.
- **GREEN:** Restored the implementation change: the multi-syllable branch now walks `joined`'s characters, and for each alphabetic character advances a pointer through `stripped`'s alphabetic characters, copying that source letter's case (upper/lower) onto the output letter. Non-letter characters (digits, `-`, spaces, punctuation) pass through unchanged and never consume a `stripped` pointer position — this is what makes `"1Before"` correctly produce `"1Be- fore"` (the digit is skipped on both sides, so the `B`'s case lands on the `B` of `"Be-"`, not the `1`). Verified all 66 tests in `lyrics.test.ts` pass, then committed the fix commit.

### Test updates (documented as required by the plan)

- `"Prayer (capitalised) → pray- er"` → now `"Prayer (capitalised) → Pray- er"` (asserts case IS now preserved).
- `"Righteous (capitalised) → righ- teous"` → now `"Righteous (capitalised) → Righ- teous"`.
- `buildAbcWithSyllables` "empty-string portions are skipped" fixture: `"1al- pha"`/`"3gam"` → `"1Al- pha"`/`"3Gam"`.
- `"single portion produces one w: line..."`: `"she- pherd"` → `"She- pherd"`, comment corrected.
- `"uppercase LEADETH is normalised to lowercase before lookup"`: this test asserted `syllabifyForAbc('LEADETH') === syllabifyForAbc('leadeth')`, which is no longer true once casing is preserved per-letter (all-caps input now produces all-caps output, `"LEAD- ETH"`, vs `"lead- eth"` for lowercase input). Not listed explicitly in the plan's must-update list, but this is a direct and correct consequence of the fix (Rule 1: the old assertion codified the same "lose case info" bug for a different input shape). Updated to assert `syllabifyForAbc('LEADETH') === 'LEAD- ETH'` with an explanatory comment that the override *lookup* still normalises to lowercase internally, while the *output* casing is now restored per source letter.
- Added a new `describe('syllabifyForAbc — verse-initial capitalisation preservation (260716-dtm fix)')` block per the plan's `<behavior>` list.
- Updated the stale multi-syllable-lowercasing doc comments at the top of `syllabifyForAbc` and inline in the test file.

### Live-data mechanical verification (extra, beyond the plan's minimum)

Ran `syllabifyForAbc` against the **actual production DB row** for Psalm 90's `lyrics_structured` (via a throwaway `tsx` script, deleted after use — not committed) to confirm the fix holds on real content, not just synthetic test strings:

```
SRC : Before thou ever hadst brought forth
ABC : Be- fore thou ever hadst brought forth
SRC : and all the world abroad;
ABC : and all the world ab- ro- ad;
SRC : Thou dost unto destruction
ABC : Thou dost un- to des- truc- tion
```

Confirms "Before" retains its capital B under real Psalm 90 data, and unrelated lowercase mid-line words are unaffected.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated the `LEADETH` case-normalization test to reflect the corrected behavior**
- **Found during:** Task 1, running the full `lyrics.test.ts` suite after the fix
- **Issue:** `it('uppercase LEADETH is normalised to lowercase before lookup', ...)` asserted `syllabifyForAbc('LEADETH') === syllabifyForAbc('leadeth')`. This equality only held because casing was being discarded (the exact bug this task fixes) — once casing is per-letter preserved, all-caps input correctly produces all-caps output, which no longer equals the lowercase-input output.
- **Fix:** Rewrote the test to assert `syllabifyForAbc('LEADETH') === 'LEAD- ETH'`, documenting that the *override dictionary lookup* still normalises to lowercase internally (so all-caps input still matches the `leadeth` override entry), while the *output* casing is restored per source letter.
- **Files modified:** `src/lib/lyrics.test.ts`
- **Commit:** `c939403` (test), `148d44e` (fix makes it pass)

### Deferred Issues (pre-existing, unrelated, out of scope)

Found while running a broader sanity sweep beyond the plan's specified `lyrics.test.ts` + `lyrics-structured.test.ts` (which pass clean). Confirmed via `git stash` that all three fail identically against the pre-fix code, so none are caused or worsened by this change:

1. `tests/lib-utilities.test.ts` — `"syllabifyForAbc: single-syllable words are returned as-is"` expects `syllabifyForAbc('Praise ye the Lord') === 'prai- se ye the Lord'`, but `PSALM_SYLLABLE_OVERRIDES.praise = ['praise']` (a later-added 1-syllable override) makes the real output `'Praise ye the Lord'` unchanged. Stale test predating that override entry.
2. `src/lib/abc-melisma.test.ts` — `"returns empty string for soprano with no events in requested phrase"`: `RangeError: Invalid array length` in `buildWLineFromSolfa` (unrelated pre-existing bug in the passing-note duration heuristic, not `syllabifyForAbc`).
3. `src/lib/abc-melisma.test.ts` — `"phrase 4 boundary survives passing notes in earlier phrases"`: expected 8 tokens, got 14 (unrelated pre-existing melisma/passing-note count mismatch).

Logged in `.planning/quick/260716-dtm-fix-verse-initial-letters-not-capitalizi/deferred-items.md`.

## Task 2 (checkpoint:human-verify) — Status

**Completed by orchestrator after merge.**

The executor correctly identified that this task needed to run outside its worktree (live app is PM2-managed via `scripts/start-with-db-wait.sh`, not Docker — `docker-compose.yml` only defines `psalter-db`). The orchestrator completed the remaining steps:

1. Merged `worktree-agent-a9b62b3d9bfd5d9cc` (commits `c939403`, `148d44e`) into `master` at `/home/services/psalter` (merge commit `c98b816`) — clean merge, no conflicts, `PLAN.md` correctly retained from `master`'s side.
2. Ran `npm run build` (Turbopack) — compiled successfully, 1529/1529 static pages generated.
3. `pm2 restart psalter` — process back online.
4. Verified live via the shared Playwright daemon against `https://psalter.gsdlabs.dev/psalms/90`: extracted `svg tspan` text nodes directly (bypassing layout-order confusion in plain `innerText`) and confirmed `"Be-"` / `"fore"` tspans — capital B preserved under the staff notation, matching the "Live-data mechanical verification" prediction above.

Mobile inline-staff-view visual confirmation (as opposed to the direct SVG tspan check) was not separately re-verified at a narrow viewport, since the same `syllabifyForAbc` fix feeds both the Staff view and inline-staff/solfège `w:`-line paths (per the dependency-graph `affects` list above) — the tspan-level check is the authoritative signal for both.

## Self-Check

- `src/lib/lyrics.ts` modified: FOUND
- `src/lib/lyrics.test.ts` modified: FOUND
- Commit `c939403` (test): FOUND in `git log`
- Commit `148d44e` (fix): FOUND in `git log`
- `.planning/quick/260716-dtm-fix-verse-initial-letters-not-capitalizi/deferred-items.md`: FOUND

## Self-Check: PASSED

## TDD Gate Compliance

- RED gate: `c939403 test(quick-260716-dtm): add failing tests for case-preserving syllabifyForAbc` — verified 9/66 tests failed against pre-fix code before this commit.
- GREEN gate: `148d44e fix(quick-260716-dtm): preserve original letter casing in syllabifyForAbc` — verified all 66/66 tests pass after this commit.
- No REFACTOR commit needed (implementation was already minimal/clean on first pass).
