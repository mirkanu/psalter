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
