/**
 * Structural ABC body edits used by /dev/melisma-editor:
 *
 *   - insertTokenAtPhraseEnd: append a new soprano note at the end of a phrase
 *   - deleteTokenAt: remove a soprano note in place
 *   - moveTokenBefore: drag a soprano note to a new position (intra- or cross-phrase)
 *   - moveTokenToPhraseEnd: drag a soprano note to the end of a phrase
 *
 * All ops are pure string-splices; positions come from
 * `extractSopranoTokensWithPos`. Whitespace cleanup is conservative (single
 * space between tokens, collapse double spaces on a line).
 */

import { extractSopranoTokensWithPos } from './abc-soprano-tokens'

function collapseSpaces(abc: string): string {
  // Collapse runs of horizontal whitespace into single spaces, line-by-line so
  // we don't accidentally swallow newlines.
  return abc
    .split('\n')
    .map(line => line.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/g, ''))
    .join('\n')
}

export function insertTokenAtPhraseEnd(
  abcBody: string,
  phraseIdx: number,
  newToken: string,
): string {
  const tokens = extractSopranoTokensWithPos(abcBody)
  const phraseTokens = tokens.filter(t => t.phraseIdx === phraseIdx)
  if (phraseTokens.length === 0) {
    // Empty phrase — fallback: append at very end of body.
    return collapseSpaces(abcBody.replace(/\n*$/, '') + '\n' + newToken)
  }
  const last = phraseTokens[phraseTokens.length - 1]
  return collapseSpaces(
    abcBody.slice(0, last.absEnd) + ' ' + newToken + abcBody.slice(last.absEnd),
  )
}

export function deleteTokenAt(
  abcBody: string,
  absStart: number,
  absEnd: number,
): string {
  return collapseSpaces(abcBody.slice(0, absStart) + abcBody.slice(absEnd))
}

/**
 * Move a token from [sourceAbsStart, sourceAbsEnd) to immediately before
 * targetAbsStart (the start of another token). Returns the new ABC body.
 *
 * Handles the cross-position case where target > source (deletion shifts
 * indices left by the token length).
 */
export function moveTokenBefore(
  abcBody: string,
  sourceAbsStart: number,
  sourceAbsEnd: number,
  targetAbsStart: number,
): string {
  if (
    targetAbsStart >= sourceAbsStart &&
    targetAbsStart <= sourceAbsEnd
  ) {
    // No-op: dropping a token onto itself.
    return abcBody
  }
  const tokenStr = abcBody.slice(sourceAbsStart, sourceAbsEnd)
  const removed = abcBody.slice(0, sourceAbsStart) + abcBody.slice(sourceAbsEnd)
  const tokenLen = sourceAbsEnd - sourceAbsStart
  const adjustedTarget = targetAbsStart > sourceAbsEnd
    ? targetAbsStart - tokenLen
    : targetAbsStart
  return collapseSpaces(
    removed.slice(0, adjustedTarget) + tokenStr + ' ' + removed.slice(adjustedTarget),
  )
}

/**
 * Move a token to the end of the given phrase. Equivalent to delete+insert.
 */
export function moveTokenToPhraseEnd(
  abcBody: string,
  sourceAbsStart: number,
  sourceAbsEnd: number,
  targetPhraseIdx: number,
): string {
  const tokenStr = abcBody.slice(sourceAbsStart, sourceAbsEnd)
  const removed = abcBody.slice(0, sourceAbsStart) + abcBody.slice(sourceAbsEnd)
  return insertTokenAtPhraseEnd(removed, targetPhraseIdx, tokenStr)
}
