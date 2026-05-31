/**
 * Pure helper for /dev/melisma-editor: parse w-lines embedded in a saved ABC
 * back into editor state (which notes are melisma continuations, what
 * syllables were assigned per phrase). Lets the editor pre-populate its
 * underline + syllable state when reopening a tune for re-editing.
 *
 * Token model (matches buildEmbeddedWline output):
 *   - `_`  → melisma continuation; the corresponding note IS underlined
 *   - else → a syllable consumed by that note
 *
 * Robust to: multiple w: lines per phrase (concatenated), leading/trailing
 * whitespace, missing w: lines (that phrase contributes 0 syllables and no
 * underline marks).
 */
import { extractSopranoTokensWithPos } from './abc-soprano-tokens'

export interface ParsedSavedWLines {
  /** Note global indices flagged as melisma continuations. */
  underlinedGlobalIndices: number[]
  /** One entry per phrase (in PHRASE_BREAK order). Each entry is the list of
   *  syllables consumed by that phrase (melisma `_` tokens excluded). */
  syllablesPerPhrase: string[][]
}

export function parseSavedWLines(abc: string): ParsedSavedWLines | null {
  if (!/^\s*w:/m.test(abc)) return null

  const tokens = extractSopranoTokensWithPos(abc)
  if (tokens.length === 0) return null

  // Collect w-line text per phrase index.
  const wByPhrase = new Map<number, string>()
  let phraseIdx = 0
  let inMusic = false
  for (const raw of abc.split('\n')) {
    const t = raw.trim()
    if (/^K:/.test(t)) { inMusic = true; continue }
    if (!inMusic) continue
    if (/^%\s*PHRASE_BREAK\s*$/.test(t)) { phraseIdx++; continue }
    if (/^w:/.test(t)) {
      const content = t.replace(/^w:\s*/, '')
      const prev = wByPhrase.get(phraseIdx)
      wByPhrase.set(phraseIdx, prev ? `${prev} ${content}` : content)
    }
  }
  if (wByPhrase.size === 0) return null

  // Group tokens by phrase, preserving order.
  const tokensByPhrase = new Map<number, typeof tokens>()
  for (const tok of tokens) {
    const arr = tokensByPhrase.get(tok.phraseIdx) ?? []
    arr.push(tok)
    tokensByPhrase.set(tok.phraseIdx, arr)
  }

  const underlinedGlobalIndices: number[] = []
  // Walk phrases in numeric order so syllablesPerPhrase index matches phrase index.
  const phraseIndices = Array.from(tokensByPhrase.keys()).sort((a, b) => a - b)
  const syllablesPerPhrase: string[][] = []
  for (const pIdx of phraseIndices) {
    const pTokens = tokensByPhrase.get(pIdx)!
    const wLine = wByPhrase.get(pIdx)
    if (!wLine) {
      syllablesPerPhrase.push([])
      continue
    }
    const wTokens = wLine.trim().split(/\s+/).filter(Boolean)
    const sylls: string[] = []
    for (let i = 0; i < pTokens.length; i++) {
      const wTok = wTokens[i]
      if (wTok === undefined) break
      if (wTok === '_') {
        underlinedGlobalIndices.push(pTokens[i].globalIdx)
      } else {
        sylls.push(wTok)
      }
    }
    syllablesPerPhrase.push(sylls)
  }

  return { underlinedGlobalIndices, syllablesPerPhrase }
}
