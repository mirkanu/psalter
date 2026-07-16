# Deferred Items — 260716-dtm

Found while running the broader sanity suite (`npx vitest run src/lib/lyrics.test.ts src/lib/lyrics-structured.test.ts` passed clean, but a wider sweep of `syllabifyForAbc`/`buildWLineFromSolfa` callers surfaced pre-existing unrelated failures). Confirmed via `git stash` that all three fail identically on the pre-fix code, so they are **not** caused or worsened by this task's change. Out of scope per SCOPE BOUNDARY — not fixed here.

1. **`tests/lib-utilities.test.ts` — "syllabifyForAbc: single-syllable words are returned as-is"**
   Asserts `syllabifyForAbc('Praise ye the Lord')` → `'prai- se ye the Lord'`, but `PSALM_SYLLABLE_OVERRIDES.praise = ['praise']` (1 syllable, added after this test was written) makes the actual output `'Praise ye the Lord'` unchanged. Stale test predating the `praise` override entry — unrelated to capitalization.

2. **`src/lib/abc-melisma.test.ts` — "returns empty string for soprano with no events in requested phrase"**
   `RangeError: Invalid array length` at `buildWLineFromSolfa` line 197 (`new Array(noteCount).fill(false)`) — `noteCount` is negative/invalid for this fixture. Pre-existing bug, unrelated to `syllabifyForAbc` casing.

3. **`src/lib/abc-melisma.test.ts` — "phrase 4 boundary survives passing notes in earlier phrases"**
   Expected 8 tokens, got 14. Pre-existing melisma/passing-note count mismatch, unrelated to this task.
