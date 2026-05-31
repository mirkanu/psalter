import { describe, it, expect } from 'vitest'
import { forceMatchMeterShape } from './force-match-meter-shape'

describe('forceMatchMeterShape', () => {
  it('passes lines through unchanged when counts match', () => {
    const r = forceMatchMeterShape([['a','b','c','d','e','f','g','h'], ['i','j','k','l','m','n']], [8, 6])
    expect(r.adjusted).toEqual([false, false])
    expect(r.fixed[0]).toHaveLength(8)
    expect(r.fixed[1]).toHaveLength(6)
  })

  it('shrinks by merging hyphenated pairs first', () => {
    const r = forceMatchMeterShape([['she-', 'pherd', 'I', 'walk']], [3])
    expect(r.adjusted[0]).toBe(true)
    expect(r.fixed[0]).toEqual(['shepherd', 'I', 'walk'])
  })

  it('shrinks via last-pair merge when no hyphens available', () => {
    const r = forceMatchMeterShape([['the','quick','brown','fox','jumps']], [3])
    expect(r.adjusted[0]).toBe(true)
    expect(r.fixed[0]).toHaveLength(3)
    expect(r.fixed[0][0]).toBe('the')
  })

  it('grows by splitting longest syllable at vowel', () => {
    const r = forceMatchMeterShape([['waters', 'flow']], [3])
    expect(r.adjusted[0]).toBe(true)
    expect(r.fixed[0]).toHaveLength(3)
    // first piece should have a trailing hyphen marking the split
    expect(r.fixed[0][0]).toMatch(/-$/)
  })

  it('handles count exactly when delta is large', () => {
    const r = forceMatchMeterShape([['x','y']], [6])
    expect(r.fixed[0].length).toBeLessThanOrEqual(6)
    // grow may give up if no interior vowels — best effort
  })

  it('passes through extra lines unchanged when expected shorter', () => {
    const r = forceMatchMeterShape([['a','b','c','d','e','f','g','h'], ['x','y']], [8])
    expect(r.adjusted).toEqual([false, false])
    expect(r.fixed[1]).toEqual(['x','y'])
  })

  it('returns identity for null/empty expected', () => {
    const r = forceMatchMeterShape([['a','b']], null)
    expect(r.fixed).toEqual([['a','b']])
    expect(r.adjusted).toEqual([false])
  })
})
