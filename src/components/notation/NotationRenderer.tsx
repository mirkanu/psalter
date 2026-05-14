'use client'

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import {
  ChevronUp,
  ChevronDown,
  Expand,
  X,
} from 'lucide-react'
import AbcPlayer from '@/components/AbcPlayer'
import { FullscreenOverlay } from './FullscreenOverlay'
import { splitOnPhraseBreaks, buildPhraseAbc } from '@/lib/abc-phrases'
import { buildAbcWithSyllables } from '@/lib/lyrics'
import {
  groupStanzasIntoCycles,
  mapCycleToPhraseSyllableLines,
} from '@/lib/stanza-cycles'
import { useMediaQuery } from '@/hooks/useMediaQuery'

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
}

type ViewMode = 'staff' | 'solfege' | 'lyrics'
type BaseSize = 12 | 14 | 16 | 18

const SIZES: readonly BaseSize[] = [12, 14, 16, 18] as const
const DEFAULT_SIZE: BaseSize = 14
const STORAGE_SIZE_KEY = 'psalter-staff-size'
const STORAGE_MODE_KEY = 'psalter-score-mode'
const CYCLES_PER_PAGE = 3
const LANDSCAPE_NARROW_QUERY = '(orientation: landscape) and (max-width: 900px)'

function isBaseSize(n: number): n is BaseSize {
  return n === 12 || n === 14 || n === 16 || n === 18
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
  solfegeJpgUrl,
  tuneName,
  tuneMeter,
  stanzaMeter,
}: NotationRendererProps) {
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

  // ── Responsive: D-21 axis B trigger ────────────────────────────────────────
  const isLandscapeNarrow = useMediaQuery(LANDSCAPE_NARROW_QUERY)
  const paginateTuneHalf = isLandscapeNarrow && T > 2
  const halfCount = paginateTuneHalf ? 2 : 1
  const halfSize = paginateTuneHalf ? T / 2 : T

  // ── State ──────────────────────────────────────────────────────────────────
  const [cyclePage, setCyclePage] = useState(0)
  const [halfPage, setHalfPage] = useState<'A' | 'B'>('A')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_MODE_KEY) : null
      if (stored && isViewMode(stored)) return stored
    } catch {
      /* ignore */
    }
    return 'staff'
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [baseSize, setBaseSize] = useState<BaseSize>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_SIZE_KEY) : null
      const n = raw ? Number(raw) : NaN
      if (Number.isFinite(n) && isBaseSize(n)) return n
    } catch {
      /* ignore */
    }
    return DEFAULT_SIZE
  })

  // ── Persistence effects ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SIZE_KEY, String(baseSize))
    } catch {
      /* ignore */
    }
  }, [baseSize])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MODE_KEY, viewMode)
    } catch {
      /* ignore */
    }
  }, [viewMode])

  // Clamp cyclePage if cycles shrink
  useEffect(() => {
    if (cyclePage >= totalStanzaPages) {
      setCyclePage(Math.max(0, totalStanzaPages - 1))
    }
  }, [cyclePage, totalStanzaPages])

  // When paginateTuneHalf flips off, reset halfPage to 'A' so re-entry is fresh
  useEffect(() => {
    if (!paginateTuneHalf && halfPage !== 'A') setHalfPage('A')
  }, [paginateTuneHalf, halfPage])

  // ── Derived: visible cycles & phrase indices ───────────────────────────────
  const visibleCycles = useMemo(
    () => cycles.slice(cyclePage * CYCLES_PER_PAGE, (cyclePage + 1) * CYCLES_PER_PAGE),
    [cycles, cyclePage],
  )

  const visiblePhraseIndices = useMemo<number[]>(() => {
    if (!paginateTuneHalf) {
      return Array.from({ length: T }, (_, i) => i)
    }
    return halfPage === 'A'
      ? Array.from({ length: halfSize }, (_, i) => i)
      : Array.from({ length: halfSize }, (_, i) => i + halfSize)
  }, [paginateTuneHalf, halfPage, halfSize, T])

  // ── Pagination handlers (D-21 — tune-half flips first) ─────────────────────
  const atStart = cyclePage === 0 && (!paginateTuneHalf || halfPage === 'A')
  const atEnd =
    cyclePage === totalStanzaPages - 1 && (!paginateTuneHalf || halfPage === 'B')

  function next() {
    if (paginateTuneHalf && halfPage === 'A') {
      setHalfPage('B')
    } else {
      if (paginateTuneHalf) setHalfPage('A')
      setCyclePage((p) => Math.min(p + 1, totalStanzaPages - 1))
    }
  }
  function prev() {
    if (paginateTuneHalf && halfPage === 'B') {
      setHalfPage('A')
    } else {
      if (paginateTuneHalf) setHalfPage('B')
      setCyclePage((p) => Math.max(p - 1, 0))
    }
  }

  const scale = baseSize / 14

  // ── w: lines for one phrase, sliced for the active tune-half if needed ─────
  function wLinesForPhrase(i: number): string[] {
    return visibleCycles
      .flatMap((cycle) => {
        const cycleSlice = paginateTuneHalf
          ? halfPage === 'A'
            ? cycle.slice(0, Math.ceil(cycle.length / 2))
            : cycle.slice(Math.ceil(cycle.length / 2))
          : cycle
        const grid = mapCycleToPhraseSyllableLines(cycleSlice, tuneMeter, stanzaMeter)
        return grid[i] ?? ['']
      })
      .filter((s) => s.length > 0)
  }

  // ── Lyrics-only stanza rendering (D-17: verse number as <sup>) ─────────────
  function renderStanza(s: string, key: number): ReactNode {
    const m = s.match(/^(\d+)\s*([\s\S]*)$/)
    if (!m) {
      return (
        <p key={key} className="verse-text whitespace-pre-line">
          {s}
        </p>
      )
    }
    return (
      <p key={key} className="verse-text whitespace-pre-line">
        <sup className="verse-number">{m[1]}</sup>
        {m[2]}
      </p>
    )
  }

  // ── Pagination indicator ───────────────────────────────────────────────────
  const totalPages = totalStanzaPages * halfCount
  const currentPage =
    cyclePage * halfCount + (paginateTuneHalf ? (halfPage === 'A' ? 1 : 2) : 1)
  const showPagination = totalStanzaPages > 1 || paginateTuneHalf

  // ── Sub-renders ───────────────────────────────────────────────────────────
  const sizeGroup = (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="xs"
        onClick={() => setBaseSize((s) => (s > 12 ? ((s - 2) as BaseSize) : s))}
        disabled={baseSize <= 12}
        aria-label="Decrease notation size"
      >
        <ChevronDown className="h-3.5 w-3.5" />
        <span className="text-xs">A</span>
      </Button>
      <Button
        variant="outline"
        size="xs"
        onClick={() => setBaseSize((s) => (s < 18 ? ((s + 2) as BaseSize) : s))}
        disabled={baseSize >= 18}
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
      <Button
        variant={viewMode === 'lyrics' ? 'default' : 'outline'}
        size="xs"
        onClick={() => setViewMode('lyrics')}
        aria-pressed={viewMode === 'lyrics'}
      >
        Lyrics only
      </Button>
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
        {totalStanzaPages > 1 && paginateTuneHalf
          ? `Page ${currentPage}/${totalPages}`
          : paginateTuneHalf
            ? `Half ${halfPage}`
            : `Stanzas ${cyclePage + 1}/${totalStanzaPages}`}
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

  // ── View area ─────────────────────────────────────────────────────────────
  let viewArea: ReactNode
  if (viewMode === 'staff') {
    viewArea = (
      <div className="space-y-4">
        {visiblePhraseIndices.map((i) => {
          const wLines = wLinesForPhrase(i)
          const phraseAbc = buildPhraseAbc(split, i)
          const abcWithLyrics = buildAbcWithSyllables(phraseAbc, wLines)
          return (
            <div key={i} className="phrase-row">
              <AbcPlayer abc={abcWithLyrics} scale={scale} tuneName={tuneName} />
            </div>
          )
        })}
      </div>
    )
  } else if (viewMode === 'solfege') {
    viewArea = solfegeJpgUrl ? (
      <img
        src={solfegeJpgUrl}
        alt={`Solfège for ${tuneName}`}
        className="w-full h-auto rounded-md border border-border"
      />
    ) : (
      <p className="text-sm text-muted-foreground italic">
        Solfège not available for this tune.
      </p>
    )
  } else {
    // Lyrics-only: single-column scrollable list of all stanzas (D-17 verse numbers).
    viewArea =
      stanzas.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No lyrics available.</p>
      ) : (
        <div className="space-y-4">{stanzas.map((s, i) => renderStanza(s, i))}</div>
      )
  }

  const rootStyle = {
    ['--staff-base-size' as string]: `${baseSize}px`,
  } as CSSProperties

  // ── Fullscreen branch ─────────────────────────────────────────────────────
  if (isFullscreen) {
    const fullscreenBottomBar = (
      <>
        {showPagination ? (
          <Button onClick={prev} disabled={atStart} aria-label="Previous page">
            ← Prev
          </Button>
        ) : (
          <span aria-hidden />
        )}
        <Button
          variant="outline"
          onClick={() => setIsFullscreen(false)}
          aria-label="Exit fullscreen"
        >
          <X className="h-4 w-4" />
        </Button>
        {showPagination ? (
          <Button onClick={next} disabled={atEnd} aria-label="Next page">
            Next →
          </Button>
        ) : (
          <span aria-hidden />
        )}
      </>
    )

    return (
      <FullscreenOverlay
        open
        onClose={() => setIsFullscreen(false)}
        bottomBar={fullscreenBottomBar}
      >
        <div data-notation-renderer style={rootStyle} className="space-y-3">
          {controlBar}
          {viewArea}
        </div>
      </FullscreenOverlay>
    )
  }

  // ── Normal branch ─────────────────────────────────────────────────────────
  return (
    <div data-notation-renderer style={rootStyle} className="space-y-3">
      {controlBar}
      {viewArea}
    </div>
  )
}
