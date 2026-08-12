'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { TuneSwitcherSheet } from './TuneSwitcherSheet'

const LazyTuneSwitcherSheet = dynamic(
  () => import('./TuneSwitcherSheet').then((m) => m.TuneSwitcherSheet),
  { ssr: false },
)

export type TuneSwitcherSheetProps = ComponentProps<typeof TuneSwitcherSheet>

/**
 * Dynamic-import wrapper for TuneSwitcherSheet. Defers the Sheet UI,
 * TieredTuneRowList import, and useRouter hooks off the initial
 * psalm-detail bundle. The sheet only opens on user tap, so a null
 * Suspense fallback is correct (no CLS — sheet is hidden by default).
 */
export function TuneSwitcherSheetClient(props: TuneSwitcherSheetProps) {
  return (
    <Suspense fallback={null}>
      <LazyTuneSwitcherSheet {...props} />
    </Suspense>
  )
}
