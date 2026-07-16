'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, type ReactNode } from 'react'
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
import { Play, Pause, RotateCcw } from 'lucide-react'
import { SOUNDFONT_URL } from '@/lib/abc-soundfont'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

/**
 * 260712-szw: mobile-only compact split-leaf fix (Task 2, follow-up to
 * 260712-kov). Root-cause diagnostic (tests/diagnostics/split-leaf-staff-diff.mjs
 * Part B) found abcjs's JS-level `options.format` object is routed through
 * `globalFormatting`, which only recognizes a small allowlist (font
 * directives, scale, stretchlast, fontboxpadding, stafftopmargin) —
 * `topmargin`/`botmargin`/`staffsep`/`systemsep` are silently ignored there.
 * Those keys ARE honored, but only as `%%directive value` lines written
 * INSIDE the ABC text itself (the per-line directive parser). This inserts
 * them right after the `K:` (key) header line so split-leaf mobile reserves
 * no space for the absent inline lyrics and inter-system gaps are tight —
 * the exact values the diagnostic's VERDICT proved reduce a 4-system CM
 * tune from 434px to 299px (spacing-tighter sweep).
 */
function injectCompactSpacingDirectives(abc: string): string {
  const DIRECTIVES = ['%%topmargin 0', '%%botmargin 0', '%%staffsep 10', '%%systemsep 10']
  const lines = abc.split('\n')
  const kIdx = lines.findIndex((l) => l.indexOf('K:') === 0)
  if (kIdx === -1) return DIRECTIVES.concat(lines).join('\n')
  const before = lines.slice(0, kIdx + 1)
  const after = lines.slice(kIdx + 1)
  return before.concat(DIRECTIVES, after).join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────

interface AbcPlayerProps {
  abc: string
  title?: string
  staffJpgUrl?: string | null
  solfegeJpgUrl?: string | null
  tuneName?: string
  initialMode?: 'staff' | 'solfege'
  /** Plain-text lyrics for the current stanza group, lines separated by \n */
  lyricsText?: string
  /** abcjs render scale factor; derived from --staff-base-size by parent (NOTATION-04) */
  scale?: number
  /**
   * When this value changes (and >0), the player auto-triggers Play once the
   * notation has rendered. Used by NotationRenderer to chain playback across
   * paginated cycles (D-21).
   */
  autoPlayToken?: number
  /** Fired when the user initiates Play. */
  onPlayStart?: () => void
  /** Fired when synth reaches end-of-tune naturally (not via user pause). */
  onPlaybackComplete?: () => void
  /** Fired when the user pauses or stops playback. */
  onPlaybackStop?: () => void
  /**
   * Optional content rendered below the image when "Show original" is active.
   * Used to surface the stanza list beside the legacy JPG (Item 1).
   */
  renderLyricsBelow?: ReactNode
  /**
   * Optional controlled state for "Show original" mode. When provided, the
   * player becomes controlled — the parent (e.g. NotationRenderer) owns the
   * boolean so it can hide pagination affordances while the JPG is shown.
   * When omitted, the player falls back to internal state.
   */
  showOriginal?: boolean
  onShowOriginalChange?: (next: boolean) => void
  /**
   * Optional node rendered ABOVE the original JPG (e.g. a prominent
   * "← Back to notation" button). Parent supplies this when it owns the
   * showOriginal state so the back-action can do more than just toggle the
   * local state (e.g. analytics, focus management).
   */
  renderAboveOriginal?: ReactNode
  /** When true, hides Play/Key/BPM/ShowOriginal controls (used in fullscreen mode). */
  hidePlayerControls?: boolean
  /**
   * Multiplier applied to the measured container width when computing abcjs
   * `staffwidth`. Values < 1 force abcjs to wrap notation to more systems
   * (used in chromeless singing view to render ≥3 systems on mobile, ≥4 on
   * tablet — UI-SPEC §Body, design-notes "4 systems"). Default 1 = legacy
   * behavior (fill container width).
   */
  staffWidthFactor?: number
  /**
   * 260712-szw: mobile-only compact split-leaf fix. When true, applies (a)
   * compact vertical spacing via `%%` ABC directive prepend (no topmargin/
   * botmargin, tight staffsep/systemsep — see injectCompactSpacingDirectives)
   * and (b) a post-render CSS height-fit scale so the whole tune's systems
   * fit within the `[data-notation-slot]` ancestor's clientHeight without
   * scrolling. Gated by the caller to chromeless && split-leaf && <768px
   * (NotationRenderer's `compactSplitMobile`) — default false preserves
   * existing behaviour everywhere else (desktop split-leaf stays
   * byte-identical to inline per the 260712-kov guarantee; inline Staff,
   * inline Solfège, and split-leaf Solfège are all unaffected).
   */
  compactSplitMobile?: boolean
}

const STORAGE_BPM_KEY = 'psalter-bpm'

function readStoredBpm(): number | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(STORAGE_BPM_KEY)
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n)) return null
    if (n < 40 || n > 200) return null
    return n
  } catch {
    return null
  }
}

