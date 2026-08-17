/**
 * PSEL-02 — short meter tags for the psalm listing grid.
 *
 * Per .planning/research/scottish-psalter-structure.md §1a (Meter Taxonomy) and 12-UI-SPEC.md §1: only a
 * subset of meters have a true letter code. For the rest the compact numeric syllable pattern IS the
 * standard short form — it is the correct answer, not a fallback, so it is returned verbatim.
 */

/**
 * 2026-08-17: strips a trailing " D" (Double meter) suffix from a raw psalm-version meter string
 * so it matches how tunes.meter is stored — e.g. "66 66 D" -> "66 66". A doubled psalm version is
 * sung to two repetitions of the SAME (non-doubled) tune; tunes.meter never itself carries a "D"
 * suffix, so fetching/filtering tunes by the raw, un-stripped psalm-version meter finds zero
 * matches (confirmed live: Psalm 143 Second Version, meter "66 66 D", has exactly 1 matching tune
 * at "66 66" — the Sing view and Study tab tune pickers showed "0 tunes" before this fix, while
 * /precent's picker already stripped the suffix inline in SetDetail.tsx's handleTuneClick).
 * Distinct from abbreviateMeter() above, which produces a short DISPLAY code (CM, LM, CMD) for a
 * fully-formed meter string — this operates on the raw numeric-syllable string used for DB
 * lookups, before any abbreviation.
 */
export function stripDoubleMeterSuffix(meter: string | null | undefined): string | null {
  if (!meter) return null
  return meter.replace(/\s+D$/i, '')
}

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
