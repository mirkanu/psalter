/**
 * V3 approach — three clean stages:
 *   Stage 1: Claude vision transcribes the raw sol-fa text verbatim (no musical interpretation)
 *   Stage 2: Parser converts sol-fa text → structured notes with scale degrees + durations
 *   Stage 3: Mapper applies DOH= key to get absolute pitches → ABC notation
 *
 * The key insight: tonic sol-fa is printed text. Claude reads text well.
 * All musical logic lives in deterministic TypeScript, not in the LLM prompt.
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'node:fs'
import sharp from 'sharp'

const client = new Anthropic({ apiKey: process.env.PSALTER_ANTHROPIC_API_KEY })

// ─── Stage 1 prompt: pure transcription, no interpretation ───────────────────

const TRANSCRIPTION_PROMPT = `This is a page from a tonic sol-fa (solfège) psalter.

Your job is ONLY to read text — do not interpret, convert, or analyse the music.

1. Read the key line near the top. It looks like: "DOH = G." or "LAH = A.  DOH = C."
   Extract the DOH value (e.g. "C", "G", "D", "F", "Bb").

2. Read the TIME SIGNATURE if present. It may say "C" (common time = 4/4), or show a number.
   If absent, assume "C".

3. The score has 4 voices stacked in a bracket { }. The SOPRANO is the TOP line.
   Transcribe EXACTLY what the soprano line says, left to right, including all symbols:
   - Note syllables: d  r  m  f  s  l  t  (and chromatics: de re me fe se le te)
   - Octave marks: apostrophe after = high (d'), comma before = low (,l or l,)
   - Rhythm separators: colon (:)
   - Holds/continuations: dash (—) or (-)
   - Barlines: pipe (|) or double pipe (||)
   - If a note is held across two positions write it once with the hold marker

   Write the soprano line as plain text exactly as printed, e.g.:
   :l | l :t | d' :t | l :l | se :d' | m' :r' | d' :t | d' :— | — ||

Output as JSON:
{
  "doh": "C",
  "time": "C",
  "soprano": ":l | l :t | d' :t | l :l | se :d' | m' :r' | d' :t | d' :— | — ||"
}

Return ONLY the JSON object. Do not add any explanation.`

// ─── Scale degree table ───────────────────────────────────────────────────────
// Each key maps doh to a semitone offset from C4.
// Positive = above C4, negative = below.
const DOH_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  'F#': 6, 'C#': 1, 'G#': 8, 'D#': 3, 'A#': 10,
  Bb: -2, Eb: -1, Ab: -4, Db: -5, Gb: -6,
}

// Scale degree semitone offsets from tonic (major scale)
const DEGREE: Record<string, number> = {
  d: 0, r: 2, m: 4, f: 5, s: 7, l: 9, t: 11,
  // Chromatic alterations (Curwen convention)
  de: 1, re: 3, me: 3, fe: 6, se: 8, le: 8, te: 10,
}

function semitoneToAbcNote(semitone: number): string {
  // semitone is absolute from C4 = 0
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  // Normalise to 0-11 range, track octave
  let oct = 4
  let s = semitone
  while (s < 0)  { s += 12; oct-- }
  while (s >= 12){ s -= 12; oct++ }
  const name = NOTE_NAMES[s]
  const letter = name[0]
  const sharp = name.length > 1 ? '^' : ''

  if (oct >= 6)  return `${sharp}${letter.toLowerCase()}''`
  if (oct === 5) return `${sharp}${letter.toLowerCase()}'`
  if (oct === 4) return `${sharp}${letter.toLowerCase()}`
  if (oct === 3) return `${sharp}${letter}`
  return `${sharp}${letter},`
}

// ─── Stage 2+3: parse sol-fa text → ABC ──────────────────────────────────────

interface SolFaNote { syllable: string; octaveShift: number; hold: boolean }

function parseSyllable(token: string): SolFaNote | null {
  // token examples: d  d'  ,l  l,  se  se'  d'  m'  —  -
  if (token === '—' || token === '-') return { syllable: 'hold', octaveShift: 0, hold: true }

  let t = token.trim()
  let octaveShift = 0

  // Leading comma = lower octave
  while (t.startsWith(',')) { octaveShift--; t = t.slice(1) }
  // Trailing comma = lower octave (alternate notation)
  while (t.endsWith(',')) { octaveShift--; t = t.slice(0, -1) }
  // Trailing apostrophe = upper octave
  while (t.endsWith("'")) { octaveShift++; t = t.slice(0, -1) }

  const syllable = t.toLowerCase()
  if (!DEGREE.hasOwnProperty(syllable)) return null
  return { syllable, octaveShift, hold: false }
}

export interface ParsedBar { abcNotes: string[] }

export function solFaToAbc(raw: string, doh: string, time: string, tuneName: string): {
  abc: string
  bars: string[][]
  warnings: string[]
} {
  const warnings: string[] = []
  const dohSemitone = DOH_SEMITONES[doh]
  if (dohSemitone === undefined) {
    warnings.push(`Unknown DOH key: ${doh}, defaulting to C`)
  }
  const tonic = dohSemitone ?? 0

  // Parse: split into bars, then each bar into beat-pairs around ':'
  const barStrings = raw.split(/\|+/).map(b => b.trim()).filter(Boolean)

  // Remove trailing || marker
  const cleanBars = barStrings.filter(b => b !== '||' && b !== '|')

  const bars: string[][] = []

  for (const barStr of cleanBars) {
    // Each bar contains beat positions separated by ':'
    // e.g. "l :t" = beat1=l beat2=t, "d' :—" = beat1=d' beat2=hold
    const beats = barStr.split(':').map(b => b.trim()).filter(Boolean)
    const barNotes: string[] = []
    let lastNote = 'z'

    for (const beat of beats) {
      // A beat may contain multiple notes if it's a quaver pair e.g. "l.t" or just one
      const tokens = beat.split(/\s+/).filter(Boolean)
      for (const token of tokens) {
        const parsed = parseSyllable(token)
        if (!parsed) { warnings.push(`Unrecognised token: ${token}`); continue }

        if (parsed.hold) {
          // Hold = repeat last note with same duration
          barNotes.push(lastNote.replace(/[\d/]+$/, '') + '2')
          // Remove the previous note's default length since it's now half
          if (barNotes.length >= 2) {
            const prev = barNotes[barNotes.length - 2]
            barNotes[barNotes.length - 2] = prev.endsWith('2') ? prev.slice(0, -1) : prev
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

  const meter = time === '4/4' ? 'C' : time
  const musicLine = bars.map(b => b.join('')).join('|')

  const abc = [
    `X:1`,
    `T:${tuneName}`,
    `M:${meter}`,
    `L:1/4`,
    `K:C`,
    musicLine,
  ].join('\n')

  return { abc, bars, warnings }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface TranscriptionResult {
  doh: string
  time: string
  soprano: string
}

export async function extractTuneV3(tuneName: string, imagePath: string): Promise<{
  transcription: TranscriptionResult
  abc: string
  bars: string[][]
  warnings: string[]
  rawResponse: string
}> {
  const rawFile = fs.readFileSync(imagePath)
  const imageBuffer: Buffer = rawFile.length > 4 * 1024 * 1024
    ? await sharp(rawFile).resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer() as Buffer
    : Buffer.from(rawFile)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBuffer.toString('base64') } },
        { type: 'text', text: TRANSCRIPTION_PROMPT },
      ],
    }],
  })

  const rawResponse = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON in Claude response:\n${rawResponse.slice(0, 500)}`)

  const transcription: TranscriptionResult = JSON.parse(jsonMatch[0])
  const { abc, bars, warnings } = solFaToAbc(
    transcription.soprano,
    transcription.doh,
    transcription.time,
    tuneName,
  )

  return { transcription, abc, bars, warnings, rawResponse }
}

// Keep old export name pointing to v3 so the API route doesn't need changes
export const extractTuneV2 = extractTuneV3
export type ExtractedTune = TranscriptionResult

// Stage 1 only — returns raw OCR text without ABC conversion
export async function transcribeOnly(tuneName: string, imagePath: string): Promise<{
  doh: string
  time: string
  soprano: string
  rawResponse: string
}> {
  const rawFile = fs.readFileSync(imagePath)
  const imageBuffer: Buffer = rawFile.length > 4 * 1024 * 1024
    ? await sharp(rawFile).resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer() as Buffer
    : Buffer.from(rawFile)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBuffer.toString('base64') } },
        { type: 'text', text: TRANSCRIPTION_PROMPT },
      ],
    }],
  })

  const rawResponse = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON in Claude response:\n${rawResponse.slice(0, 500)}`)

  const parsed = JSON.parse(jsonMatch[0]) as TranscriptionResult
  return { doh: parsed.doh, time: parsed.time, soprano: parsed.soprano, rawResponse }
}

// ─── Staff notation → ABC (direct) ───────────────────────────────────────────

const STAFF_PROMPT = `This is a page of printed psalm/hymn tune in standard Western staff notation.

Transcribe the SOPRANO voice (the top-line melody, stems pointing up on the upper staff) into ABC notation.

Steps:
1. KEY: read the key signature (number of sharps or flats). Map to ABC K: field (e.g. K:G for 1 sharp, K:D for 2 sharps, K:F for 1 flat, K:Bb for 2 flats, K:C for no accidentals).
2. TIME: read the time signature. Map to ABC M: field (e.g. M:4/4, M:3/4, M:2/2).
3. UNIT: use L:1/8 (eighth note = 1).
4. NOTES: transcribe only the soprano line, bar by bar. Use lowercase for octave 4 (middle C = c), uppercase for octave 3, add ' for octave 5 (e.g. d').
5. ACCIDENTALS: ^ = sharp, _ = flat, = = natural.
6. LENGTHS: no suffix = eighth, 2 = quarter, 3 = dotted quarter, 4 = half, 6 = dotted half, 8 = whole.
7. BARLINES: | between bars. Use || at the end.
8. TIES: - between tied notes.
9. REPEATS: [| and |] for repeat signs if present.
10. If there is a pickup bar (anacrusis), include it before the first |.

Output ONLY the ABC block, no explanation:
X:1
T:{tune name}
M:{time}
L:1/8
K:{key}
{notes}`

export async function extractStaffToAbc(tuneName: string, imagePath: string): Promise<{
  abc: string
  rawResponse: string
}> {
  const rawFile = fs.readFileSync(imagePath)
  const imageBuffer: Buffer = rawFile.length > 4 * 1024 * 1024
    ? await sharp(rawFile).resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer() as Buffer
    : Buffer.from(rawFile)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBuffer.toString('base64') } },
        { type: 'text', text: STAFF_PROMPT.replace('{tune name}', tuneName) },
      ],
    }],
  })

  const rawResponse = response.content[0].type === 'text' ? response.content[0].text : ''
  const abcMatch = rawResponse.match(/X:1[\s\S]+/)
  if (!abcMatch) throw new Error(`No ABC in response:\n${rawResponse.slice(0, 400)}`)

  return { abc: abcMatch[0].trim(), rawResponse }
}
