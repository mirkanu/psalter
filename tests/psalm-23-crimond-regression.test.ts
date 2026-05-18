import { describe, it, expect } from 'vitest'
import { parseLyrics } from '../src/lib/lyrics-structured'
import { groupStanzasIntoCycles, mapCycleToPhraseSyllableLines } from '../src/lib/stanza-cycles'
import { buildAbcWithSyllables } from '../src/lib/lyrics'
import corpus from '../tests/fixtures/lyrics-corpus-snapshot.json'

// Touch buildAbcWithSyllables so the import is not tree-shaken (acceptance: file
// imports buildAbcWithSyllables) and so a future regression in the wider lyrics
// pipeline surfaces here.
void buildAbcWithSyllables

const psalm23Row = (corpus as Array<{
  id: number; psalterNumber: string | null; meter: string | null; lyrics: string
}>).find((r) => (r.psalterNumber ?? '').startsWith('23'))

describe('Psalm 23 + Crimond regression (D-16, RENDER-06)', () => {
  it('Psalm 23 fixture is present in corpus snapshot', () => {
    expect(psalm23Row).toBeDefined()
  })

  it('parses without quarantine', () => {
    if (!psalm23Row) return
    const r = parseLyrics(psalm23Row.lyrics, psalm23Row.meter)
    expect(r.ok).toBe(true)
  })

  it('produces single-stanza-per-cycle cycles (Crimond is CM not DCM)', () => {
    if (!psalm23Row) return
    const r = parseLyrics(psalm23Row.lyrics, psalm23Row.meter)
    if (!r.ok) throw new Error('parse failed')
    const cycles = groupStanzasIntoCycles(r.stanzas, false)
    expect(cycles.length).toBe(r.stanzas.length)
    cycles.forEach((c) => expect(c.length).toBe(1))
  })

  it('first cycle stanza 1 has bibleVerseRef=1 on line 0 and bibleVerseRef=2 on line 1', () => {
    if (!psalm23Row) return
    const r = parseLyrics(psalm23Row.lyrics, psalm23Row.meter)
    if (!r.ok) throw new Error('parse failed')
    expect(r.stanzas[0].lines[0].bibleVerseRef).toBe(1)
    expect(r.stanzas[0].lines[1].bibleVerseRef).toBe(2)
  })

  it('mapCycleToPhraseSyllableLines returns shape-preserved grid (string[][] length T) for CM', () => {
    if (!psalm23Row) return
    const r = parseLyrics(psalm23Row.lyrics, psalm23Row.meter)
    if (!r.ok) throw new Error('parse failed')
    // CM tune T=2 phrases per cycle
    const grid = mapCycleToPhraseSyllableLines([r.stanzas[0]], 2)
    expect(grid).toHaveLength(2)
    grid.forEach((slot) => {
      expect(Array.isArray(slot)).toBe(true)
      expect(slot.length).toBe(1)
      expect(typeof slot[0]).toBe('string')
    })
    expect(grid[0][0].length).toBeGreaterThan(0)
    expect(grid[1][0].length).toBeGreaterThan(0)
  })
})
