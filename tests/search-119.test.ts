import { describe, it, expect } from 'vitest'
import {
  deriveVersionSlug,
  parseSlug,
  slugToDisplayTitle,
  stripStar,
  verseRangeToLetter,
  stanzaForVerse,
  stanzaLetterFromRange,
} from '@/lib/psalm-slugs'

// Regression coverage for issue #34 / #25: psalm 119 section lookup.
// 119 has 22 metrical versions, each labelled "119:1-8", "119:9-16", etc.
// `deriveVersionSlug` must produce slug "119-1-8" so the URL `/psalms/119-1-8`
// resolves via `parseSlug` → `{ psalmId: 119, verseRange: "1-8" }`.

describe('deriveVersionSlug — psalm 119 sections', () => {
  it('turns "119:1-8 (1)" into "119-1-8"', () => {
    expect(deriveVersionSlug(119, '119:1-8 (1)', true)).toBe('119-1-8')
  })

  it('turns "119:9-16" into "119-9-16"', () => {
    expect(deriveVersionSlug(119, '119:9-16', true)).toBe('119-9-16')
  })

  it('turns "119:169-176" into "119-169-176"', () => {
    expect(deriveVersionSlug(119, '119:169-176', true)).toBe('119-169-176')
  })
})

describe('parseSlug — psalm 119 sections', () => {
  it('parses "119-1-8" into psalmId 119 and verseRange "1-8"', () => {
    expect(parseSlug('119-1-8')).toEqual({ psalmId: 119, verseRange: '1-8' })
  })

  it('parses "70a" into psalmId 70 and versionLetter "a"', () => {
    expect(parseSlug('70a')).toEqual({ psalmId: 70, versionLetter: 'a' })
  })

  it('parses "70" into psalmId 70 only', () => {
    expect(parseSlug('70')).toEqual({ psalmId: 70 })
  })

  it('returns null for unrecognised slugs', () => {
    expect(parseSlug('xx')).toBeNull()
  })
})

describe('slugToDisplayTitle', () => {
  it('renders "119-1-8" as "119:1-8"', () => {
    expect(slugToDisplayTitle('119-1-8')).toBe('119:1-8')
  })

  it('passes "70a" through unchanged', () => {
    expect(slugToDisplayTitle('70a')).toBe('70a')
  })

  it('passes "70" through unchanged', () => {
    expect(slugToDisplayTitle('70')).toBe('70')
  })
})

describe('stripStar', () => {
  it('strips a trailing asterisk from "6a*"', () => {
    expect(stripStar('6a*')).toBe('6a')
  })

  it('leaves "6a" unchanged', () => {
    expect(stripStar('6a')).toBe('6a')
  })
})

describe('verseRangeToLetter — psalm 119 stanza letter', () => {
  it('returns "a" for 1-8', () => {
    expect(verseRangeToLetter('1-8')).toBe('a')
  })
  it('returns "b" for 9-16', () => {
    expect(verseRangeToLetter('9-16')).toBe('b')
  })
  it('returns "v" for 169-176', () => {
    expect(verseRangeToLetter('169-176')).toBe('v')
  })
  it('returns null for non-aligned ranges', () => {
    expect(verseRangeToLetter('1-7')).toBeNull()
    expect(verseRangeToLetter('2-9')).toBeNull()
    expect(verseRangeToLetter('177-184')).toBeNull()
  })
  it('returns null for null/empty input', () => {
    expect(verseRangeToLetter(null)).toBeNull()
    expect(verseRangeToLetter('')).toBeNull()
  })
})

describe('stanzaLetterFromRange — psalmId guard', () => {
  it('returns the letter for psalm 119 ranges', () => {
    expect(stanzaLetterFromRange('1-8', 119)).toBe('a')
    expect(stanzaLetterFromRange('9-16', 119)).toBe('b')
  })
  it('returns null for non-119 psalms even if range happens to be 8 verses', () => {
    expect(stanzaLetterFromRange('1-8', 1)).toBeNull()
  })
})

