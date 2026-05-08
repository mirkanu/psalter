import { describe, it, expect } from 'vitest'
import { fetchPsalmIds, fetchPsalmDetail } from '@/db/queries/psalms'
import { fetchTuneIds } from '@/db/queries/tunes'
import { fetchAllDailyReadings } from '@/db/queries/daily'

describe('Phase 2 query helpers', () => {
  it('fetchPsalmIds returns all 150 psalm ids in ascending order', async () => {
    const ids = await fetchPsalmIds()
    expect(ids).toHaveLength(150)
    expect(ids[0]).toBe(1)
    expect(ids[149]).toBe(150)
  })

  it('fetchPsalmDetail(23) returns psalm with verses, versions, and traversal data', async () => {
    const psalm = await fetchPsalmDetail(23)
    expect(psalm).toBeDefined()
    expect(psalm!.id).toBe(23)
    expect(Array.isArray(psalm!.psalmVersions)).toBe(true)
    expect(psalm!.psalmVersions.length).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(psalm!.verses)).toBe(true)
    expect(Array.isArray(psalm!.sectionHeadings)).toBe(true)
    expect(Array.isArray(psalm!.messianicPsalms)).toBe(true)
    // Confirm junction traversal works (does not throw)
    const firstVersion = psalm!.psalmVersions[0]
    expect(Array.isArray(firstVersion.psalmVersionTunes)).toBe(true)
  })

  it('fetchPsalmDetail returns undefined for non-existent id', async () => {
    const psalm = await fetchPsalmDetail(9999)
    expect(psalm).toBeUndefined()
  })

  it('fetchAllDailyReadings returns 365 entries with psalm relation', async () => {
    const readings = await fetchAllDailyReadings()
    expect(readings).toHaveLength(365)
    expect(readings[0]).toHaveProperty('psalm')
  })

  it('fetchTuneIds returns at least 1 id', async () => {
    const ids = await fetchTuneIds()
    expect(ids.length).toBeGreaterThan(0)
  })
})
