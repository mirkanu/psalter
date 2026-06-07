/**
 * Vision OCR v3 — underline-preserving solfège transcription.
 *
 * Reverses the v2 anti-instruction at `ocr-solfege-v2.ts` line 70 (which tells the
 * model to discard underline data).
 * Returns structured per-token JSON with `underlined` + `conf` flags suitable for
 * downstream consumption by `buildEmbeddedWline` (Plan 02 of phase 04.11).
 *
 * REUSES (does NOT fork) the retry/backoff + image preprocessing helpers from v2:
 *   - `callClaude` (4-retry exponential backoff on 529 overloaded errors)
 *   - `prepareImageBuffer` (sharp resize at 3.5MB threshold, ≤ 5MB API cap)
 *
 * Single source of truth for the underline directive:
 *   `.planning/research/lyric-to-note-alignment.md` §3
 *   `.planning/research/tonic-solfa-notation.md` "Other Symbols"
 *
 * CLAUDE.md hard rule #3 fix lives here: this module is the ONLY Vision-touching
 * code in phase 04.11 that emits canonical melisma data. v2 remains the heuristic
 * fallback path (D-05).
 */

import { callClaude, prepareImageBuffer } from './ocr-solfege-v2'
import { splitOnPhraseBreaks, countNoteHeads } from './abc-phrases'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MelismaTokenEntry {
  /** Solfège letter token with any octave markers (e.g. "m", "d'", "s_1", "te"). */
  tok: string
  /** Relative duration: 1 = quarter, 2 = half, 4 = whole, 0.5 = eighth. */
  dur: number
  /** True iff an underline runs directly beneath this note letter in print. */
  underlined: boolean
  /** Vision confidence 0.0–1.0 for the (tok, underlined) pair on this token. */
  conf: number
}

