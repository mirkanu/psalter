'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const STORAGE_KEY = 'psalter.desktopBannerDismissed'

/**
 * Quick task 260817-p17: desktop-only banner telling visitors the site is
 * phone-first. Dismissal is permanent per browser (localStorage, not
 * sessionStorage/state) — once closed it never returns, even after reload.
 *
 * Fixed positioning is required (not document flow): `/psalms/[id]` uses
 * `h-[calc(100vh-3.5rem)]` fixed-height math keyed to the 56px SiteHeader,
 * and an in-flow banner would overflow that layout. Bottom-centre placement
 * (with `max-w-md`) keeps it clear of the Toaster, which sits bottom-right
 * with an 88px offset (see `layout.tsx`).
 */
export function DesktopOptimisedBanner() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  // Start dismissed (hidden) and only flip to visible once the mount effect
  // confirms no stored dismissal flag exists — avoids a flash-then-hide for
  // returning desktop visitors who already dismissed it.
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== '1') {
        setDismissed(false)
      }
    } catch {
      // Private mode / storage disabled — leave dismissed (hidden) rather
      // than crash the root layout.
    }
  }, [])

  function handleDismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Private mode / storage disabled — dismissal still hides it for this
      // page view, it just won't persist across reloads.
    }
  }

  if (!isDesktop || dismissed) return null

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-md bg-muted border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 text-sm text-muted-foreground"
    >
      <span>This website is optimised for use on phones.</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-md hover:bg-background transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
