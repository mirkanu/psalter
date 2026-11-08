import type { PsalmRow } from '@/components/PsalmListingGrid'

export interface ParsedPsalmEntry {
  psalmNum: number
  verseRange: string | null
  psalm: PsalmRow | null
  /**
   * The resolved `psalm_versions.id` whenever the psalm has more than one
   * version row (an a/b pair, or a psalm-119 stanza). Null for single-version
   * psalms, which have no a/b choice to record.
   */
  psalmVersionId: number | null
}

/**
 * Parses a freeform psalm list into entries. Supports:
 *   "23:1-6; 74 (AOTS); 119:1-8"
 *
 * A bare psalm number resolves in four steps:
 *   1. an exact single-version label ("23")
 *   2. an exact psalm-119 stanza ("119:9-16") when a verse range was pasted
 *   3. the RECOMMENDED version of a multi-version psalm ("50" → "50a*")
 *   4. any psalm-119 stanza, i.e. the first one (fallback for an unranged "119")
 *
 * "(AOTS)" or any parenthetical after a psalm number (not a verse range)
 * selects the "b" version BY LABEL — never by array position, because for
 * psalm 119 the array position is an arbitrary stanza.
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

    // All rows for this psalm number. A First/Second pair has 2 rows ("50a*"/"50b");
    // psalm 119 has 22 stanza rows ("119:1-8" … "119:169-176").
    const allForPsalm = psalms.filter((r) => r.id === psalmNum)
    const isMultiVersion = allForPsalm.length > 1

    let psalm: PsalmRow | null = null

    if (parenthetical) {
      // "(AOTS)" / "Second Version" → the "b" version, matched by LABEL, never by
      // array position (for psalm 119, array position [1] is an arbitrary stanza).
      psalm =
        allForPsalm.find((r) => r.displayLabel.startsWith(numStr + 'b')) ??
        allForPsalm.find((r) => r.isRecommended === true) ??
        allForPsalm[0] ??
        null
    } else {
      // 1. exact single-version label ("23")
      // 2. exact psalm-119 stanza ("119:9-16") when a verse range was pasted
      // 3. RECOMMENDED version of a multi-version psalm ("50" → "50a*")
      // 4. any psalm-119 stanza, i.e. the first one (fallback for an unranged "119")
      psalm =
        allForPsalm.find((r) => r.displayLabel === numStr) ??
        (verseRange
          ? allForPsalm.find((r) => r.displayLabel === `${numStr}:${verseRange}`)
          : null) ??
        allForPsalm.find((r) => r.isRecommended === true) ??
        allForPsalm.find((r) => r.displayLabel.startsWith(numStr + ':')) ??
        null
    }

    // Record the resolved version whenever the psalm has more than one version
    // row, so the sing view renders THAT versification instead of falling back to
    // sortedVersions[0] (lowest id) — which is the non-recommended version for
    // 45/102/124/143/145/148. Single-version psalms stay null: there is no a/b
    // choice to record, and it keeps the paste preview free of "(23)" noise.
    const psalmVersionId = psalm && isMultiVersion ? psalm.versionId ?? null : null

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
