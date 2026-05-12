'use client'

/**
 * Thin client-boundary wrapper that holds the next/dynamic ssr:false import of AbcPlayer.
 *
 * Next.js Turbopack does not allow `ssr: false` in next/dynamic calls placed in
 * Server Components — the dynamic() call with ssr:false must live in a 'use client' file.
 * This wrapper satisfies that constraint while keeping RSC consumers (TunePage, etc.) as RSCs.
 *
 * Per CLAUDE.md: abcjs manipulates the DOM directly and MUST be loaded via
 * dynamic(..., { ssr: false }).
 */

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const AbcPlayer = dynamic(() => import('@/components/AbcPlayer'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full max-w-3xl mx-auto rounded-md" />,
})

interface AbcPlayerSectionProps {
  abc: string
  title?: string
  staffJpgUrl?: string | null
  solfegeJpgUrl?: string | null
  tuneName?: string
  initialMode?: 'staff' | 'solfege'
}

export function AbcPlayerSection(props: AbcPlayerSectionProps) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full max-w-3xl mx-auto rounded-md" />}>
      <AbcPlayer {...props} />
    </Suspense>
  )
}
