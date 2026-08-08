import { describe, it, expect } from 'vitest'
import { db } from '@/db'
import { psalmVersionTunes, psalmVersions, tunes } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'

const PS148B_AIRTABLE_ID = 'recVRb3GpPgq6FEKc' // "148 (Second Version, Recommended)"

describe('TUNE-01: primary tune uniqueness (data state)', () => {
  it('no psalm_version_id has more than one is_primary row', async () => {
    const dupes = await db
      .select({ psalmVersionId: psalmVersionTunes.psalmVersionId, n: sql<number>`count(*)::int` })
      .from(psalmVersionTunes)
      .where(eq(psalmVersionTunes.isPrimary, true))
      .groupBy(psalmVersionTunes.psalmVersionId)
      .having(sql`count(*) > 1`)
    expect(dupes).toEqual([])
  })

  it('Psalm 148 Second Version has exactly one primary tune, and it is Darwall', async () => {
    const [pv] = await db.select({ id: psalmVersions.id }).from(psalmVersions)
      .where(eq(psalmVersions.airtableId, PS148B_AIRTABLE_ID))
    expect(pv).toBeDefined()
    const primaries = await db
      .select({ tuneId: psalmVersionTunes.tuneId, name: tunes.name })
      .from(psalmVersionTunes)
      .innerJoin(tunes, eq(tunes.id, psalmVersionTunes.tuneId))
      .where(and(eq(psalmVersionTunes.psalmVersionId, pv.id), eq(psalmVersionTunes.isPrimary, true)))
    expect(primaries).toHaveLength(1)
    expect(primaries[0].name).toBe('Darwall')
  })
})
