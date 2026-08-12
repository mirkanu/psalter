'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { GlobalSearch } from './GlobalSearch'

const LazyGlobalSearch = dynamic(
  () => import('./GlobalSearch').then((m) => m.GlobalSearch),
  { ssr: false },
)

export type GlobalSearchProps = ComponentProps<typeof GlobalSearch>

/**
 * Dynamic-import wrapper for GlobalSearch. SiteHeader lives in the root
 * layout, so anything it imports eagerly hydrates on EVERY route. The search
 * dialog is only reachable behind the search button, so its Dialog subtree,
 * lucide icons, and result-rendering helpers have no business in the initial
 * bundle of every page. Null fallback: the dialog is closed by default, so
 * there is nothing to placehold and no CLS to avoid.
 */
export function GlobalSearchClient(props: GlobalSearchProps) {
  return (
    <Suspense fallback={null}>
      <LazyGlobalSearch {...props} />
    </Suspense>
  )
}
