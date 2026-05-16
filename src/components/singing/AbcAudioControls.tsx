'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as abcjsModule from 'abcjs'
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
import { Play, Pause, RotateCcw } from 'lucide-react'
import { SOUNDFONT_URL } from '@/lib/abc-soundfont'

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const KEY_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}

function parseKeyFromAbc(abc: string): number {
  const m = abc.match(/^K:\s*([A-Ga-g][#b]?)/m)
  if (!m) return 0
  const letter = m[1][0].toUpperCase()
  const acc = m[1][1] ?? ''
  const base = KEY_SEMITONES[letter] ?? 0
  return (base + (acc === '#' ? 1 : acc === 'b' ? -1 : 0) + 12) % 12
}
function parseBpmFromAbc(abc: string): number {
  const m = abc.match(/^Q:.*?=(\d+)/m) ?? abc.match(/^Q:\s*(\d+)/m)
  return m ? Math.max(40, Math.min(200, parseInt(m[1], 10))) : 100
}

const STORAGE_BPM_KEY = 'psalter-bpm'

function readStoredBpm(): number | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(STORAGE_BPM_KEY)
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 40 || n > 200) return null
    return n
  } catch {
    return null
  }
}

interface Props {
  abc: string
  label?: string
  /** When provided, AbcAudioControls is controlled by the parent for play state. */
  isPlaying?: boolean
  /** Called whenever the synth transitions between playing/paused. */
  onPlayingChange?: (playing: boolean) => void
}

