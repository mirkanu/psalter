'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { PsalmPickerModal } from './PsalmPickerModal'

const LazyPsalmPickerModal = dynamic(
  () => import('./PsalmPickerModal').then((m) => m.PsalmPickerModal),
  { ssr: false },
)

export type PsalmPickerModalProps = ComponentProps<typeof PsalmPickerModal>

/**
 * Dynamic-import wrapper for PsalmPickerModal. Deferrs the modal's full
 * dependency tree (PsalmListingGrid + useLocalStorage hydration + lucide
 * icons + Dialog UI) off the initial psalm-detail bundle. Modal renders
 * nothing visible on mount (`open={false}` until user taps picker), so
 * the Suspense fallback is a hidden sentinel — guarantees no CLS when
 * the modal is finally opened.
 */
export function PsalmPickerModalClient(props: PsalmPickerModalProps) {
  return (
    <Suspense fallback={null}>
      <LazyPsalmPickerModal {...props} />
    </Suspense>
  )
}
