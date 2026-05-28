import { describe, it, expect } from 'vitest'
import { getPassingPositions } from './solfege-parser'

describe('getPassingPositions', () => {
  it('returns all false for a tune with no dot-pairs', () => {
    // CM soprano: s|m:r|d:t_1|l_1:—|s|f:m|r:d|t_1| — all full-beat notes
    const soprano = 's|m:r|d:t_1|l_1:—|s|f:m|r:d|t_1|'
    const result = getPassingPositions(soprano, 'G', 'C')
    expect(result.every((v) => v === false)).toBe(true)
  })

  it('tags second token of a dot-pair as passing', () => {
    // Single cell: m.r → m (false), r (true)
    const soprano = 'm.r|'
    const result = getPassingPositions(soprano, 'C', 'C')
    expect(result).toEqual([false, true])
  })

  it('does not create an event for a hold token', () => {
    // d:— → d (full beat extended, still one event)
    const soprano = 'd:—|'
    const result = getPassingPositions(soprano, 'C', 'C')
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(false)
  })

  it('handles Crimond-style dot-pairs in phrase 4 pattern', () => {
    // Phrase 4 Crimond-like: s|f.m|r:d|t_1.l_1|s:—||
    // f.m → f(false), m(true)
    // t_1.l_1 → t_1(false), l_1(true)
    const soprano = 's|f.m|r:d|t_1.l_1|s:—||'
    const result = getPassingPositions(soprano, 'G', 'C')
    const passingIndices = result
      .map((v, i) => (v ? i : -1))
      .filter((i) => i >= 0)
    // f.m and t_1.l_1 each contribute one passing note
    expect(passingIndices.length).toBe(2)
  })

  it('first token of a dot-pair is NOT passing', () => {
    const soprano = 'f.m|'
    const result = getPassingPositions(soprano, 'C', 'C')
    expect(result[0]).toBe(false)  // f — syllabic
    expect(result[1]).toBe(true)   // m — passing
  })
})
