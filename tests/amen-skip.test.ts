import { describe, it, expect } from 'vitest'
import { parseLyrics } from '../src/lib/lyrics-structured'
import { mapCycleToPhraseSyllableLines } from '../src/lib/stanza-cycles'
import corpus from '../tests/fixtures/lyrics-corpus-snapshot.json'

const psalm23 = (corpus as Array<{
  id: number; psalterNumber: string | null; meter: string | null; lyrics: string
}>).find((r) => (r.psalterNumber ?? '').startsWith('23'))

describe('Amen-skip negative (D-13) — renderer must not synthesise amen tail', () => {
  it('generated grid for Psalm 23 contains no "Amen" token', () => {
    if (!psalm23) return
    const r = parseLyrics(psalm23.lyrics, psalm23.meter)
    if (!r.ok) throw new Error('parse failed')
    const grid = mapCycleToPhraseSyllableLines([r.stanzas[0]], 2)
    grid.forEach((slot) => {
      slot.forEach((s) => {
        expect(s.toLowerCase()).not.toContain('amen')
        expect(s.toLowerCase()).not.toContain('a-men')
      })
    })
  })

  it('parser does NOT introduce a synthesised final stanza for amen', () => {
    if (!psalm23) return
    const r = parseLyrics(psalm23.lyrics, psalm23.meter)
    if (!r.ok) throw new Error('parse failed')
    const lastStanza = r.stanzas[r.stanzas.length - 1]
    const lastLineText = lastStanza.lines[lastStanza.lines.length - 1].text.toLowerCase()
    expect(lastLineText).not.toMatch(/^amen\.?$/)
  })

  it('no stanza in the corpus has a synthesised pure-amen final line (sanity sweep)', () => {
    let offenders = 0
    for (const row of corpus as Array<{ id: number; meter: string | null; lyrics: string }>) {
      const r = parseLyrics(row.lyrics ?? '', row.meter)
      if (!r.ok) continue
      const last = r.stanzas[r.stanzas.length - 1]
      if (!last) continue
      const lastLine = last.lines[last.lines.length - 1]?.text?.toLowerCase() ?? ''
      if (/^amen\.?$/.test(lastLine)) offenders++
    }
    expect(offenders).toBe(0)
  })
})
