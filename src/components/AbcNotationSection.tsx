'use client'

/**
 * Thin client-boundary wrapper that holds the next/dynamic ssr:false import of AbcRenderer.
 *
 * Next.js 16 Turbopack does not allow `ssr: false` in next/dynamic calls placed in
 * Server Components — the dynamic() call with ssr:false must live in a 'use client' file.
 * This wrapper satisfies that constraint while keeping TunePage itself as an RSC.
 *
 * Per CLAUDE.md: abcjs manipulates the DOM directly. AbcRenderer must be loaded via
 * dynamic(..., { ssr: false }) and must only render client-side.
 */

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const AbcRenderer = dynamic(() => import('@/components/AbcRenderer'), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full max-w-3xl mx-auto rounded-md" />,
})

interface AbcNotationSectionProps {
  abc: string
  title?: string
}

export function AbcNotationSection({ abc, title }: AbcNotationSectionProps) {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full max-w-3xl mx-auto rounded-md" />}>
      <AbcRenderer abc={abc} title={title} />
    </Suspense>
  )
}
