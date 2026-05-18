import { describe, it, expect } from 'vitest'
import { groupStanzasIntoCycles } from '../src/lib/stanza-cycles'
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
