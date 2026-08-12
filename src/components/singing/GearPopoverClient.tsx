'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { GearPopover } from './GearPopover'

const LazyGearPopover = dynamic(
  () => import('./GearPopover').then((m) => m.GearPopover),
  { ssr: false },
)

export type GearPopoverProps = ComponentProps<typeof GearPopover>

/**
 * Dynamic-import wrapper for GearPopover. Defers the popover UI,
 * lucide icons, and computeInlineLayoutDisabled import off the
 * initial psalm-detail bundle. The popover only opens on tap, so a
 * null Suspense fallback is correct.
 */
export function GearPopoverClient(props: GearPopoverProps) {
  return (
    <Suspense fallback={null}>
      <LazyGearPopover {...props} />
    </Suspense>
  )
}
