import { describe, it, expect } from 'vitest'
import {
  regroupLinesToMeter,
  regroupStanzasAcrossBoundaries,
} from './regroup-lines-to-meter'

// Helper: build a syllable array of N identical tokens.
const syl = (n: number, token = 'x') => Array(n).fill(token)

describe('regroupLinesToMeter', () => {
  it('passes through when line counts match', () => {
    const input = [syl(8), syl(6), syl(8), syl(6)]
    const result = regroupLinesToMeter(input, [8, 6, 8, 6])
    expect(result.merged).toBe(false)
    expect(result.regrouped).toBe(input)
  })

  it('passes through when expected is null', () => {
    const input = [syl(8), syl(6)]
    const result = regroupLinesToMeter(input, null)
    expect(result.merged).toBe(false)
  })

  it('merges two short lines into one 8-syllable line (CM stanza line 1)', () => {
    // CM line 1: 8 syllables. Source has two 4-syllable lines that should merge.
    const input = [syl(4), syl(4), syl(6), syl(8), syl(6)]
    const result = regroupLinesToMeter(input, [8, 6, 8, 6])
    expect(result.merged).toBe(true)
    expect(result.regrouped.map((l) => l.length)).toEqual([8, 6, 8, 6])
  })

  it('bails out gracefully when input is too short', () => {
    const input = [syl(4), syl(4)]
    const result = regroupLinesToMeter(input, [8, 6, 8, 6])
    expect(result.merged).toBe(false)
  })

  it('merges 4+4 into 8, then runs 6+8+6 cleanly', () => {
    // 5 input lines matching [8,6,8,6] with split: [4,4]→8, [6], [8], [6].
    const input = [syl(4), syl(4), syl(6), syl(8), syl(6)]
    const result = regroupLinesToMeter(input, [8, 6, 8, 6])
    expect(result.merged).toBe(true)
    expect(result.regrouped.map((l) => l.length)).toEqual([8, 6, 8, 6])
  })

  it('bails out when the cumulative sum never matches', () => {
    // 5 input lines that cannot be consumed into [8,6,8,6] (e.g. irregular
    // counts that the greedy match can't reconcile).
    const input = [syl(3), syl(3), syl(3), syl(3), syl(8)] // sum=20, expected=28
    const result = regroupLinesToMeter(input, [8, 6, 8, 6])
    expect(result.merged).toBe(false)
  })
})

describe('regroupStanzasAcrossBoundaries', () => {
  it('returns input unchanged when expected shape matches stanzas', () => {
    const input = [[syl(8), syl(6), syl(8), syl(6)], [syl(8), syl(6), syl(8), syl(6)]]
    const result = regroupStanzasAcrossBoundaries(input, [[8, 6, 8, 6], [8, 6, 8, 6]])
    expect(result.merged).toBe(false)
    expect(result.regrouped).toBe(input)
  })

  it('returns input unchanged when expected is null', () => {
    const input = [[syl(8), syl(6)]]
    const result = regroupStanzasAcrossBoundaries(input, null)
    expect(result.merged).toBe(false)
  })

  it('merges two physical stanzas into one metrical stanza when per-line halves align', () => {
    // Works when the metrical line sums already match the source line
    // counts exactly (the cross-stanza function is a thin wrapper over
    // regroupLinesToMeter — it inherits the same single-stanza greediness).
    // Test: 1 physical stanza of 6 lines × 8 syllables = 48 syllables,
    // expected 1 metrical stanza of 6 lines × 8 syllables = 48 syllables.
    // The cross-stanza helper kicks in whenever the input stanza count
    // differs from the expected stanza count, so we use 2 physical
    // stanzas of 4 lines (each metrical line is itself a syllable sum
    // split across two source lines, e.g. 4+4=8).
    const input = [
      [syl(4), syl(4), syl(4), syl(4), syl(4), syl(4)],
      [syl(4), syl(4), syl(4), syl(4), syl(4), syl(4)],
    ]
    const result = regroupStanzasAcrossBoundaries(input, [[8, 8, 8, 8, 8, 8]])
    expect(result.merged).toBe(true)
    expect(result.regrouped).toHaveLength(1)
    expect(result.regrouped[0]).toHaveLength(6)
    expect(result.regrouped[0].map((l) => l.length)).toEqual([8, 8, 8, 8, 8, 8])
  })

  it('bails when source line sums do not align with expected metrical line sums', () => {
    // 2 physical stanzas × 4 lines × 6 syllables = 48 syllables total,
    // expected 6 metrical lines × 8 syllables = 48 syllables total.
    // Same totals but per-line mismatch (6 vs 8) — algorithm bails.
    const input = [[syl(6), syl(6), syl(6), syl(6)], [syl(6), syl(6), syl(6), syl(6)]]
    const result = regroupStanzasAcrossBoundaries(input, [[8, 8, 8, 8, 8, 8]])
    expect(result.merged).toBe(false)
  })

  it('bails when physical syllable sum does not match expected sum', () => {
    // 2 physical stanzas × 4 lines × 4 syllables = 32 syllables,
    // expected 1 metrical stanza of 6 lines × 8 syllables = 48 syllables.
    const input = [[syl(4), syl(4), syl(4), syl(4)], [syl(4), syl(4), syl(4), syl(4)]]
    const result = regroupStanzasAcrossBoundaries(input, [[8, 8, 8, 8, 8, 8]])
    expect(result.merged).toBe(false)
  })
})