export interface MelismaTranscriptionResult {
  doh: string
  time: string
  soprano: MelismaTokenEntry[]
  alto?: MelismaTokenEntry[]
  tenor?: MelismaTokenEntry[]
  bass?: MelismaTokenEntry[]
  /** Raw model text — preserved for review JSONs and audit trails. */
  raw: string
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

/**
 * Underline-preserving transcription prompt for Claude Haiku 4.5.
 *
 * Specific literal substrings are asserted by `ocr-melisma-v3.test.ts`:
 *   - "PRESERVE every underline"
 *   - "\"underlined\":"
 *   - "Dot subdivisions BETWEEN notes"
 *   - "Em-dash BETWEEN notes"
 *   - "Subscript digit BELOW a letter"
 *   - MUST NOT contain the v2 anti-instruction directing the model to discard underlines.
 */
export const TRANSCRIPTION_PROMPT_V3 = `This is a page from a Scottish Psalter printed in tonic sol-fa (Curwen) notation.

Your job: read every note accurately, including which notes are underlined.

━━━ STEP 1: HEADER ━━━
Find the key line near the top of the page:
  • Major key:  "DOH = G"          → set doh="G", omit lah and mode fields
  • Minor key:  "LAH = D  DOH = F" → set doh="F", lah="D", mode="minor"
Find the time if shown (e.g. "C" for common time, "3" for triple). Default: "C".

━━━ STEP 2: FOUR VOICES ━━━
There are typically 4 voice lines inside a curly bracket {, stacked top to bottom:
  1. Soprano  (top)
  2. Alto
  3. Tenor
  4. Bass     (bottom)

Transcribe ALL voices left to right exactly as printed. Each voice becomes a JSON array of
per-note entries (see output spec below).

━━━ PITCH SYLLABLES (the value of "tok") ━━━
Normal syllables:   d  r  m  f  s  l  t
Upper octave:       apostrophe after the letter → d'  r'  m'  s'  l'
Lower octave:       subscript numeral printed BELOW the letter → write as _1 suffix
                    e.g. s with subscript 1 → s_1,  d with subscript 1 → d_1,  t with subscript 1 → t_1
                    Two octaves below (rare) → _2 suffix: d_2
Sharp alterations (add 'e' vowel):   de  re  fe  se  le
Flat alterations  (add 'a' vowel):   ta  la  ba  ma  ra   (ta = flat-7th, most common)
Combined:  se_1  fe_1  ta_1  d'  (chromatic + octave together)

CRITICAL: subscript numerals are printed smaller and BELOW the letter. Do not miss them —
they are extremely common in alto, tenor, and bass voices.

━━━ RHYTHM (the value of "dur") ━━━
The printed cell structure tells you rhythm. Within a cell:
  •  ":"   separates beats:           "d :m"     = d on beat 1, m on beat 2 (each dur ≈ 1)
  •  "."   half-beat subdivision:     "d.r :m"   = d and r share beat 1 (each dur ≈ 0.5), m on beat 2
  •  "—"   em-dash hold/continue:     "d :—"     = d held for 2 beats (dur ≈ 2)
                                       "— :d"     = previous note still held, then d (assign extra dur to the held note)
                                       "d :—.r"   = d dotted-half-cell (dur ≈ 1.5), r on second half (dur ≈ 0.5)
  •  "-"   hyphen — same as em-dash
  •  "|"   cell divider (end-of-measure)
  •  "||"  end of phrase or tune
Pickup: ":s" before the first | = one pickup beat (not a full bar).

Estimate "dur" as best you can: quarter=1, eighth=0.5, half=2, dotted-quarter=1.5, whole=4.

━━━ UNDERLINES — THE KEY DIFFERENCE FROM SIMPLE TRANSCRIPTION ━━━
In tonic sol-fa, an UNDERLINE PRINTED BENEATH a note letter marks that note as a passing
note / melisma continuation — it is sung as a continuation of the previous syllable's vowel
rather than receiving its own syllable.

PRESERVE every underline. Mark each underlined note token with \`"underlined": true\`.

DISTINGUISH the underline from three visual lookalikes:
- Dot subdivisions BETWEEN notes (e.g. \`d.r\`): a rhythm subdivision — NOT a melisma marker.
- Em-dash BETWEEN notes (\`—\`): a sustained hold — NOT a melisma marker.
- Subscript digit BELOW a letter (e.g. \`d₁\`): a lower-octave indicator — NOT a melisma marker.

Only a horizontal line DIRECTLY BENEATH the note letter marks melisma. The line may span
2, 3, or more consecutive notes — mark EVERY underlined note (not just the first) as
\`"underlined": true\`.

If you are uncertain whether a note is underlined, lower its "conf" value rather than
guessing — downstream code uses conf to triage low-confidence calls.

━━━ OTHER ━━━
Amen: a 2-chord section after the final ||. Include it verbatim if present.
Multi-page tunes: images are provided in page order (Image 1 first, Image 2 second). Transcribe
Image 1 completely — every line from top to bottom — before moving to Image 2. Never interleave or skip lines.

━━━ OUTPUT ━━━
Return ONLY this JSON object (no markdown, no prose):
{
  "doh": "G",
  "time": "C",
  "soprano": [
    { "tok": "s",   "dur": 1,   "underlined": false, "conf": 0.98 },
    { "tok": "d'",  "dur": 2,   "underlined": false, "conf": 0.95 },
    { "tok": "t",   "dur": 0.5, "underlined": true,  "conf": 0.90 },
    { "tok": "l",   "dur": 0.5, "underlined": true,  "conf": 0.90 }
  ],
  "alto":    [ ... ],
  "tenor":   [ ... ],
  "bass":    [ ... ]
}

For minor keys also include: "lah": "D", "mode": "minor"

Reminders:
- Subscript ₁ in print → _1 in your output. Critical for bass and tenor.
- Underlines: mark them — they are the whole point of this transcription pass.
- Em-dashes and dot-subdivisions are RHYTHM, not melisma. Do not confuse.`

// ─── JSON extraction ──────────────────────────────────────────────────────────

/**
 * Extract a MelismaTranscriptionResult from a raw Claude response.
 *
 * Mirrors v2's pattern (`ocr-solfege-v2.ts` lines 155-157): finds the first
 * `{...}` block via a permissive regex, JSON-parses it, and normalises per-voice
 * arrays so each token entry has a `conf` field (default 0 for low-confidence
 * gating in Plan 04).
 *
 * Throws a descriptive error if no JSON object is present.
 */
export function extractMelismaJson(raw: string): MelismaTranscriptionResult {
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) throw new Error(`No JSON in Claude response:\n${raw.slice(0, 500)}`)

  const parsed = JSON.parse(m[0]) as Partial<MelismaTranscriptionResult>

  const normaliseVoice = (arr: MelismaTokenEntry[] | undefined): MelismaTokenEntry[] | undefined => {
    if (!Array.isArray(arr)) return undefined
    return arr.map(entry => ({
      tok: entry.tok,
      dur: entry.dur,
      underlined: Boolean(entry.underlined),
      conf: typeof entry.conf === 'number' ? entry.conf : 0,
    }))
  }

  const soprano = normaliseVoice(parsed.soprano) ?? []

