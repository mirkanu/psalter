/**
 * Pure deterministic solfège → ABC parser.
 * No imports — safe to use in both server and client code.
 *
 * Reference: .planning/research/tonic-solfa-notation.md
 *
 * Notation handled:
 *   Pitches:   d r m f s l t  (plain)
 *              d' r' m' ...   (upper octave, apostrophe after)
 *              d_1 r_1 m_1 .. (lower octave, subscript numeral)
 *              de re fe se le (sharp alterations, +e vowel)
 *              ta la ba ma ra (flat alterations, +a vowel)
 *   Rhythm:    | = cell divider (2 beats in C time, 3 in 3/4)
 *              : = beat separator within a cell
 *              . = half-beat subdivision (quaver pair)
 *              — or - = hold (prolong previous note)
 *   Special:   :x before first | = pickup note
 *              — at start of cell = continue hold from previous cell
 */

// ── Scale tables ──────────────────────────────────────────────────────────────

export const DOH_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  'F#': 6, 'C#': 1, 'G#': 8, 'D#': 3, 'A#': 10,
  Bb: -2, Eb: -1, Ab: -4, Db: -5, Gb: -6,
}

export const DEGREE: Record<string, number> = {
  // Natural scale degrees
  d: 0, r: 2, m: 4, f: 5, s: 7, l: 9, t: 11,
  // Sharp alterations (add 'e' vowel, ascending chromatic)
  de: 1,   // raised doh  (C# in C)
  re: 3,   // raised ray  (D# in C)
  fe: 6,   // raised fah  (F# in C) — very common
  se: 8,   // raised soh  (G# in C) — harmonic minor leading tone
  le: 10,  // raised lah  (A#/Bb in C)
  // Flat alterations (add 'a' vowel, descending chromatic)
  ta: 10,  // flat te     (Bb in C) — most common flat alteration
  la: 8,   // flat lah    (Ab in C)
  ba: 8,   // flat 6th in minor (= la, alternate name)
  ma: 3,   // flat me     (Eb in C)
  ra: 1,   // flat ray    (Db in C)
  // Minor-mode mediant (flat 3rd, sometimes written 'me' by singers)
  me: 3,
}

// ── Key helpers ───────────────────────────────────────────────────────────────

export function dohToAbcKey(doh: string, lah?: string, mode?: string): string {
  if (mode === 'minor' && lah) return `${lah}m`
  const map: Record<string, string> = {
    C: 'C', G: 'G', D: 'D', A: 'A', E: 'E', B: 'B',
    'F#': 'F#', 'C#': 'C#',
    F: 'F', Bb: 'Bb', Eb: 'Eb', Ab: 'Ab', Db: 'Db', Gb: 'Gb',
  }
  return map[doh] ?? 'C'
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
  const acc = name.length > 1 ? '^' : ''

  if (oct >= 6)  return `${acc}${letter.toLowerCase()}''`
  if (oct === 5) return `${acc}${letter.toLowerCase()}'`
  if (oct === 4) return `${acc}${letter.toLowerCase()}`
  if (oct === 3) return `${acc}${letter}`
  if (oct === 2) return `${acc}${letter},`
  return `${acc}${letter},,`
}

// ── Syllable parser ───────────────────────────────────────────────────────────

interface SolFaNote { syllable: string; octaveShift: number }

export function parseSyllable(token: string): SolFaNote | null {
  let t = token.trim()
  let octaveShift = 0

  // Leading commas = lower octave
  while (t.startsWith(',')) { octaveShift--; t = t.slice(1) }

  // Trailing _1 / _2 = lower octave (subscript numeral from OCR)
  const subMatch = t.match(/^(.*?)_(\d+)$/)
  if (subMatch) {
    octaveShift -= parseInt(subMatch[2])
    t = subMatch[1]
  }

  // Trailing apostrophes = upper octave
  while (t.endsWith("'")) { octaveShift++; t = t.slice(0, -1) }

  // Trailing commas = lower octave (alternate convention)
  while (t.endsWith(',')) { octaveShift--; t = t.slice(0, -1) }

  const syllable = t.toLowerCase()
  if (!(syllable in DEGREE)) return null
  return { syllable, octaveShift }
}

// ── Core converter ────────────────────────────────────────────────────────────
// Uses L:1/8 as ABC base unit so all durations are integers:
//   full beat (crotchet)  = 2
//   half beat (quaver)    = 1
//   dotted crotchet       = 3
//   minim                 = 4
//   dotted minim (3/4 bar)= 6
//   semibreve             = 8

interface NoteEvent { note: string; duration: number }

function isHold(token: string): boolean {
  return token === '—' || token === '-'
}

