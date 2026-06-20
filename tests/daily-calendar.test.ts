import { describe, it, expect } from 'vitest'
import { formatPsalmRef, calendarDateToDayOfYear } from '@/lib/daily'

describe('formatPsalmRef (DAILY-02/03 ref formatting)', () => {
  it('formats full range without prefix → "50:1-8"', () => {
    expect(formatPsalmRef(50, 1, 8, false)).toBe('50:1-8')
  })
  it('formats full range with prefix → "Psalm 50:1-8"', () => {
    expect(formatPsalmRef(50, 1, 8, true)).toBe('Psalm 50:1-8')
  })
  it('omits range when startingVerse is null → "50"', () => {
    expect(formatPsalmRef(50, null, null, false)).toBe('50')
  })
  it('omits range when only endingVerse is null → "Psalm 50"', () => {
    expect(formatPsalmRef(50, 1, null, true)).toBe('Psalm 50')
  })
})

describe('calendarDateToDayOfYear (DAILY-03 cell mapping)', () => {
  it('Jan 1 is day 1', () => {
    expect(calendarDateToDayOfYear(2026, 0, 1)).toBe(1)
  })
  it('June 20 2026 is day 171', () => {
    expect(calendarDateToDayOfYear(2026, 5, 20)).toBe(171)
  })
  it('Dec 31 2026 is day 365', () => {
    expect(calendarDateToDayOfYear(2026, 11, 31)).toBe(365)
  })
  it('leap-year Dec 31 2024 wraps day 366 back to 1', () => {
    expect(calendarDateToDayOfYear(2024, 11, 31)).toBe(1)
  })
})
