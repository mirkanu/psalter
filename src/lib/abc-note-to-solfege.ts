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
