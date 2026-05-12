/**
 * Pure deterministic solfège → ABC parser.
 * No imports — safe to use in both server and client code.
 */

// ── Scale tables ──────────────────────────────────────────────────────────────

export const DOH_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  'F#': 6, 'C#': 1, 'G#': 8, 'D#': 3, 'A#': 10,
  Bb: -2, Eb: -1, Ab: -4, Db: -5, Gb: -6,
}

export const DEGREE: Record<string, number> = {
  d: 0, r: 2, m: 4, f: 5, s: 7, l: 9, t: 11,
  // Curwen chromatic alterations
  de: 1, re: 3, me: 3, fe: 6, se: 8, le: 8, te: 10,
}

// ── Note conversion ───────────────────────────────────────────────────────────

export function semitoneToAbcNote(semitone: number): string {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  let oct = 4
  let s = semitone
  while (s < 0)   { s += 12; oct-- }
  while (s >= 12) { s -= 12; oct++ }
  const name = NOTE_NAMES[s]
  const letter = name[0]
  const sharp = name.length > 1 ? '^' : ''

  if (oct >= 6)  return `${sharp}${letter.toLowerCase()}''`
  if (oct === 5) return `${sharp}${letter.toLowerCase()}'`
  if (oct === 4) return `${sharp}${letter.toLowerCase()}`
  if (oct === 3) return `${sharp}${letter}`
  return `${sharp}${letter},`
}

// ── Syllable parser ───────────────────────────────────────────────────────────

interface SolFaNote { syllable: string; octaveShift: number; hold: boolean }

export function parseSyllable(token: string): SolFaNote | null {
  if (token === '—' || token === '-') return { syllable: 'hold', octaveShift: 0, hold: true }

  let t = token.trim()
  let octaveShift = 0

  while (t.startsWith(',')) { octaveShift--; t = t.slice(1) }
  while (t.endsWith(','))   { octaveShift--; t = t.slice(0, -1) }
  while (t.endsWith("'"))   { octaveShift++; t = t.slice(0, -1) }

  const syllable = t.toLowerCase()
  if (!(syllable in DEGREE)) return null
  return { syllable, octaveShift, hold: false }
}

// ── Main converter ────────────────────────────────────────────────────────────

export function solFaToAbc(
  raw: string,
  doh: string,
  time: string,
  tuneName: string,
): { abc: string; bars: string[][]; warnings: string[] } {
  const warnings: string[] = []
  const dohSemitone = DOH_SEMITONES[doh]
  if (dohSemitone === undefined) warnings.push(`Unknown DOH key: ${doh}, defaulting to C`)
  const tonic = dohSemitone ?? 0

  const barStrings = raw.split(/\|+/).map(b => b.trim()).filter(Boolean)
  const cleanBars = barStrings.filter(b => b !== '||' && b !== '|')
  const bars: string[][] = []

  for (const barStr of cleanBars) {
    const beats = barStr.split(':').map(b => b.trim()).filter(Boolean)
    const barNotes: string[] = []
    let lastNote = 'z'

    for (const beat of beats) {
      const tokens = beat.split(/\s+/).filter(Boolean)
      for (const token of tokens) {
        const parsed = parseSyllable(token)
        if (!parsed) { warnings.push(`Unrecognised token: ${token}`); continue }

        if (parsed.hold) {
          if (barNotes.length > 0) {
            // Extend the previous note's duration (quarter → half → whole)
            const prev = barNotes[barNotes.length - 1]
            const base = prev.replace(/\d+$/, '')
            const dur = parseInt(prev.match(/\d+$/)?.[0] ?? '1')
            barNotes[barNotes.length - 1] = base + String(dur * 2)
          } else {
            // Hold carries from previous bar — emit as tied note
            barNotes.push(lastNote + '2')
          }
        } else {
          const semitone = tonic + (DEGREE[parsed.syllable] ?? 0) + (parsed.octaveShift * 12)
          const abcNote = semitoneToAbcNote(semitone)
          lastNote = abcNote
          barNotes.push(abcNote)
        }
      }
    }

    if (barNotes.length > 0) bars.push(barNotes)
  }

  const meter = time === '4/4' ? 'C' : time === '3/4' ? '3/4' : time
  const musicLine = bars.map(b => b.join('')).join('|')

  const abc = [`X:1`, `T:${tuneName}`, `M:${meter}`, `L:1/4`, `K:C`, musicLine].join('\n')
  return { abc, bars, warnings }
}
