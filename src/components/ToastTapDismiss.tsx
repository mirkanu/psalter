'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

/**
 * 260717-mwv checkpoint round 2 (item A): sonner's built-in `closeButton`
 * only wires an onClick to its own small X button — clicking anywhere else
 * on the toast body does NOT dismiss it by default (verified empirically
 * against sonner@2.0.7's source: the click handler is scoped to the
 * `[data-close-button]` element only, not the toast `<li>` itself). This
 * adds a document-level tap-anywhere-on-the-toast dismiss, so users don't
 * have to precisely hit the small close button.
 *
 * Excludes clicks on the close button / action / cancel buttons so their own
 * handlers (dismiss, custom action, etc.) aren't double-fired or shadowed.
 */
export function ToastTapDismiss() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const toastEl = target.closest('[data-sonner-toast]')
      if (!toastEl) return
      if (target.closest('[data-close-button], [data-button], button')) return
      toast.dismiss()
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
