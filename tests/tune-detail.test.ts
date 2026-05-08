import { describe, it, expect } from 'vitest'
import { fetchTuneDetail, fetchTuneIds, fetchAllTunes } from '@/db/queries/tunes'
import { toEmbedUrl } from '@/lib/youtube'

describe('Tune detail data shape (TUNE-01)', () => {
  it('fetchAllTunes returns 172 tunes with id, name, meter', async () => {
    const tunes = await fetchAllTunes()
    expect(tunes.length).toBeGreaterThanOrEqual(170)
    expect(tunes[0]).toHaveProperty('id')
    expect(tunes[0]).toHaveProperty('name')
    expect(tunes[0]).toHaveProperty('meter')
  })

  it('fetchTuneIds returns identifiers for every tune', async () => {
    const ids = await fetchTuneIds()
    expect(ids.length).toBeGreaterThanOrEqual(170)
  })

  it('first tune in the index resolves to a detail object with junction relations', async () => {
    const ids = await fetchTuneIds()
    const tune = await fetchTuneDetail(ids[0])
    expect(tune).toBeDefined()
    expect(Array.isArray(tune!.psalmVersionTunes)).toBe(true)
    expect(Array.isArray(tune!.tuneMoods)).toBe(true)
  })

  it('at least one tune has a score_jpg_url', async () => {
    const tunes = await fetchAllTunes()
    const withScore = tunes.filter((t) => t.scoreJpgUrl)
    expect(withScore.length).toBeGreaterThan(0)
  })

  it('at least one tune has a YouTube URL that toEmbedUrl can convert', async () => {
    const ids = await fetchTuneIds()
    let foundEmbeddable = false
    for (const id of ids.slice(0, 50)) {
      const t = await fetchTuneDetail(id)
      if (t && t.youtubeUrl && toEmbedUrl(t.youtubeUrl)) {
        foundEmbeddable = true
        break
      }
    }
    expect(foundEmbeddable).toBe(true)
  })
})

describe('Seeded ABC notation (TUNE-02)', () => {
  it('at least one tune has non-null abc_notation after Phase 4 seed', async () => {
    const allIds = await fetchTuneIds()
    let foundWithAbc = 0
    let sampleAbc: string | null = null
    for (const id of allIds) {
      const t = await fetchTuneDetail(id)
      if (t?.abcNotation) {
        foundWithAbc++
        sampleAbc = t.abcNotation
        if (foundWithAbc >= 1 && sampleAbc.length > 50) break
      }
    }
    expect(foundWithAbc).toBeGreaterThanOrEqual(1)
    expect(sampleAbc).toBeTruthy()
    expect(sampleAbc!.length).toBeGreaterThan(50)
    expect(sampleAbc).toMatch(/^X:/m)
    expect(sampleAbc).toMatch(/^K:/m)
  })

  it('seed covers at least one Common Meter tune', async () => {
    // CM tunes seeded: Dundee, French, Elgin (meter value in DB is 'CM')
    const allIds = await fetchTuneIds()
    let cmWithAbc = false
    for (const id of allIds) {
      const t = await fetchTuneDetail(id)
      if (t?.abcNotation && t.meter === 'CM') {
        cmWithAbc = true
        break
      }
    }
    expect(cmWithAbc).toBe(true)
  })
})
