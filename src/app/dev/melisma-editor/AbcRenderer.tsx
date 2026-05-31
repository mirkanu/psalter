'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import * as abcjsModule from 'abcjs'
import 'abcjs/abcjs-audio.css'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const abcjs = (abcjsModule as any).default ?? abcjsModule

interface Props {
  abc: string
  /**
   * Multiplier on container width → abcjs `staffwidth`.
   * 1.0 = fit-to-display; >1 wider/smaller-notes; <1 narrower/bigger-notes.
   * abcjs `scale` is overridden by `responsive:'resize'`, so we drive size via staffwidth.
   */
  staffWidthMultiplier?: number
}

export default function AbcRenderer({ abc, staffWidthMultiplier = 1 }: Props) {
  const outerRef = useRef<HTMLDivElement>(null)
  const renderRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visualObjRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synthRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioCtxRef = useRef<AudioContext | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [playState, setPlayState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [playError, setPlayError] = useState<string | null>(null)

  // Measure container width.
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

  // Render abcjs notation on abc/width/scale change. Reset synth — it'll
  // re-initialise on next Play.
  useEffect(() => {
    const el = renderRef.current
    if (!el || containerWidth === 0) return
    el.innerHTML = ''
    try {
      const staffwidth = Math.max(200, Math.floor(containerWidth * staffWidthMultiplier))
      const result = abcjs.renderAbc(el, abc, { responsive: 'resize', staffwidth })
      visualObjRef.current = Array.isArray(result) ? result[0] : result
    } catch (err) {
      el.innerHTML = `<div class="text-red-700 text-sm">abcjs render error: ${
        err instanceof Error ? err.message : String(err)
      }</div>`
      visualObjRef.current = null
    }
    // Invalidate any existing synth — must re-init for new score.
    if (synthRef.current) {
      try { synthRef.current.stop() } catch { /* noop */ }
      synthRef.current = null
    }
    setPlayState('idle')
    setPlayError(null)
  }, [abc, staffWidthMultiplier, containerWidth])

  const stop = useCallback(() => {
    if (synthRef.current) {
      try { synthRef.current.stop() } catch { /* noop */ }
    }
    setPlayState('idle')
  }, [])

  const play = useCallback(async () => {
    setPlayError(null)
    if (!visualObjRef.current) {
      setPlayError('No score rendered yet')
      return
    }
    if (playState === 'playing') {
      stop()
      return
    }
    setPlayState('loading')
    try {
      if (!audioCtxRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext
        audioCtxRef.current = new Ctor()
      }
      const ctx = audioCtxRef.current!
      if (ctx.state === 'suspended') await ctx.resume()

      const synth = new abcjs.synth.CreateSynth()
      await synth.init({
        audioContext: ctx,
        visualObj: visualObjRef.current,
        millisecondsPerMeasure: 1000,
        options: { soundFontVolumeMultiplier: 1 },
      })
      await synth.prime()
      synth.start()
      synthRef.current = synth
      setPlayState('playing')
      // abcjs synth doesn't emit a "finished" event consistently; reset
      // state after the estimated duration.
      const totalMs = synth.duration ? synth.duration * 1000 : 30_000
      window.setTimeout(() => {
        if (synthRef.current === synth) setPlayState('idle')
      }, totalMs + 250)
    } catch (err) {
      setPlayError(err instanceof Error ? err.message : String(err))
      setPlayState('idle')
    }
  }, [playState, stop])

  return (
    <div ref={outerRef} className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={play}
          disabled={playState === 'loading'}
          className={`px-3 py-1 text-xs font-medium rounded border ${
            playState === 'playing'
              ? 'bg-red-100 border-red-400 text-red-900'
              : 'bg-green-100 border-green-400 text-green-900'
          } disabled:opacity-50`}
        >
          {playState === 'playing' ? '■ Stop' : playState === 'loading' ? 'Loading…' : '▶ Play'}
        </button>
        {playError && <span className="text-xs text-red-700">⚠ {playError}</span>}
      </div>
      <div ref={renderRef} className="abc-render" />
    </div>
  )
}
