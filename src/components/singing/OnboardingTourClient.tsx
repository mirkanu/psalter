'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { OnboardingTour } from './OnboardingTour'

const LazyOnboardingTour = dynamic(
  () => import('./OnboardingTour').then((m) => m.OnboardingTour),
  { ssr: false },
)

export type OnboardingTourProps = ComponentProps<typeof OnboardingTour>

/**
 * Dynamic-import wrapper for OnboardingTour. The tour is a one-time
 * intro shown several seconds after first visit; it has zero visible
 * presence on initial paint. Deferring it removes its useEffect +
 * localStorage reads + `Hand` lucide-icon import from the initial
 * psalm-detail bundle. Suspense fallback is null — the tour is not
 * visible during the lazy chunk load.
 */
export function OnboardingTourClient(props: OnboardingTourProps) {
  return (
    <Suspense fallback={null}>
      <LazyOnboardingTour {...props} />
    </Suspense>
  )
}
