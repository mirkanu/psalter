import { describe, it, expect } from 'vitest'
import { injectPhraseBreaksAtCounts } from './inject-phrase-breaks-at-counts'

const CM_PLAIN = `X:1
T:Test
M:C
L:1/8
K:C
c d e f g a b c | c d e f g a | c d e f g a b c | c d e f g a`

describe('injectPhraseBreaksAtCounts', () => {
  it('inserts N-1 PHRASE_BREAKs for N phrase counts', () => {
    const r = injectPhraseBreaksAtCounts(CM_PLAIN, [8, 6, 8, 6])
    expect(r.inserted).toBe(3)
    expect(r.totalNotes).toBe(28)
    const breaks = (r.abc.match(/% PHRASE_BREAK/g) ?? []).length
    expect(breaks).toBe(3)
  })

  it('places breaks AFTER the cumulative count (note 8 is in phrase 1)', () => {
    const r = injectPhraseBreaksAtCounts(CM_PLAIN, [8, 6, 8, 6])
    const lines = r.abc.split('\n')
    const firstBreakIdx = lines.findIndex((l) => l.trim() === '% PHRASE_BREAK')
    expect(firstBreakIdx).toBeGreaterThan(0)
    // The line before the first break should contain the first 8 notes ending in 'c'
    const lineBefore = lines[firstBreakIdx - 1]
    expect(lineBefore).toContain('c d e f g a b c')
  })

  it('returns input unchanged for empty counts', () => {
    const r = injectPhraseBreaksAtCounts(CM_PLAIN, [])
    expect(r.abc).toBe(CM_PLAIN)
    expect(r.inserted).toBe(0)
  })

  it('returns input unchanged for single-phrase counts (no break needed)', () => {
    const r = injectPhraseBreaksAtCounts(CM_PLAIN, [28])
    expect(r.inserted).toBe(0)
  })

  it('reports inserted count below requested when ABC has too few notes', () => {
    const r = injectPhraseBreaksAtCounts(CM_PLAIN, [8, 6, 8, 6, 100])
    expect(r.inserted).toBe(4)
    expect(r.totalNotes).toBe(28)
  })

  it('preserves header (everything up to and including K: line)', () => {
    const r = injectPhraseBreaksAtCounts(CM_PLAIN, [8, 6, 8, 6])
    expect(r.abc.startsWith('X:1\nT:Test\nM:C\nL:1/8\nK:C')).toBe(true)
  })
})
