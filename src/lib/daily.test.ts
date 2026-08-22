import { describe, it, expect } from 'vitest'
import { getDayOfYear, dayOfYearToDate, formatOrdinalDate, parseReadingDate } from './daily'

describe('dayOfYearToDate', () => {
  it('day 1 is 1 January', () => {
    const d = dayOfYearToDate(1)
    expect(d.getUTCMonth()).toBe(0)
    expect(d.getUTCDate()).toBe(1)
  })

  it('day 224 is 12 August', () => {
    const d = dayOfYearToDate(224)
    expect(d.getUTCMonth()).toBe(7)
    expect(d.getUTCDate()).toBe(12)
  })

  it('day 365 is 31 December', () => {
    const d = dayOfYearToDate(365)
    expect(d.getUTCMonth()).toBe(11)
    expect(d.getUTCDate()).toBe(31)
  })

  it('day 366 wraps to day 1 (1 January)', () => {
    const d = dayOfYearToDate(366)
    expect(d.getUTCMonth()).toBe(0)
    expect(d.getUTCDate()).toBe(1)
  })

  it('round-trips through getDayOfYear for a range of days', () => {
    for (const n of [1, 59, 60, 100, 224, 365]) {
      expect(getDayOfYear(dayOfYearToDate(n))).toBe(n)
    }
  })
})

describe('formatOrdinalDate', () => {
  it('formats day 224 as "12th August"', () => {
    expect(formatOrdinalDate(dayOfYearToDate(224))).toBe('12th August')
  })

  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [23, '23rd'],
    [31, '31st'],
  ])('day-of-month %i gets ordinal suffix %s', (day, expected) => {
    const d = new Date(Date.UTC(2025, 0, day))
    expect(formatOrdinalDate(d)).toBe(`${expected} January`)
  })
})

describe('parseReadingDate', () => {
  it('parses a YYYY-MM-DD string', () => {
    const d = parseReadingDate('2026-08-12')
    expect(d).not.toBeNull()
    expect(d?.getUTCFullYear()).toBe(2026)
    expect(d?.getUTCMonth()).toBe(7)
    expect(d?.getUTCDate()).toBe(12)
  })

  it('returns null for malformed input', () => {
    expect(parseReadingDate('nonsense')).toBeNull()
  })
})
