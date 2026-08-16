'use client'
import { Fragment } from 'react'
import type { ReactNode } from 'react'
import type { PsalmVersionTuneTiers } from '@/db/queries/tunes'
import { sortTunesByTier, tuneTier, type TuneTier } from '@/lib/tune-tiers'

/**
 * Shared tiered tune row list (Phase 11, TSEL-01 / D-12 / D-13).
 *
 * Owns exactly three things: the Backup → Historical → Other sort, the "emit a section heading when the
 * tier changes" walk, and row iteration. It deliberately does NOT own filtering/search chrome or the row
 * visual — each container (Sheet for the Sing view, compact Dialog for the Study tab, Dialog+TuneTable for
 * the precentor) keeps its own container and passes an already-filtered `tunes` array plus its own
 * `renderRow`. Per D-12 the three pickers are NOT forced into one visual shell.
 */
export interface TieredRowTune {
  id: number
  name: string | null
  weightedHistoricalFrequency?: number | null
}

export interface TieredTuneRow<T extends TieredRowTune> {
  tune: T
  tier: TuneTier
  isCurrent: boolean
  /** Non-null on the first row of each tier — the section heading to render above it. */
  heading: string | null
}

export const DEFAULT_TIER_LABELS: Record<TuneTier, string> = {
  recommended: 'Recommended',
  backup: 'Backup tune',
  historical: 'Historically sung for this psalm',
  other: 'Other tunes in this meter',
}

/**
 * Pure. Sorts via sortTunesByTier (reused unmodified) using an index projection so the caller's original
 * objects — which may have `name: null`, unlike TierableTune's `name: string` — are returned by identity.
 */
export function buildTieredTuneRows<T extends TieredRowTune>(
  tunes: readonly T[],
  tuneTiers?: PsalmVersionTuneTiers | null,
  currentTuneId?: number | null,
  tierLabels: Partial<Record<TuneTier, string>> = {},
): TieredTuneRow<T>[] {
  const recommendedTuneIds = tuneTiers?.recommendedTuneIds ?? []
  const backupTuneIds = tuneTiers?.backupTuneIds ?? []
  const historicalTuneIds = tuneTiers?.historicalTuneIds ?? []
  const projected = tunes.map((t, index) => ({
    id: t.id,
    name: t.name ?? '',
    weightedHistoricalFrequency: t.weightedHistoricalFrequency,
    index,
  }))
  const sorted = sortTunesByTier(projected, recommendedTuneIds, backupTuneIds, historicalTuneIds)
  const labels = { ...DEFAULT_TIER_LABELS, ...tierLabels }
  let prevTier: TuneTier | null = null
  return sorted.map((p) => {
    const tune = tunes[p.index]
    const tier = tuneTier(tune.id, recommendedTuneIds, backupTuneIds, historicalTuneIds)
    const heading = tier === prevTier ? null : labels[tier]
    prevTier = tier
    return { tune, tier, isCurrent: currentTuneId != null && tune.id === currentTuneId, heading }
  })
}

interface TieredTuneRowListProps<T extends TieredRowTune> {
  tunes: readonly T[]
  /** null/undefined = no tier data available; everything falls into the 'other' tier. */
  tuneTiers?: PsalmVersionTuneTiers | null
  currentTuneId?: number | null
  renderRow: (row: TieredTuneRow<T>) => ReactNode
  /** Defaults to the Study-tab heading markup. Override for <tr>-based containers (Plan 06). */
  renderHeading?: (args: { tier: TuneTier; label: string }) => ReactNode
  tierLabels?: Partial<Record<TuneTier, string>>
  /**
   * 'div' (default) wraps each heading+row pair in a <div key>, preserving the study-tab picker's
   * existing `grid gap-1` spacing exactly. 'fragment' emits no wrapper element — required inside
   * <tbody>, where a <div> would be invalid HTML.
   */
  itemWrapper?: 'div' | 'fragment'
}

function defaultRenderHeading({ tier, label }: { tier: TuneTier; label: string }) {
  return (
    <p
      data-tune-tier-heading={tier}
      className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {label}
    </p>
  )
}

export function TieredTuneRowList<T extends TieredRowTune>({
  tunes,
  tuneTiers,
  currentTuneId,
  renderRow,
  renderHeading = defaultRenderHeading,
  tierLabels,
  itemWrapper = 'div',
}: TieredTuneRowListProps<T>) {
  const rows = buildTieredTuneRows(tunes, tuneTiers, currentTuneId, tierLabels)
  return (
    <>
      {rows.map((row) => {
        const content = (
          <>
            {row.heading && renderHeading({ tier: row.tier, label: row.heading })}
            {renderRow(row)}
          </>
        )
        return itemWrapper === 'fragment'
          ? <Fragment key={row.tune.id}>{content}</Fragment>
          : <div key={row.tune.id}>{content}</div>
      })}
    </>
  )
}
