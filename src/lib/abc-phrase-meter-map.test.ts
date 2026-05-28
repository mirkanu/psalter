import { describe, it, expect } from 'vitest'
import { PHRASES_PER_STANZA, phrasesForMeter } from './abc-phrase-meter-map'

describe('phrasesForMeter', () => {
  it('returns 4 for "CM"', () => {
    expect(phrasesForMeter('CM')).toBe(4)
  })

  it('returns 4 for "CM (common meter, 8.6.8.6)" (parenthesised long form)', () => {
    expect(phrasesForMeter('CM (common meter, 8.6.8.6)')).toBe(4)
  })

  it('returns 4 for "LM (long meter, 88 88)" (parenthesised long form)', () => {
    expect(phrasesForMeter('LM (long meter, 88 88)')).toBe(4)
  })

  it('returns 8 for "DCM"', () => {
    expect(phrasesForMeter('DCM')).toBe(8)
  })

  it('returns 8 for "DLM"', () => {
    expect(phrasesForMeter('DLM')).toBe(8)
  })

  it('returns 8 for "DSM"', () => {
    expect(phrasesForMeter('DSM')).toBe(8)
  })

  it('returns 4 for "SM"', () => {
    expect(phrasesForMeter('SM')).toBe(4)
  })

  it('returns 4 for numeric meter "8.7.8.7"', () => {
    expect(phrasesForMeter('8.7.8.7')).toBe(4)
  })

  it('returns 4 for numeric meter "7.6.7.6"', () => {
    expect(phrasesForMeter('7.6.7.6')).toBe(4)
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
    expect(phrasesForMeter('cm')).toBe(4)
    expect(phrasesForMeter('dcm')).toBe(8)
  })
})

describe('PHRASES_PER_STANZA', () => {
  it('exports at least CM, LM, SM, DCM, DLM, DSM keys', () => {
    expect(PHRASES_PER_STANZA.CM).toBe(4)
    expect(PHRASES_PER_STANZA.LM).toBe(4)
    expect(PHRASES_PER_STANZA.SM).toBe(4)
    expect(PHRASES_PER_STANZA.DCM).toBe(8)
    expect(PHRASES_PER_STANZA.DLM).toBe(8)
    expect(PHRASES_PER_STANZA.DSM).toBe(8)
  })

  it('exports numeric meter keys 8.7.8.7 and 7.6.7.6', () => {
    expect(PHRASES_PER_STANZA['8.7.8.7']).toBe(4)
    expect(PHRASES_PER_STANZA['7.6.7.6']).toBe(4)
  })
})

describe('phrasesForMeter — post-Phase 04.9.8 values', () => {
  it('returns 4 for CM', () => expect(phrasesForMeter('CM')).toBe(4))
  it('returns 4 for LM', () => expect(phrasesForMeter('LM')).toBe(4))
  it('returns 4 for SM', () => expect(phrasesForMeter('SM')).toBe(4))
  it('returns 8 for DCM', () => expect(phrasesForMeter('DCM')).toBe(8))
  it('returns 8 for DLM', () => expect(phrasesForMeter('DLM')).toBe(8))
  it('returns 8 for DSM', () => expect(phrasesForMeter('DSM')).toBe(8))
  it('returns 4 for 8.7.8.7', () => expect(phrasesForMeter('8.7.8.7')).toBe(4))
  it('returns 4 for 7.6.7.6', () => expect(phrasesForMeter('7.6.7.6')).toBe(4))
  it('returns 1 for unknown meter', () => expect(phrasesForMeter('foo')).toBe(1))
})
