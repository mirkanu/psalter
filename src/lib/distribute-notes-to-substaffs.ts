// LPT (Longest-Processing-Time-first) scheduler for distributing individual
// NOTES (not whole measures) across N sub-staves. Each note is a unit of
// work; LPT balances the note count per sub-staff to keep rendered widths
// roughly equal.
//
// Why per-note and not per-measure:
//   Scottish Psalter tunes in CM (8.6.8.6) compress some phrases into a
//   single dense measure (e.g. Psalm 23 phrase 3 m1 has 9 notes for
//   "pas-ture green: he lead-eth me"). Per-measure LPT cannot split that
//   measure, so one sub-staff always carries a 9-note row while others
//   carry 3-5 notes. Per-note LPT fragments the dense measure across
//   sub-staves (joined by `\` continuation), equalising rendered density.
//
// Each entry carries a `weight` (default 1) for the LPT scheduler —
// measures with multi-note syllables (e.g. held chords) can weight more
// than 1 to reflect rendered width, but for the Scottish Psalter corpus
// weight=1 (= per-note) gives the best visual balance.
//
// 260825-lpt-note: replaces the per-measure LPT for the flatten path
// when the user has pressed A+. The per-phrase path (A+=0) is unaffected.

export interface NoteEntry {
  phraseIdx: number
  measureIdx: number
  noteIdxInMeasure: number
  /** True if this note is the LAST note of its original measure — when
   *  emitting, a `|` bar line follows it. */
  isEndOfMeasure: boolean
  /** ABC note text (e.g. "c2", "a4", "b", "g", "c'4"). The emission step
   *  joins these with spaces. */
  noteText: string
  /** Per-cycle token for this note. Length === number of visible cycles.
   *  Token is either a real syllable, `_` (melisma continuation) or an
   *  empty string (no syllable assigned — emission treats empty as `_` to
   *  keep abcjs's w: line aligned to note positions). */
  cycleTokens: string[]
}

export function distributeNotesToSubstaffs(
  entries: NoteEntry[],
  targetSubstaffCount: number,
  startOffset: number = 0,
): NoteEntry[][] {
  if (targetSubstaffCount <= 0) return []
  if (entries.length === 0) {
    return Array.from({ length: targetSubstaffCount }, () => [])
  }
  // Each sub-staff gets at least one note if possible — empty sub-staves
  // render as empty systems, which looks broken.
  const n = Math.min(targetSubstaffCount, entries.length)
  const substaffs: NoteEntry[][] = Array.from({ length: n }, () => [])
  const sums: number[] = Array.from({ length: n }, () => 0)
  // 260825-lpt-rotate: start the LPT search at `startOffset` so the largest
  // job rotates through sub-staves as A+ is pressed (see the matching
  // comment in distribute-measures-to-substaffs.ts for rationale).
  const offset = ((startOffset % n) + n) % n

  for (const entry of entries) {
    let minIdx = offset
    let minSum = sums[offset] ?? Number.POSITIVE_INFINITY
    for (let i = 1; i < n; i++) {
      const idx = (offset + i) % n
      const s = sums[idx] ?? Number.POSITIVE_INFINITY
      if (s < minSum) {
        minSum = s
        minIdx = idx
      }
    }
    substaffs[minIdx]!.push(entry)
    sums[minIdx] = (sums[minIdx] ?? 0) + 1
  }

  while (substaffs.length < targetSubstaffCount) {
    substaffs.push([])
  }
  return substaffs
}
