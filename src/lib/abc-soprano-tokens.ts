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
