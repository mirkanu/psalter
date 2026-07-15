import { describe, it, expect } from 'vitest'
import { splitWLineByNoteCounts } from '../splitWLineByNoteCounts'

describe('splitWLineByNoteCounts', () => {
  it('gives the held-final-note sub-staff exactly one syllable (St Agnes P0 case)', () => {
    const out = splitWLineByNoteCounts('a b c d e f g h', [7, 1])
    expect(out).toEqual(['a b c d e f g', 'h'])
  })

  it('splits evenly when note counts are equal (regression sanity)', () => {
    const out = splitWLineByNoteCounts('one two three four', [2, 2])
    expect(out).toEqual(['one two', 'three four'])
  })

  it('splits one token per chunk across three equal-weight chunks', () => {
    const out = splitWLineByNoteCounts('a b c', [1, 1, 1])
    expect(out).toEqual(['a', 'b', 'c'])
  })

  it('last chunk absorbs extra tokens beyond sum(noteCounts) — no drop', () => {
    const out = splitWLineByNoteCounts('a b c d e', [2, 2])
    expect(out).toEqual(['a b', 'c d e'])
  })

  it('fewer tokens than notes — chunk 0 takes all available, chunk 1 empty', () => {
    const out = splitWLineByNoteCounts('a b', [3, 1])
    expect(out).toEqual(['a b', ''])
  })
})
