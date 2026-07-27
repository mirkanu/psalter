// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSwipeGesture } from './useSwipeGesture'

function makeTouchEvent(
  type: 'touchstart' | 'touchmove' | 'touchend',
  point: { clientX: number; clientY: number },
) {
  const key = type === 'touchend' ? 'changedTouches' : 'touches'
  return new TouchEvent(type, { [key]: [point] } as unknown as TouchEventInit)
}

function fireSwipe(el: HTMLElement, from: { x: number; y: number }, to: { x: number; y: number }) {
  el.dispatchEvent(makeTouchEvent('touchstart', { clientX: from.x, clientY: from.y }))
  el.dispatchEvent(makeTouchEvent('touchmove', { clientX: to.x, clientY: to.y }))
  el.dispatchEvent(makeTouchEvent('touchend', { clientX: to.x, clientY: to.y }))
}

describe('useSwipeGesture', () => {
  it('calls onSwipeLeft on a committed leftward horizontal swipe', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const ref = { current: el }
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    renderHook(() => useSwipeGesture(ref, { onSwipeLeft, onSwipeRight }))

    fireSwipe(el, { x: 200, y: 100 }, { x: 140, y: 105 })

    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('calls onSwipeRight on a committed rightward horizontal swipe', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const ref = { current: el }
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    renderHook(() => useSwipeGesture(ref, { onSwipeLeft, onSwipeRight }))

    fireSwipe(el, { x: 140, y: 100 }, { x: 210, y: 102 })

    expect(onSwipeRight).toHaveBeenCalledTimes(1)
    expect(onSwipeLeft).not.toHaveBeenCalled()
  })

  it('does nothing when |dx| < 50px (below commit threshold)', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const ref = { current: el }
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    renderHook(() => useSwipeGesture(ref, { onSwipeLeft, onSwipeRight }))

    fireSwipe(el, { x: 200, y: 100 }, { x: 175, y: 100 })

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('does nothing on a mostly-vertical drag (direction lock rejects it)', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const ref = { current: el }
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    renderHook(() => useSwipeGesture(ref, { onSwipeLeft, onSwipeRight }))

    fireSwipe(el, { x: 100, y: 100 }, { x: 160, y: 300 })

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('attaches no listeners and fires no callbacks when enabled is false', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const addSpy = vi.spyOn(el, 'addEventListener')
    const ref = { current: el }
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    renderHook(() => useSwipeGesture(ref, { onSwipeLeft, onSwipeRight, enabled: false }))

    expect(addSpy).not.toHaveBeenCalled()

    fireSwipe(el, { x: 200, y: 100 }, { x: 140, y: 105 })

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })
})
