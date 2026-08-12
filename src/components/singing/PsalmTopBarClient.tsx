'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { PsalmTopBar } from './PsalmTopBar'

const LazyPsalmTopBar = dynamic(
  () => import('./PsalmTopBar').then((m) => m.PsalmTopBar),
  { ssr: false },
)

export type PsalmTopBarProps = ComponentProps<typeof PsalmTopBar>

/**
 * Dynamic-import wrapper for PsalmTopBar. Defers the top chrome's
 * useEffect + useLayoutEffect + useTransition (keyboard nav, scroll
 * listener, viewport-aware back-button logic) off the initial psalm-detail
 * bundle. The bar is small but its hydration competes with the framework
 * runtime's 888ms long-task on psalm-detail. Suspense fallback is a
 * static height placeholder (h-12 = 48px) so no CLS is introduced while
 * the lazy chunk loads.
 */
export function PsalmTopBarClient(props: PsalmTopBarProps) {
  return (
    <Suspense fallback={<div className="h-12" aria-hidden />}>
      <LazyPsalmTopBar {...props} />
    </Suspense>
  )
}
