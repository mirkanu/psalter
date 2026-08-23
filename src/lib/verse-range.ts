/**
 * Pure verse-range parsing + filtering helpers for Psalm 119 sub-divisions
 * (slug ranges like "119-17-24" → verse range "17-24"). No React, no DOM,
 * no DB imports — safe to import from both server and client components.
 */

export interface VerseRange {
  start: number
  end: number
}

const RANGE_RE = /^(\d+)-(\d+)$/

/**
 * Parses a "start-end" verse range string, e.g. "17-24" → { start: 17, end: 24 }.
 * Returns null for anything that isn't a strict, well-formed, non-reversed range:
 * missing/empty input, non-numeric parts, partial ranges ("17-"), a bare number
 * ("17"), or a reversed range ("24-17").
 */
export function parseVerseRange(raw: string | null | undefined): VerseRange | null {
  if (!raw) return null
  const match = raw.match(RANGE_RE)
  if (!match) return null
  const start = Number(match[1])
  const end = Number(match[2])
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  if (start > end) return null
  return { start, end }
}

/**
 * True when `verseNumber` falls within `range` (inclusive on both ends).
 * A verse with no number (null/undefined) can never be scoped, so it never matches.
 */
export function isVerseInRange(
  verseNumber: number | null | undefined,
  range: VerseRange,
): boolean {
  if (verseNumber === null || verseNumber === undefined) return false
  return verseNumber >= range.start && verseNumber <= range.end
}

/**
 * True when an entry's own [start, end] span overlaps `range` at all (partial
 * overlap counts). An entry with both start and end missing is treated as
 * unscoped and always overlaps (it covers the whole psalm). A missing end is
 * treated as equal to start, and a missing start is treated as equal to end.
 */
export function rangesOverlap(
  range: VerseRange,
  start: number | null | undefined,
  end: number | null | undefined,
): boolean {
  if (start === null || start === undefined) {
    if (end === null || end === undefined) return true
    start = end
  }
  if (end === null || end === undefined) {
    end = start
  }
  return start <= range.end && end >= range.start
}

const PSALTER_NUMBER_RANGE_RE = /\d+:(\d+-\d+)/

/**
 * Extracts a Psalm-119 sub-division's own verse range straight from its
 * psalterNumber (e.g. "119:17-24 (3)" → { start: 17, end: 24 }), instead of
 * the URL slug. This is the single source of truth for "which verses does
 * the currently active version cover" — it works identically whether the
 * slug explicitly named a range ("119-17-24") or the page fell back to
 * sortedVersions[0] for a bare "119" slug, since both paths resolve to a
 * specific psalmVersions row with its own psalterNumber. Regular
 * (non-119) psalms have no colon-range in their psalterNumber (e.g.
 * "6 (First Version, Recommended)"), so this correctly returns null and
 * scoping stays opt-in.
 */
export function extractVerseRangeFromPsalterNumber(
  psalterNumber: string | null | undefined,
): VerseRange | null {
  if (!psalterNumber) return null
  const match = psalterNumber.match(PSALTER_NUMBER_RANGE_RE)
  if (!match) return null
  return parseVerseRange(match[1])
}
