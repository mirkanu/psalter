import { describe, it, expect } from 'vitest'
import { db } from '@/db'
import { tunes, psalmVersions, psalmVersionTunes, psalmVersionHistoricalTunes } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { fetchPsalmVersionTuneTiers, fetchTunesByMeter } from '@/db/queries/tunes'

const BACKUP_SAMPLE_PV_AIRTABLE_ID = 'rec0nktaSJL3WGGtk' // links to "Crediton"
const HISTORICAL_SAMPLE_PV_AIRTABLE_ID = 'recVRb3GpPgq6FEKc' // "148 Second Version" -> "Darwall"

describe('TUNE-03: per-tune historical stats', () => {
  it('SUM(historical_usage_count) > 0', async () => {
    const [row] = await db.select({ sum: sql<number>`sum(${tunes.historicalUsageCount})::int` }).from(tunes)
    expect(row.sum).toBeGreaterThan(0)
  })

  it('at least one tune has weighted_historical_frequency > 0', async () => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tunes)
      .where(sql`${tunes.weightedHistoricalFrequency} > 0`)
    expect(row.count).toBeGreaterThan(0)
  })

  it('no tune has weighted_historical_frequency > 1 (fraction, not a percentage)', async () => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tunes)
      .where(sql`${tunes.weightedHistoricalFrequency} > 1`)
    expect(row.count).toBe(0)
  })

  it('every tune has non-null stat columns (NOT NULL DEFAULT 0)', async () => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tunes)
      .where(sql`${tunes.historicalUsageCount} is null or ${tunes.weightedHistoricalFrequency} is null`)
    expect(row.count).toBe(0)
  })
})

describe('TUNE-03: per-psalm-version backup and historical links', () => {
  it('is_backup row count is between 34 and 60', async () => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(psalmVersionTunes)
      .where(eq(psalmVersionTunes.isBackup, true))
    expect(row.count).toBeGreaterThanOrEqual(34)
    expect(row.count).toBeLessThanOrEqual(60)
  })

  it('psalm_version_historical_tunes row count is between 380 and 400', async () => {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(psalmVersionHistoricalTunes)
    expect(row.count).toBeGreaterThanOrEqual(380)
    expect(row.count).toBeLessThanOrEqual(400)
  })

  it('backup spot check: rec0nktaSJL3WGGtk has a backup row joined to Crediton', async () => {
    const [pv] = await db.select({ id: psalmVersions.id }).from(psalmVersions)
      .where(eq(psalmVersions.airtableId, BACKUP_SAMPLE_PV_AIRTABLE_ID))
    expect(pv).toBeDefined()
    const rows = await db
      .select({ name: tunes.name })
      .from(psalmVersionTunes)
      .innerJoin(tunes, eq(tunes.id, psalmVersionTunes.tuneId))
      .where(and(eq(psalmVersionTunes.psalmVersionId, pv.id), eq(psalmVersionTunes.isBackup, true)))
    expect(rows.map((r) => r.name)).toContain('Crediton')
  })

  it('historical spot check: recVRb3GpPgq6FEKc ("148 Second Version") has exactly one historical row, Darwall', async () => {
    const [pv] = await db.select({ id: psalmVersions.id }).from(psalmVersions)
      .where(eq(psalmVersions.airtableId, HISTORICAL_SAMPLE_PV_AIRTABLE_ID))
    expect(pv).toBeDefined()
    const rows = await db
      .select({ name: tunes.name })
      .from(psalmVersionHistoricalTunes)
      .innerJoin(tunes, eq(tunes.id, psalmVersionHistoricalTunes.tuneId))
      .where(eq(psalmVersionHistoricalTunes.psalmVersionId, pv.id))
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Darwall')
  })

  it('regression guard: is_primary count unchanged at 184 (one per psalm version), no duplicate primaries', async () => {
    // NOTE: the plan's acceptance criteria assumed 173, a figure recorded in 10-02-PLAN.md's
    // planning-time research. The live count is actually 184 (one primary per psalm_versions
    // row, 0 missing, 0 duplicates) and was ALREADY 184 before this plan's migration script ran
    // — confirmed by code review: migratePsalmVersionBackupAndHistorical() never writes
    // isPrimary (backup inserts explicitly set isPrimary: false; onConflictDoUpdate's `set`
    // clause touches only isBackup). 173 vs 184 is a pre-existing stale figure in Plan 02's
    // research, not a regression introduced here — asserting the true current baseline instead.
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(psalmVersionTunes)
      .where(eq(psalmVersionTunes.isPrimary, true))
    expect(row.count).toBe(184)

    const dupes = await db
      .select({ psalmVersionId: psalmVersionTunes.psalmVersionId, n: sql<number>`count(*)::int` })
      .from(psalmVersionTunes)
      .where(eq(psalmVersionTunes.isPrimary, true))
      .groupBy(psalmVersionTunes.psalmVersionId)
      .having(sql`count(*) > 1`)
    expect(dupes).toEqual([])
  })
})

describe('TUNE-03: fetchPsalmVersionTuneTiers', () => {
  it('recVRb3GpPgq6FEKc: historicalTuneIds contains Darwall, backupTuneIds is empty', async () => {
    const [pv] = await db.select({ id: psalmVersions.id }).from(psalmVersions)
      .where(eq(psalmVersions.airtableId, HISTORICAL_SAMPLE_PV_AIRTABLE_ID))
    const [darwall] = await db.select({ id: tunes.id }).from(tunes).where(eq(tunes.name, 'Darwall'))
    const tiers = await fetchPsalmVersionTuneTiers(pv.id)
    expect(tiers.historicalTuneIds).toContain(darwall.id)
    expect(tiers.backupTuneIds).toEqual([])
  })

  it('rec0nktaSJL3WGGtk: backupTuneIds contains Crediton', async () => {
    const [pv] = await db.select({ id: psalmVersions.id }).from(psalmVersions)
      .where(eq(psalmVersions.airtableId, BACKUP_SAMPLE_PV_AIRTABLE_ID))
    const [crediton] = await db.select({ id: tunes.id }).from(tunes).where(eq(tunes.name, 'Crediton'))
    const tiers = await fetchPsalmVersionTuneTiers(pv.id)
    expect(tiers.backupTuneIds).toContain(crediton.id)
  })

  it('non-existent psalm version id returns empty arrays, no throw', async () => {
    const tiers = await fetchPsalmVersionTuneTiers(999999)
    expect(tiers.backupTuneIds).toEqual([])
    expect(tiers.historicalTuneIds).toEqual([])
  })

  it("fetchTunesByMeter('CM') rows all expose a numeric weightedHistoricalFrequency in [0, 1]", async () => {
    const rows = await fetchTunesByMeter('CM')
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(typeof row.weightedHistoricalFrequency).toBe('number')
      expect(row.weightedHistoricalFrequency).toBeGreaterThanOrEqual(0)
      expect(row.weightedHistoricalFrequency).toBeLessThanOrEqual(1)
    }
  })
})