export default function AbcPlayer({
  abc,
  title,
  staffJpgUrl,
  solfegeJpgUrl,
  tuneName,
  initialMode = 'staff',
  lyricsText,
  scale,
  autoPlayToken,
  onPlayStart,
  onPlaybackComplete,
  onPlaybackStop,
  renderLyricsBelow,
  showOriginal: showOriginalProp,
  onShowOriginalChange,
  renderAboveOriginal,
  hidePlayerControls = false,
  staffWidthFactor = 1,
  compactSplitMobile = false,
}: AbcPlayerProps) {
  const baseKeySemitone = useMemo(() => parseKeyFromAbc(abc), [abc])
  const defaultBpm = useMemo(() => parseBpmFromAbc(abc), [abc])

  const [transpose, setTranspose] = useState(0)
  // Item 3: persist BPM across tunes in localStorage. Initial value reads from
  // storage if present (lazy initializer runs only on mount), else falls back
  // to the tune-derived default. We deliberately do NOT reset to defaultBpm
  // when the tune changes.
  const [bpm, setBpm] = useState<number>(() => readStoredBpm() ?? defaultBpm)

  // Persist on change. Skip on SSR. If BPM equals the tune-derived default we
  // remove the key entirely so a future tune's default applies unless the
  // user has explicitly chosen a non-default tempo.
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      if (bpm === defaultBpm) {
        window.localStorage.removeItem(STORAGE_BPM_KEY)
      } else {
        window.localStorage.setItem(STORAGE_BPM_KEY, String(bpm))
      }
    } catch {
      /* ignore */
    }
  }, [bpm, defaultBpm])
  const [showOriginalUncontrolled, setShowOriginalUncontrolled] = useState(false)
  const isControlled = showOriginalProp !== undefined
  const showOriginal = isControlled ? showOriginalProp : showOriginalUncontrolled
  const setShowOriginal = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const resolved =
        typeof next === 'function'
          ? (next as (prev: boolean) => boolean)(showOriginal)
          : next
      if (onShowOriginalChange) onShowOriginalChange(resolved)
      if (!isControlled) setShowOriginalUncontrolled(resolved)
    },
    [isControlled, showOriginal, onShowOriginalChange],
  )
  // Which JPEG to show when showOriginal=true
  const [originalMode, setOriginalMode] = useState<'staff' | 'solfege'>(initialMode)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  // 260712-szw: static (never transformed) clipping viewport that wraps
  // containerRef — see the height-fit pass below for why this must be a
  // separate element from the one that receives `transform:scale`.
  const fitWrapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visualObjRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synthRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timingRef = useRef<any>(null)
  const lastHighlightedRef = useRef<SVGElement[] | null>(null)
  // Track whether synth needs re-init (e.g. after re-render due to abc/transpose/bpm change)
  const needsSynthReinitRef = useRef(true)

  const outerRef = useRef<HTMLDivElement>(null)
  const [staffWidth, setStaffWidth] = useState(0)

  // Synchronous initial measurement so abcjs never paints at a wrong staffwidth.
  useLayoutEffect(() => {
    const w = outerRef.current?.clientWidth ?? 0
    if (w > 0) setStaffWidth(w)
  }, [])

  // Keep staffwidth in sync on viewport / container resize.
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      const w = el.clientWidth
      if (w > 0 && Math.abs(w - staffWidth) >= 8) setStaffWidth(w)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [staffWidth])

  // iOS Safari: ResizeObserver does NOT reliably fire on URL-bar / orientation
  // transitions. Add explicit listeners with rAF debounce + ≥8px threshold.
  useEffect(() => {
    if (typeof window === 'undefined') return
    let raf = 0
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const trigger = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const w = outerRef.current?.clientWidth ?? 0
        if (w > 0 && Math.abs(w - staffWidth) >= 8) setStaffWidth(w)
      })
    }
    const debounced = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(trigger, 150)
    }
    window.addEventListener('orientationchange', debounced)
    window.visualViewport?.addEventListener('resize', debounced)
    return () => {
      cancelAnimationFrame(raf)
      if (timeoutId) clearTimeout(timeoutId)
      window.removeEventListener('orientationchange', debounced)
      window.visualViewport?.removeEventListener('resize', debounced)
    }
  }, [staffWidth])

  // 260712-szw: mobile split-leaf compact fix — observe the ancestor
  // `[data-notation-slot]` region's height (NotationRenderer's chromeless
  // notation-slot cap, ≤50% viewport) so the height-fit pass below knows the
  // true available space. Self-contained: no prop threading from
  // NotationRenderer beyond the `compactSplitMobile` boolean. No-op when the
  // flag is false (desktop split-leaf / inline Staff / inline Solfège /
  // split-leaf Solfège never observe or apply this).
  const [slotHeight, setSlotHeight] = useState(0)
  useEffect(() => {
    if (!compactSplitMobile) {
      setSlotHeight(0)
      return
    }
    // 260716: also matches `[data-notation-fit-slot]` — the inline (non-split)
    // Staff mobile fit target (NotationRenderer's chromeless viewarea
    // wrapper). `closest()` finds the NEAREST ancestor regardless of which
    // attribute matches, so split-leaf (nested inside its own, closer
    // `[data-notation-slot]`) is unaffected.
    const slotEl = outerRef.current?.closest('[data-notation-slot], [data-notation-fit-slot]') as HTMLElement | null
    if (!slotEl) return
    const update = () => setSlotHeight(slotEl.clientHeight)
    update()
    const obs = new ResizeObserver(update)
    obs.observe(slotEl)
    return () => obs.disconnect()
  }, [compactSplitMobile])

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
        // End of tune — stop playback and notify parent (D-21 chain)
        if (synthRef.current) {
          synthRef.current.stop()
        }
        setIsPlaying(false)
        if (onPlaybackComplete) onPlaybackComplete()
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
    [onPlaybackComplete]
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

  // Track previous synth-relevant inputs so layout-only re-renders (staffWidth /
  // staffWidthFactor / scale) do NOT tear down active playback. (WR-03)
  // iOS Safari's URL-bar collapse triggers a ≥8px viewport resize that would
  // otherwise silently kill playback when the user scrolls.
  const prevSynthInputsRef = useRef<{ abc: string; transpose: number; bpm: number } | null>(null)

  // ── Render effect — reruns on abc / transpose / bpm / staffWidth changes ──
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Stop existing audio ONLY when synth-relevant inputs changed; pure layout
    // changes re-render the SVG but keep the synth alive. (WR-03)
    const prev = prevSynthInputsRef.current
    const synthInputsChanged =
      !prev || prev.abc !== abc || prev.transpose !== transpose || prev.bpm !== bpm
    if (synthInputsChanged) {
      stopAudio()
    }
    prevSynthInputsRef.current = { abc, transpose, bpm }

    // Clear previous SVG
    el.innerHTML = ''
    setAudioError(null)

    try {
      // staffWidth is measured from outerRef (ResizeObserver + useLayoutEffect).
      // Passing it as `staffwidth` constrains abcjs to the available width so
      // notes wrap to more rows as scale increases rather than overflowing.
      //
      // MOBILE-03 hotfix: abcjs ignores `staffwidth` when content is structurally
      // unbreakable (e.g. Psalm 23 SATB stacked staves with long lyric syllables).
      // We layer two defenses:
      //   1. `responsive: 'resize'` — makes the SVG use viewBox + width:100% so it
      //      visually scales to fit its container even if abcjs lays out wider.
      //   2. Post-render measure-and-rescale fallback — if `responsive` did not
      //      bring the rendered SVG within the available width (one feedback
      //      loop max, guarded by a ref so we don't loop), shrink `scale`
      //      proportionally and re-render once.
      const containerWidth = Math.max(0, (staffWidth || 600) - 16)
      const effectiveScale = scale ?? 1
      // UAT v7 bug-fix (MOBILE-03, UAT v6 #1c regression):
      //
      // Strategy: `responsive: 'resize'` ON (so SVG always fills container
      // width exactly via viewBox — no right gap, no lyric clipping), and
      // we modulate VISUAL size by varying `staffwidth` inversely with
      // `scale`. abcjs's `scale` option, combined with responsive viewBox,
      // does NOT visibly change rendering (the viewBox absorbs the change),
      // so we keep abcjs's internal scale at 1 and let staffwidth do the
      // work.
      //
      // - Bigger requested size (effectiveScale > 1) → narrower staffwidth
      //   → fewer notes fit per system → more system wraps → viewBox grows
      //   taller-relative-to-wide → SVG renders TALLER (per-unit scale =
      //   container_width / staffwidth grows, so notes and lyrics render
      //   bigger). A+ visibly grows the staff.
      // - Smaller requested size → wider staffwidth → fewer wraps → shorter
      //   SVG.
      const targetStaffwidth = (containerWidth * staffWidthFactor) / effectiveScale
      const effectiveStaffWidth = Math.max(120, Math.floor(targetStaffwidth))
      // 260712-szw: mobile split-leaf only — compact vertical spacing via
      // %% ABC directive prepend (see injectCompactSpacingDirectives; abcjs's
      // JS-level `format` option does not honor topmargin/botmargin/
      // staffsep/systemsep). No-op (abc unchanged) when compactSplitMobile
      // is false, so desktop split-leaf / inline Staff / inline Solfège /
      // split-leaf Solfège render exactly as before.
      const abcForRender = compactSplitMobile ? injectCompactSpacingDirectives(abc) : abc
      const visualObjs = abcjs.renderAbc(el, abcForRender, {
        add_classes: true,
        visualTranspose: transpose,
        defaultTempo: { duration: 0.25, bpm },
        // Keep abcjs `scale` at 1; visual size is driven by staffwidth above.
        scale: 1,
        staffwidth: effectiveStaffWidth,
        responsive: 'resize',
        // UAT v6 issue #2(a): force every system — including the last — to
        // span the full staffwidth so all lines are visually even-length.
        format: { stretchlast: 1 },
      })
      visualObjRef.current = visualObjs?.[0] ?? null
    } catch (e) {
      console.error('abcjs render failed:', e)
      setAudioError('Could not render notation.')
      visualObjRef.current = null
    }
  }, [abc, transpose, bpm, scale, showOriginal, stopAudio, staffWidth, staffWidthFactor, compactSplitMobile])

  // ── Height-fit pass (260712-szw) ──────────────────────────────────────────
  // Mobile split-leaf only: the width-only responsive fit above (MOBILE-03)
  // has no height counterpart, so even with compact spacing a 4-system CM
  // tune can still exceed the ~50%-viewport notation-slot height (Task 1
  // diagnostic VERDICT: spacing-only is NOT sufficient — needs-fit-scale
  // =yes). After the SVG renders, if it's taller than the observed
  // `[data-notation-slot]` height, apply a uniform CSS transform:scale
  // (preserves note aspect ratio — no distortion) to fit all systems without
  // scrolling.
  //
  // IMPORTANT: `overflow:hidden` + a reduced `height` must be applied to a
  // DIFFERENT (static, untransformed) element than the one being scaled.
  // Overflow clipping happens in an element's own untransformed coordinate
  // space, THEN the transform paints the (already-clipped) result — so
  // setting both on the SAME element would clip the tune down to the
  // available height's worth of UNSCALED content (a crop showing only the
  // first ~system or two) and then shrink that crop further, instead of
  // shrinking the WHOLE tune to fit. `fitWrapRef` (static) gets the
  // height+overflow; `containerRef` (the actual abcjs mount, nested inside
  // fitWrapRef) gets the transform. Because fitScale is computed so that
  // naturalHeight * fitScale === slotHeight, the scaled content fills
  // fitWrapRef's clipped viewport with no visible cropping.
  //
  // Declared AFTER the render effect so it always runs following a render in
  // the same commit (superset of that effect's deps plus
  // compactSplitMobile/slotHeight); always resets first since both elements
  // persist across renders (only containerRef's innerHTML is replaced above).
  useEffect(() => {
    const el = containerRef.current
    const wrap = fitWrapRef.current
    if (!el || !wrap) return
    el.style.transform = ''
    el.style.transformOrigin = ''
    wrap.style.height = ''
    wrap.style.overflow = ''
    if (!compactSplitMobile || !slotHeight) return
    const svg = el.querySelector('svg')
    if (!svg) return
    const naturalHeight = svg.getBoundingClientRect().height
    if (naturalHeight <= 0 || naturalHeight <= slotHeight) return
    const fitScale = slotHeight / naturalHeight
    el.style.transformOrigin = 'top center'
    el.style.transform = `scale(${fitScale})`
    wrap.style.height = `${slotHeight}px`
    wrap.style.overflow = 'hidden'
  }, [abc, transpose, bpm, scale, showOriginal, staffWidth, staffWidthFactor, compactSplitMobile, slotHeight])

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
        millisecondsPerMeasure: visualObjRef.current.millisecondsPerMeasure?.(bpm),
        options: {
          soundFontUrl: SOUNDFONT_URL,
          midiTranspose: transpose,
        },
      })
      await synth.prime()
      synthRef.current = synth
      setAudioReady(true)
      needsSynthReinitRef.current = false

      // qpm drives TimingCallbacks tick rate — must match synth's BPM so highlights stay in sync
      const timing = new abcjs.TimingCallbacks(visualObjRef.current, {
        eventCallback: highlightEvent,
        qpm: bpm,
      })
      timingRef.current = timing

      synth.start()
      timing.start()
      setIsPlaying(true)
      if (onPlayStart) onPlayStart()
    } catch (e) {
      console.error('abcjs audio init failed:', e)
      setAudioError('Audio not available in this browser.')
      setAudioReady(false)
    }
  }, [bpm, transpose, highlightEvent, onPlayStart])

  // ── Auto-play trigger: parent bumps autoPlayToken to chain playback across
  // paginated cycles (D-21). Wait one tick so the new abc has rendered.
  useEffect(() => {
    if (autoPlayToken === undefined || autoPlayToken <= 0) return
    let cancelled = false
    const id = setTimeout(() => {
      if (!cancelled && visualObjRef.current) {
        onPlay()
      }
    }, 50)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
    // Intentionally only depend on autoPlayToken — we want exactly one trigger
    // per token increment.
    //
    // INVARIANT (WR-05): `onPlay` is recreated on every render (it is a
    // `useCallback` whose deps include bpm/transpose/highlightEvent/onPlayStart).
    // Because this effect re-runs each time the token increments, the call
    // site reads `onPlay` from the latest render's closure — so the freshest
    // bpm/transpose/highlightEvent are captured by the time setTimeout fires.
    // If a future refactor stabilises `onPlay` (e.g. `useEvent` / a ref), this
    // closure-capture-by-call assumption breaks and `onPlay` must be added to
    // deps (or read through a ref). Re-evaluate this disable then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayToken])

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
    if (onPlaybackStop) onPlaybackStop()
  }, [onPlaybackStop])

  const hasOriginal = !!(staffJpgUrl || solfegeJpgUrl)
  const hasBothOriginals = !!(staffJpgUrl && solfegeJpgUrl)
  const originalSrc = originalMode === 'solfege' ? (solfegeJpgUrl ?? staffJpgUrl) : (staffJpgUrl ?? solfegeJpgUrl)

  return (
    <div
      ref={outerRef}
      className="w-full max-w-full overflow-x-hidden px-2 space-y-3"
      aria-label={title ? `Music player for ${title}` : 'Music player'}
    >
      {/* Notation area: SVG OR original JPEG */}
      {showOriginal ? (
        <div className="relative w-full space-y-2">
          {renderAboveOriginal}
          {/* Staff / Solfège sub-toggle — only when both are available */}
          {hasBothOriginals && (
            <div className="flex gap-1 justify-center">
              <Button
                variant={originalMode === 'staff' ? 'default' : 'outline'}
                size="xs"
                onClick={() => setOriginalMode('staff')}
                aria-pressed={originalMode === 'staff'}
              >
                Staff
              </Button>
              <Button
                variant={originalMode === 'solfege' ? 'default' : 'outline'}
                size="xs"
                onClick={() => setOriginalMode('solfege')}
                aria-pressed={originalMode === 'solfege'}
              >
                Solfège
              </Button>
            </div>
          )}
          {originalSrc ? (
            // R2-hosted JPG with unknown intrinsic dimensions — next/image
            // requires either width/height or fill+sized parent, which the
            // surrounding aspect-fitting layout doesn't provide. Match the
            // disable used elsewhere (SiteHeader.tsx). (WR-09)
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={originalSrc}
              alt={`Original score for ${tuneName ?? 'tune'}`}
              className="w-full h-auto object-contain rounded-md border border-border"
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">Original score not available.</p>
          )}
          {renderLyricsBelow}
        </div>
      ) : (
        <>
          {/* 260712-szw: fitWrapRef is a STATIC (never transformed) clipping
              viewport — its height/overflow are set imperatively by the
              height-fit effect below. containerRef (the actual abcjs mount +
              scaled element) is nested inside it. This two-layer split is
              required: applying `overflow:hidden` + a reduced height to the
              SAME element that also gets `transform:scale` would clip the
              content at the UNTRANSFORMED box edge before the scale runs
              (cropping the tune instead of shrinking it). Only active when
              compactSplitMobile fits the SVG down; otherwise both layers are
              inert (no height/overflow/transform set). */}
          <div ref={fitWrapRef} className="w-full">
            <div
              ref={containerRef}
              role="img"
              aria-label={title ? `Music notation for ${title}` : 'Music notation'}
              className="w-full max-w-full overflow-x-hidden [&_svg]:max-w-full [&_svg]:h-auto"
            />
          </div>
          {/* Lyrics text block — shown below notation in interactive mode */}
          {lyricsText && lyricsText.trim() && (
            <pre
              className="text-xs text-muted-foreground whitespace-pre-wrap text-center max-w-2xl mx-auto leading-relaxed font-sans"
              data-testid="abc-lyrics"
            >
              {lyricsText}
            </pre>
          )}
        </>
      )}

      {audioError && (
        <p className="text-sm text-destructive">{audioError}</p>
      )}

      {/* Controls row — hidden in fullscreen mode */}
      {!hidePlayerControls && (
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

        {/* Reset key + BPM */}
        {(transpose !== 0 || bpm !== defaultBpm) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              setTranspose(0)
              setBpm(defaultBpm)
              try {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem(STORAGE_BPM_KEY)
                }
              } catch {
                /* ignore */
              }
            }}
            disabled={showOriginal}
            aria-label="Reset key and tempo"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}

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
      )}

      {/* Unused — suppress TS warning about audioReady */}
      {audioReady && false && <span />}
    </div>
  )
}
