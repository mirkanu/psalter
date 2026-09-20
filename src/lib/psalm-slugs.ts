/**
 * Converts a displayLabel (like "6a*", "119:1-8") to a URL slug.
 * "6a*" → "6a", "119:1-8" → "119-1-8", "6" → "6"
 */
export function displayLabelToSlug(displayLabel: string): string {
  return displayLabel.replace('*', '').replace(':', '-')
}

/**
 * Converts a URL slug back to a human-readable display title.
 * "119-1-8" → "119:1-8", "70a" → "70a", "70" → "70"
 */
export function slugToDisplayTitle(slug: string): string {
  return slug.replace(/^(\d+)-(\d+-\d+)$/, '$1:$2')
}

export interface ParsedSlug {
  psalmId: number
  versionLetter?: 'a' | 'b'
  verseRange?: string
}

/**
 * Parses a psalm URL slug into its components.
 * "119-1-8" → { psalmId: 119, verseRange: "1-8" }
 * "70a"     → { psalmId: 70, versionLetter: "a" }
 * "70"      → { psalmId: 70 }
 * Returns null for unrecognised formats.
 */
export function parseSlug(slug: string): ParsedSlug | null {
  const ps119 = slug.match(/^(\d+)-(\d+-\d+)$/)
  if (ps119) return { psalmId: parseInt(ps119[1], 10), verseRange: ps119[2] }

  const multi = slug.match(/^(\d+)([ab])$/)
  if (multi) return { psalmId: parseInt(multi[1], 10), versionLetter: multi[2] as 'a' | 'b' }

  const single = slug.match(/^(\d+)$/)
  if (single) return { psalmId: parseInt(single[1], 10) }

  return null
}

/**
 * Derives a display label and slug for each psalm version row.
 * Used in both the listing page and generateStaticParams.
 */
export function deriveVersionSlug(
  psalmId: number,
  psalterNumber: string | null,
  isMultiVersion: boolean,
): string {
  if (!isMultiVersion) return String(psalmId)

  const pn = psalterNumber ?? ''

  // Psalm 119 sections: "119:1-8 (1)" → "119-1-8"
  const rangeMatch = pn.match(/(\d+):(\d+-\d+)/)
  if (rangeMatch) return `${rangeMatch[1]}-${rangeMatch[2]}`

  // Other psalms: "6 (First Version, Recommended)" → "6a", "6 (Second Version)" → "6b"
  const isFirst = pn.includes('First')
  const isRecommended = pn.includes('Recommended')
  const letter = isFirst ? 'a' : 'b'
  const star = isRecommended ? '*' : ''
  return `${psalmId}${letter}${star}`
}

/**
 * Strips the asterisk from a slug (for use as a URL path segment).
 * "6a*" → "6a"
 */
export function stripStar(slug: string): string {
  return slug.replace('*', '')
}

/**
 * Maps a Psalm 119 verse range (or single verse) to its alphabetic stanza
 * letter. Each stanza spans 8 verses starting at verse 1: 1-8 → "a",
 * 9-16 → "b", …, 169-176 → "v".
 *
 * Returns null for ranges that don't align with an 119 stanza (i.e. the
 * start is not 1 + 8*k, or the end is not start + 7, or the range is out
 * of 1-176).
 *
 *   verseRangeToLetter('1-8')    → 'a'
 *   verseRangeToLetter('9-16')   → 'b'
 *   verseRangeToLetter('169-176')→ 'v'
 *   verseRangeToLetter('1-7')    → null      // not 8 verses
 *   verseRangeToLetter('177-180')→ null      // out of range
 */

export function verseRangeToLetter(verseRange: string | null | undefined): string | null {
  if (!verseRange) return null
  const m = verseRange.match(/^(\d+)-(\d+)$/)
  if (!m) return null
  const start = parseInt(m[1], 10)
  const end = parseInt(m[2], 10)
  if (start < 1 || end < start) return null
  if ((end - start + 1) !== 8) return null
  const stanzaIndex = Math.floor((start - 1) / 8)
  if (stanzaIndex < 0 || stanzaIndex > 21) return null
  if (stanzaIndex * 8 + 1 !== start) return null
  return String.fromCharCode('a'.charCodeAt(0) + stanzaIndex)
}

/**
 * Finds the Psalm 119 stanza that contains the given 1-based verse.
 * Returns the verse range of the matching stanza, or null if the verse
 * is outside 1-176.
 *
 *   stanzaForVerse(1)   → '1-8'
 *   stanzaForVerse(2)   → '1-8'
 *   stanzaForVerse(8)   → '1-8'
 *   stanzaForVerse(9)   → '9-16'
 *   stanzaForVerse(177) → null
 */
export function stanzaForVerse(verse: number): string | null {
  if (!Number.isInteger(verse) || verse < 1 || verse > 176) return null
  const stanzaIndex = Math.floor((verse - 1) / 8)
  const start = stanzaIndex * 8 + 1
  return `${start}-${start + 7}`
}

/**
 * Convenience wrapper that only returns a stanza letter for Psalm 119 ranges.
 * Other psalms have no alphabetic stanza convention, so callers that need
 * "any psalm's range as a letter" should call `verseRangeToLetter` directly
 * (it returns null for non-8-verse ranges).
 */
export function stanzaLetterFromRange(
  verseRange: string | null | undefined,
  psalmId: number,
): string | null {
  if (psalmId !== 119) return null
  return verseRangeToLetter(verseRange)
}


