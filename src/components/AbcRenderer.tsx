'use client'

import { useEffect, useRef } from 'react'
import abcjs from 'abcjs'

interface AbcRendererProps {
  abc: string
  title?: string
}

/**
 * Renders ABC music notation as a responsive SVG.
 *
 * Per CLAUDE.md, abcjs requires DOM access and MUST be loaded via
 * next/dynamic(..., { ssr: false }) from any consumer.
 *
 * The responsive: 'resize' option satisfies TUNE-04 (mobile-responsive
 * layout at 375px / 768px / 1200px viewports).
 */
export default function AbcRenderer({ abc, title }: AbcRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // Clear prior render (abcjs appends; without clearing, prop changes stack SVGs)
    el.innerHTML = ''
    abcjs.renderAbc(el, abc, {
      responsive: 'resize',
      add_classes: true,
    })
  }, [abc])

  return (
    <div
      ref={containerRef}
      aria-label={title ? `Music notation for ${title}` : 'Music notation'}
      role="img"
      className="w-full max-w-3xl mx-auto"
    />
  )
}
