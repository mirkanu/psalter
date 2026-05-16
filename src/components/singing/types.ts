import type { AlternateTune } from '@/db/queries/tunes'

export type TuneOption = AlternateTune

/**
 * RESEARCH Open Q §1 resolution: "Recommended" = tunes editorially linked
 * via psalmVersionTunes for this psalm (passed in by parent); "Other" =
 * meter-matched alts NOT in that editorial set; current is highlighted.
 */
export interface TuneSwitcherSections {
  current: TuneOption | null
  recommended: TuneOption[]
  other: TuneOption[]
}
