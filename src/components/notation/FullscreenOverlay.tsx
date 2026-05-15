'use client'

import { useEffect, type ReactNode } from 'react'

interface FullscreenOverlayProps {
  open: boolean
  onClose: () => void
  /** Optional bar pinned to the viewport top (height: 48px). */
  topBar?: ReactNode
  /** Optional bar pinned to the viewport bottom (height: 48px). */
  bottomBar?: ReactNode
  children: ReactNode
}

/**
 * CSS pseudo-fullscreen overlay (per D-15, RESEARCH Pattern 5).
 * Does NOT use the native Fullscreen API — iOS Safari does not support it for
 * non-video elements (Pitfall 3). Pure `position: fixed` overlay works on all
 * browsers including iOS.
 *
 * - Escape key closes the overlay.
 * - While open, document.body scroll is locked and restored on close.
 * - Attempts screen.orientation.lock('landscape') on entry; fails silently on
 *   iOS Safari which does not support the API.
 */
export function FullscreenOverlay({ open, onClose, topBar, bottomBar, children }: FullscreenOverlayProps) {
  useEffect(() => {
    if (!open) return

    // Attempt landscape lock — works on Android Chrome, silently ignored on iOS.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {})
    } catch { /* ignore */ }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(screen.orientation as any)?.unlock?.()
      } catch { /* ignore */ }
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {topBar && (
        <div className="flex-none flex items-center px-4 h-12 border-b border-border">
          {topBar}
        </div>
      )}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        {children}
      </div>
      {bottomBar && (
        <div className="flex-none flex items-center justify-between px-4 h-12 border-t border-border">
          {bottomBar}
        </div>
      )}
    </div>
  )
}
