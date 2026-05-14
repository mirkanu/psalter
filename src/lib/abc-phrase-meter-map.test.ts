import { describe, it, expect } from 'vitest'
import { PHRASES_PER_STANZA, phrasesForMeter } from './abc-phrase-meter-map'

describe('phrasesForMeter', () => {
  it('returns 2 for "CM"', () => {
    expect(phrasesForMeter('CM')).toBe(2)
  })

  it('returns 2 for "CM (common meter, 8.6.8.6)" (parenthesised long form)', () => {
    expect(phrasesForMeter('CM (common meter, 8.6.8.6)')).toBe(2)
  })

  it('returns 2 for "LM (long meter, 88 88)" (parenthesised long form)', () => {
    expect(phrasesForMeter('LM (long meter, 88 88)')).toBe(2)
  })

  it('returns 4 for "DCM"', () => {
    expect(phrasesForMeter('DCM')).toBe(4)
  })

  it('returns 4 for "DLM"', () => {
    expect(phrasesForMeter('DLM')).toBe(4)
  })

  it('returns 4 for "DSM"', () => {
    expect(phrasesForMeter('DSM')).toBe(4)
  })

  it('returns 2 for "SM"', () => {
    expect(phrasesForMeter('SM')).toBe(2)
  })

  it('returns 2 for numeric meter "8.7.8.7"', () => {
    expect(phrasesForMeter('8.7.8.7')).toBe(2)
  })

  it('returns 2 for numeric meter "7.6.7.6"', () => {
    expect(phrasesForMeter('7.6.7.6')).toBe(2)
  })

  it('returns 1 for null', () => {
    expect(phrasesForMeter(null)).toBe(1)
  })

  it('returns 1 for undefined', () => {
    expect(phrasesForMeter(undefined)).toBe(1)
  })

  it('returns 1 for empty string', () => {
    expect(phrasesForMeter('')).toBe(1)
  })

  it('returns 1 for whitespace-only string', () => {
    expect(phrasesForMeter('   ')).toBe(1)
  })

  it('returns 1 for unknown meter token', () => {
    expect(phrasesForMeter('UNKNOWN-METER')).toBe(1)
  })

  it('lowercase token still resolves (case-insensitive on first token)', () => {
    expect(phrasesForMeter('cm')).toBe(2)
    expect(phrasesForMeter('dcm')).toBe(4)
  })
})

describe('PHRASES_PER_STANZA', () => {
  it('exports at least CM, LM, SM, DCM, DLM, DSM keys', () => {
    expect(PHRASES_PER_STANZA.CM).toBe(2)
    expect(PHRASES_PER_STANZA.LM).toBe(2)
    expect(PHRASES_PER_STANZA.SM).toBe(2)
    expect(PHRASES_PER_STANZA.DCM).toBe(4)
    expect(PHRASES_PER_STANZA.DLM).toBe(4)
    expect(PHRASES_PER_STANZA.DSM).toBe(4)
  })

  it('exports numeric meter keys 8.7.8.7 and 7.6.7.6', () => {
    expect(PHRASES_PER_STANZA['8.7.8.7']).toBe(2)
    expect(PHRASES_PER_STANZA['7.6.7.6']).toBe(2)
  })
})