export function AbcAudioControls({ abc, label, isPlaying, onPlayingChange }: Props) {
  const baseKeySemitone = useMemo(() => parseKeyFromAbc(abc), [abc])
  const defaultBpm = useMemo(() => parseBpmFromAbc(abc), [abc])

  const [transpose, setTranspose] = useState(0)
  const [bpm, setBpm] = useState<number>(() => readStoredBpm() ?? defaultBpm)
  const [internalIsPlaying, setInternalIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const effectiveIsPlaying = isPlaying ?? internalIsPlaying

  const hiddenRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visualObjRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synthRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timingRef = useRef<any>(null)

  // Persist BPM on change (mirrors AbcPlayer.tsx behavior)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      if (bpm === defaultBpm) {
        window.localStorage.removeItem(STORAGE_BPM_KEY)
      } else {
        window.localStorage.setItem(STORAGE_BPM_KEY, String(bpm))
      }
    } catch { /* ignore */ }
  }, [bpm, defaultBpm])

  // Render hidden visualObj for synth init.
  // NOTE: deps deliberately exclude `bpm` — BPM is passed to synth.init() and
  // TimingCallbacks at play time, so the visualObj does not need to be rebuilt
  // when the user adjusts tempo. Including bpm here would re-run cleanup
  // (stopping any active synth/timing) on every +/- tap mid-playback. (BL-03)
  useEffect(() => {
    const el = hiddenRef.current
    if (!el) return
    try {
      const visualObjs = abcjs.renderAbc(el, abc, {
        add_classes: false,
        visualTranspose: transpose,
        // Use the parsed-from-abc default for the hidden render; runtime bpm
        // is applied via synth.init({ millisecondsPerMeasure }) at play.
        defaultTempo: { duration: 0.25, bpm: defaultBpm },
        scale: 0.5,
        staffwidth: 200,
      })
      visualObjRef.current = visualObjs?.[0] ?? null
    } catch (e) {
      console.error('AbcAudioControls hidden render failed:', e)
      visualObjRef.current = null
      setAudioError('Audio not available for this tune.')
    }
    // Intentionally NOT stopping synth/timing in this effect's cleanup —
    // that would tear down active playback on abc/transpose change. The
    // dedicated unmount cleanup below is the single source of synth teardown.
  }, [abc, transpose, defaultBpm])

  // Dedicated unmount cleanup — guarantees synth/timing are stopped exactly
  // once when the component unmounts (FAB sheet close, route change, etc.). (BL-03)
  useEffect(() => {
    return () => {
      if (synthRef.current) { try { synthRef.current.stop() } catch { /* ignore */ } }
      if (timingRef.current) { try { timingRef.current.stop() } catch { /* ignore */ } }
      synthRef.current = null
      timingRef.current = null
    }
  }, [])

  const onPlay = useCallback(async () => {
    if (!visualObjRef.current) {
      setAudioError('Audio not available for this tune.')
      return
    }
    setAudioError(null)
    try {
      const synth = new abcjs.synth.CreateSynth()
      await synth.init({
        visualObj: visualObjRef.current,
        millisecondsPerMeasure: visualObjRef.current.millisecondsPerMeasure?.(bpm),
        options: {
          soundFontUrl: SOUNDFONT_URL,
          midiTranspose: transpose,
        },
      })
      await synth.prime()
      synthRef.current = synth

      const timing = new abcjs.TimingCallbacks(visualObjRef.current, {
        eventCallback: (ev: unknown) => {
          if (!ev) {
            // end of tune
            if (synthRef.current) { try { synthRef.current.stop() } catch { /* ignore */ } }
            setInternalIsPlaying(false)
            onPlayingChange?.(false)
          }
        },
        qpm: bpm,
      })
      timingRef.current = timing

      synth.start()
      timing.start()
      setInternalIsPlaying(true)
      onPlayingChange?.(true)
    } catch (e) {
      console.error('AbcAudioControls play failed:', e)
      setAudioError('Audio not available in this browser.')
    }
  }, [bpm, transpose, onPlayingChange])

  const onPause = useCallback(() => {
    if (synthRef.current) { try { synthRef.current.pause() } catch { /* ignore */ } }
    if (timingRef.current) { try { timingRef.current.stop() } catch { /* ignore */ } }
    setInternalIsPlaying(false)
    onPlayingChange?.(false)
  }, [onPlayingChange])

  // React to controlled `isPlaying` flips from a parent (e.g. GlassBottomBar
  // tapping its own Play button while the mini-bar is collapsed). Guarded so
  // we don't recurse when our own onPlay/onPause has already pushed the new
  // value back up through onPlayingChange. (T-04.9.4.02-02)
  const prevControlledRef = useRef<boolean | undefined>(isPlaying)
  useEffect(() => {
    if (isPlaying === undefined) return
    const prev = prevControlledRef.current
    prevControlledRef.current = isPlaying
    if (prev === isPlaying) return
    if (isPlaying && !internalIsPlaying) {
      void onPlay()
    } else if (!isPlaying && internalIsPlaying) {
      onPause()
    }
  }, [isPlaying, internalIsPlaying, onPlay, onPause])

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-abc-audio-controls
      aria-label={label ?? 'Audio controls'}
    >
      <div
        ref={hiddenRef}
        aria-hidden
        style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}
      />
      <Button
        variant="default"
        size="sm"
        onClick={() => (effectiveIsPlaying ? onPause() : onPlay())}
        aria-label={effectiveIsPlaying ? 'Pause' : 'Play'}
        data-testid="audio-play-button"
      >
        {effectiveIsPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        <span className="ml-1">{effectiveIsPlaying ? 'Pause' : 'Play'}</span>
      </Button>

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Key</span>
        <Select value={String(transpose)} onValueChange={(v) => setTranspose(Number(v))}>
          <SelectTrigger className="h-8 w-20">
            <SelectValue>{NOTE_NAMES[(baseKeySemitone + transpose + 12) % 12]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {NOTE_NAMES[(baseKeySemitone + n + 12) % 12]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">BPM</span>
        <Button variant="outline" size="sm" className="h-8 w-8 px-0"
          onClick={() => setBpm((b) => Math.max(40, b - 5))} aria-label="Decrease tempo">−</Button>
        <span className="text-sm tabular-nums w-8 text-center">{bpm}</span>
        <Button variant="outline" size="sm" className="h-8 w-8 px-0"
          onClick={() => setBpm((b) => Math.min(200, b + 5))} aria-label="Increase tempo">+</Button>
      </div>

      {(transpose !== 0 || bpm !== defaultBpm) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => {
            setTranspose(0)
            setBpm(defaultBpm)
            try {
              if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_BPM_KEY)
            } catch { /* ignore */ }
          }}
          aria-label="Reset key and tempo"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      )}

      {audioError && <p className="text-sm text-destructive w-full">{audioError}</p>}
    </div>
  )
}
