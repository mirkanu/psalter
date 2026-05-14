'use client'

import { useEffect, type ReactNode } from 'react'

interface FullscreenOverlayProps {
  open: boolean
  onClose: () => void
  /** Optional sticky bar pinned to the viewport bottom (height: 48px). */
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
 */
export function FullscreenOverlay({ open, onClose, bottomBar, children }: FullscreenOverlayProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 bg-background overflow-auto p-4 pb-20"
      >
        {children}
      </div>
      {bottomBar && (
        <div className="fixed inset-x-0 bottom-0 h-12 bg-background border-t flex items-center justify-between px-4 z-50">
          {bottomBar}
        </div>
      )}
    </>
  )
}
