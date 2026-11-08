import { describe, it, expect } from 'vitest'
import { normaliseVerseRange, VERSE_RANGE_MAX_LENGTH } from './set-verse-range'

describe('normaliseVerseRange', () => {
  it('accepts a simple range', () => {
    const result = normaliseVerseRange('1-6')
    expect(result).toEqual({ ok: true, value: '1-6' })
  })

  it('trims surrounding whitespace', () => {
    const result = normaliseVerseRange('  28-33  ')
    expect(result).toEqual({ ok: true, value: '28-33' })
  })

  it('collapses internal whitespace', () => {
    const result = normaliseVerseRange('1-6,   16b-19')
    expect(result).toEqual({ ok: true, value: '1-6, 16b-19' })
  })

  it('converts en and em dashes to a plain hyphen', () => {
    expect(normaliseVerseRange('1–6')).toEqual({ ok: true, value: '1-6' })
    expect(normaliseVerseRange('1—6')).toEqual({ ok: true, value: '1-6' })
  })

  it('treats an empty value as "all verses"', () => {
    expect(normaliseVerseRange('')).toEqual({ ok: true, value: '' })
    expect(normaliseVerseRange('   ')).toEqual({ ok: true, value: '' })
  })

  it('accepts the existing database formats', () => {
    expect(normaliseVerseRange('7-8, 16b-19').ok).toBe(true)
    expect(normaliseVerseRange('3-8').ok).toBe(true)
    expect(normaliseVerseRange('vv. 1-6').ok).toBe(true)
  })

  it('accepts a value of exactly the maximum length', () => {
    const value = '12345678901234567890'
    expect(value.length).toBe(VERSE_RANGE_MAX_LENGTH)
    expect(normaliseVerseRange(value).ok).toBe(true)
  })

  it('rejects a value longer than the maximum', () => {
    const result = normaliseVerseRange('123456789012345678901')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Maximum')
    }
  })

  it('rejects characters outside the permitted set', () => {
    const result = normaliseVerseRange('1-6!')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('numbers')
    }
  })
})
