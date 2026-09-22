'use client'

/**
 * InstallDialogHost — owns the "Install on your phone" Dialog so the
 * SiteHeader menu item, the InstallAsAppBanner CTA, and any future entry
 * point can all open the same dialog without re-rendering its content.
 *
 * Mounted once at the root layout (next to DesktopOptimisedBanner /
 * InstallAsAppBanner). The Dialog is rendered inside a portal at the
 * document root, so the host's position in the React tree does not affect
 * where it appears.
 *
 * Platform-specific instructions use SSR-safe detection (window is only
 * read after mount) so the first paint never mis-classifies a phone UA.
 *
 * Quick task 260817-p17 (#17 follow-up).
 */

import { useEffect, useState } from 'react'
import { MoreHorizontal, MoreVertical } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  isAndroidPhoneDevice,
  isIOSDevice,
  isPhoneDevice,
  isStandaloneDisplayMode,
} from '@/lib/device'
import {
  closeInstallDialog,
  useInstallDialogOpen,
} from '@/lib/install-dialog-store'

interface PlatformHints {
  isIOS: boolean
  isAndroidPhone: boolean
  isPhone: boolean
  isStandalone: boolean
}

function readPlatform(): PlatformHints {
  if (typeof navigator === 'undefined') {
    return { isIOS: false, isAndroidPhone: false, isPhone: false, isStandalone: false }
  }
  return {
    isIOS: isIOSDevice(),
    isAndroidPhone: isAndroidPhoneDevice(),
    isPhone: isPhoneDevice(),
    isStandalone: isStandaloneDisplayMode(),
  }
}

export function InstallDialogHost(): React.ReactElement | null {
  const open = useInstallDialogOpen()
  const [platform, setPlatform] = useState<PlatformHints>(() => ({
    isIOS: false,
    isAndroidPhone: false,
    isPhone: false,
    isStandalone: false,
  }))

  useEffect(() => {
    setPlatform(readPlatform())
  }, [])

  // If the visitor somehow opens the dialog after the app has been
  // installed (rare race: install completes while the dialog is up), close
  // it automatically — the menu gate would also have hidden the trigger.
  useEffect(() => {
    if (open && platform.isStandalone) {
      closeInstallDialog()
    }
  }, [open, platform.isStandalone])

  if (!open) return null

  const platformTag = platform.isIOS
    ? 'ios'
    : platform.isAndroidPhone
      ? 'android'
      : platform.isPhone
        ? 'phone'
        : 'unknown'

  return (
    <Dialog open onOpenChange={(v) => !v && closeInstallDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Install on your phone</DialogTitle></DialogHeader>
        <div
          className="space-y-3 text-sm text-muted-foreground"
          data-install-instructions
          data-platform={platformTag}
        >
          {platform.isIOS ? (
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Open the page-actions menu (the{' '}
                <MoreHorizontal
                  className="inline align-[-0.125em] text-foreground"
                  size={16}
                  strokeWidth={2.25}
                  aria-hidden
                />{' '}
                <strong>three-dot icon</strong> next to the reload button at
                the right end of the Safari address bar).
              </li>
              <li>Tap <strong>Share</strong> in the menu.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Confirm the name and tap <strong>Add</strong>.</li>
            </ol>
          ) : platform.isAndroidPhone ? (
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open this site in Chrome.</li>
              <li>
                Tap the{' '}
                <MoreVertical
                  className="inline align-[-0.125em] text-foreground"
                  size={16}
                  strokeWidth={2.25}
                  aria-hidden
                />{' '}
                <strong>three-dot menu</strong> in the top-right.
              </li>
              <li>Tap <strong>Install app</strong> (or &ldquo;Add to Home screen&rdquo;).</li>
              <li>Follow the prompt to confirm.</li>
            </ol>
          ) : (
            <p>
              The Psalter works as a Progressive Web App &mdash; once installed
              it opens full-screen, loads faster, and is reachable from your
              home screen just like a native app.
            </p>
          )}
          <p>
            More detail for every browser:{' '}
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              MDN &mdash; Installing PWAs
            </a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
