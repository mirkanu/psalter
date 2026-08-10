/**
 * PSEL-02 — short meter tags for the psalm listing grid.
 *
 * Per .planning/research/scottish-psalter-structure.md §1a (Meter Taxonomy) and 12-UI-SPEC.md §1: only a
 * subset of meters have a true letter code. For the rest the compact numeric syllable pattern IS the
 * standard short form — it is the correct answer, not a fallback, so it is returned verbatim.
 */

// Longer codes first: 'DCM' must win before 'CM', 'SMD' before 'SM', etc.
const LETTER_CODES = ['CMD', 'DCM', 'LMD', 'SMD', 'CM', 'LM', 'SM'] as const

/** The one named numeric alias (Hallelujah Metre). No other numeric pattern gets a letter code. */
const HALLELUJAH_METRE = '66 66 88'

export function abbreviateMeter(meter: string | null | undefined): string | null {
  if (!meter) return null
  // Strip trailing parenthetical/descriptive text: 'LM (long meter, 88 88)' -> 'LM'
  const base = meter.split('(')[0].trim().replace(/\s+/g, ' ')
  if (!base) return null

  const codeCandidate = base.toUpperCase().replace(/\./g, '')
  for (const code of LETTER_CODES) {
    if (codeCandidate === code || codeCandidate.startsWith(`${code} `)) {
      return code === 'DCM' ? 'CMD' : code
    }
  }

  if (base === HALLELUJAH_METRE) return 'HM'
  return base
}

/**
 * The tag a collapsed multi-version toggle box shows for its group (12-UI-SPEC.md §1, steps 1-5):
 * CM is the unmarked default across the grid, so it never produces a tag; exactly one distinct non-CM
 * abbreviation produces that abbreviation; two or more distinct non-CM abbreviations produce no tag
 * (one small badge cannot honestly represent two different meters).
 */
export function groupMeterTag(meters: readonly (string | null | undefined)[]): string | null {
  const distinct = Array.from(
    new Set(meters.map(abbreviateMeter).filter((m): m is string => m !== null)),
  )
  const nonCm = distinct.filter((m) => m !== 'CM')
  return nonCm.length === 1 ? nonCm[0] : null
}
