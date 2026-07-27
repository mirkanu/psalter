'use client'

import { useEffect } from 'react'
import type { RefObject } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  /** default true */
  enabled?: boolean
}

/**
 * useSwipeGesture — hand-rolled horizontal swipe-gesture hook (MOBILE-10).
 *
 * No gesture library exists in package.json; this hook is intentionally
 * dependency-free. Mirrors useMediaQuery.ts's file shape: single exported
 * function, one useEffect, SSR guard, cleanup on return.
 *
 * Attaches passive touchstart/touchmove/touchend listeners to `ref.current`.
 * A swipe only "commits" (fires onSwipeLeft/onSwipeRight) when:
 *  - the drag direction locks horizontal — `Math.abs(dx) > Math.abs(dy) * 1.5`
 *    — after the first ~10px of movement, AND
 *  - the final horizontal delta at touchend is `>= 50` px (COMMIT_PX).
 *
 * Default is never blocked on any of the three listeners — vertical
 * scroll-hide detection elsewhere in the app must keep working.
 */
export function useSwipeGesture(
  ref: RefObject<HTMLElement | null>,
  { onSwipeLeft, onSwipeRight, enabled = true }: SwipeOptions,
): void {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    const el = ref.current
    if (!el) return

    const COMMIT_PX = 50
    const DIR_LOCK_RATIO = 1.5
    const DIR_LOCK_START_PX = 10

    let startX = 0
    let startY = 0
    let locked: 'none' | 'horizontal' | 'vertical' = 'none'

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0]
      if (!touch) return
      startX = touch.clientX
      startY = touch.clientY
      locked = 'none'
    }

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0]
      if (!touch) return
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (locked === 'none' && Math.hypot(dx, dy) > DIR_LOCK_START_PX) {
        locked = Math.abs(dx) > Math.abs(dy) * DIR_LOCK_RATIO ? 'horizontal' : 'vertical'
      }
    }

    function onTouchEnd(e: TouchEvent) {
      const touch = e.changedTouches[0]
      if (!touch) return
      const dx = touch.clientX - startX
      if (locked !== 'horizontal') return
      if (Math.abs(dx) < COMMIT_PX) return
      if (dx < 0) {
        onSwipeLeft?.()
      } else if (dx > 0) {
        onSwipeRight?.()
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [ref, enabled, onSwipeLeft, onSwipeRight])
}
