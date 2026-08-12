'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { PlayMiniBar } from './PlayMiniBar'

const LazyPlayMiniBar = dynamic(
  () => import('./PlayMiniBar').then((m) => m.PlayMiniBar),
  { ssr: false },
)

export type PlayMiniBarProps = ComponentProps<typeof PlayMiniBar>

export function PlayMiniBarClient(props: PlayMiniBarProps) {
  return (
    <Suspense fallback={<div className="h-[44px]" aria-hidden />}>
      <LazyPlayMiniBar {...props} />
    </Suspense>
  )
}