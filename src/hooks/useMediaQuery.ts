'use client'

import { useEffect, useState } from 'react'

/**
 * SSR-safe `useMediaQuery` hook (D-21 axis B trigger).
 *
 * - Returns `false` during SSR and the first client paint (landscape-narrow is
 *   the exception, never the default).
 * - After mount, subscribes to `window.matchMedia(query)`'s `change` event and
 *   tracks the current match state.
 * - Cleans up listener on unmount and re-subscribes when `query` changes.
 * - Guarded against `typeof window === 'undefined'` and missing `matchMedia`.
 *
 * @example
 *   const isLandscapeNarrow = useMediaQuery('(orientation: landscape) and (max-width: 900px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [query])

  return matches
}
