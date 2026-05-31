'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as abcjsModule from 'abcjs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const abcjs = (abcjsModule as any).default ?? abcjsModule

interface Props {
  abc: string
  /**
   * Multiplier applied to the container width to derive abcjs `staffwidth`.
   * - 1.0 = fit-to-display normal density
   * - >1  = wider staffwidth → fewer wraps → smaller-looking notes
   * - <1  = narrower staffwidth → more wraps → bigger-looking notes
   *
   * Mirrors the AbcPlayer (production) trick — abcjs's `scale` option is
   * overridden by `responsive: 'resize'`, so we modulate visible size via
   * `staffwidth` instead.
   */
  staffWidthMultiplier?: number
}

export default function AbcRenderer({ abc, staffWidthMultiplier = 1 }: Props) {
  const outerRef = useRef<HTMLDivElement>(null)
  const renderRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Measure container width synchronously on mount + on resize.
  useLayoutEffect(() => {
    const el = outerRef.current
    if (!el) return
    setContainerWidth(el.clientWidth)
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width)
        if (w > 0) setContainerWidth(w)
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const el = renderRef.current
    if (!el || containerWidth === 0) return
    el.innerHTML = ''
    try {
      const staffwidth = Math.max(200, Math.floor(containerWidth * staffWidthMultiplier))
      abcjs.renderAbc(el, abc, { responsive: 'resize', staffwidth })
    } catch (err) {
      el.innerHTML = `<div class="text-red-700 text-sm">abcjs render error: ${err instanceof Error ? err.message : String(err)}</div>`
    }
  }, [abc, staffWidthMultiplier, containerWidth])

  return (
    <div ref={outerRef} className="w-full">
      <div ref={renderRef} className="abc-render" />
    </div>
  )
}
