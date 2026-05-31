/**
 * Convert an ABC note token (e.g. "c2", "a4", "c'", "=b") to its solfège
 * syllable in the given key (e.g. "s", "m", "s'", "fe").
 *
 * Used by the melisma editor so the note grid matches what the user sees in
 * the printed solfège JPG.
 *
 * Convention: the bare lowercase letter is the singer's reference octave;
 * `'` adds an upper-octave marker, `,` adds a lower-octave marker (`_1`).
 */

const LETTER_SEMI: Record<string, number> = {
  c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11,
}

const DOH_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  'F#': 6, 'C#': 1, 'G#': 8, 'D#': 3, 'A#': 10,
  Bb: 10, Eb: 3, Ab: 8, Db: 1, Gb: 6,
}

const KEY_SHARPS: Record<string, Set<string>> = {
  C: new Set(), G: new Set(['F']), D: new Set(['F', 'C']),
  A: new Set(['F', 'C', 'G']), E: new Set(['F', 'C', 'G', 'D']),
  B: new Set(['F', 'C', 'G', 'D', 'A']),
  'F#': new Set(['F', 'C', 'G', 'D', 'A', 'E']),
  'C#': new Set(['F', 'C', 'G', 'D', 'A', 'E', 'B']),
}

const KEY_FLATS: Record<string, Set<string>> = {
  F: new Set(['B']),
  Bb: new Set(['B', 'E']),
  Eb: new Set(['B', 'E', 'A']),
  Ab: new Set(['B', 'E', 'A', 'D']),
  Db: new Set(['B', 'E', 'A', 'D', 'G']),
  Gb: new Set(['B', 'E', 'A', 'D', 'G', 'C']),
}

// Semitone (0–11 mod 12, relative to doh) → solfège syllable.
// Natural-scale entries take precedence; chromatic entries are the canonical
// alteration spelling.
const SEMI_TO_SYLLABLE: Record<number, string> = {
  0: 'd',
  1: 'de',
  2: 'r',
  3: 'ma',
  4: 'm',
  5: 'f',
  6: 'fe',
  7: 's',
  8: 'la',
  9: 'l',
  10: 'ta',
  11: 't',
}

/**
 * Extract doh from an ABC body's K: header. Falls back to "C" on miss.
 * Handles "K:F", "K:Bb", "K:Dm" (minor — uses relative major's doh).
 */
