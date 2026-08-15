import { describe, it, expect } from 'vitest'
import { expectedSyllablesByLine, checkAgainstMeter } from './meter-syllable-shape'

describe('expectedSyllablesByLine', () => {
  it('CM = 8.6.8.6', () => expect(expectedSyllablesByLine('CM')).toEqual([8, 6, 8, 6]))
  it('LM = 8.8.8.8', () => expect(expectedSyllablesByLine('LM')).toEqual([8, 8, 8, 8]))
  it('SM = 6.6.8.6', () => expect(expectedSyllablesByLine('SM')).toEqual([6, 6, 8, 6]))
  it('CMD = 8.6.8.6.8.6.8.6', () => expect(expectedSyllablesByLine('CMD')).toEqual([8, 6, 8, 6, 8, 6, 8, 6]))
  it('numeric form 76 76 D parses as run-together-doubled', () => {
    expect(expectedSyllablesByLine('76 76 D')).toEqual([7, 6, 7, 6, 7, 6, 7, 6])
  })
  it('numeric form 76 76 parses as run-together', () => {
    expect(expectedSyllablesByLine('76 76')).toEqual([7, 6, 7, 6])
  })
  it('8.7.8.7 parses', () => expect(expectedSyllablesByLine('8.7.8.7')).toEqual([8, 7, 8, 7]))
  it('null meter returns null', () => expect(expectedSyllablesByLine(null)).toBeNull())
  it('unknown returns null', () => expect(expectedSyllablesByLine('XYZ')).toBeNull())
  it('CM with doubleLength=true doubles to 8 entries', () => {
    expect(expectedSyllablesByLine('CM', true)).toEqual([8, 6, 8, 6, 8, 6, 8, 6])
  })
  it('DCM with doubleLength=true is idempotent (already doubled)', () => {
    expect(expectedSyllablesByLine('DCM', true)).toEqual([8, 6, 8, 6, 8, 6, 8, 6])
  })
  it('numeric 76 76 with doubleLength=true doubles to 8 entries', () => {
    expect(expectedSyllablesByLine('76 76', true)).toEqual([7, 6, 7, 6, 7, 6, 7, 6])
  })
  it('numeric 76 76 D with doubleLength=true is idempotent (already doubled)', () => {
    expect(expectedSyllablesByLine('76 76 D', true)).toEqual([7, 6, 7, 6, 7, 6, 7, 6])
  })
  it('null meter with doubleLength=true still returns null', () => {
    expect(expectedSyllablesByLine(null, true)).toBeNull()
  })
})

describe('checkAgainstMeter', () => {
  it('CM with matching counts flags all match', () => {
    const r = checkAgainstMeter(
      [Array(8).fill('x'), Array(6).fill('x'), Array(8).fill('x'), Array(6).fill('x')],
      'CM',
    )
    expect(r.map(c => c.match)).toEqual([true, true, true, true])
  })
  it('CM with line 1 over-split flags mismatch', () => {
    const r = checkAgainstMeter(
      [Array(10).fill('x'), Array(6).fill('x'), Array(8).fill('x'), Array(7).fill('x')],
      'CM',
    )
    expect(r[0]).toEqual({ actual: 10, expected: 8, match: false })
    expect(r[1]).toEqual({ actual: 6, expected: 6, match: true })
    expect(r[3]).toEqual({ actual: 7, expected: 6, match: false })
  })
  it('null meter still emits rows but expected=null', () => {
    const r = checkAgainstMeter([Array(8).fill('x'), Array(6).fill('x')], null)
    expect(r).toEqual([
      { actual: 8, expected: null, match: true },
      { actual: 6, expected: null, match: true },
    ])
  })
  it('CM with second-last line doubled is accepted (repeat-second-last)', () => {
    // CM shape is [8,6,8,6]; second-last = index 2 (expected 8). A folded
    // repeat-second-last pattern would have 16 syllables (8 × 2) at index 2.
    const r = checkAgainstMeter(
      [Array(8).fill('x'), Array(6).fill('x'), Array(16).fill('x'), Array(6).fill('x')],
      'CM',
    )
    expect(r.map(c => c.match)).toEqual([true, true, true, true])
  })
  it('CM with second-last line at non-multiple ratio is still flagged', () => {
    // 14 syllables is not a multiple of 8 — flagged even with second-last tolerance.
    const r = checkAgainstMeter(
      [Array(8).fill('x'), Array(6).fill('x'), Array(14).fill('x'), Array(6).fill('x')],
      'CM',
    )
    expect(r[2]).toEqual({ actual: 14, expected: 8, match: false })
  })
})
