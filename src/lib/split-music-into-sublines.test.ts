/**
 * Unit tests for splitMusicIntoSubLines (extracted from NotationRenderer.tsx).
 * Tests the z2 trailing-rest defensive filter (Phase 04.9.8 fix).
 */
import { describe, it, expect } from 'vitest'
import { splitMusicIntoSubLines } from './split-music-into-sublines'

describe('splitMusicIntoSubLines', () => {
  it('returns [body] when n <= 1', () => {
    expect(splitMusicIntoSubLines('ABCD | EFGA |', 1)).toEqual(['ABCD | EFGA |'])
    expect(splitMusicIntoSubLines('ABCD | EFGA |', 0)).toEqual(['ABCD | EFGA |'])
  })

  it('returns 2 sub-lines for a 4-bar phrase split into 2', () => {
    const result = splitMusicIntoSubLines('ABCD | EFGA | BCDE | FGAB |', 2)
    expect(result).toHaveLength(2)
  })

  it('does NOT count a trailing z2 as a measure (z2 bug fix)', () => {
    const result = splitMusicIntoSubLines('ABCD | EFGA | BCDE | FGAB | z2', 2)
    expect(result).toHaveLength(2)
  })

  it('excludes bare x2 rests from measure count', () => {
    const result = splitMusicIntoSubLines('ABCD | EFGA | x2', 2)
    // Only 2 real measures (ABCD and EFGA), z/x2 stripped
    // With 2 real measures and n=2, per=1, so 2 sub-lines
    expect(result).toHaveLength(2)
  })

  it('excludes bare Z (whole-bar) rests from measure count', () => {
    const result = splitMusicIntoSubLines('ABCD | EFGA | BCDE | FGAB | Z', 2)
    expect(result).toHaveLength(2)
  })

  it('handles z with no number (bare z rest)', () => {
    const result = splitMusicIntoSubLines('ABCD | EFGA | BCDE | FGAB | z', 2)
    expect(result).toHaveLength(2)
  })

  it('returns [body] when fewer than 2 real measures', () => {
    const result = splitMusicIntoSubLines('ABCD |', 2)
    expect(result).toEqual(['ABCD |'])
  })

  it('splits 4 measures into 2 groups of 2 for n=2', () => {
    const result = splitMusicIntoSubLines('A | B | C | D |', 2)
    expect(result).toHaveLength(2)
    // First sub-line has measures A and B
    expect(result[0]).toContain('A')
    expect(result[0]).toContain('B')
    // Second sub-line has measures C and D
    expect(result[1]).toContain('C')
    expect(result[1]).toContain('D')
  })
})
