/**
 * Splits a syllabified `w:` line payload across N sub-staves, weighting each
 * chunk by that sub-staff's actual note-head count instead of an equal token
 * split. This restores strict 1:1 syllable-to-note alignment when a phrase is
 * subdivided unevenly (e.g. mobile sub-division of a phrase ending in a long
 * held note in its own measure).
 *
 * - Tokens are consumed cumulatively, in order: chunk 0 gets the first
 *   `noteCounts[0]` tokens, chunk 1 gets the next `noteCounts[1]`, etc.
 * - The LAST chunk absorbs any remaining tokens so no syllable is ever
 *   dropped when the token count exceeds sum(noteCounts).
 * - If tokens run out before reaching a chunk, that chunk (and any after it)
 *   is an empty string — never a negative slice.
 */
export function splitWLineByNoteCounts(
  payload: string,
  noteCounts: number[],
): string[] {
  const tokens = payload.trim() === '' ? [] : payload.trim().split(/\s+/)
  const chunks: string[] = []
  let cursor = 0

  for (let i = 0; i < noteCounts.length; i++) {
    const isLast = i === noteCounts.length - 1
    if (isLast) {
      chunks.push(tokens.slice(cursor).join(' '))
      cursor = tokens.length
      continue
    }
    const count = Math.max(0, noteCounts[i])
    const end = Math.min(cursor + count, tokens.length)
    chunks.push(tokens.slice(cursor, end).join(' '))
    cursor = end
  }

  return chunks
}
