'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as abcjsModule from 'abcjs'
// abcjs uses CJS module.exports — in bundlers the default may be nested under .default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const abcjs = (abcjsModule as any).default ?? abcjsModule

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Play, Pause } from 'lucide-react'

interface AbcPlayerProps {
  abc: string
  title?: string
  staffJpgUrl?: string | null
  solfegeJpgUrl?: string | null
  tuneName?: string
  initialMode?: 'staff' | 'solfege'
}

const SOUNDFONT_URL = 'https://paulrosen.github.io/midi-js-soundfonts/abcjs/'

const noteHighlightStyle = `
.abcjs-current-note { fill: #2563eb !important; }
.abcjs-current-note path { fill: #2563eb !important; }
.abcjs-current-note rect { fill: #2563eb !important; }
`

export default function AbcPlayer({
  abc,
  title,
  staffJpgUrl,
  solfegeJpgUrl,
  tuneName,
  initialMode = 'staff',
}: AbcPlayerProps) {
  const [transpose, setTranspose] = useState(0)
  const [bpm, setBpm] = useState(100)
  const [showOriginal, setShowOriginal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visualObjRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synthRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timingRef = useRef<any>(null)
  const lastHighlightedRef = useRef<SVGElement[] | null>(null)
  // Track whether synth needs re-init (e.g. after re-render due to abc/transpose/bpm change)
  const needsSynthReinitRef = useRef(true)

  // ── Note highlight callback ────────────────────────────────────────────────
  const highlightEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ev: any) => {
      // Clear prior highlight
      if (lastHighlightedRef.current) {
        for (const el of lastHighlightedRef.current) {
          el.classList.remove('abcjs-current-note')
        }
        lastHighlightedRef.current = null
      }

      if (!ev || !ev.elements) {
        // End of tune — stop playback
        if (synthRef.current) {
          synthRef.current.stop()
        }
        setIsPlaying(false)
        return
      }

      const highlighted: SVGElement[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const group of ev.elements) {
        if (!group) continue
        for (const node of group) {
          if (node && node.classList) {
            node.classList.add('abcjs-current-note')
            highlighted.push(node)
          }
        }
      }
      lastHighlightedRef.current = highlighted
    },
    []
  )

  // ── Stop all audio helpers ─────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    if (timingRef.current) {
      try { timingRef.current.stop() } catch { /* ignore */ }
      timingRef.current = null
    }
    if (synthRef.current) {
      try { synthRef.current.stop() } catch { /* ignore */ }
      synthRef.current = null
    }
    // Clear highlights
    if (lastHighlightedRef.current) {
      for (const el of lastHighlightedRef.current) {
        el.classList.remove('abcjs-current-note')
      }
      lastHighlightedRef.current = null
    }
    setIsPlaying(false)
    setAudioReady(false)
    needsSynthReinitRef.current = true
  }, [])

  // ── Render effect — reruns on abc / transpose / bpm changes ───────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Stop any existing audio before re-rendering
    stopAudio()

    // Clear previous SVG
    el.innerHTML = ''
    setAudioError(null)

    try {
      const visualObjs = abcjs.renderAbc(el, abc, {
        responsive: 'resize',
        add_classes: true,
        visualTranspose: transpose,
        defaultTempo: { duration: 0.25, bpm },
      })
      visualObjRef.current = visualObjs?.[0] ?? null
    } catch (e) {
      console.error('abcjs render failed:', e)
      setAudioError('Could not render notation.')
      visualObjRef.current = null
    }
  }, [abc, transpose, bpm, stopAudio])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timingRef.current) {
        try { timingRef.current.stop() } catch { /* ignore */ }
      }
      if (synthRef.current) {
        try { synthRef.current.stop() } catch { /* ignore */ }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  // ── Play handler ──────────────────────────────────────────────────────────
  const onPlay = useCallback(async () => {
    if (!visualObjRef.current) {
      setAudioError('Notation not rendered — cannot play.')
      return
    }

    setAudioError(null)

    try {
      // Always create fresh synth
      const synth = new abcjs.synth.CreateSynth()
      await synth.init({
        visualObj: visualObjRef.current,
        options: { soundFontUrl: SOUNDFONT_URL },
        millisecondsPerMeasure: visualObjRef.current.millisecondsPerMeasure
          ? visualObjRef.current.millisecondsPerMeasure(bpm)
          : undefined,
      })
      await synth.prime()
      synthRef.current = synth
      setAudioReady(true)
      needsSynthReinitRef.current = false

      // Create fresh timing callbacks for highlighting
      const timing = new abcjs.TimingCallbacks(visualObjRef.current, {
        eventCallback: highlightEvent,
      })
      timingRef.current = timing

      synth.start()
      timing.start()
      setIsPlaying(true)
    } catch (e) {
      console.error('abcjs audio init failed:', e)
      setAudioError('Audio not available in this browser.')
      setAudioReady(false)
    }
  }, [bpm, highlightEvent])

  // ── Pause handler ─────────────────────────────────────────────────────────
  const onPause = useCallback(() => {
    if (synthRef.current) {
      try { synthRef.current.pause() } catch { /* ignore */ }
    }
    if (timingRef.current) {
      try { timingRef.current.stop() } catch { /* ignore */ }
    }
    // Clear highlights
    if (lastHighlightedRef.current) {
      for (const el of lastHighlightedRef.current) {
        el.classList.remove('abcjs-current-note')
      }
      lastHighlightedRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const hasOriginal = !!(staffJpgUrl || solfegeJpgUrl)
  const originalSrc = initialMode === 'solfege' ? (solfegeJpgUrl ?? staffJpgUrl) : (staffJpgUrl ?? solfegeJpgUrl)

  return (
    <div
      className="w-full max-w-3xl mx-auto space-y-3"
      aria-label={title ? `Music player for ${title}` : 'Music player'}
    >
      <style dangerouslySetInnerHTML={{ __html: noteHighlightStyle }} />

      {/* Notation area: SVG OR original JPEG */}
      {showOriginal ? (
        <div className="relative w-full">
          {originalSrc ? (
            <img
              src={originalSrc}
              alt={`Original score for ${tuneName ?? 'tune'}`}
              className="w-full h-auto object-contain rounded-md border border-border"
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">Original score not available.</p>
          )}
        </div>
      ) : (
        <div
          ref={containerRef}
          role="img"
          aria-label={title ? `Music notation for ${title}` : 'Music notation'}
          className="w-full"
        />
      )}

      {audioError && (
        <p className="text-sm text-destructive">{audioError}</p>
      )}

      {/* Controls row — flex-wrap so 375px viewport collapses cleanly */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Play / Pause */}
        <Button
          variant="default"
          size="sm"
          onClick={() => (isPlaying ? onPause() : onPlay())}
          disabled={showOriginal}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          data-testid="abc-play-button"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="ml-1">{isPlaying ? 'Pause' : 'Play'}</span>
        </Button>

        {/* Transpose */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Key</span>
          <Select
            value={String(transpose)}
            onValueChange={(v) => setTranspose(Number(v))}
            disabled={showOriginal}
          >
            <SelectTrigger className="h-8 w-20" data-testid="abc-transpose-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n > 0 ? `+${n}` : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* BPM */}
        <div className="flex items-center gap-1" data-testid="abc-bpm-group">
          <span className="text-xs text-muted-foreground">BPM</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 px-0"
            onClick={() => setBpm((b) => Math.max(40, b - 5))}
            disabled={showOriginal}
            aria-label="Decrease tempo"
          >
            −
          </Button>
          <span
            className="text-sm tabular-nums w-8 text-center"
            data-testid="abc-bpm-value"
          >
            {bpm}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 px-0"
            onClick={() => setBpm((b) => Math.min(200, b + 5))}
            disabled={showOriginal}
            aria-label="Increase tempo"
          >
            +
          </Button>
        </div>

        {/* Show original */}
        <Button
          variant={showOriginal ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowOriginal((v) => !v)}
          aria-pressed={showOriginal}
          disabled={!hasOriginal}
          data-testid="abc-show-original-toggle"
        >
          {showOriginal ? 'Show notation' : 'Show original'}
        </Button>
      </div>

      {/* Unused — suppress TS warning about audioReady */}
      {audioReady && false && <span />}
    </div>
  )
}
