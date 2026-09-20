'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { isPhoneDevice, isStandaloneDisplayMode } from '@/lib/device'

const STORAGE_KEY = 'psalter.desktopBannerDismissed'

function readDismissed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Private mode / storage disabled — default to dismissed so we don't
    // crash the root layout if storage throws.
    return true
  }
}

interface ClientHints {
  isPhone: boolean
  isStandalone: boolean
}

function readClient(): ClientHints {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return { isPhone: false, isStandalone: false }
  }
  return {
    isPhone: isPhoneDevice(),
    isStandalone: isStandaloneDisplayMode(),
  }
}

/**
 * Quick task 260817-p17: desktop-only banner telling visitors the site is
 * phone-first. Dismissal is permanent per browser (localStorage, not
 * sessionStorage/state) — once closed it never returns, even after reload.
 *
 * Hide on phones and on home-screen-installed PWA instances even when the
 * viewport is ≥768px — those environments would see a confusing "optimised for
 * phones" message despite already being on the phone-shaped target. Only show
 * the banner to desktop visitors in a regular browser tab.
 *
 * Fixed positioning is required (not document flow): `/psalms/[id]` uses
 * `h-[calc(100vh-3.5rem)]` fixed-height math keyed to the 56px SiteHeader,
 * and an in-flow banner would overflow that layout. Top-centre placement
 * directly under the 56px SiteHeader (top-14) keeps the message prominent
 * for first-time desktop visitors without obscuring page content.
 */
export function DesktopOptimisedBanner() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  // Read the dismissal flag at mount (SSR-safe: returns true on the server,
  // so the SSR markup never includes the banner). After hydration on the
  // client, the initializer runs once and returns the stored value.
  const [dismissed, setDismissed] = useState(readDismissed)
  // navigator / matchMedia are unavailable on the server — default to "not a
  // phone, not standalone" so the SSR markup hides the banner, then resolve
  // the real values in a post-mount effect.
  const [client, setClient] = useState<ClientHints>(() => ({
    isPhone: false,
    isStandalone: false,
  }))

  useEffect(() => {
    setClient(readClient())
  }, [])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Private mode / storage disabled — dismissal still hides it for this
      // page view, it just won't persist across reloads.
    }
  }, [])

  if (!isDesktop || dismissed) return null
  if (client.isPhone || client.isStandalone) return null

  return (
    <div
      role="status"
      className="fixed top-14 left-1/2 -translate-x-1/2 z-40 max-w-md bg-muted border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 text-sm text-muted-foreground"
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
