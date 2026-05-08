import { describe, it, expect } from 'vitest'
import { fetchPsalmDetail } from '@/db/queries/psalms'

describe('Psalm detail data shape (PSALM-02..05)', () => {
  it('PSALM-02: psalm 23 has bibleTitle, book, haddingtonIntro, kjvText fields available', async () => {
    const psalm = await fetchPsalmDetail(23)
    expect(psalm).toBeDefined()
    expect(psalm).toHaveProperty('bibleTitle')
    expect(psalm).toHaveProperty('book')
    expect(psalm).toHaveProperty('haddingtonIntro')
    expect(psalm).toHaveProperty('kjvText')
  })

  it('PSALM-05: psalm 23 has at least one psalmVersion with lyrics and tune linkage', async () => {
    const psalm = await fetchPsalmDetail(23)
    expect(psalm!.psalmVersions.length).toBeGreaterThanOrEqual(1)
    const v = psalm!.psalmVersions[0]
    expect(v).toHaveProperty('lyrics')
    expect(v).toHaveProperty('psalmVersionTunes')
  })

  it('PSALM-03: study tab data sources are available (verses with topic and doctrine relations)', async () => {
    const psalm = await fetchPsalmDetail(23)
    expect(Array.isArray(psalm!.verses)).toBe(true)
    expect(Array.isArray(psalm!.sectionHeadings)).toBe(true)
    if (psalm!.verses.length > 0) {
      const firstVerse = psalm!.verses[0]
      expect(Array.isArray(firstVerse.verseNavesTopics)).toBe(true)
      expect(Array.isArray(firstVerse.verseDoctrines)).toBe(true)
    }
  })

  it('PSALM-04: messianic data is an array (empty for non-messianic psalms)', async () => {
    const psalm = await fetchPsalmDetail(23)
    expect(Array.isArray(psalm!.messianicPsalms)).toBe(true)
  })

  it('PSALM-04: at least one of psalms 1-150 has a messianic record', async () => {
    let foundMessianic = false
    for (const id of [2, 16, 22, 110, 118]) { // Common messianic psalms
      const p = await fetchPsalmDetail(id)
      if (p && p.messianicPsalms.length > 0) {
        foundMessianic = true
        break
      }
    }
    expect(foundMessianic).toBe(true)
  })
})
