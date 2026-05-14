#!/usr/bin/env npx tsx
/**
 * Backfill `% PHRASE_BREAK` markers into existing tunes.abc_notation rows
 * (Phase 04.9.2 Plan 02, D-01 / D-02). Per D-01, phrase boundaries are
 * computed ONCE at import time; this script is the import for the existing
 * dataset (Phase 4.9 left ~75 rows un-annotated).
 *
 * Idempotent: rows already containing `% PHRASE_BREAK` are skipped by default.
 *
 * Usage (CLI loop added in Plan 02 Task 2):
 *   npx tsx scripts/annotate-phrase-breaks.ts            # apply all eligible rows
 *   npx tsx scripts/annotate-phrase-breaks.ts --dry-run  # print plan, no writes
 *   npx tsx scripts/annotate-phrase-breaks.ts --overwrite# re-annotate rows that already have a marker
 */

// ─── Pure helper (exported for unit tests — Plan 02 Task 1) ──────────────────

/**
 * Insert (n-1) `% PHRASE_BREAK` markers into the music body of an ABC string,
 * dividing the music lines into n roughly-equal phrases.
 *
 * Pure function. No DB, no fs, no env.
 *
 * Algorithm:
 *   1. n <= 1 → return input unchanged.
 *   2. Input already contains `% PHRASE_BREAK` → return unchanged (idempotent).
 *   3. Locate K: line. If absent → return unchanged (cannot annotate safely).
 *   4. Body = lines after K:. Identify "music lines" = lines containing '|'.
 *   5. If fewer music lines than n → return unchanged (cannot split cleanly).
 *   6. Distribute music lines into n roughly-equal chunks (floor + remainder).
 *   7. After the last music line of each non-final chunk, splice in a line
 *      consisting of exactly `% PHRASE_BREAK`.
 *
 * For Scottish Psalter tunes, music lines roughly correspond to staff lines
 * / lyrical lines (D-04). Splitting on music-line boundaries is the simplest
 * approximation of "split where the lyric lines break".
 */
export function insertPhraseBreaks(abc: string, n: number): string {
  if (n <= 1) return abc
  if (abc.includes('% PHRASE_BREAK')) return abc

  const lines = abc.split('\n')
  const kIdx = lines.findIndex((l) => /^K:/.test(l.trim()))
  if (kIdx === -1) return abc

  const header = lines.slice(0, kIdx + 1)
  const body = lines.slice(kIdx + 1)

  // Music line = line containing at least one bar separator
  const musicLineIndices = body
    .map((l, i) => (l.includes('|') ? i : -1))
    .filter((i) => i !== -1)
  if (musicLineIndices.length < n) return abc

  // Distribute music lines into n chunks; chunk k gets floor(L/n) + (k<remainder?1:0).
  const chunkSize = Math.floor(musicLineIndices.length / n)
  const remainder = musicLineIndices.length % n
  // breakIndices = body-array indices AFTER which to insert a marker
  const breakIndices: number[] = []
  let consumed = 0
  for (let k = 0; k < n - 1; k++) {
    consumed += chunkSize + (k < remainder ? 1 : 0)
    breakIndices.push(musicLineIndices[consumed - 1])
  }

  const newBody: string[] = []
  for (let i = 0; i < body.length; i++) {
    newBody.push(body[i])
    if (breakIndices.includes(i)) newBody.push('% PHRASE_BREAK')
  }

  return [...header, ...newBody].join('\n')
}
