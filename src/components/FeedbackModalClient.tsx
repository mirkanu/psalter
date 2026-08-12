'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { FeedbackModal } from './FeedbackModal'

const LazyFeedbackModal = dynamic(
  () => import('./FeedbackModal').then((m) => m.FeedbackModal),
  { ssr: false },
)

export type FeedbackModalProps = ComponentProps<typeof FeedbackModal>

/**
 * Dynamic-import wrapper for FeedbackModal. SiteHeader lives in the root
 * layout, so anything it imports eagerly hydrates on EVERY route. The feedback
 * dialog is only reachable from the mobile hamburger menu, so its form
 * `Input`/`Label`/`Textarea`/`Checkbox` shadcn primitives have no business
 * in the initial bundle of every page. Null fallback: the dialog is closed by
 * default, so there is nothing to placehold and no CLS to avoid.
 */
export function FeedbackModalClient(props: FeedbackModalProps) {
  return (
    <Suspense fallback={null}>
      <LazyFeedbackModal {...props} />
    </Suspense>
  )
}