  return {
    doh: parsed.doh ?? 'C',
    time: parsed.time ?? 'C',
    soprano,
    alto: normaliseVoice(parsed.alto),
    tenor: normaliseVoice(parsed.tenor),
    bass: normaliseVoice(parsed.bass),
    raw,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * OCR one or more solfège JPG pages → underline-preserving structured JSON.
 *
 * Pipeline:
 *   1. Resize each JPG via v2's `prepareImageBuffer` (sharp, 3.5MB threshold).
 *   2. Call Claude Haiku 4.5 via v2's `callClaude` (4-retry backoff on 529).
 *      maxTokens = 4000 per RESEARCH §Pattern 1.
 *   3. Extract the JSON block and normalise per-token `conf` defaults.
 */
export async function ocrMelismaV3(imagePaths: string[]): Promise<MelismaTranscriptionResult> {
  const buffers = await Promise.all(imagePaths.map(prepareImageBuffer))
  const model = process.env.OCR_MELISMA_MODEL || 'claude-sonnet-4-6'
  const raw = await callClaude(buffers, TRANSCRIPTION_PROMPT_V3, 8000, model)
  return extractMelismaJson(raw)
}

// ─── Pass-2: underline classification using existing DB transcription ─────────

/**
 * Pass-2 prompt: identify underlines only, given a known soprano note count.
 *
 * The score's pitches and rhythm are already in the DB (from the v2 pipeline).
 * Vision only needs to look at the image and answer one question per soprano note:
 * is there a horizontal underline directly beneath the note letter?
 *
 * Returning fixed-length arrays lets us validate the response length matches the
 * DB's note count — mismatches surface as a structured error rather than silent
 * drift through buildEmbeddedWline.
 */
export function buildUnderlinePass2Prompt(sopranoCount: number): string {
  return `This is a Scottish Psalter page in tonic sol-fa (Curwen) notation.

Focus on the SOPRANO voice — the TOP voice line inside the curly bracket "{".

We already have an accurate transcription of the pitches and rhythm from another source.
Your ONLY job is to identify which soprano notes are UNDERLINED in the print.

In tonic sol-fa, a horizontal underline printed DIRECTLY BENEATH a note letter marks
that note as a melisma continuation — sung on the previous syllable's vowel. The
underline often spans 2, 3, or more consecutive notes; mark EVERY underlined note.

The soprano voice contains exactly ${sopranoCount} note tokens, left to right across
all phrases / lines (read left-to-right, top-to-bottom across pages if multi-page).

DO NOT confuse the underline with these visual lookalikes:
- Em-dash "—" or hyphen "-" BETWEEN notes (rhythm hold, NOT melisma)
- Dot "." BETWEEN notes (rhythm subdivision, NOT melisma)
- Subscript numeral (₁, ₂) BELOW a note letter (lower-octave marker, NOT melisma)
- Bottom edge of the curly bracket "{"
- Print artifacts, page edges, or descenders from text above

Only a horizontal stroke DIRECTLY BENEATH a note letter (often spanning multiple
adjacent notes) is a melisma underline.

Return ONLY this JSON object — no prose, no markdown:
{
  "soprano": [false, true, true, false, ...]
}

The "soprano" array MUST contain exactly ${sopranoCount} boolean entries, one per
soprano note in order. If you genuinely cannot determine a note, return false (the
heuristic fallback will fire downstream).`
}

/**
 * Count soprano note-heads in the existing ABC body (across all phrases).
 */
export function countSopranoNotesInAbc(existingAbc: string): number {
  const split = splitOnPhraseBreaks(existingAbc)
  return split.phrases.reduce((sum, p) => sum + countNoteHeads(p), 0)
}

/**
 * Pass-2 OCR: only classifies underlines, using the DB's existing ABC for ground-truth
 * note count. Returns a MelismaTranscriptionResult with placeholder `tok`/`dur` values
 * (buildEmbeddedWline only uses these in warning messages — the underline flags are
 * what actually drive the algorithm).
 *
 * Throws if Vision returns the wrong number of underline flags — that mismatch
 * surfaces as a clear, actionable failure rather than silent drift.
 */
export async function ocrMelismaV4Pass2(
  imagePaths: string[],
  existingAbc: string,
): Promise<MelismaTranscriptionResult> {
  const sopranoCount = countSopranoNotesInAbc(existingAbc)
  if (sopranoCount === 0) {
    throw new Error('Pass-2: existing ABC has zero soprano notes — cannot classify underlines')
  }

  const buffers = await Promise.all(imagePaths.map(prepareImageBuffer))
  const model = process.env.OCR_MELISMA_MODEL || 'claude-sonnet-4-6'
  const prompt = buildUnderlinePass2Prompt(sopranoCount)
  const raw = await callClaude(buffers, prompt, 4000, model)

  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) throw new Error(`Pass-2: no JSON in response:\n${raw.slice(0, 500)}`)
  const parsed = JSON.parse(m[0]) as { soprano?: unknown }
  if (!Array.isArray(parsed.soprano)) {
    throw new Error(`Pass-2: response has no "soprano" array. Raw:\n${raw.slice(0, 500)}`)
  }
  if (parsed.soprano.length !== sopranoCount) {
    throw new Error(
      `Pass-2: expected ${sopranoCount} underline flags, got ${parsed.soprano.length}`,
    )
  }

  const soprano: MelismaTokenEntry[] = (parsed.soprano as unknown[]).map((u) => ({
    tok: '?', // placeholder — buildEmbeddedWline only uses tok in warning text
    dur: 1, // placeholder
    underlined: Boolean(u),
    conf: 0.9, // synthesized; pass-2 doesn't surface per-note confidence
  }))

  return {
    doh: 'C',
    time: 'C',
    soprano,
    raw,
  }
}
