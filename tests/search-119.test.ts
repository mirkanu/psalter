import { describe, it, expect } from 'vitest'
import {
  deriveVersionSlug,
  parseSlug,
  slugToDisplayTitle,
  stripStar,
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
