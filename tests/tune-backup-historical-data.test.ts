import { describe, it, expect } from 'vitest'
import { db } from '@/db'
import { tunes } from '@/db/schema'
import { sql } from 'drizzle-orm'

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
