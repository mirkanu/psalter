import { describe, it, expect } from 'vitest'
import { parseLyrics } from '../src/lib/lyrics-structured'
import { mapCycleToPhraseSyllableLines } from '../src/lib/stanza-cycles'
import corpus from '../tests/fixtures/lyrics-corpus-snapshot.json'

// Old 124th meter: 10.10.10.10.10 — 5 metrical lines per stanza
const ps124SecondVersion = (corpus as Array<{
  id: number; psalterNumber: string | null; versionLabel: string | null; meter: string | null; lyrics: string
}>).find((r) =>
  (r.psalterNumber ?? '').startsWith('124') &&
  ((r.versionLabel ?? '').toLowerCase().includes('second') ||
   /10[\s.]10[\s.]10[\s.]10[\s.]10/.test(r.meter ?? '')),
)

describe('Alternate-meter alignment (RENDER-05) — Old 124th @ 10.10.10.10.10', () => {
  it('Psalm 124 Second Version present in corpus', () => {
    expect(ps124SecondVersion).toBeDefined()
  })

  it('parses with 5-line stanzas (10.10.10.10.10 meter)', () => {
    if (!ps124SecondVersion) return
    const r = parseLyrics(ps124SecondVersion.lyrics, ps124SecondVersion.meter)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    r.stanzas.forEach((s) => expect(s.lines.length).toBe(5))
  })

  it('mapCycleToPhraseSyllableLines distributes 5 lines across 5 phrase slots (shape-preserved grid)', () => {
    if (!ps124SecondVersion) return
    const r = parseLyrics(ps124SecondVersion.lyrics, ps124SecondVersion.meter)
    if (!r.ok) return
    const grid = mapCycleToPhraseSyllableLines([r.stanzas[0]], 5)
    expect(grid).toHaveLength(5)
    grid.forEach((slot) => {
      expect(slot.length).toBe(1)
      expect(slot[0].length).toBeGreaterThan(0)
    })
  })
})
