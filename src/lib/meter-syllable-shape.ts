/**
 * Per-line expected syllable counts derived from the Scottish Psalter's
 * canonical meter taxonomy. The Psalter's meter is the authoritative source
 * of truth for syllable count — when `syllabifyForAbc` disagrees with the
 * meter, that's a strong signal of an over/under-split word (e.g. "praise"
 * being split as "prai-se").
 *
 * Returns `null` for unknown / numeric meters where we can't derive a shape.
 */

/** Per-line expected syllable count for a given meter name. */
export function expectedSyllablesByLine(meter: string | null | undefined): number[] | null {
  if (!meter) return null
  const m = meter.trim().toUpperCase()

  // Numeric forms. Two conventions in the wild:
  //   "8.6.8.6"          → already-separated → [8,6,8,6]
  //   "76 76"            → run-together pairs (= 7,6,7,6) — Scottish Psalter style
  //   "76 76 D"          → doubled → [7,6,7,6,7,6,7,6]
  //   "8 7 8 7" / "8.7.8.7" → already-separated → [8,7,8,7]
  // Strategy: extract digit groups, then split any 2-digit group into single
  // digits whenever every group has length ≥ 2 (run-together convention) AND
  // splitting it leaves syllable counts in the singable range (3–10).
  const isDoubled = / D\b/.test(m)
  const groups = (m.match(/\d+/g) ?? []).map(s => s)
  if (groups.length > 0) {
    let nums: number[]
    const allMultiDigit = groups.every(g => g.length >= 2)
    if (allMultiDigit && groups.every(g => g.length === 2)) {
      // Run-together — split every group into individual digits.
      nums = groups.flatMap(g => g.split('').map(Number))
    } else {
      nums = groups.map(Number)
    }
    nums = nums.filter(n => Number.isFinite(n) && n > 0)
    if (nums.length > 0) {
      return isDoubled ? [...nums, ...nums] : nums
    }
  }

  // Named meters
  switch (m) {
    case 'CM':
    case 'COMMON METER':
      return [8, 6, 8, 6]
    case 'LM':
    case 'LONG METER':
      return [8, 8, 8, 8]
    case 'SM':
    case 'SHORT METER':
      return [6, 6, 8, 6]
    case 'CMD':
    case 'DCM':
    case 'COMMON METER DOUBLED':
      return [8, 6, 8, 6, 8, 6, 8, 6]
    case 'LMD':
    case 'DLM':
    case 'LONG METER DOUBLED':
      return [8, 8, 8, 8, 8, 8, 8, 8]
    case 'SMD':
    case 'DSM':
    case 'SHORT METER DOUBLED':
      return [6, 6, 8, 6, 6, 6, 8, 6]
    default:
      return null
  }
}

export interface LineCheck {
  actual: number
  expected: number | null
  match: boolean
}

/**
 * Compare actual per-line syllable counts against the meter's expected shape.
 * Returns a parallel array of `{actual, expected, match}` records, padded with
 * extra rows if actual has more lines than expected (or vice versa).
 *
 * `expected: null` means "we don't know the meter shape" — the row is shown
 * but not flagged.
 */
export function checkAgainstMeter(
  actualPerLine: string[][],
  meter: string | null | undefined,
): LineCheck[] {
  const expected = expectedSyllablesByLine(meter)
  const maxLines = expected
    ? Math.max(actualPerLine.length, expected.length)
    : actualPerLine.length
  const out: LineCheck[] = []
  for (let i = 0; i < maxLines; i++) {
    const a = actualPerLine[i]?.length ?? 0
    const e = expected?.[i] ?? null
    out.push({ actual: a, expected: e, match: e === null ? true : a === e })
  }
  return out
}
