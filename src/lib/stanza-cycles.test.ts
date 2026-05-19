import { describe, it, expect } from 'vitest'
import {
  groupStanzasIntoCycles,
  mapCycleToPhraseSyllableLines,
} from './stanza-cycles'
import type { Stanza } from './lyrics-structured'

function stanza(idx: number, ...lines: string[]): Stanza {
  return { index: idx, lines: lines.map((text) => ({ text })) }
}

const S0 = stanza(0, 'Line 1a', 'Line 1b', 'Line 1c', 'Line 1d')
const S1 = stanza(1, 'Line 2a', 'Line 2b', 'Line 2c', 'Line 2d')
const S2 = stanza(2, 'Line 3a', 'Line 3b', 'Line 3c', 'Line 3d')
const S3 = stanza(3, 'Line 4a', 'Line 4b', 'Line 4c', 'Line 4d')

describe('groupStanzasIntoCycles — RENDER-01 doubleLength gating', () => {
  it('pairs two stanzas per cycle when doubleLength=true (DCM × CM stanzas)', () => {
    expect(groupStanzasIntoCycles([S0, S1, S2, S3], true)).toEqual([
      [S0, S1],
      [S2, S3],
    ])
  })

  it('produces one stanza per cycle when doubleLength=false', () => {
    expect(groupStanzasIntoCycles([S0, S1, S2, S3], false)).toEqual([
      [S0],
      [S1],
      [S2],
      [S3],
    ])
  })

  it('handles odd stanza count under doubleLength (under-fill — D-12; does NOT repeat content)', () => {
    expect(groupStanzasIntoCycles([S0, S1, S2], true)).toEqual([
      [S0, S1],
      [S2],
    ])
  })

  it('returns empty array on empty input', () => {
    expect(groupStanzasIntoCycles([], true)).toEqual([])
    expect(groupStanzasIntoCycles([], false)).toEqual([])
  })

  it('single-stanza doubleLength input yields one 1-stanza cycle (under-fill at index 0)', () => {
    expect(groupStanzasIntoCycles([S0], true)).toEqual([[S0]])
  })

  it('does not import or compare meter strings (B3 audit)', async () => {
    // Static guard: source file must NOT contain 'CMD'/'DCM'/'DLM'/'DSM' literals
    // and must NOT call phrasesForMeter in the cycle-grouping path.
    const fs = await import('fs')
    const src = fs.readFileSync('src/lib/stanza-cycles.ts', 'utf8')
    expect(src).not.toMatch(/['"](CMD|DCM|DLM|DSM)['"]/)
    expect(src).not.toMatch(/phrasesForMeter\s*\(/)
  })
})

describe('mapCycleToPhraseSyllableLines — RENDER-02 structured line read + B1 shape preservation', () => {
  it('returns string[][] of length phrasesPerCycle (preserves T-element grid contract)', () => {
    const result = mapCycleToPhraseSyllableLines([S0], 4 /* phrasesPerCycle */)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(4)
    // Each slot is itself a string[] — the single-string-array contract the
    // renderer relies on at NotationRenderer.tsx:451 (grid[i] ?? ['']).
    result.forEach((slot) => {
      expect(Array.isArray(slot)).toBe(true)
      slot.forEach((s) => expect(typeof s).toBe('string'))
    })
  })

  it('pairs cycle stanzas into consecutive phrase slots (DCM × CM: T=4, two stanzas → 4 phrases)', () => {
    const result = mapCycleToPhraseSyllableLines([S0, S1], 4)
    expect(result).toHaveLength(4)
    // First two phrases derive from S0; last two from S1 — no empty slots in a full cycle.
    expect(result[0]![0]!.length).toBeGreaterThan(0)
    expect(result[1]![0]!.length).toBeGreaterThan(0)
    expect(result[2]![0]!.length).toBeGreaterThan(0)
    expect(result[3]![0]!.length).toBeGreaterThan(0)
  })

  it('under-filled cycle pads with empty-string slots (preserves T length)', () => {
    // DCM under-fill: only one stanza but T=4 phrases — slots 2 and 3 are [''] not absent.
    // S0 has 4 lines, so all 4 slots get filled. Use a 2-line stanza to test the under-fill.
    const shortStanza = stanza(0, 'Only line A', 'Only line B')
    const result = mapCycleToPhraseSyllableLines([shortStanza], 4)
    expect(result).toHaveLength(4)
    expect(result[2]).toEqual([''])
    expect(result[3]).toEqual([''])
  })

  it('CM single-stanza cycle: T=2, S=2 → both slots filled, single-string-array shape', () => {
    const result = mapCycleToPhraseSyllableLines([S0], 2)
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveLength(1)
    expect(result[1]).toHaveLength(1)
    expect(typeof result[0]![0]).toBe('string')
    expect(typeof result[1]![0]).toBe('string')
  })

  it('reads stanza.lines directly (no string-blob input, no splitStanzaIntoPhrasePortions call)', async () => {
    const fs = await import('fs')
    const src = fs.readFileSync('src/lib/stanza-cycles.ts', 'utf8')
    expect(src).not.toMatch(/splitStanzaIntoPhrasePortions/)
  })

  it('uses Line.syllables when present (hand-override per D-03 hybrid)', () => {
    const overridden: Stanza = {
      index: 0,
      lines: [{ text: 'beautiful word', syllables: ['be-au', 'ti-ful', 'word'] }],
    }
    const result = mapCycleToPhraseSyllableLines([overridden], 1)
    expect(result).toHaveLength(1)
    expect(result[0]![0]).toBe('be-au ti-ful word')
  })

  it('empty cycle returns phrasesPerCycle elements each [""]', () => {
    const result = mapCycleToPhraseSyllableLines([], 4)
    expect(result).toEqual([[''], [''], [''], ['']])
  })
})

describe('mapCycleToPhraseSyllableLines — RENDER-07 all metrical lines render (D-06/07/08)', () => {
  it('LM 8.8.8.8 (T=2, 4 lines) — all 4 lines appear in the 2-phrase grid', () => {
    const lm = stanza(0, 'LMa rejoice one', 'LMb rejoice two', 'LMc rejoice three', 'LMd rejoice four')
    const grid = mapCycleToPhraseSyllableLines([lm], 2)
    expect(grid).toHaveLength(2)
    const concatenated = grid.map((slot) => slot[0]).join(' ')
    for (const m of ['LMa', 'LMb', 'LMc', 'LMd']) {
      expect(concatenated).toContain(m)
    }
  })

  it('CM 8.6.8.6 (T=2, 4 lines) — all 4 lines appear in the 2-phrase grid', () => {
    const grid = mapCycleToPhraseSyllableLines([S0], 2)
    expect(grid).toHaveLength(2)
    const concatenated = grid.map((slot) => slot[0]).join(' ')
    for (const m of ['Line 1a', 'Line 1b', 'Line 1c', 'Line 1d']) {
      expect(concatenated).toContain(m)
    }
  })

  it('DCM-like 2-stanza cycle (T=4, 8 lines) — all 8 lines appear', () => {
    const grid = mapCycleToPhraseSyllableLines([S0, S1], 4)
    expect(grid).toHaveLength(4)
    const concatenated = grid.map((slot) => slot[0]).join(' ')
    for (const m of [
      'Line 1a','Line 1b','Line 1c','Line 1d',
      'Line 2a','Line 2b','Line 2c','Line 2d',
    ]) {
      expect(concatenated).toContain(m)
    }
  })

  it('alternate-meter 10.10.10.10.10 (T=5, 5 lines) — exactly one line per slot, no dropping', () => {
    const alt = stanza(0, 'X1', 'X2', 'X3', 'X4', 'X5')
    const grid = mapCycleToPhraseSyllableLines([alt], 5)
    expect(grid).toHaveLength(5)
    const concatenated = grid.map((slot) => slot[0]).join(' ')
    for (const m of ['X1', 'X2', 'X3', 'X4', 'X5']) {
      expect(concatenated).toContain(m)
    }
  })
})
