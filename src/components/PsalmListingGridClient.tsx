'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import PsalmsLoading from '@/app/psalms/loading'
import type { PsalmRow } from './PsalmListingGrid'

const LazyGrid = dynamic(
  () => import('./PsalmListingGrid').then((m) => m.PsalmListingGrid),
  { ssr: false },
)

interface Props {
  psalms: PsalmRow[]
  onSelect?: (row: PsalmRow) => void
  hideExport?: boolean
}

export function PsalmListingGridClient(props: Props) {
  return (
    <Suspense fallback={<PsalmsLoading />}>
      <LazyGrid {...props} />
    </Suspense>
  )
}