/**
 * Change Tune list tiering (TUNE-04).
 *
 * Tier order: this psalm version's 2024 backup tune(s) → tunes historically sung for THIS psalm
 * version → every other matching-meter tune.
 *
 * The Historical tier is deliberately per-psalm-version (Airtable "Historical CPRC Usage" on
 * Scottish Psalter, resolved in scripts/migrate-tune-backup-historical.ts). The global
 * tunes.weighted_historical_frequency stat is NOT a tier signal — it only breaks ties inside the
 * third tier. See locked decision D-TUNE04-A.
 */
export type TuneTier = 'backup' | 'historical' | 'other'

export interface TierableTune {
  id: number
  name: string
  weightedHistoricalFrequency?: number | null
}

const TIER_RANK: Record<TuneTier, number> = { backup: 0, historical: 1, other: 2 }

export function tuneTier(
  tuneId: number,
  backupTuneIds: readonly number[],
  historicalTuneIds: readonly number[],
): TuneTier {
  if (backupTuneIds.includes(tuneId)) return 'backup'
  if (historicalTuneIds.includes(tuneId)) return 'historical'
  return 'other'
}

/**
 * Non-mutating. Backup and historical tiers sort by name; the "other" tier sorts by
 * weightedHistoricalFrequency DESC, then name.
 */
export function sortTunesByTier<T extends TierableTune>(
  tunes: readonly T[],
  backupTuneIds: readonly number[],
  historicalTuneIds: readonly number[],
): T[] {
  return [...tunes].sort((a, b) => {
    const ta = tuneTier(a.id, backupTuneIds, historicalTuneIds)
    const tb = tuneTier(b.id, backupTuneIds, historicalTuneIds)
    if (TIER_RANK[ta] !== TIER_RANK[tb]) return TIER_RANK[ta] - TIER_RANK[tb]
    if (ta === 'other') {
      const fa = a.weightedHistoricalFrequency ?? 0
      const fb = b.weightedHistoricalFrequency ?? 0
      if (fa !== fb) return fb - fa
    }
    return a.name.localeCompare(b.name)
  })
}
