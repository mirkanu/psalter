import { describe, it, expect } from 'vitest'
import {
  groupStanzasIntoCycles,
  mapCycleToPhraseSyllableLines,
} from './stanza-cycles'
import type { Stanza } from './lyrics-structured'
import { syllabifyForAbc } from './lyrics'

function stanza(idx: number, ...lines: string[]): Stanza {
  return { index: idx, lines: lines.map((text) => ({ text })) }
}

const S0 = stanza(0, 'Line 1a', 'Line 1b', 'Line 1c', 'Line 1d')
const S1 = stanza(1, 'Line 2a', 'Line 2b', 'Line 2c', 'Line 2d')
const S2 = stanza(2, 'Line 3a', 'Line 3b', 'Line 3c', 'Line 3d')
const S3 = stanza(3, 'Line 4a', 'Line 4b', 'Line 4c', 'Line 4d')

describe('groupStanzasIntoCycles — RENDER-01 meterVariant gating', () => {
  it('pairs two stanzas per cycle when meterVariant includes double_length (DCM × CM stanzas)', () => {
    expect(groupStanzasIntoCycles([S0, S1, S2, S3], ['double_length'])).toEqual([
      [S0, S1],
      [S2, S3],
    ])
  })

  it('produces one stanza per cycle when meterVariant is empty', () => {
    expect(groupStanzasIntoCycles([S0, S1, S2, S3], [])).toEqual([
      [S0],
      [S1],
      [S2],
      [S3],
    ])
  })

  it('produces one stanza per cycle when meterVariant only carries repeat_last_line (not double_length)', () => {
    expect(groupStanzasIntoCycles([S0, S1, S2, S3], ['repeat_last_line'])).toEqual([
      [S0],
      [S1],
      [S2],
      [S3],
    ])
  })

  it('handles odd stanza count under double_length (under-fill — D-12; does NOT repeat content)', () => {
    expect(groupStanzasIntoCycles([S0, S1, S2], ['double_length'])).toEqual([
      [S0, S1],
      [S2],
    ])
  })

  it('returns empty array on empty input', () => {
    expect(groupStanzasIntoCycles([], ['double_length'])).toEqual([])
    expect(groupStanzasIntoCycles([], [])).toEqual([])
  })

  it('single-stanza double_length input yields one 1-stanza cycle (under-fill at index 0)', () => {
    expect(groupStanzasIntoCycles([S0], ['double_length'])).toEqual([[S0]])
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
    // Each slot is itself a string[] (post-RENDER-07b: length === linesPerPhrase for filled slots).
    result.forEach((slot) => {
      expect(Array.isArray(slot)).toBe(true)
      slot.forEach((s) => expect(typeof s).toBe('string'))
    })
  })

  it('pairs cycle stanzas into consecutive phrase slots (DCM × CM: T=4, two stanzas → 4 phrases)', () => {
    const result = mapCycleToPhraseSyllableLines([S0, S1], 4)
    expect(result).toHaveLength(4)
    // First two phrases derive from S0; last two from S1 — no empty slots in a full cycle.
    expect(result[0]!.join(' ').length).toBeGreaterThan(0)
    expect(result[1]!.join(' ').length).toBeGreaterThan(0)
    expect(result[2]!.join(' ').length).toBeGreaterThan(0)
    expect(result[3]!.join(' ').length).toBeGreaterThan(0)
  })

  it('under-filled cycle pads with empty slots (preserves T length)', () => {
    // 2-line stanza at T=4 → linesPerPhrase=1; first 2 slots filled, last 2 are [].
    const shortStanza = stanza(0, 'Only line A', 'Only line B')
    const result = mapCycleToPhraseSyllableLines([shortStanza], 4)
    expect(result).toHaveLength(4)
    expect(result[2]).toEqual([])
    expect(result[3]).toEqual([])
  })

  it('CM single-stanza cycle: T=2, S=4 lines → both slots filled (RENDER-07b: 2 entries each)', () => {
    const result = mapCycleToPhraseSyllableLines([S0], 2)
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveLength(2)
    expect(result[1]).toHaveLength(2)
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

  it('empty cycle returns phrasesPerCycle elements each [] (RENDER-07b)', () => {
    const result = mapCycleToPhraseSyllableLines([], 4)
    expect(result).toEqual([[], [], [], []])
  })
})

describe('mapCycleToPhraseSyllableLines — RENDER-07 all metrical lines render (D-06/07/08)', () => {
  it('LM 8.8.8.8 (T=2, 4 lines) — all 4 lines appear in the 2-phrase grid', () => {
    const lm = stanza(0, 'LMa rejoice one', 'LMb rejoice two', 'LMc rejoice three', 'LMd rejoice four')
    const grid = mapCycleToPhraseSyllableLines([lm], 2)
    expect(grid).toHaveLength(2)
    const concatenated = grid.flat().join(' ')
    for (const m of ['LMa', 'LMb', 'LMc', 'LMd']) {
      expect(concatenated).toContain(m)
    }
  })

  it('CM 8.6.8.6 (T=2, 4 lines) — all 4 lines appear in the 2-phrase grid', () => {
    const grid = mapCycleToPhraseSyllableLines([S0], 2)
    expect(grid).toHaveLength(2)
    const concatenated = grid.flat().join(' ')
    for (const m of ['Line 1a', 'Line 1b', 'Line 1c', 'Line 1d']) {
      expect(concatenated).toContain(m)
    }
  })

  it('DCM-like 2-stanza cycle (T=4, 8 lines) — all 8 lines appear', () => {
    const grid = mapCycleToPhraseSyllableLines([S0, S1], 4)
    expect(grid).toHaveLength(4)
    const concatenated = grid.flat().join(' ')
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
    const concatenated = grid.flat().join(' ')
    for (const m of ['X1', 'X2', 'X3', 'X4', 'X5']) {
      expect(concatenated).toContain(m)
    }
  })
})

describe('mapCycleToPhraseSyllableLines — MOBILE-06 verse-number digit-glue', () => {
  it('glues bibleVerseRef digit to the front of the first syllable (no separator)', () => {
    const stanzaWithRef: Stanza = {
      index: 0,
      lines: [{ text: 'Before the mountains', bibleVerseRef: 1 }],
    }
    const result = mapCycleToPhraseSyllableLines([stanzaWithRef], 1)
    const output = result[0]![0]!
    expect(output.startsWith('1')).toBe(true)
    const unprefixed = syllabifyForAbc('Before the mountains')
    expect(output.slice(1)).toBe(unprefixed)
  })

  it('leaves lines without bibleVerseRef unchanged (no leading digit)', () => {
    const stanzaNoRef: Stanza = {
      index: 0,
      lines: [{ text: 'plain line' }],
    }
    const result = mapCycleToPhraseSyllableLines([stanzaNoRef], 1)
    const output = result[0]![0]!
    expect(output).toBe(syllabifyForAbc('plain line'))
    expect(/^\d/.test(output)).toBe(false)
  })

  it('applies the digit-glue to the Line.syllables hand-override branch too', () => {
    const overridden: Stanza = {
      index: 0,
      lines: [{ text: 'x', bibleVerseRef: 5, syllables: ['be-au', 'ti-ful'] }],
    }
    const result = mapCycleToPhraseSyllableLines([overridden], 1)
    expect(result[0]![0]).toBe('5be-au ti-ful')
  })

  it('preserves token count when gluing the digit (no standalone digit token)', () => {
    const stanzaWithRef: Stanza = {
      index: 0,
      lines: [{ text: 'Before the mountains', bibleVerseRef: 1 }],
    }
    const withRef = mapCycleToPhraseSyllableLines([stanzaWithRef], 1)[0]![0]!
    const stanzaNoRef: Stanza = {
      index: 0,
      lines: [{ text: 'Before the mountains' }],
    }
    const withoutRef = mapCycleToPhraseSyllableLines([stanzaNoRef], 1)[0]![0]!
    expect(withRef.split(' ').length).toBe(withoutRef.split(' ').length)
  })

  it('renders bibleVerseRef 0 (falsy but defined) as a leading "0"', () => {
    const stanzaZeroRef: Stanza = {
      index: 0,
      lines: [{ text: 'zero verse', bibleVerseRef: 0 }],
    }
    const result = mapCycleToPhraseSyllableLines([stanzaZeroRef], 1)
    expect(result[0]![0]!.startsWith('0')).toBe(true)
  })
})

describe('mapCycleToPhraseSyllableLines — RENDER-07b per-line inner array (Phase 4.9.7 Plan 03)', () => {
  it('CM (T=2, 4 lines): inner length === 2, one metrical line per inner entry', () => {
    const grid = mapCycleToPhraseSyllableLines([S0], 2)
    expect(grid).toHaveLength(2)
    expect(grid[0]).toHaveLength(2)
    expect(grid[1]).toHaveLength(2)
    expect(grid[0]![0]).toContain('Line 1a')
    expect(grid[0]![1]).toContain('Line 1b')
    expect(grid[1]![0]).toContain('Line 1c')
    expect(grid[1]![1]).toContain('Line 1d')
    // The "joined-string" Plan 01 shape would have had grid[0]![0] containing BOTH 'Line 1a' and 'Line 1b'.
    expect(grid[0]![0]).not.toContain('Line 1b')
  })

  it('DCM (T=4, 8 lines across 2 stanzas): inner length === 2 for each slot', () => {
    const grid = mapCycleToPhraseSyllableLines([S0, S1], 4)
    expect(grid).toHaveLength(4)
    for (const slot of grid) expect(slot).toHaveLength(2)
    // Stanza boundary lands cleanly between slots 1 and 2.
    expect(grid[1]![1]).toContain('Line 1d')
    expect(grid[2]![0]).toContain('Line 2a')
  })

  it('alternate meter 10.10.10.10.10 (T=5, 5 lines): inner length === 1', () => {
    const alt = stanza(0, 'X1', 'X2', 'X3', 'X4', 'X5')
    const grid = mapCycleToPhraseSyllableLines([alt], 5)
    expect(grid).toHaveLength(5)
    for (let i = 0; i < 5; i++) {
      expect(grid[i]).toHaveLength(1)
      expect(grid[i]![0]).toContain(`X${i + 1}`)
    }
  })

  it('under-fill (empty cycle): outer length === phrasesPerCycle, every inner === []', () => {
    const grid = mapCycleToPhraseSyllableLines([], 2)
    expect(grid).toHaveLength(2)
    for (const slot of grid) expect(slot).toEqual([])
  })

  it('under-fill (partial last cycle): trailing slots are []', () => {
    // 2-line stanza at T=4 → linesPerPhrase = max(1, floor(2/4)) = 1; first 2 slots filled, last 2 empty.
    const short = stanza(0, 'short-A', 'short-B')
    const grid = mapCycleToPhraseSyllableLines([short], 4)
    expect(grid).toHaveLength(4)
    expect(grid[0]).toHaveLength(1)
    expect(grid[1]).toHaveLength(1)
    expect(grid[2]).toEqual([])
    expect(grid[3]).toEqual([])
  })
})