function parseVoiceLine(
  raw: string,
  tonic: number,
  warnings: string[],
): NoteEvent[] {
  const events: NoteEvent[] = []

  const lastEventIdx = (): number => events.length - 1

  function extendLast(dur: number) {
    if (events.length > 0) {
      events[lastEventIdx()].duration += dur
    } else {
      events.push({ note: 'z', duration: dur })
    }
  }

  function addNote(note: string, dur: number) {
    events.push({ note, duration: dur })
  }

  // Strip final barlines and trim
  const cleaned = raw
    .replace(/\|\|.*$/, '') // drop everything from final || onward (Amen etc.)
    .replace(/\|$/, '')
    .trim()

  // Split on | to get cells
  const cells = cleaned.split(/\|+/).map(c => c.trim()).filter(Boolean)

  for (const cell of cells) {
    // Split on : to get beat slots; filter empties (handles leading : in pickup)
    const slots = cell.split(':').map(s => s.trim()).filter(Boolean)

    for (const slot of slots) {
      // Check for dot subdivision: "d.r" or "—.m" → split into half-beat tokens
      const subTokens = slot.split('.').map(s => s.trim()).filter(Boolean)
      const halfBeat = subTokens.length > 1
      const unitDur = halfBeat ? 1 : 2 // L:1/8: full beat=2, half beat=1

      for (const token of subTokens) {
        if (isHold(token)) {
          extendLast(unitDur)
        } else {
          const parsed = parseSyllable(token)
          if (!parsed) {
            warnings.push(`Unrecognised token: "${token}" in "${raw.slice(0, 60)}"`)
            // Emit a rest so bar lengths stay correct
            addNote('z', unitDur)
            continue
          }
          const semitone = tonic + (DEGREE[parsed.syllable] ?? 0) + parsed.octaveShift * 12
          addNote(semitoneToAbcNote(semitone), unitDur)
        }
      }
    }
  }

  return events
}

function eventsToAbcStr(events: NoteEvent[]): string {
  return events.map(e => {
    // L:1/8 → no suffix = 1 eighth. For n > 1, suffix is n.
    return e.duration === 1 ? e.note : `${e.note}${e.duration}`
  }).join('')
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SolFaVoices {
  soprano: string
  alto: string
  tenor: string
  bass: string
}

export interface MultiVoiceResult {
  abc: string
  warnings: string[]
}

/** Convert all four SATB solfège lines to a single multi-voice ABC string. */
export function solFaToAbcMultiVoice(
  voices: SolFaVoices,
  doh: string,
  time: string,
  tuneName: string,
  lah?: string,
  mode?: string,
): MultiVoiceResult {
  const warnings: string[] = []
  const tonic = DOH_SEMITONES[doh] ?? (warnings.push(`Unknown DOH: "${doh}" — defaulting to C`), 0)
  const key = dohToAbcKey(doh, lah, mode)
  const meter = time === '4/4' ? 'C' : time === 'C' ? 'C' : time

  const sopranoEvents = parseVoiceLine(voices.soprano, tonic, warnings)
  const altoEvents    = parseVoiceLine(voices.alto,    tonic, warnings)
  const tenorEvents   = parseVoiceLine(voices.tenor,   tonic, warnings)
  const bassEvents    = parseVoiceLine(voices.bass,    tonic, warnings)

  const abc = [
    `X:1`,
    `T:${tuneName}`,
    `M:${meter}`,
    `L:1/8`,
    `Q:1/4=76`,
    `K:${key}`,
    `V:1 clef=treble name="Soprano"`,
    eventsToAbcStr(sopranoEvents),
    `V:2 clef=treble name="Alto"`,
    eventsToAbcStr(altoEvents),
    `V:3 clef=treble name="Tenor"`,
    eventsToAbcStr(tenorEvents),
    `V:4 clef=bass name="Bass"`,
    eventsToAbcStr(bassEvents),
  ].join('\n')

  return { abc, warnings }
}

/** Convert a single solfège voice line to ABC. Used by the editable OCR text panel. */
export function solFaToAbc(
  raw: string,
  doh: string,
  time: string,
  tuneName: string,
  lah?: string,
  mode?: string,
): { abc: string; bars: string[][]; warnings: string[] } {
  const warnings: string[] = []
  const tonic = DOH_SEMITONES[doh] ?? (warnings.push(`Unknown DOH: "${doh}" — defaulting to C`), 0)
  const key = dohToAbcKey(doh, lah, mode)
  const meter = time === '4/4' ? 'C' : time === 'C' ? 'C' : time

  const events = parseVoiceLine(raw, tonic, warnings)
  const musicStr = eventsToAbcStr(events)

  // bars: group events into cells of 4 units (1 beat = 2 units → 2 beats per cell)
  // This is a rough grouping for display only
  const bars: string[][] = []
  let current: string[] = []
  let cellDur = 0
  const cellSize = meter === 'C' ? 4 : 6 // 2 beats in C time, 3 beats in 3/4

  for (const e of events) {
    current.push(`${e.note}${e.duration === 1 ? '' : e.duration}`)
    cellDur += e.duration
    if (cellDur >= cellSize) {
      bars.push(current)
      current = []
      cellDur = 0
    }
  }
  if (current.length > 0) bars.push(current)

  const abc = [`X:1`, `T:${tuneName}`, `M:${meter}`, `L:1/8`, `Q:1/4=76`, `K:${key}`, musicStr].join('\n')
  return { abc, bars, warnings }
}
