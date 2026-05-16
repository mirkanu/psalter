'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import AbcPlayer from '@/components/AbcPlayer'
import { FullscreenOverlay } from './FullscreenOverlay'
import { StanzaList } from './StanzaList'
import { BackToNotationButton } from './BackToNotationButton'
import { splitOnPhraseBreaks } from '@/lib/abc-phrases'
import { syllabifyForAbc } from '@/lib/lyrics'
import {
  groupStanzasIntoCycles,
  mapCycleToPhraseSyllableLines,
} from '@/lib/stanza-cycles'

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotationRendererProps {
  abc: string
  lyrics: string
  scoreJpgUrl: string | null
  solfegeJpgUrl: string | null
  tuneName: string
  tuneMeter: string | null
  /** Stanza meter (e.g. "CM" or "double-CM") — required for D-20 cycle pairing. */
  stanzaMeter: string | null
  /** When false, hides the "Lyrics only" view mode and omits `w:` lines from
   *  the staff. Used on tune detail pages where lyrics are out of scope. */
  showLyrics?: boolean
  /** Called whenever the active view mode changes. Used by PsalmTabs to switch
   *  the desktop layout between stacked (Staff/Solfège) and 2-column (Lyrics). */
  onViewModeChange?: (mode: ViewMode) => void
  /**
   * When provided, NotationRenderer becomes controlled for viewMode.
   * Parent owns persistence; internal localStorage is bypassed.
   */
  viewMode?: ViewMode
  /**
   * When provided, NotationRenderer becomes controlled for size.
   * Parent owns persistence; internal localStorage is bypassed.
   */
  baseSize?: number
  onBaseSizeChange?: (size: number) => void
  /**
   * When true, the internal controlBar (size + view-mode + pagination +
   * fullscreen-enter button) is NOT rendered. Parent is expected to
   * supply equivalent UI (see SingingView FAB sheet). Pagination state
   * stays inside the renderer; parent has no reason to drive it.
   *
   * Implies: fullscreen mode is permanently disabled (the singing view
   * IS the fullscreen — there is no second-level FS overlay).
   */
  chromeless?: boolean
}

export type ViewMode = 'staff' | 'solfege' | 'lyrics'
type BaseSize = number

const MIN_SIZE = 4
const MAX_SIZE = 120
const SIZE_STEP = 2
const DEFAULT_SIZE: BaseSize = 14
/** Larger default on narrow portrait screens so phrases naturally wrap to 4 rows. */
const MOBILE_DEFAULT_SIZE: BaseSize = 24
/** SingingView mobile default — UI-SPEC §3 (<768px when chromeless). */
const MOBILE_DEFAULT_SIZE_CHROMELESS: BaseSize = 13
const STORAGE_SIZE_KEY = 'psalter-staff-size'
const STORAGE_SIZE_FS_KEY = 'psalter-staff-size-fs'
const STORAGE_MODE_KEY = 'psalter-score-mode'
const CYCLES_PER_PAGE = 3

function isBaseSize(n: number): n is BaseSize {
  return Number.isFinite(n) && n >= MIN_SIZE && n <= MAX_SIZE
}

