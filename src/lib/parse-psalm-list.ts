import type { PsalmRow } from '@/components/PsalmListingGrid'

export interface ParsedPsalmEntry {
  psalmNum: number
  verseRange: string | null
  psalm: PsalmRow | null
  /** Non-null when a specific version (e.g. version b via "(AOTS)") was detected. */
  psalmVersionId: number | null
}

/**
 * Parses a freeform psalm list into entries. Supports:
 *   "23:1-6; 74 (AOTS); 119:1-8"
 *
 * "(AOTS)" or any parenthetical after a psalm number (not a verse range) is
 * treated as a version-b indicator — maps to the second PsalmRow for that psalm.
 */
export function parsePsalmList(input: string, psalms: PsalmRow[]): ParsedPsalmEntry[] {
  const results: ParsedPsalmEntry[] = []
  // Match: optional whitespace, psalm number, optional ":verses", optional "(anything)"
  const regex = /\b(\d{1,3})(?::([0-9]+(?:-[0-9]+)?))?(?:\s*\(([^)]+)\))?/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(input)) !== null) {
    const psalmNum = parseInt(match[1], 10)
    if (psalmNum < 1 || psalmNum > 150) continue
    const verseRange = match[2] ?? null
    const parenthetical = match[3] ?? null   // e.g. "AOTS", "Second Version"
    const numStr = String(psalmNum)

    // All rows for this psalm number (may include multi-version rows like "55a", "55b")
    const allForPsalm = psalms.filter(
      (r) => r.id === psalmNum
    )

    let psalm: PsalmRow | null = null
    let psalmVersionId: number | null = null

    if (parenthetical) {
      // "(AOTS)" or any tune/version hint → pick the second (b) version if available
      const secondVersion = allForPsalm[1] ?? null
      if (secondVersion) {
        psalm = secondVersion
        psalmVersionId = secondVersion.versionId ?? null
      } else {
        // Fall back to first version
        psalm = allForPsalm[0] ?? null
      }
    } else {
      psalm =
        psalms.find((r) => r.displayLabel === numStr) ??
        psalms.find((r) => r.displayLabel.startsWith(numStr + ':')) ??
        null
    }

    results.push({ psalmNum, verseRange, psalm, psalmVersionId })
  }
  return results
}

export function nextSunday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const daysUntil = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + daysUntil)
  return d
}
