'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { AlternateTune } from '@/db/queries/tunes'

const PsalmNotationPlayer = dynamic(
  () => import('@/components/PsalmNotationPlayer').then((m) => m.PsalmNotationPlayer),
  { ssr: false }
)

interface PsalmNotationPlayerClientProps {
  abc: string | null
  lyrics: string
  scoreJpgUrl: string | null
  solfegeJpgUrl: string | null
  tuneName: string
  tuneMeter: string | null
  tuneId: number | null
  alternateTunes: AlternateTune[]
  onChangeTune: (tune: AlternateTune) => void
}

/**
 * Thin client wrapper that hosts the ssr:false dynamic import.
 * next/dynamic with ssr:false cannot be used in RSC (Server Components) —
 * it must live in a 'use client' file. This wrapper provides that boundary
 * so page.tsx (an async RSC) can render the notation player.
 */
export function PsalmNotationPlayerClient(props: PsalmNotationPlayerClientProps) {
  return (
    <Suspense fallback={<Skeleton className="h-52 w-full rounded-md" />}>
      <PsalmNotationPlayer {...props} />
    </Suspense>
  )
}
