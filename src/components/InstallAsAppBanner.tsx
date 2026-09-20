'use client'

/**
 * InstallAsAppBanner — companion to DesktopOptimisedBanner, mirrored style.
 *
 * The two banners are mutually exclusive: a first-time visitor should see
 * exactly one of them based on the device they're on:
 *   - desktop browser tab              → DesktopOptimisedBanner ("optimised
 *                                        for phones, please rotate / grab
 *                                        your phone")
 *   - phone browser tab (no PWA yet)   → InstallAsAppBanner ("install as an
 *                                        app for full-screen, faster loads")
 *   - desktop OR phone running as PWA  → no banner (the PWA is already the
 *                                        "installed app" form; nothing to
 *                                        tell the user to do)
 *   - dismissed banner                 → no banner (per-browser localStorage
 *                                        flag, never returns)
 *
 * Layout mirrors DesktopOptimisedBanner verbatim: fixed top-14, centred,
 * muted surface, dismiss X button. Same accessibility role="status". Same
 * styling rationale — `/psalms/[id]` uses fixed-height math keyed to the
 * 56px SiteHeader, so this is also fixed-positioned to stay out of the
 * document flow.
 *
 * Quick task 260817-p17 (#17 follow-up).
 */

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
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
      className="fixed top-14 left-1/2 -translate-x-1/2 z-40 max-w-md bg-muted border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 text-sm text-muted-foreground"
    >
      <button
        type="button"
        onClick={handleInstall}
        className="font-medium text-foreground underline-offset-2 hover:underline"
      >
        Install as an app
      </button>
      <span aria-hidden="true">·</span>
      <span>Tap to see how.</span>
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
