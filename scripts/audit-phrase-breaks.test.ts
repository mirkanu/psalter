/**
 * Unit tests for scripts/audit-phrase-breaks.ts
 * Tests the pure auditTune() function against crafted fixtures.
 * No DB, no fs — just string in / object out.
 */
import { describe, it, expect } from 'vitest'
import { auditTune } from './audit-phrase-breaks'

// Realistic CM tune fixture with 1 PHRASE_BREAK — should be OK with current phrasesForMeter (returns 2 → expected=1)
const CM_WITH_ONE_BREAK = [
  'X:1',
  'T:Crimond-like',
  'M:3/4',
  'L:1/8',
  'K:D',
  '| d2 fe dc | BA GF ED |',
  '| F2 AB c2 | d4 d2 |',
  '% PHRASE_BREAK',
  '| A2 AB cA | d2 cd ef |',
  '| g2 fe dc | d4 d2 |',
].join('\n')

// CM tune fixture with 0 PHRASE_BREAKs — should be MISMATCH (expected=1, actual=0)
const CM_WITHOUT_BREAK = [
  'X:1',
  'T:No-break CM',
  'M:4/4',
  'L:1/4',
  'K:G',
  '| G2 G F | E D G2 |',
  '| A2 B2 | c2 B2 |',
  '| A2 G2 | F2 G2 |',
  '| E2 D2 | G4 |',
].join('\n')

// CM tune ending with trailing z2 rest — should detect hasZ2TrailingRest=true
const CM_WITH_Z2_TRAILING = [
  'X:1',
  'T:Arnold-like',
  'M:3/4',
  'L:1/8',
  'K:D',
  '| d2 fe dc | BA GF ED |',
  '| F2 AB c2 | d4 d2 |',
  '% PHRASE_BREAK',
  '| A2 AB cA | d2 cd ef |',
  '| g2 fe dc | z2',
].join('\n')

describe('auditTune', () => {
  it('CM tune with 1 PHRASE_BREAK: expected=1, actual=1, status=OK', () => {
    const result = auditTune({ name: 'Crimond', meter: 'CM', abcNotation: CM_WITH_ONE_BREAK })
    expect(result.expected).toBe(1)
    expect(result.actual).toBe(1)
    expect(result.status).toBe('OK')
    expect(result.name).toBe('Crimond')
    expect(result.meter).toBe('CM')
  })

  it('CM tune with 0 PHRASE_BREAKs: status=MISMATCH (expected=1, actual=0)', () => {
    const result = auditTune({ name: 'NoneBreak', meter: 'CM', abcNotation: CM_WITHOUT_BREAK })
    expect(result.expected).toBe(1)
    expect(result.actual).toBe(0)
    expect(result.status).toBe('MISMATCH')
  })

  it('CM tune with 1 PHRASE_BREAK: noteHeadsPerPhrase is an array of length 2', () => {
    const result = auditTune({ name: 'Crimond', meter: 'CM', abcNotation: CM_WITH_ONE_BREAK })
    expect(Array.isArray(result.noteHeadsPerPhrase)).toBe(true)
    expect(result.noteHeadsPerPhrase.length).toBe(2)
    // Each phrase should have some note heads
    expect(result.noteHeadsPerPhrase[0]).toBeGreaterThan(0)
    expect(result.noteHeadsPerPhrase[1]).toBeGreaterThan(0)
  })

  it('tune ending with z2 rest: hasZ2TrailingRest=true', () => {
    const result = auditTune({ name: 'Arnold', meter: 'CM', abcNotation: CM_WITH_Z2_TRAILING })
    expect(result.hasZ2TrailingRest).toBe(true)
  })

  it('tune without trailing z rest: hasZ2TrailingRest=false', () => {
    const result = auditTune({ name: 'Crimond', meter: 'CM', abcNotation: CM_WITH_ONE_BREAK })
    expect(result.hasZ2TrailingRest).toBe(false)
  })

  it('isKnownZ2Bug=true for Arnold', () => {
    const result = auditTune({ name: 'Arnold', meter: 'CM', abcNotation: CM_WITH_Z2_TRAILING })
    expect(result.isKnownZ2Bug).toBe(true)
  })

  it('isKnownZ2Bug=true for Crediton', () => {
    const result = auditTune({ name: 'Crediton', meter: 'CM', abcNotation: CM_WITH_ONE_BREAK })
    expect(result.isKnownZ2Bug).toBe(true)
  })

  it('isKnownZ2Bug=true for New Britain', () => {
    const result = auditTune({ name: 'New Britain', meter: 'CM', abcNotation: CM_WITH_ONE_BREAK })
    expect(result.isKnownZ2Bug).toBe(true)
  })

  it('isKnownZ2Bug=true for St. Andrew', () => {
    const result = auditTune({ name: 'St. Andrew', meter: 'CM', abcNotation: CM_WITH_ONE_BREAK })
    expect(result.isKnownZ2Bug).toBe(true)
  })

  it('isKnownZ2Bug=true for St. Mary', () => {
    const result = auditTune({ name: 'St. Mary', meter: 'CM', abcNotation: CM_WITH_ONE_BREAK })
    expect(result.isKnownZ2Bug).toBe(true)
  })

  it('isKnownZ2Bug=false for non-z2-bug tune', () => {
    const result = auditTune({ name: 'Crimond', meter: 'CM', abcNotation: CM_WITH_ONE_BREAK })
    expect(result.isKnownZ2Bug).toBe(false)
  })

  it('null meter tune: expected=0, status=OK if actual=0', () => {
    const result = auditTune({
      name: 'Unknown',
      meter: null,
      abcNotation: '| G2 G2 |\n| A2 A2 |',
    })
    // phrasesForMeter(null) = 1, so expected = max(0, 1-1) = 0
    expect(result.expected).toBe(0)
    expect(result.actual).toBe(0)
    expect(result.status).toBe('OK')
  })

  it('totalNoteHeads is the sum of all noteHeadsPerPhrase', () => {
    const result = auditTune({ name: 'Crimond', meter: 'CM', abcNotation: CM_WITH_ONE_BREAK })
    const expectedTotal = result.noteHeadsPerPhrase.reduce((a, b) => a + b, 0)
    expect(result.totalNoteHeads).toBe(expectedTotal)
  })
})
