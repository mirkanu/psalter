'use client'

/**
 * InstallAsAppBanner — companion to DesktopOptimisedBanner, mirrored style.
 *
 * The two banners are mutually exclusive: a first-time visitor should see
 * exactly one of them based on the device they're on:
 *   - desktop browser tab              → DesktopOptimisedBanner ("optimised
 *                                        for phones, please rotate / grab
 *                                        your phone")
 *   - phone browser tab (no PWA yet)   → InstallAsAppBanner (orange-tinted
 *                                        brand banner inviting a PWA install)
 *   - desktop OR phone running as PWA  → no banner (the PWA is already the
 *                                        "installed app" form; nothing to
 *                                        tell the user to do)
 *   - dismissed banner                 → no banner (per-browser localStorage
 *                                        flag, never returns)
 *
 * Layout mirrors DesktopOptimisedBanner verbatim: fixed top-16 (one Tailwind step below the header) so the banner breathes below the nav, centred,
 * muted surface, dismiss X button. Same accessibility role="status". Same
 * styling rationale — `/psalms/[id]` uses fixed-height math keyed to the
 * 56px SiteHeader, so this is also fixed-positioned to stay out of the
 * document flow.
 *
 * Quick task 260817-p17 (#17 follow-up).
 */

import { useCallback, useEffect, useState } from 'react'
import { Smartphone, X } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { isPhoneDevice, isStandaloneDisplayMode } from '@/lib/device'
import { openInstallDialog } from '@/lib/install-dialog-store'

const STORAGE_KEY = 'psalter.installBannerDismissed'

function readDismissed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
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

export function InstallAsAppBanner(): React.ReactElement | null {
  // Show only on the phone-shaped viewport. The complement banner
  // (DesktopOptimisedBanner) covers ≥768px; this one covers <768px.
  const isPhoneView = useMediaQuery('(max-width: 767px)')

  const [dismissed, setDismissed] = useState(readDismissed)
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

  const handleInstall = useCallback(() => {
    // Open the platform-aware install dialog (also dismisses the banner so
    // it doesn't sit on top of the modal).
    handleDismiss()
    openInstallDialog()
  }, [handleDismiss])

  if (!isPhoneView || dismissed) return null
  // Don't show on desktop (defensive — isPhoneView covers the phone branch,
  // but matchMedia and viewport can disagree in iPadOS split-view) or on
  // already-installed PWAs (the user already took the action the banner
  // would have prompted for).
  if (!client.isPhone || client.isStandalone) return null

  return (
    <div
      role="status"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-1.5rem)] max-w-md rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 backdrop-blur-md shadow-xl shadow-primary/10 px-3.5 py-2.5 flex items-center gap-3 text-sm text-foreground"
    >
      <span
        aria-hidden="true"
        className="grid place-items-center size-8 shrink-0 rounded-full bg-primary/15 text-primary"
      >
        <Smartphone className="size-4" />
      </span>
      <div className="min-w-0 flex-1 flex items-baseline gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleInstall}
          className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
        >
          Install as an app
        </button>
        <span className="text-muted-foreground">for full-screen and faster loads.</span>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={handleDismiss}
        className="shrink-0 -mr-1 p-1.5 rounded-full text-muted-foreground hover:bg-primary/15 hover:text-foreground focus-visible:bg-primary/15 focus-visible:text-foreground transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
