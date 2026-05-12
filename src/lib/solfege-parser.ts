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

// ── Key signature tables ──────────────────────────────────────────────────────
// Which note LETTERS (uppercase) are modified by the key signature.
// Used to avoid double-sharps/double-flats in the generated ABC.

// Sharped letters per major key (order of sharps: F C G D A E B)
const KEY_SHARPS: Record<string, Set<string>> = {
  C:  new Set(),
  G:  new Set(['F']),
  D:  new Set(['F','C']),
  A:  new Set(['F','C','G']),
  E:  new Set(['F','C','G','D']),
  B:  new Set(['F','C','G','D','A']),
  'F#': new Set(['F','C','G','D','A','E']),
  'C#': new Set(['F','C','G','D','A','E','B']),
}

// Flatted letters per major key (order of flats: B E A D G C F)
const KEY_FLATS: Record<string, Set<string>> = {
  F:  new Set(['B']),
  Bb: new Set(['B','E']),
  Eb: new Set(['B','E','A']),
  Ab: new Set(['B','E','A','D']),
  Db: new Set(['B','E','A','D','G']),
  Gb: new Set(['B','E','A','D','G','C']),
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

/** Return the set of sharped and flatted letters for a given doh (always major lookup). */
function keyAccidentalsForDoh(doh: string): { sharps: Set<string>; flats: Set<string> } {
  return {
    sharps: KEY_SHARPS[doh] ?? new Set(),
    flats:  KEY_FLATS[doh]  ?? new Set(),
  }
}

// ── Note conversion ───────────────────────────────────────────────────────────

// Chromatic positions 0–11: sharp and flat representations.
// 'sharpLetter' is always the sharp (or natural) spelling.
// 'flatLetter' is set for enharmonic positions with a flat spelling.
const SEMITONE_REPR = [
  { sharpLetter: 'C', flatLetter: null  },  // 0
  { sharpLetter: 'C', flatLetter: 'D'   },  // 1  C#/Db
  { sharpLetter: 'D', flatLetter: null  },  // 2
  { sharpLetter: 'D', flatLetter: 'E'   },  // 3  D#/Eb
  { sharpLetter: 'E', flatLetter: null  },  // 4
  { sharpLetter: 'F', flatLetter: null  },  // 5
  { sharpLetter: 'F', flatLetter: 'G'   },  // 6  F#/Gb
  { sharpLetter: 'G', flatLetter: null  },  // 7
  { sharpLetter: 'G', flatLetter: 'A'   },  // 8  G#/Ab
  { sharpLetter: 'A', flatLetter: null  },  // 9
  { sharpLetter: 'A', flatLetter: 'B'   },  // 10 A#/Bb
  { sharpLetter: 'B', flatLetter: null  },  // 11
] as const

/**
 * Convert an absolute semitone to an ABC note string, respecting the key signature.
 *
 * The key signature (sharps/flats) determines which letter+accidental combo
 * produces the right pitch without needing an explicit modifier:
 *   • K:G has F#  → 'f' in ABC = F#, so te (F#) → 'f' (not '^f', which would be F##)
 *   • K:Ab has Ab → 'a' in ABC = Ab, so doh (Ab) → 'A' (not '^G', enharmonic but confusing)
 *   • K:F has Bb  → 'b' in ABC = Bb, so ray (Bb) → 'b' (not '^a')
 *
 * Natural signs ('=') are emitted when the key signature would otherwise alter a note
 * that should be natural (e.g. ta = F-natural in K:G → '=f').
 */
export function semitoneToAbcNote(
  semitone: number,
  sharps: Set<string> = new Set(),
  flats:  Set<string> = new Set(),
): string {
  let oct = 4
  let s = semitone
  while (s < 0)   { s += 12; oct-- }
  while (s >= 12) { s -= 12; oct++ }

  const { sharpLetter, flatLetter } = SEMITONE_REPR[s]
  let letter: string
  let accPrefix: string

  const isChromatic = sharpLetter !== SEMITONE_REPR[s].sharpLetter || flatLetter !== null

  if (flatLetter === null) {
    // Natural semitone (C D E F G A B)
    letter = sharpLetter
    if (sharps.has(letter)) {
      accPrefix = '='  // key sharps this note; need natural to cancel
    } else if (flats.has(letter)) {
      accPrefix = '='  // key flats this note; need natural to cancel
    } else {
      accPrefix = ''
    }
  } else {
    // Chromatic semitone — find the representation that fits the key
    if (sharps.has(sharpLetter)) {
      // Key already sharps this letter → omit explicit accidental
      letter = sharpLetter; accPrefix = ''
    } else if (flats.has(flatLetter)) {
      // Key already flats the flat-letter → use flat spelling without explicit accidental
      letter = flatLetter; accPrefix = ''
    } else if (flats.size > 0) {
      // Flat-key context but neither letter is in key → prefer flat spelling
      letter = flatLetter; accPrefix = '_'
    } else {
      // Sharp-key or no-key context → prefer sharp spelling
      letter = sharpLetter; accPrefix = '^'
    }
  }

  const lower = letter.toLowerCase()
  if (oct >= 6)  return `${accPrefix}${lower}''`
  if (oct === 5) return `${accPrefix}${lower}'`
  if (oct === 4) return `${accPrefix}${lower}`
  if (oct === 3) return `${accPrefix}${letter}`
  if (oct === 2) return `${accPrefix}${letter},`
  return `${accPrefix}${letter},,`
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
  sharps: Set<string>,
  flats:  Set<string>,
): NoteEvent[] {
  const events: NoteEvent[] = []

  function extendLast(dur: number) {
    if (events.length > 0) {
      events[events.length - 1].duration += dur
    } else {
      events.push({ note: 'z', duration: dur })
    }
  }

  function addNote(note: string, dur: number) {
    events.push({ note, duration: dur })
  }

  // Strip Amen (anything after the last ||), then treat remaining || as single bars
  let cleaned = raw.trim()
  const lastDbl = cleaned.lastIndexOf('||')
  if (lastDbl >= 0) cleaned = cleaned.slice(0, lastDbl)
  cleaned = cleaned.replace(/\|\|/g, '|').replace(/\|$/, '').trim()

  // Split on | to get cells
  const cells = cleaned.split(/\|+/).map(c => c.trim()).filter(Boolean)

  for (const cell of cells) {
    // Split on : to get beat slots; filter empties (handles leading : in pickup)
    const slots = cell.split(':').map(s => s.trim()).filter(Boolean)

    for (const slot of slots) {
      // Check for dot subdivision: "d.r" or "—.m" → split into half-beat tokens
      const rawSubs = slot.split('.')
      const subTokens = rawSubs.map((s, i) => {
        let tok = s.trim()
        // Strip comma that's a rhythmic separator artifact (e.g. "m.,r" → ["m", ",r"])
        // The printer formats dotted subdivisions as "m.,r"; after split('.'), the second
        // token gets a spurious leading comma. Only strip for i > 0 (never the first token).
        if (i > 0 && tok.startsWith(',')) tok = tok.slice(1).trim()
        return tok
      }).filter(Boolean)
      const halfBeat = subTokens.length > 1
      const unitDur = halfBeat ? 1 : 2 // L:1/8: full beat=2, half beat=1

      for (const token of subTokens) {
        if (isHold(token)) {
          extendLast(unitDur)
        } else {
          const parsed = parseSyllable(token)
          if (!parsed) {
            warnings.push(`Unrecognised token: "${token}" in "${raw.slice(0, 60)}"`)
            addNote('z', unitDur)
            continue
          }
          const semitone = tonic + (DEGREE[parsed.syllable] ?? 0) + parsed.octaveShift * 12
          addNote(semitoneToAbcNote(semitone, sharps, flats), unitDur)
        }
      }
    }
  }

  return events
}

/**
 * Render NoteEvent[] to an ABC note string with bar lines.
 *
 * Tracks within-bar accidentals so that:
 *   1. After ^X or _X, a plain X gets '=' to cancel the carry-over.
 *   2. After =X (natural override), the next X that should be key-sharp/flat
 *      gets an explicit ^ or _ to restore the key convention (required because
 *      ABC's carry-over keeps '=' active until the bar ends).
 */
function eventsToAbcStr(
  events: NoteEvent[],
  barUnits: number,
  sharps: Set<string>,
  flats:  Set<string>,
): string {
  // Map pitch string → active accidental in current bar ('^', '_', '=', or absent)
  const barAcc = new Map<string, string>()

  // Uppercase the pitch letter for key-table lookup (pitch may be 'g', "g'", 'G,', etc.)
  function keyModFor(pitch: string): string {
    const upper = pitch[0].toUpperCase()
    if (sharps.has(upper)) return '^'
    if (flats.has(upper))  return '_'
    return ''
  }

  let result = ''
  let accumulated = 0

  for (const e of events) {
    let note = e.note

    // Parse optional accidental prefix
    let acc = ''
    let pitch = note
    if (note[0] === '^' || note[0] === '_' || note[0] === '=') {
      acc = note[0]; pitch = note.slice(1)
    }

    if (pitch && pitch !== 'z') {
      const prevAcc = barAcc.get(pitch)
      const keyMod  = keyModFor(pitch)

      if (acc) {
        barAcc.set(pitch, acc)
        // output as-is
      } else if (prevAcc === '^' || prevAcc === '_') {
        // Chromatically altered earlier → add natural sign to cancel carry-over
        note = '=' + pitch
        barAcc.set(pitch, '=')
      } else if (prevAcc === '=' && keyMod === '^') {
        // Natural was explicit; now this note should be key-sharp again → restore it
        note = '^' + pitch
        barAcc.set(pitch, '^')
      } else if (prevAcc === '=' && keyMod === '_') {
        // Natural was explicit; now this note should be key-flat again → restore it
        note = '_' + pitch
        barAcc.set(pitch, '_')
      }
      // else: no prior accidental in this bar — output as-is
    }

    result += note + (e.duration === 1 ? '' : `${e.duration}`)
    accumulated += e.duration
    if (accumulated >= barUnits) {
      result += ' | '
      accumulated = 0
      barAcc.clear()
    }
  }

  return result.replace(/\s*\|\s*$/, '').trim()
}

function meterToBarUnits(time: string): number {
  if (time === 'C' || time === '4/4') return 8  // 4 beats × 2 units/beat
  if (time === '3/4') return 6                   // 3 beats × 2 units/beat
  if (time === '6/8') return 6                   // 6 eighth notes
  if (time === '2/4') return 4                   // 2 beats × 2 units/beat
  if (time === '3/2') return 12                  // 3 half-notes × 4 units/half
  return 8
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
  const key   = dohToAbcKey(doh, lah, mode)
  const meter = time === '4/4' ? 'C' : time === 'C' ? 'C' : time
  const { sharps, flats } = keyAccidentalsForDoh(doh)

  const barUnits = meterToBarUnits(meter)
  const sopranoEvents = parseVoiceLine(voices.soprano, tonic, warnings, sharps, flats)
  const altoEvents    = parseVoiceLine(voices.alto,    tonic, warnings, sharps, flats)
  const tenorEvents   = parseVoiceLine(voices.tenor,   tonic, warnings, sharps, flats)
  const bassEvents    = parseVoiceLine(voices.bass,    tonic, warnings, sharps, flats)

  const abc = [
    `X:1`,
    `T:${tuneName}`,
    `M:${meter}`,
    `L:1/8`,
    `Q:1/4=76`,
    `V:1 clef=treble name="Soprano"`,
    `V:2 clef=treble name="Alto"`,
    `V:3 clef=treble name="Tenor"`,
    `V:4 clef=bass name="Bass"`,
    `K:${key}`,
    `[V:1] ${eventsToAbcStr(sopranoEvents, barUnits, sharps, flats)}`,
    `[V:2] ${eventsToAbcStr(altoEvents,    barUnits, sharps, flats)}`,
    `[V:3] ${eventsToAbcStr(tenorEvents,   barUnits, sharps, flats)}`,
    `[V:4] ${eventsToAbcStr(bassEvents,    barUnits, sharps, flats)}`,
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
  const key   = dohToAbcKey(doh, lah, mode)
  const meter = time === '4/4' ? 'C' : time === 'C' ? 'C' : time
  const { sharps, flats } = keyAccidentalsForDoh(doh)
  const barUnits = meterToBarUnits(meter)

  const events = parseVoiceLine(raw, tonic, warnings, sharps, flats)
  const musicStr = eventsToAbcStr(events, barUnits, sharps, flats)

  // bars: group events into cells for display only
  const bars: string[][] = []
  let current: string[] = []
  let cellDur = 0
  const cellSize = meter === 'C' ? 4 : 6

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
