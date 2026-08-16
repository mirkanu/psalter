/**
 * Change Tune list tiering (TUNE-04).
 *
 * Tier order: the psalm version's recommended (canonical/primary) tune → its 2024 backup tune(s)
 * → tunes historically sung for THIS psalm version → every other matching-meter tune.
 *
 * 2026-08-16 (icon/picker sign-off round): Recommended was previously a per-row Star badge
 * layered on top of whichever tier a tune fell into; it's now its own top-ranked tier, sourced
 * from psalmVersionTunes.isPrimary — a check against real data found only 8 tunes are BOTH
 * isPrimary and isBackup (vs 176 primary-only, 31 backup-only), so these are genuinely distinct
 * categories, not the same concept under two names.
 *
 * The Historical tier is deliberately per-psalm-version (Airtable "Historical CPRC Usage" on
 * Scottish Psalter, resolved in scripts/migrate-tune-backup-historical.ts). The global
 * tunes.weighted_historical_frequency stat is NOT a tier signal — it only breaks ties inside the
 * fourth (Other) tier. See locked decision D-TUNE04-A.
 */
export type TuneTier = 'recommended' | 'backup' | 'historical' | 'other'

export interface TierableTune {
  id: number
  name: string
  weightedHistoricalFrequency?: number | null
}

const TIER_RANK: Record<TuneTier, number> = { recommended: 0, backup: 1, historical: 2, other: 3 }

export function tuneTier(
  tuneId: number,
  recommendedTuneIds: readonly number[],
  backupTuneIds: readonly number[],
  historicalTuneIds: readonly number[],
): TuneTier {
  if (recommendedTuneIds.includes(tuneId)) return 'recommended'
  if (backupTuneIds.includes(tuneId)) return 'backup'
  if (historicalTuneIds.includes(tuneId)) return 'historical'
  return 'other'
}

/**
 * Non-mutating. Recommended/backup/historical tiers sort by name; the "other" tier sorts by
 * weightedHistoricalFrequency DESC, then name.
 */
export function sortTunesByTier<T extends TierableTune>(
  tunes: readonly T[],
  recommendedTuneIds: readonly number[],
  backupTuneIds: readonly number[],
  historicalTuneIds: readonly number[],
): T[] {
  return [...tunes].sort((a, b) => {
    const ta = tuneTier(a.id, recommendedTuneIds, backupTuneIds, historicalTuneIds)
    const tb = tuneTier(b.id, recommendedTuneIds, backupTuneIds, historicalTuneIds)
    if (TIER_RANK[ta] !== TIER_RANK[tb]) return TIER_RANK[ta] - TIER_RANK[tb]
    if (ta === 'other') {
      const fa = a.weightedHistoricalFrequency ?? 0
      const fb = b.weightedHistoricalFrequency ?? 0
      if (fa !== fb) return fb - fa
    }
    return a.name.localeCompare(b.name)
  })
}
