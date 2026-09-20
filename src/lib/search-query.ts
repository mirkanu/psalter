/**
 * Pure parsing helpers for the /api/search query string.
 *
 * Extracted from src/app/api/search/route.ts so the parser can be unit-tested
 * without booting the Next.js runtime, drizzle, or the database. Issue #25
 * relies on this separation to keep regression coverage cheap.
 */

/** "119:1-8" / "119-1-8" / "119 : 1 - 8" — psalm range query (any psalm id) */
export function matchPsalmRange(compact: string): { id: number; verseStart: number; verseEnd: number } | null {
  const m = compact.match(/^(\d+)[:-](\d+)-(\d+)$/)
  if (!m) return null
  const id = parseInt(m[1], 10)
  const verseStart = parseInt(m[2], 10)
  const verseEnd = parseInt(m[3], 10)
  if (!Number.isFinite(id) || !Number.isFinite(verseStart) || !Number.isFinite(verseEnd)) {
    return null
  }
  return { id, verseStart, verseEnd }
}

/** "119:1" / "119 : 2" — single verse query (narrowed to enclosing stanza) */
export function matchPsalmSingleVerse(compact: string): { id: number; verse: number } | null {
  const m = compact.match(/^(\d+):(\d+)$/)
  if (!m) return null
  const id = parseInt(m[1], 10)
  const verse = parseInt(m[2], 10)
  if (!Number.isFinite(id) || !Number.isFinite(verse)) return null
  return { id, verse }
}

/** "119a" / "119 b" — Psalm 119 stanza-letter query, plus "70a" for other multi-version psalms */
export function matchStanzaLetter(compact: string): { id: number; letter: string } | null {
  const m = compact.match(/^(\d+)([a-z])$/)
  if (!m) return null
  const id = parseInt(m[1], 10)
  if (!Number.isFinite(id)) return null
  return { id, letter: m[2] }
}

/** Bare-number psalm query ("119", "23", "70") */
export function matchPsalmNumber(compact: string): number | null {
  if (!/^\d+$/.test(compact)) return null
  const id = parseInt(compact, 10)
  return Number.isFinite(id) ? id : null
}
