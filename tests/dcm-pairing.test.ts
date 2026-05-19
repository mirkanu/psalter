import { describe, it, expect } from 'vitest'
import { groupStanzasIntoCycles, mapCycleToPhraseSyllableLines } from '../src/lib/stanza-cycles'
import type { Stanza } from '../src/lib/lyrics-structured'

function stz(idx: number, ...txt: string[]): Stanza {
  return { index: idx, lines: txt.map((t) => ({ text: t })) }
}

describe('DCM pairing (RENDER-01, D-11) — live bug fix', () => {
  it('pairs two consecutive CM stanzas per cycle when tune.double_length=true', () => {
    const stanzas = [stz(0, 'a'), stz(1, 'b'), stz(2, 'c'), stz(3, 'd')]
    const cycles = groupStanzasIntoCycles(stanzas, true)
    expect(cycles).toEqual([[stanzas[0], stanzas[1]], [stanzas[2], stanzas[3]]])
  })

  it('does NOT pair when tune.double_length=false (CM tune × CM stanzas)', () => {
    const stanzas = [stz(0, 'a'), stz(1, 'b')]
    const cycles = groupStanzasIntoCycles(stanzas, false)
    expect(cycles).toEqual([[stanzas[0]], [stanzas[1]]])
  })

  it('under-fills the last cycle (3 stanzas, doubleLength=true → [[s0,s1],[s2]]) without duplicating content', () => {
    const stanzas = [stz(0, 'a'), stz(1, 'b'), stz(2, 'c')]
    const cycles = groupStanzasIntoCycles(stanzas, true)
    expect(cycles).toEqual([[stanzas[0], stanzas[1]], [stanzas[2]]])
    expect(cycles[1].length).toBe(1)
  })
})

describe('DCM mapCycleToPhraseSyllableLines — all 8 metrical lines render (RENDER-07, D-07)', () => {
  it('packs 2 stanzas × 4 lines into 4 phrase slots without dropping any line', () => {
    const s0 = stz(0, 'L1a alpha', 'L1b beta', 'L1c gamma', 'L1d delta')
    const s1 = stz(1, 'L2a epsilon', 'L2b zeta', 'L2c eta', 'L2d theta')
    // DCM tune T=4 phrases per cycle.
    const grid = mapCycleToPhraseSyllableLines([s0, s1], 4)
    expect(grid).toHaveLength(4)
    const concatenated = grid.map((slot) => slot[0]).join(' ')
    // All 8 stanza-line markers must be present.
    for (const marker of ['L1a', 'L1b', 'L1c', 'L1d', 'L2a', 'L2b', 'L2c', 'L2d']) {
      expect(concatenated).toContain(marker)
    }
  })
})
