/**
 * Claude Vision → solfège transcription → ABC conversion pipeline.
 *
 * Stage 1: Claude vision reads the printed solfège image and outputs raw text
 *          (doh, time, and all 4 SATB voice lines) as JSON — no musical interpretation.
 * Stage 2: Deterministic parser (solfege-parser.ts) converts the text to ABC notation.
 *
 * The key insight: tonic sol-fa is printed text. Claude reads text well.
 * All musical logic lives in the TypeScript parser, not in the LLM prompt.
 *
 * Full notation reference: .planning/research/tonic-solfa-notation.md
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'node:fs'
import sharp from 'sharp'
import { solFaToAbc, solFaToAbcMultiVoice } from './solfege-parser'

const client = new Anthropic({ apiKey: process.env.PSALTER_ANTHROPIC_API_KEY })

// ─── Stage 1 prompt: pure transcription, no interpretation ───────────────────

const TRANSCRIPTION_PROMPT = `This is a page from a Scottish Psalter printed in tonic sol-fa (Curwen) notation.

Your ONLY job is to READ TEXT accurately — do not convert to staff notation or interpret musically.

━━━ STEP 1: HEADER ━━━
Find the key line near the top of the page:
  • Major key:  "DOH = G"          → set doh="G", omit lah and mode fields
  • Minor key:  "LAH = D  DOH = F" → set doh="F", lah="D", mode="minor"
Find the time if shown (e.g. "C" for common time, "3" for triple). Default: "C".

━━━ STEP 2: FOUR VOICES ━━━
There are exactly 4 voice lines inside a curly bracket {, stacked top to bottom:
  1. Soprano  (top)
  2. Alto
  3. Tenor
  4. Bass     (bottom)

Transcribe ALL FOUR voices left to right exactly as printed.

━━━ PITCH SYLLABLES ━━━
Normal syllables:   d  r  m  f  s  l  t
Upper octave:       apostrophe/superscript after the letter → d'  r'  m'  s'  l'
Lower octave:       subscript numeral printed BELOW the letter → write as _1 suffix
                    e.g. s with subscript 1 → s_1,  d with subscript 1 → d_1,  t with subscript 1 → t_1
                    Two octaves below (rare) → _2 suffix: d_2
Sharp alterations (add 'e' vowel):   de  re  fe  se  le
Flat alterations  (add 'a' vowel):   ta  la  ba  ma  ra   (ta = flat-7th, most common)
Combined:  se_1  fe_1  ta_1  d'  (chromatic + octave together)

CRITICAL: subscript numerals are printed smaller and BELOW the letter. Do not miss them —
they are extremely common in alto, tenor, and bass voices.

━━━ RHYTHM SYMBOLS ━━━
|    cell divider (in C time each cell = 2 beats; in 3/4 each cell = 3 beats)
||   end of phrase or tune
:    beat separator within a cell — "d :m" = d on beat 1, m on beat 2
.    half-beat subdivision — "d.r :m" = d+r share beat 1 as two quavers, m on beat 2
—    hold/continue (em dash) — prolongs the preceding note for one beat position
     "d :—"     = d held for 2 beats
     "d :— :—"  = d held for 3 beats (triple time)
     "— :d"     = previous note still held, then d on beat 2
     "d :—.r"   = d dotted (holds into first half of beat 2), r on second half
-    hyphen — same as em dash hold (used in some printings)

Pickup: ":s" before the first | = one pickup beat (not a full bar).

━━━ OTHER ━━━
Underlined notes: passing notes — transcribe the letters, ignore the underline.
Amen: a 2-chord section after the final ||. Include it verbatim.
Multi-page tunes: images are provided in page order (Image 1 first, Image 2 second). Transcribe Image 1 completely — every line from top to bottom — before moving to Image 2. Never interleave or skip lines.

━━━ OUTPUT ━━━
Return ONLY this JSON object (no markdown, no explanation):
{
  "doh": "G",
  "time": "C",
  "soprano": ":s |d' :s |m :l |s :s.f |m :r |d :—|—||",
  "alto":    ":d |m :r |d :f |m :r |d :t_1 |d :—|—||",
  "tenor":   ":m |s :s |s :l |s :t |l :s |m :—|—||",
  "bass":    ":d |d :t_1 |l_1 :f_1 |m_1 :r |d :—|—||"
}

For minor keys also include: "lah": "D", "mode": "minor"

Remember: subscript ₁ in print → _1 in your output. This is critical for bass and tenor voices.`

// ─── Shared image preparation ─────────────────────────────────────────────────

export async function prepareImageBuffer(imagePath: string): Promise<Buffer> {
  const rawFile = fs.readFileSync(imagePath)
  // Base64 inflates by ~4/3, so raw threshold = 5MB API limit × 3/4 = 3.75MB → use 3.5MB to be safe
  return rawFile.length > 3.5 * 1024 * 1024
    ? await sharp(rawFile).resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer() as Buffer
    : Buffer.from(rawFile)
}

export async function callClaude(imageBuffers: Buffer | Buffer[], prompt: string, maxTokens = 3000, model = 'claude-haiku-4-5-20251001'): Promise<string> {
  const buffers = Array.isArray(imageBuffers) ? imageBuffers : [imageBuffers]
  const imageContent = buffers.map(buf => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: buf.toString('base64') },
  }))

  const MAX_RETRIES = 4
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [{
          role: 'user',
          content: [...imageContent, { type: 'text' as const, text: prompt }],
        }],
      })
      return response.content[0].type === 'text' ? response.content[0].text : ''
    } catch (err) {
      lastError = err
      const isOverloaded = err instanceof Error && (
        err.message.includes('overloaded_error') ||
        err.message.includes('529') ||
        (err as { status?: number }).status === 529
      )
      if (!isOverloaded || attempt === MAX_RETRIES) throw err
      // Exponential backoff: 5s, 10s, 20s, 40s
      await new Promise(r => setTimeout(r, 5000 * 2 ** attempt))
    }
  }
  throw lastError
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TranscriptionResult {
  doh: string
  time: string
  soprano: string
  alto: string
  tenor: string
  bass: string
  lah?: string
  mode?: string
}

// ─── Stage 1: transcribe solfège image → raw text ────────────────────────────

/** Returns the raw transcribed solfège text (all 4 voices) without converting to ABC. */
export async function transcribeOnly(tuneName: string, imagePaths: string | string[]): Promise<TranscriptionResult & { rawResponse: string }> {
  const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths]
  const imageBuffers = await Promise.all(paths.map(prepareImageBuffer))
  const rawResponse = await callClaude(imageBuffers, TRANSCRIPTION_PROMPT)

  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON in Claude response:\n${rawResponse.slice(0, 500)}`)

  const parsed = JSON.parse(jsonMatch[0]) as TranscriptionResult
  return {
    doh: parsed.doh ?? 'C',
    time: parsed.time ?? 'C',
    soprano: parsed.soprano ?? '',
    alto: parsed.alto ?? '',
    tenor: parsed.tenor ?? '',
    bass: parsed.bass ?? '',
    lah: parsed.lah,
    mode: parsed.mode,
    rawResponse,
  }
}

// ─── Stage 1+2: transcribe + convert to multi-voice ABC ──────────────────────

export async function extractTuneV3(tuneName: string, imagePaths: string | string[]): Promise<{
  transcription: TranscriptionResult
  abc: string
  warnings: string[]
  rawResponse: string
}> {
  const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths]
  const imageBuffers = await Promise.all(paths.map(prepareImageBuffer))
  const rawResponse = await callClaude(imageBuffers, TRANSCRIPTION_PROMPT)

  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON in Claude response:\n${rawResponse.slice(0, 500)}`)

  const transcription = JSON.parse(jsonMatch[0]) as TranscriptionResult

  const { abc, warnings } = solFaToAbcMultiVoice(
    {
      soprano: transcription.soprano ?? '',
      alto:    transcription.alto    ?? '',
      tenor:   transcription.tenor   ?? '',
      bass:    transcription.bass    ?? '',
    },
    transcription.doh ?? 'C',
    transcription.time ?? 'C',
    tuneName,
    transcription.lah,
    transcription.mode,
  )

  return { transcription, abc, warnings, rawResponse }
}

// Keep old export name so callers don't need updating
export const extractTuneV2 = extractTuneV3
export type ExtractedTune = TranscriptionResult

// ─── Staff notation → ABC (direct, soprano only) ─────────────────────────────

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
  const imageBuffer = await prepareImageBuffer(imagePath)
  const rawResponse = await callClaude(imageBuffer, STAFF_PROMPT.replace('{tune name}', tuneName))

  const abcMatch = rawResponse.match(/X:1[\s\S]+/)
  if (!abcMatch) throw new Error(`No ABC in response:\n${rawResponse.slice(0, 400)}`)

  return { abc: abcMatch[0].trim(), rawResponse }
}
