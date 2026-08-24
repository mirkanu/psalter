// LPT (Longest-Processing-Time-first) scheduler for distributing measures
// across N sub-staves balanced by syllable count.
//
// Used by the Inline Staff flatten path: when the user presses A+ on Inline
// Staff, we flatten all phrases into a single measure stream and split into
// (meterMin + rowDelta) sub-staves, balancing syllables per row so the user
// sees roughly equal-width sub-staves and equal font sizes.
//
// Algorithm: walk the measure list in order; for each measure, append it to
// the sub-staff whose current syllable sum is lowest. This preserves
// sequential measure order (which matters for the music stream — reordering
// measures would change the tune) while minimizing the max syllable count
// across sub-staves. LPT gives a 4/3-OPT approximation for makespan.
//
// Ties broken by lower sub-staff index — deterministic across re-renders so
// the layout doesn't flicker when rowDelta toggles between flatten and
// per-phrase modes.

export interface MeasureEntry {
  phraseIdx: number
  measureIdx: number
  musicText: string
  noteCount: number
  /** Per-cycle tokens for this measure. Length === number of visible cycles.
   *  Tokens may include `_` melisma continuation markers (which carry 0
   *  syllable weight — see syllableCount for the balancing metric). */
  perCycleTokens: string[][]
  /** Cycle-0 tokens, kept in sync with perCycleTokens[0]. */
  syllableTokens: string[]
  /** Count of NON-`_` tokens in syllableTokens. Used as the LPT scheduler's
   *  weight so melisma continuation markers don't inflate a measure's
   *  syllable count. */
  syllableCount: number
}

export function distributeMeasuresToSubstaffs(
  entries: MeasureEntry[],
  targetSubstaffCount: number,
): MeasureEntry[][] {
  if (targetSubstaffCount <= 0) return []
  if (entries.length === 0) {
    return Array.from({ length: targetSubstaffCount }, () => [])
  }
  // Each sub-staff gets at least one measure if possible — empty sub-staves
  // render as empty systems, which looks broken.
  const n = Math.min(targetSubstaffCount, entries.length)
  const substaffs: MeasureEntry[][] = Array.from({ length: n }, () => [])
  const sums: number[] = Array.from({ length: n }, () => 0)

  for (const entry of entries) {
    let minIdx = 0
    let minSum = sums[0] ?? Number.POSITIVE_INFINITY
    for (let i = 1; i < n; i++) {
      const s = sums[i] ?? Number.POSITIVE_INFINITY
      if (s < minSum) {
        minSum = s
        minIdx = i
      }
    }
    substaffs[minIdx]!.push(entry)
    sums[minIdx] = (sums[minIdx] ?? 0) + entry.syllableCount
  }

  // Pad to targetSubstaffCount if fewer measures than requested.
  while (substaffs.length < targetSubstaffCount) {
    substaffs.push([])
  }
  return substaffs
}