describe('stanzaForVerse — single-verse lookup', () => {
  it('maps verse 1 to stanza 1-8', () => {
    expect(stanzaForVerse(1)).toBe('1-8')
  })
  it('maps verse 8 to stanza 1-8', () => {
    expect(stanzaForVerse(8)).toBe('1-8')
  })
  it('maps verse 9 to stanza 9-16', () => {
    expect(stanzaForVerse(9)).toBe('9-16')
  })
  it('maps verse 176 to stanza 169-176', () => {
    expect(stanzaForVerse(176)).toBe('169-176')
  })
  it('returns null for verses outside 1-176', () => {
    expect(stanzaForVerse(0)).toBeNull()
    expect(stanzaForVerse(177)).toBeNull()
    expect(stanzaForVerse(-5)).toBeNull()
  })
})

// Regex from src/app/api/search/route.ts: matches "119-1-8" or "119:1-8".
// Locking in to prevent regressions from refactors.
describe('search route section regex', () => {
  const sectionMatch = (q: string): RegExpMatchArray | null =>
    q.match(/^(\d+)[:-](\d+)-(\d+)$/)

  it('matches "119-1-8"', () => {
    const m = sectionMatch('119-1-8')
    expect(m).not.toBeNull()
    expect(m?.[1]).toBe('119')
    expect(m?.[2]).toBe('1')
    expect(m?.[3]).toBe('8')
  })

  it('matches "119:9-16"', () => {
    const m = sectionMatch('119:9-16')
    expect(m).not.toBeNull()
    expect(m?.[1]).toBe('119')
    expect(m?.[2]).toBe('9')
    expect(m?.[3]).toBe('16')
  })

  it('does not match bare "119"', () => {
    expect(sectionMatch('119')).toBeNull()
  })

  it('does not match "1-8" (missing psalm id)', () => {
    expect(sectionMatch('1-8')).toBeNull()
  })
})

// Regression coverage for the search route's query parsing (Plan 04.x search UX).
// Mirrors the regex order in src/app/api/search/route.ts so refactors are caught.
describe('search route query parsing', () => {
  function parseQuery(q: string) {
    const compact = q.replace(/\s+/g, '')
    return {
      sectionMatch: compact.match(/^(\d+)[:-](\d+)-(\d+)$/),
      singleVerseMatch: compact.match(/^(\d+):(\d+)$/),
      stanzaLetterMatch: compact.match(/^(\d+)([a-z])$/),
      isPlainNumber: /^\d+$/.test(compact),
    }
  }

  it('matches "119:1-9" as a section', () => {
    const r = parseQuery('119:1-9')
    expect(r.sectionMatch?.[1]).toBe('119')
    expect(r.sectionMatch?.[2]).toBe('1')
    expect(r.sectionMatch?.[3]).toBe('9')
  })

  it('matches "119-1-9" as a section (slash or hyphen)', () => {
    expect(parseQuery('119-1-9').sectionMatch).not.toBeNull()
  })

  it('parses "119:1" as single verse lookup, not section', () => {
    const r = parseQuery('119:1')
    expect(r.sectionMatch).toBeNull()
    expect(r.singleVerseMatch).not.toBeNull()
  })

  it('parses "119a" as stanza letter lookup', () => {
    const r = parseQuery('119a')
    expect(r.singleVerseMatch).toBeNull()
    expect(r.sectionMatch).toBeNull()
    expect(r.stanzaLetterMatch).not.toBeNull()
  })

  it('parses "119 a" as stanza letter lookup (whitespace tolerated)', () => {
    expect(parseQuery('119 a').stanzaLetterMatch?.[2]).toBe('a')
  })

  it('parses bare "119" as a plain psalm number', () => {
    const r = parseQuery('119')
    expect(r.isPlainNumber).toBe(true)
    expect(r.sectionMatch).toBeNull()
    expect(r.singleVerseMatch).toBeNull()
    expect(r.stanzaLetterMatch).toBeNull()
  })

  it('does not promote "1-9" (no psalm id) to a section match', () => {
    expect(parseQuery('1-9').sectionMatch).toBeNull()
  })
})
