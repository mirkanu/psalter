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

/**
 * Cross-stanza regrouping for cases where the source lyrics are broken into
 * the wrong stanza boundaries (e.g. one physical stanza = half a metrical
 * stanza, so two physical stanzas must merge into one). The 260815 audit
 * found psalm 148 has this case: 6 physical stanzas of 4 lines, but the
 * meter expects 6 metrical lines per stanza.
 *
 * Walks `expectedStanzaShape` (an array of per-line expected syllable counts,
 * one per metrical line of the whole poem) and accumulates adjacent physical
 * stanzas until the running syllable sum matches one metrical stanza's total.
 * Returns the merged stanzas or the original input if a clean fit isn't
 * possible.
 *
 * Strategy: first flatten all physical lines into a single sequence, call
 * `regroupLinesToMeter` on the flattened sequence against the CONCATENATED
 * expected shape, then split the result back into per-stanza chunks sized
 * to the sum of each physical-stanza's expected lines.
 *
 * Pure module. Used by the import pipeline when re-parsing raw lyrics that
 * have wrong stanza breaks.
 */
export function regroupStanzasAcrossBoundaries(
  actualStanzas: string[][][],
  expectedStanzaShape: number[][] | null | undefined,
): { regrouped: string[][][]; merged: boolean } {
  // Trivial inputs: nothing to do.
  if (
    !expectedStanzaShape ||
    expectedStanzaShape.length === 0 ||
    actualStanzas.length === 0
  ) {
    return { regrouped: actualStanzas, merged: false }
  }
  // Expected shape must equal the number of physical stanzas for a no-op
  // pass; otherwise the func has work to do.
  if (expectedStanzaShape.length === actualStanzas.length) {
    return { regrouped: actualStanzas, merged: false }
  }

  // Flatten physical lines into one sequence.
  const flat: string[][] = []
  for (const stanza of actualStanzas) {
    for (const line of stanza) {
      flat.push(line)
    }
  }

  // Concatenate expected per-line counts into a single shape.
  const flatExpected: number[] = []
  for (const stanza of expectedStanzaShape) {
    for (const count of stanza) {
      flatExpected.push(count)
    }
  }

  // Run the single-stanza regroup on the flattened sequence.
  const result = regroupLinesToMeter(flat, flatExpected)
  if (!result.merged) {
    return { regrouped: actualStanzas, merged: false }
  }

  // Split the regrouped lines back into per-stanza chunks, sized by the
  // expected metrical-line count per stanza.
  const regrouped: string[][][] = []
  let cursor = 0
  for (const stanza of expectedStanzaShape) {
    const chunk: string[][] = []
    for (let i = 0; i < stanza.length; i++) {
      const line = result.regrouped[cursor + i]
      if (!line) {
        // Defensive — regroupLinesToMeter should have produced exactly
        // flatExpected.length entries.
        return { regrouped: actualStanzas, merged: false }
      }
      chunk.push(line)
    }
    regrouped.push(chunk)
    cursor += stanza.length
  }
  if (cursor !== result.regrouped.length) {
    return { regrouped: actualStanzas, merged: false }
  }
  return { regrouped, merged: true }
}
