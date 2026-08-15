/**
 * Phrase-meter lookup map for Scottish Psalter tunes (D-03).
 *
 * One "phrase" = one displayed line of staff + the corresponding lyric line
 * break. Common Meter (CM, 8.6.8.6) breaks into 4 phrases (one per metrical
 * line); Double Common Meter (DCM) doubles that to 8. This map is consumed
 * by both the phrase-annotation script (Plan 02) and the NotationRenderer
 * (Plan 04) to decide how many `% PHRASE_BREAK` markers a tune should carry
 * and how many w: lines a stanza splits into.
 *
 * Per STATE.md decision [04-02], tune.meter values in the database can include
 * a parenthesised long-form description such as `"CM (common meter, 8.6.8.6)"`
 * or `"LM (long meter, 88 88)"`. `phrasesForMeter()` MUST normalise these by
 * taking the first whitespace-delimited token before lookup.
 *
 * For meters not in the map (e.g. `66 66 88`, `10 10 10 10 10`, `87 87`),
 * the function falls back to parsing the numeric digits in the meter string
 * and counting the resulting metrical lines. This mirrors the numeric
 * heuristic in `expectedSyllablesByLine` (meter-syllable-shape.ts) so the
 * phrase count and the syllable shape stay in sync.
 */
export const PHRASES_PER_STANZA: Record<string, number> = {
  CM: 4, // 8.6.8.6 — four metrical lines, one phrase each
  LM: 4, // 8.8.8.8 — four metrical lines, one phrase each
  SM: 4, // 6.6.8.6 — four metrical lines, one phrase each
  DCM: 8, // 8.6.8.6.8.6.8.6 — eight metrical lines
  DLM: 8,
  DSM: 8,
  '8.7.8.7': 4,
  '7.6.7.6': 4,
}

/**
 * Parse the metrical line count from a numeric meter string.
 *
 * Mirrors the numeric heuristic in `expectedSyllablesByLine` so the result
 * returns the *number of metrical lines* (= phrases per stanza for most
 * tunes). Handles:
 *   - `"8.6.8.6"` / `"8 7 8 7"` → already-separated → 4
 *   - `"76 76"`  → run-together pairs (Scottish Psalter convention) → 4
 *   - `"76 76 D"` → doubled → 8
 *   - `"10 10 10 10 10"` → already-separated (zero-guard avoids split) → 5
 *   - `"66 66 88"` → run-together → 6
 *   - `"10 10"` → 2
 *
 * Returns null when the string contains no digits or the parse fails.
 */
function parseNumericMeterLines(meter: string): number | null {
  const isDoubled = / D\b/.test(meter)
  const groups = meter.match(/\d+/g)
  if (!groups || groups.length === 0) return null
  const allMultiDigit = groups.every(g => g.length >= 2)
  let nums: number[]
  if (allMultiDigit && groups.every(g => g.length === 2) && !groups.some(g => g.includes('0'))) {
    // Run-together split (e.g. "76 76" → [7,6,7,6]) — never triggers on
    // "10 10" because the zero-guard skips it.
    nums = groups.flatMap(g => g.split('').map(Number))
  } else {
    nums = groups.map(Number)
  }
  nums = nums.filter(n => Number.isFinite(n) && n > 0)
  if (nums.length === 0) return null
  return isDoubled ? nums.length * 2 : nums.length
}

/**
 * Returns the number of phrases per stanza for a given meter string.
 *
 * Normalisation rules:
 *   - null / undefined / empty string → 1 (whole-stanza fallback).
 *   - First whitespace-delimited token is uppercased and looked up in
 *     PHRASES_PER_STANZA first (catches "CM (common meter, 8.6.8.6)").
 *   - If that misses, the trimmed raw string is looked up (catches numeric
 *     meters like "8.7.8.7" that would be mangled by toUpperCase).
 *   - Unknown strings then fall back to numeric parsing (extracts digit
 *     groups and counts them, doubling if the string ends in " D").
 *   - Anything still unknown → 1.
 *
 * @example
 *   phrasesForMeter("CM")                            // => 4
 *   phrasesForMeter("CM (common meter, 8.6.8.6)")    // => 4
 *   phrasesForMeter("DCM")                           // => 8
 *   phrasesForMeter("8.7.8.7")                       // => 4
 *   phrasesForMeter("66 66 88")                      // => 6
 *   phrasesForMeter("10 10 10 10 10")                // => 5
 *   phrasesForMeter("76 76 D")                       // => 8
 *   phrasesForMeter(null)                            // => 1
 *   phrasesForMeter("UNKNOWN")                       // => 1
 */
export function phrasesForMeter(meter: string | null | undefined): number {
  if (!meter) return 1
  const trimmed = meter.trim()
  if (!trimmed) return 1
  const firstToken = trimmed.split(/\s+/)[0]
  const normalised = firstToken ? firstToken.toUpperCase() : ''
  const fromMap = PHRASES_PER_STANZA[normalised] ?? PHRASES_PER_STANZA[trimmed]
  if (fromMap !== undefined) return fromMap
  const fromNumeric = parseNumericMeterLines(trimmed)
  return fromNumeric ?? 1
}
