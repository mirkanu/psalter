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
    // CM tune T=2 phrases per cycle; RENDER-07b: inner length = linesPerPhrase = 2.
    const grid = mapCycleToPhraseSyllableLines([r.stanzas[0]], 2)
    expect(grid).toHaveLength(2)
    grid.forEach((slot) => {
      expect(Array.isArray(slot)).toBe(true)
      expect(slot.length).toBe(2)
      slot.forEach((s) => expect(typeof s).toBe('string'))
    })
    expect(grid[0].join(' ').length).toBeGreaterThan(0)
    expect(grid[1].join(' ').length).toBeGreaterThan(0)
  })

  it('all 4 CM metrical lines of stanza 0 appear in mapCycleToPhraseSyllableLines output (RENDER-07, D-06)', () => {
    if (!psalm23Row) return
    const r = parseLyrics(psalm23Row.lyrics, psalm23Row.meter)
    if (!r.ok) throw new Error('parse failed')
    // CM tune: T=2 phrases per cycle, but stanza has 4 metrical lines.
    // The fix must pack 2 lines into each phrase slot — none may be dropped.
    const grid = mapCycleToPhraseSyllableLines([r.stanzas[0]], 2)
    const concatenated = grid.flat().join(' ')
    // Each metrical line's leading phrase must appear somewhere.
    expect(concatenated).toMatch(/Lord's my she/)          // line 0
    expect(concatenated).toMatch(/He makes me/)            // line 1
    expect(concatenated).toMatch(/In pas-?\s*tures green/)    // line 2 — was dropped pre-fix
    expect(concatenated).toMatch(/qu-?\s*i-?\s*et waters by/) // line 3 — was dropped pre-fix
  })

  it('Phase 4.9.7 Plan 03 — per-line inner-array shape AND cross-stanza alignment (RENDER-07b)', () => {
    if (!psalm23Row) return
    const r = parseLyrics(psalm23Row.lyrics, psalm23Row.meter)
    if (!r.ok) throw new Error('parse failed')
    const grid = mapCycleToPhraseSyllableLines([r.stanzas[0]], 2)
    // The new shape: each phrase slot carries 2 metrical lines as SEPARATE strings.
    expect(grid[0]).toHaveLength(2)
    expect(grid[1]).toHaveLength(2)
    // Line 0 ends with "shepherd, I'll not want." — and that string is ALONE in grid[0][0]
    // (not bleeding into the next line which lives at grid[0][1]).
    expect(grid[0]![0]).toMatch(/want\.?$/i)
    expect(grid[0]![1]).toMatch(/^He makes/i)
    // grid[1] is the second phrase: lines 2-3 of the stanza ("In pastures green..." / "the quiet waters by.").
    expect(grid[1]![0]).toMatch(/^In pas/i)
    expect(grid[1]![1]).toMatch(/waters by/i)
    // Cross-stanza spill guard: grid[0][0] must not contain line-1 tokens.
    expect(grid[0]![0]).not.toMatch(/He makes/i)
    // Cross-stanza alignment guarantee: stanza 1 and stanza 3 have the SAME per-line entry
    // count, so the renderer's per-line sub-staff distribution cannot drift between them.
    const grid3 = mapCycleToPhraseSyllableLines([r.stanzas[2]], 2)
    expect(grid3[0]).toHaveLength(grid[0]!.length)
    expect(grid3[1]).toHaveLength(grid[1]!.length)
  })
})
