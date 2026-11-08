/**
 * Verse-range input handling for precenting set items.
 *
 * A set item stores a free-text verse range (e.g. "1-6", "28-33", "7-8, 16b-19").
 * The API caps the value at 20 characters and silently stores `null` for
 * anything longer — i.e. a long entry would clear the range instead of
 * saving it. The same cap is therefore enforced here, before the request.
 *
 * This is deliberately separate from `lib/verse-range.ts`, which parses
 * Psalm-119 sub-division ranges ("119:17-24" → { start, end }) for the
 * psalm pages. Different concern, different shape.
 */

export const VERSE_RANGE_MAX_LENGTH = 20

export type VerseRangeResult =
  | { ok: true; value: string }
  | { ok: false; error: string }

/**
 * Normalise a user-entered verse range.
 *
 * - trims and collapses runs of whitespace
 * - converts en/em dashes to a plain hyphen
 * - an empty result means "all verses" (stored as null)
 */
export function normaliseVerseRange(raw: string): VerseRangeResult {
  const trimmed = raw
    .trim()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')

  if (trimmed.length === 0) return { ok: true, value: '' }

  if (trimmed.length > VERSE_RANGE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Maximum ${VERSE_RANGE_MAX_LENGTH} characters`,
    }
  }

  if (!/^[0-9a-zA-Z,.\-\s]+$/.test(trimmed)) {
    return { ok: false, error: 'Use numbers, letters, commas, hyphens or dots only' }
  }

  return { ok: true, value: trimmed }
}
