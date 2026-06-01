/**
 * Greedy line-regrouping helper for psalters whose lyrics_imported_raw uses
 * Bible-verse line breaks that don't match the tune's metrical line count
 * (e.g. Darwall 66 66 88: Airtable has 8 short lines [6,6,6,6,4,4,5,4] but
 * the meter expects 6 lines [6,6,6,6,8,8]).
 *
 * Given (a) the actual per-line syllable arrays and (b) the meter's expected
 * per-line counts, walks expected[i] in order and accumulates adjacent actual
 * lines until the running syllable sum ≈ expected[i]. Returns the merged
 * shape, or the original input if a clean greedy fit isn't possible.
 *
 * Tolerance: ±2 syllables per merged group (the per-line force-fit handles
 * the residual). Won't over-eagerly merge — bails if any expected slot
 * can't be filled.
 *
 * Pure module. Used by /dev/melisma-editor's page.tsx loader.
 */

export interface RegroupResult {
  /** Merged syllable arrays — one per expected line. Same shape as expectedShape. */
  regrouped: string[][]
  /** True when a merge actually happened (vs unchanged input). */
  merged: boolean
}

export function regroupLinesToMeter(
  actualPerLine: string[][],
  expectedShape: number[] | null | undefined,
): RegroupResult {
  if (!expectedShape || expectedShape.length === 0) {
    return { regrouped: actualPerLine, merged: false }
  }
  // No regrouping needed when line counts already match (or actual has FEWER).
  if (actualPerLine.length <= expectedShape.length) {
    return { regrouped: actualPerLine, merged: false }
  }

  const TOL = 2  // accept ±2-syllable mismatch per group
  const out: string[][] = []
  let cursor = 0
  for (let i = 0; i < expectedShape.length; i++) {
    const target = expectedShape[i]
    if (cursor >= actualPerLine.length) {
      // Ran out of source lines — abort, return original.
      return { regrouped: actualPerLine, merged: false }
    }
    // Accumulate from cursor until sum is at-or-above (target - TOL).
    const acc: string[] = []
    let sum = 0
    while (cursor < actualPerLine.length) {
      acc.push(...actualPerLine[cursor])
      sum += actualPerLine[cursor].length
      cursor++
      // Stop once we hit target. If overshooting badly, accept what we have.
      if (sum >= target - TOL && sum <= target + TOL) break
      if (sum > target + TOL) break  // overshot — stop here
    }
    out.push(acc)
  }
  // If we didn't consume all source lines, the regrouping failed to fit —
  // bail to original so the caller doesn't drop content.
  if (cursor < actualPerLine.length) {
    return { regrouped: actualPerLine, merged: false }
  }
  // Ensure result has exactly expectedShape.length entries (sanity check).
  if (out.length !== expectedShape.length) {
    return { regrouped: actualPerLine, merged: false }
  }
  return { regrouped: out, merged: true }
}
