/**
 * Extract soprano note tokens from an ABC body, in order, across all phrases.
 *
 * Uses the same regex as `countNoteHeads` (`abc-phrases.ts`) so that the
 * extracted token count is guaranteed to match what `buildEmbeddedWline`
 * expects per-phrase.
 *
 * Pure module — safe to import from browser code.
 */

import { splitOnPhraseBreaks } from './abc-phrases'

const NOTE_PATTERN = /[=^_]?[A-Ga-g][',]*\d*/g

function isInfoFieldLine(line: string): boolean {
  return /^[A-Za-z]:/.test(line.trim())
}

function stripNonNoteContent(abc: string): string {
  const musicOnly = abc
    .split('\n')
    .filter((l) => !isInfoFieldLine(l))
    .join(' ')
  return musicOnly
    .replace(/\{[^}]*\}/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/![^!]*!/g, '')
    .replace(/\[[^\]]+\]/g, '') // chord brackets — count separately if needed
}

export interface SopranoToken {
  token: string
  phraseIdx: number
  /** Sequential index across the whole soprano (0-based). */
  globalIdx: number
}

/**
 * Extract soprano note tokens from a phrased ABC body, preserving phrase
 * structure for the editor's per-phrase grid layout.
 */
export function extractSopranoTokens(abcBody: string): SopranoToken[] {
  const split = splitOnPhraseBreaks(abcBody)
  const out: SopranoToken[] = []
  let globalIdx = 0
  for (let pIdx = 0; pIdx < split.phrases.length; pIdx++) {
    const stripped = stripNonNoteContent(split.phrases[pIdx])
    const matches = stripped.match(NOTE_PATTERN) ?? []
    for (const tok of matches) {
      out.push({ token: tok, phraseIdx: pIdx, globalIdx })
      globalIdx++
    }
  }
  return out
}

// ─── Position-tracking variant (for in-place per-cell editing) ────────────────

export interface SopranoTokenWithPos extends SopranoToken {
  /** Start index (inclusive) in the full ABC body string. */
  absStart: number
  /** End index (exclusive). */
  absEnd: number
}

/**
 * Like extractSopranoTokens, but walks the ABC body line-by-line tracking
 * absolute character offsets. Returns each soprano token together with its
 * `[absStart, absEnd)` range in the original body — enabling per-token
 * splice-based edits.
 *
 * Lines skipped (no notes extracted from them):
 *   - Info fields:  `X:`, `T:`, `M:`, `L:`, `K:`, `Q:`, `w:`, etc.
 *   - Comments:     lines starting with `%` (including `% PHRASE_BREAK`)
 *
 * Phrase index advances each time a `% PHRASE_BREAK` line is encountered
 * after music has started (after the K: line).
 *
 * Chord brackets / inline strings / decorations are masked to spaces before
 * regex matching so position arithmetic stays correct.
 */
export function extractSopranoTokensWithPos(abcBody: string): SopranoTokenWithPos[] {
  const out: SopranoTokenWithPos[] = []
  let cursor = 0
  let phraseIdx = 0
  let globalIdx = 0
  let inMusic = false

  const lines = abcBody.split('\n')
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    // Include the trailing newline length when present (every line except possibly the last).
    const lineLen = line.length + (li < lines.length - 1 ? 1 : 0)
    const trimmed = line.trim()

    if (/^K:/.test(trimmed)) {
      inMusic = true
      cursor += lineLen
      continue
    }
    if (!inMusic) {
      cursor += lineLen
      continue
    }
    if (/^%\s*PHRASE_BREAK\s*$/.test(trimmed)) {
      phraseIdx++
      cursor += lineLen
      continue
    }
    // Skip other info-field lines (incl. w:, % comments).
    if (/^[A-Za-z]:/.test(trimmed) || trimmed.startsWith('%') || trimmed === '') {
      cursor += lineLen
      continue
    }

    // Mask non-note content while preserving offsets so regex positions remain valid.
    const masked = line
      .replace(/\{[^}]*\}/g, m => ' '.repeat(m.length))
      .replace(/"[^"]*"/g, m => ' '.repeat(m.length))
      .replace(/![^!]*!/g, m => ' '.repeat(m.length))
      .replace(/\[[^\]]+\]/g, m => ' '.repeat(m.length))

    const pat = /[=^_]?[A-Ga-g][',]*\d*\/?\d*/g
    let m: RegExpExecArray | null
    while ((m = pat.exec(masked)) !== null) {
      const absStart = cursor + m.index
      const absEnd = absStart + m[0].length
      out.push({ token: m[0], phraseIdx, globalIdx, absStart, absEnd })
      globalIdx++
    }

    cursor += lineLen
  }

  return out
}

/**
 * Splice a replacement token into the ABC body at the given position.
 * Returns the new body. Pure — does not validate the replacement.
 */
export function replaceTokenAt(
  abcBody: string,
  absStart: number,
  absEnd: number,
  newToken: string,
): string {
  return abcBody.slice(0, absStart) + newToken + abcBody.slice(absEnd)
}
