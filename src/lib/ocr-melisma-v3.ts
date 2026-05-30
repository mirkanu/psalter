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
export const TRANSCRIPTION_PROMPT_V3 = `You will be shown one or more JPG scans of a Scottish Psalter tune in tonic sol-fa notation.

For each voice (soprano, alto, tenor, bass — if present), return a JSON array of per-note token entries.

CRITICAL — UNDERLINE PRESERVATION:
The underline beneath a note letter in tonic sol-fa print is the canonical melisma-continuation
marker. It indicates that note is sung as a continuation of the previous syllable's vowel.
PRESERVE every underline. Mark each underlined note token with \`"underlined": true\`.

DISTINGUISH the underline from three visual lookalikes:
- Dot subdivisions BETWEEN notes (e.g. \`f.,r\`): a rhythm subdivision — NOT a melisma marker.
- Em-dash BETWEEN notes (\`—\`): a sustained hold — NOT a melisma marker.
- Subscript digit BELOW a letter (e.g. \`d₁\`): a lower-octave indicator — NOT a melisma marker.

Only the underline DIRECTLY BENEATH a note letter marks melisma continuation.

An underline may span 2, 3, or more consecutive notes. Mark EVERY underlined note (not just
the first) as \`"underlined": true\`.

For each token, supply:
- \`tok\`: the solfège letter with any octave markers (e.g. "m", "f", "d'", "s,", "_1", "te")
- \`dur\`: relative duration (1 = quarter, 2 = half, 4 = whole, 0.5 = eighth — best estimate)
- \`underlined\`: boolean
- \`conf\`: your confidence 0.0–1.0 for the (tok, underlined) pair on this token

Return ONLY a JSON object with this exact shape:
{
  "doh": "<key, e.g. F>",
  "time": "<time signature, e.g. 3>",
  "soprano": [ { "tok": "...", "dur": <num>, "underlined": <bool>, "conf": <num> }, ... ],
  "alto":    [ ... ],   // optional
  "tenor":   [ ... ],   // optional
  "bass":    [ ... ]    // optional
}
Do not include any prose outside the JSON object.`

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
  const raw = await callClaude(buffers, TRANSCRIPTION_PROMPT_V3, 4000)
  return extractMelismaJson(raw)
}
