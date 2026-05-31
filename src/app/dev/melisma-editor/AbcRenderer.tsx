'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as abcjsModule from 'abcjs'
import 'abcjs/abcjs-audio.css'
import { splitOnPhraseBreaks } from '@/lib/abc-phrases'

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

/**
 * Build the per-phrase ABC fragments rendered as separate staff lines.
 *
 * The input is the full embedded-w-line ABC (with `% PHRASE_BREAK` markers).
 * Each fragment shares the header (X/T/M/L/Q/K) plus a single phrase body
 * (notes + its w: line). Rendering each fragment as its own abcjs call
 * guarantees one staff system per phrase — matching how the production
 * NotationRenderer lays out the same content.
 *
 * Returns at least one fragment (the whole input) on parse failure so the
 * preview never goes blank.
 */
function buildPerPhraseFragments(abc: string): string[] {
  if (!abc.trim()) return []
  try {
    const split = splitOnPhraseBreaks(abc)
    if (!split.header || split.phrases.length === 0) return [abc]

    // Strip the title (T:) and tempo (Q:) from the header — repeating them on
    // every per-phrase staff makes the preview look like 5 mini-scores. Keep
    // only what abcjs needs to parse pitch + rhythm: X, M, L, K (+ accidentals).
    const minimalHeader = split.header
      .split('\n')
      .filter(line => {
        const t = line.trim()
        return !(t.startsWith('T:') || t.startsWith('Q:'))
      })
      .join('\n')

    return split.phrases.map(body => {
      // Each phrase body may contain internal line breaks (e.g. Crimond's
      // phrase 2: "=b4 |\n=b2c'4a2 | a2b2a2g4"). abcjs treats each music line
      // as a new staff system, so the leading `=b4 |` would render on its own
      // empty-looking row AND the w: line would attach to the wrong half.
      // Collapse the body to a single music line.
      const musicLines: string[] = []
      const wLines: string[] = []
      for (const raw of body.split('\n')) {
        const trimmed = raw.trim()
        if (trimmed === '') continue
        if (trimmed.startsWith('w:')) wLines.push(trimmed)
        else if (trimmed.startsWith('%')) continue
        else musicLines.push(trimmed)
      }
      const flatMusic = musicLines.join(' ').replace(/\s+/g, ' ').trim()
      const flatBody = [flatMusic, ...wLines].join('\n')
      return `${minimalHeader}\n${flatBody}`
    })
  } catch {
    return [abc]
  }
}

export default function AbcRenderer({ abc, staffWidthMultiplier = 1 }: Props) {
  const outerRef = useRef<HTMLDivElement>(null)
  const phrasesContainerRef = useRef<HTMLDivElement>(null)
  // Hidden full render kept around so abcjs synth can play the entire tune
  // across all phrases (per-phrase visualObjs would only play one phrase each).
  const synthRenderRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visualObjRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synthRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioCtxRef = useRef<AudioContext | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [playState, setPlayState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [playError, setPlayError] = useState<string | null>(null)

  const fragments = useMemo(() => buildPerPhraseFragments(abc), [abc])

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

  // Render each phrase fragment into its own child div + the full ABC into a
  // hidden div for the synth.
  useEffect(() => {
    const container = phrasesContainerRef.current
    const synthEl = synthRenderRef.current
    if (!container || !synthEl || containerWidth === 0) return

    container.innerHTML = ''
    synthEl.innerHTML = ''

    const staffwidth = Math.max(200, Math.floor(containerWidth * staffWidthMultiplier))

    try {
      // Per-phrase visible renders.
      fragments.forEach((frag, i) => {
        const div = document.createElement('div')
        div.className = 'abc-phrase-line'
        if (i > 0) div.style.marginTop = '4px'
        container.appendChild(div)
        abcjs.renderAbc(div, frag, { responsive: 'resize', staffwidth })
      })

      // Single full-tune render for synth.
      const result = abcjs.renderAbc(synthEl, abc, { responsive: 'resize', staffwidth: 800 })
      visualObjRef.current = Array.isArray(result) ? result[0] : result
    } catch (err) {
      container.innerHTML = `<div class="text-red-700 text-sm">abcjs render error: ${
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
  }, [abc, fragments, staffWidthMultiplier, containerWidth])

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
      <div ref={phrasesContainerRef} className="abc-render" />
      {/*
        Hidden full-tune render used as the synth's visualObj source.
        abcjs's `responsive: 'resize'` REWRITES the `style` attribute of the
        element it renders into, so we can't put display:none on it directly.
        Instead, wrap it in an outer div whose attributes abcjs never touches.
      */}
      <div
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }}
        aria-hidden
      >
        <div ref={synthRenderRef} />
      </div>
    </div>
  )
}
