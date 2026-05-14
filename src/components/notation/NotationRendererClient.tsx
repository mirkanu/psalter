'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { NotationRendererProps } from './NotationRenderer'

/**
 * Client wrapper enforcing the CLAUDE.md abcjs client-only rule:
 *   - dynamic import with SSR disabled for the abcjs-using NotationRenderer
 *   - Suspense with a skeleton fallback for the lazy chunk
 *
 * Consumers (psalm/tune detail pages, RSCs) should import this wrapper,
 * not NotationRenderer directly. Plan 05 wires this into the routes.
 */
const NotationRenderer = dynamic(
  () => import('./NotationRenderer').then((m) => m.NotationRenderer),
  { ssr: false },
)

export function NotationRendererClient(props: NotationRendererProps) {
  return (
    <Suspense fallback={<Skeleton className="h-52 w-full rounded-md" />}>
      <NotationRenderer {...props} />
    </Suspense>
  )
}

export type { NotationRendererProps }
