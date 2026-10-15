'use client'

/**
 * Dynamic-import ssr:false wrapper for FirstVisitModal.
 *
 * Mirrors `OnboardingTourClient.tsx` exactly — the modal is a one-time intro
 * shown on first visit; it has zero visible presence on subsequent visits.
 * Deferring it removes its localStorage reads + Dialog primitive + lucide-icon
 * imports from the initial psalm-detail bundle.
 */
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { FirstVisitModal } from './FirstVisitModal'

const LazyFirstVisitModal = dynamic(
  () => import('./FirstVisitModal').then((m) => m.FirstVisitModal),
  { ssr: false },
)

export type FirstVisitModalProps = ComponentProps<typeof FirstVisitModal>

export function FirstVisitModalClient(props: FirstVisitModalProps) {
  return (
    <Suspense fallback={null}>
      <LazyFirstVisitModal {...props} />
    </Suspense>
  )
}

export default FirstVisitModalClient