function isViewMode(s: string): s is ViewMode {
  return s === 'staff' || s === 'solfege' || s === 'lyrics'
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * NotationRenderer — top-level dynamic-notation component for psalm and tune
 * pages. Replaces the legacy `PsalmNotationPlayer`.
 *
 * Requirement → element mapping:
 *   - NOTATION-01 (syllable-aligned w: lines) — `buildAbcWithSyllables` per phrase
 *     row, fed by `mapCycleToPhraseSyllableLines` per visible cycle.
 *   - NOTATION-02 (Staff/Solfège toggle) — view-mode segmented control + Solfège
 *     img fallback (D-14).
 *   - NOTATION-03 (responsive sizing) — AbcPlayer carries `responsive: "resize"`;
 *     `scale = baseSize / 14` re-renders abcjs at the chosen size.
 *   - NOTATION-04 (A+/A− always visible) — size group rendered in all view
 *     modes; CSS var `--staff-base-size` on root drives `.verse-text` /
 *     `.verse-number` (D-05/D-06/D-07).
 *   - NOTATION-05 (Fullscreen) — `<FullscreenOverlay>` with sticky bottom bar
 *     (Prev / Exit / Next) (D-15).
 *   - NOTATION-06 (Control grouping) — three groups (size, view, pagination)
 *     separated by 1px vertical dividers, fullscreen toggle right-aligned.
 *
 * Locked decisions D-04..D-21 implemented herein. Key load-bearing decisions:
 *   - D-19 (universal phrase-row layout) — exactly one `<AbcPlayer>` per visible
 *     phrase index `i` in `visiblePhraseIndices`. Non-double meters with T=2
 *     render as 2 rows, NOT a single staff. The pre-D-19 "one giant staff"
 *     branch is gone.
 *   - D-20 (stanza-cycle model) — `groupStanzasIntoCycles` paires stanzas by
 *     tune-vs-stanza meter ratio; `mapCycleToPhraseSyllableLines` distributes
 *     each cycle across phrase rows.
 *   - D-21 (two independent pagination axes) —
 *       Axis A (always): `totalStanzaPages = ceil(cycles.length / 3)`; staff
 *       rows do not move when paginating stanzas.
 *       Axis B (landscape-narrow ONLY): `paginateTuneHalf = isLandscapeNarrow
 *       && T > 2`; splits the tune vertically into halves A/B.
 *       Combined cycle order: tune-half flips FIRST, then stanza-group advances.
 *
 * abcjs client-only rule (CLAUDE.md): this file is a client component. The
 * dynamic({ssr:false}) + Suspense skeleton wrapper lives in
 * `NotationRendererClient.tsx` (Task 3).
 *
 * Persistence keys: 'psalter-staff-size' (BaseSize), 'psalter-score-mode' (ViewMode).
 */
export function NotationRenderer({
  abc,
  lyrics,
  scoreJpgUrl,
  solfegeJpgUrl,
  tuneName,
  tuneMeter,
  stanzaMeter,
  showLyrics = true,
  onViewModeChange,
  viewMode: viewModeProp,
  baseSize: baseSizeProp,
  onBaseSizeChange,
  chromeless = false,
}: NotationRendererProps) {
  // chromeless mode permanently disables the FS overlay; the singing view IS the fullscreen.
  const allowFullscreen = !chromeless
  // ── Derived: phrases & cycles ──────────────────────────────────────────────
  const split = useMemo(() => splitOnPhraseBreaks(abc), [abc])
  const T = split.phrases.length

  const stanzas = useMemo(
    () =>
      lyrics
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    [lyrics],
  )

  const cycles = useMemo(
    () => groupStanzasIntoCycles(stanzas, tuneMeter, stanzaMeter),
    [stanzas, tuneMeter, stanzaMeter],
  )

  const totalStanzaPages = Math.max(1, Math.ceil(cycles.length / CYCLES_PER_PAGE))

  // ── State ──────────────────────────────────────────────────────────────────
  const [cyclePage, setCyclePage] = useState(0)
  const isViewModeControlled = viewModeProp !== undefined
  const [viewModeInternal, setViewModeInternal] = useState<ViewMode>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_MODE_KEY) : null
      if (stored && isViewMode(stored)) {
        // If lyrics view stored but lyrics are disabled on this page, fall back to staff.
        if (stored === 'lyrics' && !showLyrics) return 'staff'
        return stored
      }
    } catch {
      /* ignore */
    }
    return 'staff'
  })
  const viewMode: ViewMode = isViewModeControlled ? (viewModeProp as ViewMode) : viewModeInternal
  const setViewMode = (next: ViewMode) => {
    if (isViewModeControlled) {
      onViewModeChange?.(next)
    } else {
      setViewModeInternal(next)
      onViewModeChange?.(next)
    }
  }

  // If showLyrics flips off (or remounts with showLyrics=false) and current
  // viewMode is 'lyrics', fall back to 'staff'.
  useEffect(() => {
    if (!showLyrics && viewMode === 'lyrics') setViewMode('staff')
  }, [showLyrics, viewMode])
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Lifted from AbcPlayer so NotationRenderer knows when the legacy JPG is
  // shown (and can therefore hide the stanza-pagination row, which is
  // meaningless when the image is displayed).
  const [showOriginal, setShowOriginal] = useState(false)
  const isBaseSizeControlled = baseSizeProp !== undefined
  const [normalSize, setNormalSize] = useState<BaseSize>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_SIZE_KEY) : null
      const n = raw ? Number(raw) : NaN
      if (Number.isFinite(n) && isBaseSize(n)) return n
      if (typeof window !== 'undefined') {
        if (chromeless && window.innerWidth < 768) {
          // SingingView mobile-first default (UI-SPEC §3)
          return MOBILE_DEFAULT_SIZE_CHROMELESS
        }
        if (
          !chromeless &&
          window.innerWidth < 480 &&
          window.innerHeight > window.innerWidth
        ) {
          // Preserve legacy default for uncontrolled callers (/tunes/[id], /study)
          return MOBILE_DEFAULT_SIZE
        }
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_SIZE
  })
  const [fullscreenSize, setFullscreenSize] = useState<BaseSize>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_SIZE_FS_KEY) : null
      const n = raw ? Number(raw) : NaN
      if (Number.isFinite(n) && isBaseSize(n)) return n
      if (typeof window !== 'undefined') {
        if (chromeless && window.innerWidth < 768) {
          return MOBILE_DEFAULT_SIZE_CHROMELESS
        }
        if (
          !chromeless &&
          window.innerWidth < 480 &&
          window.innerHeight > window.innerWidth
        ) {
          return MOBILE_DEFAULT_SIZE
        }
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_SIZE
  })
  const baseSizeUncontrolled: BaseSize = isFullscreen ? fullscreenSize : normalSize
  const baseSize: BaseSize = isBaseSizeControlled
    ? ((baseSizeProp as BaseSize) ?? baseSizeUncontrolled)
    : baseSizeUncontrolled
  function setBaseSize(updater: ((s: BaseSize) => BaseSize) | BaseSize) {
    const resolved =
      typeof updater === 'function'
        ? (updater as (s: BaseSize) => BaseSize)(baseSize)
        : updater
    if (isBaseSizeControlled) {
      onBaseSizeChange?.(resolved)
    } else if (isFullscreen) {
      setFullscreenSize(resolved)
    } else {
      setNormalSize(resolved)
    }
  }

  // ── Persistence effects ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SIZE_KEY, String(normalSize))
    } catch {
      /* ignore */
    }
  }, [normalSize])

  useEffect(() => {
    if (isViewModeControlled) return
    try {
      localStorage.setItem(STORAGE_MODE_KEY, viewMode)
    } catch {
      /* ignore */
    }
  }, [viewMode, isViewModeControlled])

  // Clamp cyclePage if cycles shrink
  useEffect(() => {
    if (cyclePage >= totalStanzaPages) {
      setCyclePage(Math.max(0, totalStanzaPages - 1))
    }
  }, [cyclePage, totalStanzaPages])

  // ── Derived: visible cycles & phrase indices ───────────────────────────────
  const visibleCycles = useMemo(
    () => cycles.slice(cyclePage * CYCLES_PER_PAGE, (cyclePage + 1) * CYCLES_PER_PAGE),
    [cycles, cyclePage],
  )

  // ── Staff height tracking (last-page spacing) ─────────────────────────────
  // Measures the AbcPlayer height on full pages (CYCLES_PER_PAGE stanzas) and
  // applies it as min-height on partial last pages so stave spacing stays consistent.
  const staffRef = useRef<HTMLDivElement>(null)
  const [minStaffHeight, setMinStaffHeight] = useState<number>(0)

  useEffect(() => {
    setMinStaffHeight(0)
  }, [baseSize])

  useEffect(() => {
    if (!staffRef.current) return
    if (viewMode !== 'staff' || showOriginal) return
    if (visibleCycles.length < CYCLES_PER_PAGE) return
    const timer = setTimeout(() => {
      const h = staffRef.current?.getBoundingClientRect().height ?? 0
      if (h > 0) setMinStaffHeight(h)
    }, 150)
    return () => clearTimeout(timer)
  }, [visibleCycles, viewMode, showOriginal, baseSize])

  const visiblePhraseIndices = useMemo<number[]>(
    () => Array.from({ length: T }, (_, i) => i),
    [T],
  )

  // ── Pagination handlers (cycle-page only) ──────────────────────────────────
  const atStart = cyclePage === 0
  const atEnd = cyclePage === totalStanzaPages - 1

  function next() {
    setCyclePage((p) => Math.min(p + 1, totalStanzaPages - 1))
  }
  function prev() {
    setCyclePage((p) => Math.max(p - 1, 0))
  }

  const scale = baseSize / 14

  // Chromeless (singing view) wants ≥3 systems on mobile, ≥4 on tablet+
  // (UI-SPEC §Body / design-notes "4 systems"). Force abcjs to wrap by
  // narrowing staffwidth via a sub-1 factor; the SVG viewBox (responsive:resize)
  // then scales rendered systems up to fill the container width.
  const [viewportW, setViewportW] = useState<number>(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth,
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => setViewportW(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const staffWidthFactor = chromeless
    ? viewportW < 768
      ? 0.55
      : 0.85
    : 1

  // How many sub-systems to break each source phrase into. abcjs only wraps
  // music where the ABC source contains an explicit newline; staffwidth alone
  // does not split a single music-line. For the chromeless singing view we
  // need ≥3 systems on mobile and ≥4 on tablet (UI-SPEC §Body, design-notes
  // "4 systems"), so we split each phrase into halves at every chromeless
  // viewport. At very wide desktop (≥1280) the layout can comfortably show
  // the original phrase-count without splitting.
  const phraseSubdivisions = chromeless && viewportW < 1280 ? 2 : 1

  // ── w: lines for one phrase ────────────────────────────────────────────────
  function wLinesForPhrase(i: number): string[] {
    return visibleCycles
      .flatMap((cycle) => {
        const grid = mapCycleToPhraseSyllableLines(cycle, tuneMeter, stanzaMeter)
        return grid[i] ?? ['']
      })
      .filter((s) => s.length > 0)
  }

  // ── Pagination indicator ───────────────────────────────────────────────────
  // Pagination row is meaningful ONLY when live abcjs notation is visible.
  // Hide when:
  //   - viewMode is not 'staff' (Solfège / Lyrics-only show full stanza list)
  //   - showOriginal is true (AbcPlayer is showing the legacy JPG inside Staff
  //     view, so pagination doesn't drive what's rendered)
  const showPagination =
    totalStanzaPages > 1 && viewMode === 'staff' && !showOriginal

  // ── Sub-renders ───────────────────────────────────────────────────────────
  const sizeGroup = (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="xs"
        onClick={() => setBaseSize((s) => (s - SIZE_STEP < MIN_SIZE ? s : s - SIZE_STEP))}
        disabled={baseSize <= MIN_SIZE}
        aria-label="Decrease notation size"
      >
        <ChevronDown className="h-3.5 w-3.5" />
        <span className="text-xs">A</span>
      </Button>
      <Button
        variant="outline"
        size="xs"
        onClick={() => setBaseSize((s) => (s + SIZE_STEP > MAX_SIZE ? s : s + SIZE_STEP))}
        disabled={baseSize >= MAX_SIZE}
        aria-label="Increase notation size"
      >
        <ChevronUp className="h-3.5 w-3.5" />
        <span className="text-xs">A</span>
      </Button>
    </div>
  )

  const viewGroup = (
    <div className="flex items-center gap-1">
      <Button
        variant={viewMode === 'staff' ? 'default' : 'outline'}
        size="xs"
        onClick={() => setViewMode('staff')}
        aria-pressed={viewMode === 'staff'}
      >
        Staff
      </Button>
      <Button
        variant={viewMode === 'solfege' ? 'default' : 'outline'}
        size="xs"
        onClick={() => setViewMode('solfege')}
        aria-pressed={viewMode === 'solfege'}
      >
        Solfège
      </Button>
      {showLyrics && (
        <Button
          variant={viewMode === 'lyrics' ? 'default' : 'outline'}
          size="xs"
          onClick={() => setViewMode('lyrics')}
          aria-pressed={viewMode === 'lyrics'}
        >
          Lyrics only
        </Button>
      )}
    </div>
  )

  const paginationGroup = showPagination ? (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="xs"
        onClick={prev}
        disabled={atStart}
        aria-label="Previous page"
      >
        ← Prev
      </Button>
      <span className="text-xs text-muted-foreground px-1">
        {`Stanzas ${cyclePage + 1}/${totalStanzaPages}`}
      </span>
      <Button
        variant="outline"
        size="xs"
        onClick={next}
        disabled={atEnd}
        aria-label="Next page"
      >
        Next →
      </Button>
    </div>
  ) : null

  // Chromeless Size row — UAT v6: A−/A+ moved out of FAB onto the main canvas
  // chrome so users see the size change effect immediately (especially on
  // mobile). Affects lyric size in all view modes, and notation size in Staff
  // mode. Visual register matches the stanza nav: foreground/muted-foreground
  // only, ≥44×44 tap targets.
  const chromelessSizeRow = (
    <div
      data-chromeless-size-row
      className="mt-2 flex items-center justify-center gap-3"
    >
      <button
        type="button"
        data-testid="canvas-size-decrease"
        onClick={() => setBaseSize((s) => (s - SIZE_STEP < MIN_SIZE ? s : s - SIZE_STEP))}
        disabled={baseSize <= MIN_SIZE}
        aria-label="Decrease size"
        className="min-h-11 min-w-11 inline-flex items-center justify-center gap-1 rounded-md text-foreground active:scale-[0.97] transition-transform motion-reduce:transition-none disabled:opacity-40 disabled:pointer-events-none"
      >
        <ZoomOut className="h-4 w-4" />
        <span className="text-sm font-medium">A−</span>
      </button>
      <span className="text-xs text-muted-foreground tabular-nums w-8 text-center">
        {baseSize}
      </span>
      <button
        type="button"
        data-testid="canvas-size-increase"
        onClick={() => setBaseSize((s) => (s + SIZE_STEP > MAX_SIZE ? s : s + SIZE_STEP))}
        disabled={baseSize >= MAX_SIZE}
        aria-label="Increase size"
        className="min-h-11 min-w-11 inline-flex items-center justify-center gap-1 rounded-md text-foreground active:scale-[0.97] transition-transform motion-reduce:transition-none disabled:opacity-40 disabled:pointer-events-none"
      >
        <ZoomIn className="h-4 w-4" />
        <span className="text-sm font-medium">A+</span>
      </button>
    </div>
  )

  // Chromeless stanza nav — slim inline row for SingingView (issue #5).
  // Rendered directly below the notation viewArea, not in the FAB sheet,
  // so singers reach it without opening a menu. Matches PsalmTopBar's
  // chevron-button idiom: 44×44 tap targets, foreground/muted-foreground only.
  const chromelessStanzaNav = showPagination ? (
    <div
      data-chromeless-stanza-nav
      className="mt-2 flex items-center justify-center gap-3"
    >
      <button
        type="button"
        onClick={prev}
        disabled={atStart}
        aria-label="Previous stanza page"
        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-foreground active:scale-[0.97] transition-transform motion-reduce:transition-none disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-sm text-muted-foreground tabular-nums">
        {`Stanzas ${cyclePage + 1}/${totalStanzaPages}`}
      </span>
      <button
        type="button"
        onClick={next}
        disabled={atEnd}
        aria-label="Next stanza page"
        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-foreground active:scale-[0.97] transition-transform motion-reduce:transition-none disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  ) : null

  const divider = <div className="h-6 w-px bg-border" aria-hidden />

  const controlBar = (
    <div className="flex flex-wrap items-center gap-2">
      {sizeGroup}
      {divider}
      {viewGroup}
      {showPagination && (
        <>
          {divider}
          {paginationGroup}
        </>
      )}
      <div className="ml-auto flex items-center gap-1">
        {!isFullscreen && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsFullscreen(true)}
            aria-label="Enter fullscreen"
          >
            <Expand className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )

  // ── Unified multi-staff ABC body (D-19 — one AbcPlayer per visible cycle) ──
  // abcjs renders each newline-separated music line as a separate staff line
  // within ONE rendered tune. We compose: header → for each visible phrase i,
  // emit its body line followed by one `w:` line per stanza-portion. This
  // gives the visual effect of N stacked phrase rows while remaining a single
  // tune for the synth (Play traverses end-to-end naturally).
  const unifiedAbc = useMemo(() => {
    // Strip header lines that produce visible chrome we already render elsewhere:
    //   - `T:` titles — abcjs renders these as staff title; page UI already
    //      shows the tune name.
    //   - `Q:` tempo lines (chromeless only) — singing view has no tempo
    //      indication; the global synth BPM is controlled via FAB audio
    //      controls instead. Stripping prevents "♩ = 76" emission. (UAT v6)
    // We also strip the `name="..."` attribute from any `V:` voice declaration
    // in chromeless mode so abcjs doesn't print "Soprano" beside the stave.
    const cleanedHeader = split.header
      .split('\n')
      .filter((l) => {
        const t = l.trim()
        if (/^T:/.test(t)) return false
        if (chromeless && /^Q:/.test(t)) return false
        return true
      })
      .map((l) => (chromeless ? l.replace(/\s*name="[^"]*"/g, '') : l))
      .join('\n')
    if (split.phrases.length === 0) return cleanedHeader
    const parts: string[] = [cleanedHeader]

    // Helper: split a phrase body into N sub-staves at measure boundaries.
    // Music body is split on `|` into measures, then re-grouped into N chunks.
    // Each chunk becomes its own newline-separated music line, which abcjs
    // renders as a separate staff system.
    function splitMusicIntoSubLines(body: string, n: number): string[] {
      if (n <= 1) return [body]
      // Tokenize on the bar `|` — keep the bars attached to the preceding measure.
      const segs = body.split(/(\|)/).filter((s) => s.length > 0)
      // Re-pair tokens so each measure includes its trailing bar.
      const measures: string[] = []
      let acc = ''
      for (const s of segs) {
        acc += s
        if (s === '|') {
          measures.push(acc.trim())
          acc = ''
        }
      }
      if (acc.trim()) measures.push(acc.trim())
      const realMeasures = measures.filter((m) => m && m !== '|')
      if (realMeasures.length < 2) return [body]
      const per = Math.max(1, Math.ceil(realMeasures.length / n))
      const lines: string[] = []
      for (let k = 0; k < realMeasures.length; k += per) {
        lines.push(realMeasures.slice(k, k + per).join(' '))
      }
      return lines
    }

    // Helper: split a syllabified w: payload into N sub-lines for the music
    // sub-lines above. Splits by whitespace-separated tokens proportionally.
    function splitWLineIntoChunks(payload: string, n: number): string[] {
      if (n <= 1) return [payload]
      const tokens = payload.split(/\s+/).filter(Boolean)
      if (tokens.length < n) return [payload]
      const per = Math.max(1, Math.ceil(tokens.length / n))
      const chunks: string[] = []
      for (let k = 0; k < tokens.length; k += per) {
        chunks.push(tokens.slice(k, k + per).join(' '))
      }
      return chunks
    }

    for (const i of visiblePhraseIndices) {
      const phraseBody = (split.phrases[i] ?? '').trim()
      if (!phraseBody) continue
      // Strip any pre-existing w: lines from the phrase body (defensive).
      const cleanedBody = phraseBody
        .split('\n')
        .filter((l) => !/^w:/.test(l.trim()))
        .join('\n')
        .trim()

      const musicSubLines = splitMusicIntoSubLines(cleanedBody, phraseSubdivisions)
      const actualSubdivisions = musicSubLines.length

      const wLines = showLyrics ? wLinesForPhrase(i) : []

      // For each music sub-line, emit the music followed by its share of
      // each stanza's w: payload (one w: line per stanza per sub-line).
      for (let sub = 0; sub < actualSubdivisions; sub++) {
        parts.push(musicSubLines[sub])
        for (const portion of wLines) {
          if (!portion || !portion.trim()) continue
          const syllabified = syllabifyForAbc(portion.replace(/\n/g, ' '))
          const chunks = splitWLineIntoChunks(syllabified, actualSubdivisions)
          const piece = chunks[sub] ?? ''
          if (piece) parts.push(`w: ${piece}`)
        }
      }
    }
    return parts.join('\n')
    // wLinesForPhrase depends on visibleCycles, captured by closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [split, visiblePhraseIndices, visibleCycles, tuneMeter, stanzaMeter, showLyrics, phraseSubdivisions, chromeless])

  // ── View area ─────────────────────────────────────────────────────────────
  // Item 2: Play plays once — no chain/repeat. We deliberately do NOT pass
  // autoPlayToken / onPlayStart / onPlaybackComplete so playback stops at end
  // and pagination is fully manual.
  // Item 1: pass renderLyricsBelow so Show Original mode in AbcPlayer can
  // render the same StanzaList below the JPG.
  const lyricsBelow =
    showLyrics && stanzas.length > 0 ? (
      <div className="mt-4 max-h-[60vh] overflow-y-auto">
        <StanzaList stanzas={stanzas} />
      </div>
    ) : null

  let viewArea: ReactNode
  if (viewMode === 'staff') {
    const isPartialPage = visibleCycles.length < CYCLES_PER_PAGE
    // In chromeless staff mode the parent flex-1 + max-h-full SVG already
    // pins layout to the viewport — applying a measured min-height would
    // force vertical scroll back. Only apply minStaffHeight outside chromeless.
    const applyMinHeight = !chromeless && isPartialPage && minStaffHeight > 0
    viewArea = (
      <div
        ref={staffRef}
        style={applyMinHeight ? { minHeight: minStaffHeight } : undefined}
      >
        <AbcPlayer
          abc={unifiedAbc}
          scale={scale}
          tuneName={tuneName}
          staffJpgUrl={scoreJpgUrl}
          solfegeJpgUrl={solfegeJpgUrl}
          renderLyricsBelow={lyricsBelow}
          showOriginal={showOriginal}
          onShowOriginalChange={setShowOriginal}
          renderAboveOriginal={
            <BackToNotationButton onClick={() => setShowOriginal(false)} />
          }
          hidePlayerControls={isFullscreen || chromeless}
          staffWidthFactor={staffWidthFactor}
        />
      </div>
    )
  } else if (viewMode === 'solfege') {
    viewArea = (
      <div className="space-y-4">
        <BackToNotationButton onClick={() => setViewMode('staff')} />
        {solfegeJpgUrl ? (
          <img
            src={solfegeJpgUrl}
            alt={`Solfège for ${tuneName}`}
            className="w-full h-auto rounded-md border border-border"
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Solfège not available for this tune.
          </p>
        )}
        {showLyrics && stanzas.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto">
            <StanzaList stanzas={stanzas} />
          </div>
        )}
      </div>
    )
  } else {
    // Lyrics-only: single-column scrollable list of all stanzas (D-17 verse numbers).
    viewArea =
      stanzas.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No lyrics available.</p>
      ) : (
        <StanzaList stanzas={stanzas} />
      )
  }

  const rootStyle = {
    ['--staff-base-size' as string]: `${baseSize}px`,
  } as CSSProperties

  // ── Fullscreen branch ─────────────────────────────────────────────────────
  if (isFullscreen && allowFullscreen) {
    const fullscreenTopBar = (
      <div className="flex items-center justify-between w-full">
        {sizeGroup}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setIsFullscreen(false)}
          aria-label="Exit fullscreen"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )

    const fullscreenBottomBar = showPagination ? (
      <>
        <Button onClick={prev} disabled={atStart} aria-label="Previous page">
          ← Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          {`Stanzas ${cyclePage + 1}/${totalStanzaPages}`}
        </span>
        <Button onClick={next} disabled={atEnd} aria-label="Next page">
          Next →
        </Button>
      </>
    ) : undefined

    return (
      <FullscreenOverlay
        open
        onClose={() => setIsFullscreen(false)}
        topBar={fullscreenTopBar}
        bottomBar={fullscreenBottomBar}
      >
        <div data-notation-renderer style={rootStyle} className="w-full">
          {viewArea}
        </div>
      </FullscreenOverlay>
    )
  }

  // ── Normal branch ─────────────────────────────────────────────────────────
  // In chromeless+staff mode (singing view), we lay out as a vertical flex
  // column so the notation viewArea fills the available height (set by the
  // <main data-notation-region> calc(100dvh - 144px)) and the size/stanza
  // footer rows stick to the bottom. The viewArea uses `min-h-0` so it can
  // shrink, and overflow is hidden so the SVG (responsive:resize → viewBox)
  // scales DOWN to fit both width AND height — eliminating the vertical
  // scroll in Staff mode. (UAT v6 issue #3)
  // Lyrics/Solfège modes also use the same overflow-y-auto wrapper.
  return (
    <div
      data-notation-renderer
      data-notation-body
      data-view-mode={viewMode}
      style={rootStyle}
      className={
        chromeless
          ? 'flex flex-col h-full'
          : 'space-y-3'
      }
    >
      {!chromeless && controlBar}
      {chromeless ? (
        <div
          data-notation-viewarea
          className="flex-1 min-h-0 overflow-y-auto"
        >
          {viewArea}
        </div>
      ) : (
        viewArea
      )}
      {chromeless && (
        <div className="shrink-0">
          {chromelessSizeRow}
          {chromelessStanzaNav}
        </div>
      )}
    </div>
  )
}
