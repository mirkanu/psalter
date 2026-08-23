import { describe, it, expect } from 'vitest'
import { parseVerseRange, isVerseInRange, rangesOverlap } from './verse-range'

describe('parseVerseRange', () => {
  it('parses a valid range', () => {
    expect(parseVerseRange('17-24')).toEqual({ start: 17, end: 24 })
  })

  it('returns null for undefined', () => {
    expect(parseVerseRange(undefined)).toBeNull()
  })

  it('returns null for null', () => {
    expect(parseVerseRange(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseVerseRange('')).toBeNull()
  })

  it('returns null for non-numeric input', () => {
    expect(parseVerseRange('abc')).toBeNull()
  })

  it('returns null for a partial range (trailing dash)', () => {
    expect(parseVerseRange('17-')).toBeNull()
  })

  it('returns null for a single number (no dash)', () => {
    expect(parseVerseRange('17')).toBeNull()
  })

  it('returns null for a reversed range (never silently swapped)', () => {
    expect(parseVerseRange('24-17')).toBeNull()
  })
})

describe('isVerseInRange', () => {
  const range = { start: 17, end: 24 }

  it('returns true for a verse inside the range', () => {
    expect(isVerseInRange(20, range)).toBe(true)
  })

  it('returns false for a verse below the range', () => {
    expect(isVerseInRange(16, range)).toBe(false)
  })

  it('returns true for the lower boundary', () => {
    expect(isVerseInRange(17, range)).toBe(true)
  })

  it('returns true for the upper boundary', () => {
    expect(isVerseInRange(24, range)).toBe(true)
  })

  it('returns false for null verse number', () => {
    expect(isVerseInRange(null, range)).toBe(false)
  })

  it('returns false for undefined verse number', () => {
    expect(isVerseInRange(undefined, range)).toBe(false)
  })
})

describe('rangesOverlap', () => {
  const range = { start: 17, end: 24 }

  it('returns true for a partial overlap', () => {
    expect(rangesOverlap(range, 20, 30)).toBe(true)
  })

  it('returns false for a non-overlapping range', () => {
    expect(rangesOverlap(range, 1, 8)).toBe(false)
  })

  it('returns true when both start and end are null (unscoped entry covers everything)', () => {
    expect(rangesOverlap(range, null, null)).toBe(true)
  })

  it('treats a missing end as equal to start', () => {
    expect(rangesOverlap(range, 17, null)).toBe(true)
  })

  it('treats a missing start as equal to end', () => {
    expect(rangesOverlap(range, null, 24)).toBe(true)
  })
})