export function extractDohFromAbc(abc: string): string {
  const m = abc.match(/^K:\s*([A-G][#b]?)(m)?/m)
  if (!m) return 'C'
  const key = m[1]
  const isMinor = !!m[2]
  if (!isMinor) return key
  // Minor key → relative major doh (a minor third up)
  const MAJ_TO_REL_MIN: Record<string, string> = {
    A: 'C', E: 'G', B: 'D', 'F#': 'A', 'C#': 'E', 'G#': 'B',
    D: 'F', G: 'Bb', C: 'Eb', F: 'Ab', Bb: 'Db', Eb: 'Gb',
  }
  return MAJ_TO_REL_MIN[key] ?? 'C'
}

export function abcNoteToSolfege(abcToken: string, doh: string): string {
  // accidental? letter octave-markers? trailing-digits-or-slash (ignored)
  const m = abcToken.match(/^([_^=]?)([A-Ga-g])([,']*)/)
  if (!m) return abcToken
  const [, accStr, letter, octStr] = m

  const letterLower = letter.toLowerCase()
  const letterUpper = letter.toUpperCase()
  let semi = LETTER_SEMI[letterLower]
  if (semi === undefined) return abcToken

  // Apply key signature defaults — but only if no explicit accidental cancels.
  if (accStr === '') {
    if ((KEY_FLATS[doh] ?? new Set()).has(letterUpper)) semi -= 1
    if ((KEY_SHARPS[doh] ?? new Set()).has(letterUpper)) semi += 1
  } else if (accStr === '^') {
    semi += 1
  } else if (accStr === '_') {
    semi -= 1
  }
  // '=' (natural) leaves semi at the bare letter semitone — already correct.

  const dohSemi = DOH_SEMITONES[doh] ?? 0
  const degree = (((semi - dohSemi) % 12) + 12) % 12
  const syl = SEMI_TO_SYLLABLE[degree] ?? '?'

  // Octave marker. ABC convention: uppercase = base, lowercase = +1, then `'`/`,`.
  let octaveOffset = letter === letterLower ? 1 : 0
  octaveOffset += (octStr.match(/'/g) ?? []).length
  octaveOffset -= (octStr.match(/,/g) ?? []).length

  // Normalise to "soprano reference octave = 1" (no marker).
  const rel = octaveOffset - 1
  let suffix = ''
  if (rel > 0) suffix = "'".repeat(rel)
  else if (rel < 0) suffix = '_' + Math.abs(rel)

  return syl + suffix
}

// ─── Inverse: solfège → ABC note (preserving duration from old token) ────────

// Lookups for syllable → semitone offset from doh (mirrors DEGREE in solfege-parser).
const SYLLABLE_TO_SEMI: Record<string, number> = {
  d: 0, de: 1, r: 2, re: 3, ra: 1,
  m: 4, ma: 3, me: 3,
  f: 5, fe: 6,
  s: 7, se: 8,
  l: 9, le: 10, la: 8, ba: 8,
  t: 11, ta: 10,
}

// Prefer flat spelling when in a flat key, sharp otherwise.
function preferFlatForDoh(doh: string): boolean {
  return /^(F|Bb|Eb|Ab|Db|Gb)$/.test(doh)
}

/**
 * Parse a solfège token like "m", "fe", "s'", "d_1", "m,," into:
 *   - syllable (base + optional chromatic suffix)
 *   - octaveOffset relative to the singer's reference octave
 *
 * Octave markers: `'` = +1, `,` = -1, `_N` (digit N) = -N (matches print convention).
 */
export function parseSolfegeToken(input: string): { syllable: string; octaveOffset: number } | null {
  const s = input.trim()
  if (!s) return null
  // Match: letters (syllable) + optional octave markers (', ", _1, _2, etc.)
  const m = s.match(/^([a-z]+)((?:'|,)*)(?:_(\d))?$/)
  if (!m) return null
  const syllable = m[1]
  const apostrophes = (m[2].match(/'/g) ?? []).length
  const commas = (m[2].match(/,/g) ?? []).length
  const underscoreDigit = m[3] ? Number(m[3]) : 0
  if (!(syllable in SYLLABLE_TO_SEMI)) return null
  const octaveOffset = apostrophes - commas - underscoreDigit
  return { syllable, octaveOffset }
}

/**
 * Convert a solfège token to an ABC note token in the given key, preserving
 * the duration suffix from the original ABC token (so editing pitch doesn't
 * change rhythm). Returns the original token unchanged on parse error.
 */
export function solfegeToAbcNote(solfege: string, doh: string, originalAbcToken: string): string {
  const parsed = parseSolfegeToken(solfege)
  if (!parsed) return originalAbcToken

  // Extract duration suffix from original token (anything after letter+octave markers).
  const origMatch = originalAbcToken.match(/^([_^=]?)([A-Ga-g])([,']*)(.*)$/)
  const durationSuffix = origMatch ? origMatch[4] : ''

  const dohSemi = DOH_SEMITONES[doh] ?? 0
  const targetSemi = (dohSemi + SYLLABLE_TO_SEMI[parsed.syllable] + 1200) % 12

  // Map semitone → (letter, accidental). Explicit accidentals override the
  // key signature for that letter (per ABC convention), so we compute the
  // candidate semitone of each (letter, accidental) pair WITHOUT applying the
  // key sig when an accidental is present, and WITH the key sig when none is.
  const LETTER_ORDER = ['c', 'd', 'e', 'f', 'g', 'a', 'b'] as const
  const keyFlats = KEY_FLATS[doh] ?? new Set()
  const keySharps = KEY_SHARPS[doh] ?? new Set()
  function semiOf(letter: string, acc: '' | '^' | '_' | '='): number {
    let s = LETTER_SEMI[letter]
    if (acc === '^') s += 1
    else if (acc === '_') s -= 1
    else if (acc === '') {
      if (keyFlats.has(letter.toUpperCase())) s -= 1
      if (keySharps.has(letter.toUpperCase())) s += 1
    }
    // acc === '=' → use LETTER_SEMI[letter] directly (natural override)
    return ((s % 12) + 12) % 12
  }

  // Build a preference-ordered list of (letter, acc) candidates and pick the
  // first whose computed semitone equals targetSemi.
  //  1. No accidental (key-sig default) — cleanest.
  //  2. Natural override (=) — only useful when key sig sharps/flats that letter.
  //  3. Sharp (^) or flat (_) — preferred direction depends on the key.
  const preferFlat = preferFlatForDoh(doh)
  const accentOrder: Array<'' | '=' | '^' | '_'> = preferFlat
    ? ['', '=', '_', '^']
    : ['', '=', '^', '_']

  let chosenLetter = ''
  let accidental: '' | '^' | '_' | '=' = ''
  outer: for (const acc of accentOrder) {
    for (const L of LETTER_ORDER) {
      if (semiOf(L, acc) === targetSemi) {
        chosenLetter = L
        accidental = acc
        break outer
      }
    }
  }
  if (!chosenLetter) return originalAbcToken // give up — should not happen

  // Octave markers. ABC: lowercase = +1 from uppercase base; `'` adds octave, `,` subtracts.
  // Our solfège uses "no marker" as the reference octave, which we previously mapped to
  // ABC lowercase + 0 trailing marks. So we reproduce that:
  //   octaveOffset 0  → lowercase letter, no marker
  //   octaveOffset +1 → lowercase letter + "'"
  //   octaveOffset -1 → uppercase letter (one octave down)
  //   octaveOffset -2 → uppercase letter + ","
  let letter = chosenLetter
  let octStr = ''
  let off = parsed.octaveOffset
  if (off >= 1) {
    octStr = "'".repeat(off)
  } else if (off === 0) {
    // no marker
  } else if (off === -1) {
    letter = chosenLetter.toUpperCase()
  } else if (off < -1) {
    letter = chosenLetter.toUpperCase()
    octStr = ','.repeat(Math.abs(off) - 1)
  }

  return accidental + letter + octStr + durationSuffix
}
