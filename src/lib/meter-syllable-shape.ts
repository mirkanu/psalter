/**
 * Per-line expected syllable counts derived from the Scottish Psalter's
 * canonical meter taxonomy. The Psalter's meter is the authoritative source
 * of truth for syllable count — when `syllabifyForAbc` disagrees with the
 * meter, that's a strong signal of an over/under-split word (e.g. "praise"
 * being split as "prai-se").
 *
 * Returns `null` for unknown / numeric meters where we can't derive a shape.
 */

/** Per-line expected syllable count for a given meter name.
 *
 * When `doubleLength` is true, returns the doubled shape (concatenated with
 * itself) so each of the doubled tune's metrical lines has a defined expected
 * count. Without this, doubled-CM tunes (which already have `doubleLength`
 * paired elsewhere) get cropped to the un-doubled shape and every other
 * 6-syllable line in the doubled pairing is silently merged or split by
 * `forceMatchMeterShape`. Pass `doubleLength` from any caller that has the
 * tune's doubling flag in scope.
 */
export function expectedSyllablesByLine(
  meter: string | null | undefined,
  doubleLength: boolean = false,
): number[] | null {
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
  let shape: number[] | null = null
  if (groups.length > 0) {
    let nums: number[]
    const allMultiDigit = groups.every(g => g.length >= 2)
    // Only use run-together split when no group contains '0' — otherwise
    // "10 10 10 10 10" would be wrongly split into [1,0,1,0,...].
    if (allMultiDigit && groups.every(g => g.length === 2) && !groups.some(g => g.includes('0'))) {
      // Run-together — split every group into individual digits.
      nums = groups.flatMap(g => g.split('').map(Number))
    } else {
      nums = groups.map(Number)
    }
    nums = nums.filter(n => Number.isFinite(n) && n > 0)
    if (nums.length > 0) {
      shape = isDoubled ? [...nums, ...nums] : nums
    }
  }

  // Named meters
  if (shape === null) {
    switch (m) {
      case 'CM':
      case 'COMMON METER':
        shape = [8, 6, 8, 6]
        break
      case 'LM':
      case 'LONG METER':
        shape = [8, 8, 8, 8]
        break
      case 'SM':
      case 'SHORT METER':
        shape = [6, 6, 8, 6]
        break
      case 'CMD':
      case 'DCM':
      case 'COMMON METER DOUBLED':
        shape = [8, 6, 8, 6, 8, 6, 8, 6]
        break
      case 'LMD':
      case 'DLM':
      case 'LONG METER DOUBLED':
        shape = [8, 8, 8, 8, 8, 8, 8, 8]
        break
      case 'SMD':
      case 'DSM':
      case 'SHORT METER DOUBLED':
        shape = [6, 6, 8, 6, 6, 6, 8, 6]
        break
      default:
        return null
    }
  }

  // Apply doubleLength only when the meter itself isn't already doubled
  // (DCM/LMD/SMD are intrinsically doubled — no need to double again).
  if (doubleLength && !isDoubled && !m.startsWith('D') && !/(?:^|\s)DOUBLED/.test(m)) {
    shape = [...shape, ...shape]
  }
  return shape
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
 *
 * Repeat-line tolerance: the last and second-last meter lines allow
 * `actual = N × expected` (positive integer multiple). This covers folds
 * where a singer collapsed two identical lines into one entry (e.g. CM
 * stanza-1 line 4 = 12 syllables = 6 × 2 for a repeat-last-line tune; or
 * line 3 for a repeat-second-last-line tune). Other lines are flagged as
 * mismatches.
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
  const lastExpectedIdx = expected ? expected.length - 1 : -1
  const secondLastExpectedIdx = expected ? expected.length - 2 : -1
  for (let i = 0; i < maxLines; i++) {
    const a = actualPerLine[i]?.length ?? 0
    const e = expected?.[i] ?? null
    const isLastMeterLine = i === lastExpectedIdx
    const isSecondLastMeterLine = i === secondLastExpectedIdx
    const isRepeatedLast =
      e !== null && e > 0 && isLastMeterLine && a > 0 && a % e === 0
    const isRepeatedSecondLast =
      e !== null && e > 0 && isSecondLastMeterLine && a > 0 && a % e === 0
    const match = e === null ? true : a === e || isRepeatedLast || isRepeatedSecondLast
    out.push({ actual: a, expected: e, match })
  }
  return out
}
