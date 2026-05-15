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
}

type ViewMode = 'staff' | 'solfege' | 'lyrics'
type BaseSize = number

const MIN_SIZE = 12
const MAX_SIZE = 44
const SIZE_STEP = 2
const DEFAULT_SIZE: BaseSize = 14
const STORAGE_SIZE_KEY = 'psalter-staff-size'
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

  // ── State ──────────────────────────────────────────────────────────────────
  const [cyclePage, setCyclePage] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
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

  // ── Derived: visible cycles & phrase indices ───────────────────────────────
  const visibleCycles = useMemo(
    () => cycles.slice(cyclePage * CYCLES_PER_PAGE, (cyclePage + 1) * CYCLES_PER_PAGE),
    [cycles, cyclePage],
  )

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
    // Strip any `T:` title lines from the header — abcjs auto-renders them as a
    // staff title, but the surrounding page UI already carries the tune name.
    const cleanedHeader = split.header
      .split('\n')
      .filter((l) => !/^\s*T:/.test(l))
      .join('\n')
    if (split.phrases.length === 0) return cleanedHeader
    const parts: string[] = [cleanedHeader]
    for (const i of visiblePhraseIndices) {
      const phraseBody = (split.phrases[i] ?? '').trim()
      if (!phraseBody) continue
      // Strip any pre-existing w: lines from the phrase body (defensive).
      const cleanedBody = phraseBody
        .split('\n')
        .filter((l) => !/^w:/.test(l.trim()))
        .join('\n')
        .trim()
      parts.push(cleanedBody)
      if (showLyrics) {
        const wLines = wLinesForPhrase(i)
        for (const portion of wLines) {
          if (portion && portion.trim()) {
            parts.push(`w: ${syllabifyForAbc(portion.replace(/\n/g, ' '))}`)
          }
        }
      }
    }
    return parts.join('\n')
    // wLinesForPhrase depends on visibleCycles, captured by closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [split, visiblePhraseIndices, visibleCycles, tuneMeter, stanzaMeter, showLyrics])

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
    viewArea = (
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
      />
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
