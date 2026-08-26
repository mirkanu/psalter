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
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { isPhoneDevice } from '@/lib/device'
import AbcPlayer from '@/components/AbcPlayer'
import { FullscreenOverlay } from './FullscreenOverlay'
import { StanzaList } from './StanzaList'
import { BackToNotationButton } from './BackToNotationButton'
import { splitOnPhraseBreaks, countNoteHeads } from '@/lib/abc-phrases'
import { syllabifyForAbc } from '@/lib/lyrics'
import { buildWLineFromSolfa } from '@/lib/abc-melisma'
import {
  groupStanzasIntoCycles,
  mapCycleToPhraseSyllableLines,
} from '@/lib/stanza-cycles'
import type { Stanza, StructuredLyrics } from '@/lib/lyrics-structured'
import { phrasesForMeter } from '@/lib/abc-phrase-meter-map'
import { splitMusicIntoSubLines } from './splitMusicIntoSubLines'
import { tokenizeMeasures } from './tokenizeMeasures'
import { splitWLineByNoteCounts } from './splitWLineByNoteCounts'
import {
  type MeasureEntry,
  splitContiguousByMeasures,
} from '@/lib/distribute-measures-to-substaffs'
import { forceMatchMeterShape } from '@/lib/force-match-meter-shape'
import { expectedSyllablesByLine } from '@/lib/meter-syllable-shape'
import { detectRepeatedPitchContinuations } from '@/lib/detect-repeated-pitch-continuations'
import { computeNotationScale } from '@/lib/notation-scale'
import { isMeterMismatch } from '@/lib/meter-mismatch'
import { computeScanToggleVisible } from '@/lib/inline-staff-gating'

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotationRendererProps {
  abc: string
  lyrics: string
  scoreJpgUrl: string | null
  solfegeJpgUrl: string | null
  tuneName: string
  tuneMeter: string | null
  /**
   * Optional per-tune phrase-shape override (e.g. [8,6,8,6,6] for Abbeyville).
   * When set, takes precedence over phrasesForMeter(tuneMeter) for cycle slicing
   * AND triggers last-line repetition in stanzas where the lyrics natively
   * provide fewer lines than the override demands.
   * Authored in /dev/melisma-editor.
   */
  phraseShapeOverride?: number[] | null
  /** Stanza meter (e.g. "CM" or "double-CM") — required for D-20 cycle pairing. */
  stanzaMeter: string | null
  /** Optional recording URLs surfaced in lyrics/solfège views as inline player (260517-cm0 #1f). */
  youtubeUrl?: string | null
  soundcloudUrl?: string | null
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
   * 2026-08-23 (row-count knob): additional sub-staves beyond the meter
   * baseline. A+/A− drives this directly in Inline Staff mode — 0 at
   * meter-min (e.g. 4 for CM/LM/SM), +1 per A+ press. The dynamic lyric
   * solver then picks the largest font that fits each row, so overflow
   * cannot occur. When provided, parent owns the state; when omitted,
   * defaults to 0 (meter baseline, no subdivision).
   */
  rowDelta?: number
  /**
   * When provided, NotationRenderer becomes controlled for showOriginal
   * (the scanned-JPG-instead-of-live-abcjs swap implemented in AbcPlayer).
   * Parent owns the state — see SingingView, which drives it from GearPopover.
   * Only meaningful in staff / staff-split when the scan is not already being
   * force-shown by the approval gate.
   */
  showOriginal?: boolean
  onShowOriginalChange?: (next: boolean) => void
  /**
   * Viewport-resize-driven notation size for chromeless inline Staff (SingingView's
   * existing 04.9.4-03 proportional-zoom heuristic), independent of the lyric-only
   * `baseSize` (which A+/A− drives). Ignored for all other view modes/callers.
   */
  notationBaseSize?: number
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
  /**
   * 2026-08-16 (Phase 16 R3): tune-page mode for /tunes/[slug]. Suppresses
   * sizeGroup (A+/A-), paginationGroup (Stanza nav), fullscreen icon, and the
   * bottom player controls (Play/Key/BPM/Show original). Keeps the view-mode
   * toggle (Staff / Solfège) so users can still pick which view to see.
   * Distinct from `chromeless`: chromeless drops the entire controlBar
   * INCLUDING the view-mode buttons, which we still want here.
   */
  tunePageMode?: boolean
  /**
   * Fired whenever stanza navigation changes. `current` is reported 1-indexed
   * (`cyclePage + 1`) so consumers can render directly as `Stanza ${current} / ${total}`.
   * Fired once on mount with the initial values, and on every subsequent change.
   * Optional — when omitted the renderer behaves exactly as before.
   */
  onStanzaChange?: (current: number, total: number) => void
  /**
   * Controlled stanza page (1-indexed). When provided, NotationRenderer mirrors
   * its internal `cyclePage` to `stanzaPage - 1`. Pair with `onStanzaPageChange`
   * to let parent chrome (e.g. GlassBottomBar) drive pagination.
   */
  stanzaPage?: number
  onStanzaPageChange?: (page: number) => void
  /**
   * Plan 04.9.6-05 (D-01): canonical structured-lyrics path. When non-null,
   * the renderer consumes this directly. When null, the legacy blob `lyrics`
   * prop is parsed into a transient `Stanza[]` (D-15 fallback for the 6
   * quarantined psalm-versions).
   */
  lyricsStructured: StructuredLyrics | null
  /**
   * Plan 04.9.6-05 (D-11): canonical signal driving stanza-cycle pairing.
   * Replaces the Plan-04 transitional meter-string heuristic.
   */
  doubleLength: boolean
  /**
   * Plan 04.9.9: Raw solfège OCR JSON string from DB. When non-null and containing
   * soprano/doh/time fields, used to build melisma-aware w: lines via
   * buildWLineFromSolfa. When null, falls back to syllabifyForAbc.
   */
  solfegeOcrText?: string | null
  /**
   * Per-phrase melisma note indices from tunes.melisma_positions.
   * melismaPositions[phraseIdx][k] = 0-based intra-phrase note index that is
   * a melisma continuation (w: `_` token). NULL/undefined = use heuristic path.
   */
  melismaPositions?: number[][] | null
  /**
   * When true, the staff ABC includes `w:` lines under the notes (slurs
   * render via `_` melisma continuation tokens). Defaults to `showLyrics`.
   * Set to true on the tune page where lyrics are intentionally hidden
   * (`showLyrics: false`) but melisma contours still need to render.
   * (Phase 4.9 / Phase 16 — D-02 split: hide the StanzaList panel but
   * still emit w: lines so abcjs renders `_` marks for melisma positions.)
   */
  renderWLineUnderStaff?: boolean
  /** Full ordered list of staff-score image paths for the active tune (server-derived). Enables multi-page thumbnail nav. */
  staffPages?: string[]
  /** Full ordered list of solfège image paths for the active tune (server-derived). Enables multi-page thumbnail nav. */
  solfegePages?: string[]
  /**
   * When false, Split-Leaf Staff renders the pre-rendered staff JPEG instead
   * of live abcjs notation (mirrors how Split-Leaf Solfège already always
   * shows the scanned JPG). Default true preserves current behavior for
   * every caller that doesn't pass it (study/tune pages are never gated —
   * locked decision from Phase 04.9.14).
   */
  staffInlineApproved?: boolean
}

export type ViewMode = 'staff' | 'solfege' | 'staff-split' | 'solfege-split' | 'lyrics'
type BaseSize = number

export const MIN_SIZE = 4
export const MAX_SIZE = 120
export const SIZE_STEP = 2
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
  return s === 'staff' || s === 'solfege' || s === 'staff-split' || s === 'solfege-split' || s === 'lyrics'
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
function activePages(viewMode: ViewMode, staffPages?: string[], solfegePages?: string[]): string[] {
  if (viewMode === 'solfege' || viewMode === 'solfege-split') return solfegePages ?? []
  return staffPages ?? []
}

function isSplitMode(viewMode: ViewMode): boolean {
  return viewMode === 'staff-split' || viewMode === 'solfege-split'
}

function isSolfegeMode(viewMode: ViewMode): boolean {
  return viewMode === 'solfege' || viewMode === 'solfege-split'
}

/**
 * Phase 04.9.20 quick task 260825-slur: wrap melisma groups in (...) so
 * abcjs draws a native slur arc. abcjs's slur parser (see
 * node_modules/abcjs/src/parse/abc_parse_music.js:62-83) treats '(' before
 * a note as slur-start and ')' after a note as slur-stop, and its drawer
 * (write/draw/tie.js → drawArc) anchors the arc to the notehead's stem
 * side rather than the notehead center — which is the correct musical
 * position and matches the Hark! the Herald reference image.
 *
 * `melismaContinuations` are 0-based intra-phrase note indices of each
 * melisma CONTINUATION (the second, third, ... note of a melisma). The
 * first note of each melisma is the one immediately preceding the
 * continuation. For a melisma spanning notes 2,3,4, continuations = [3,4]
 * and the wrap emits `(n2 n3 n4)`.
 *
 * Walks the music line token-by-token with the same note-head regex used
 * by the flatten path so octave marks and durations stay attached to
 * their note. Inserts '(' before the syllable-start note and ')' after
 * the last continuation note. NO-OP when continuations is empty (returns
 * input unchanged so callers can pass unconditionally).
 */
function wrapMelismaSlurs(musicLine: string, melismaContinuations: number[]): string {
  if (melismaContinuations.length === 0) return musicLine
  const NOTE_RE = /(?:[\^_=]?[A-Ga-gzZ][',]*\d*(?:\/\d+)?)/g
  type NoteMatch = { index: number; text: string }
  const notes: NoteMatch[] = []
  let m: RegExpExecArray | null
  while ((m = NOTE_RE.exec(musicLine)) !== null) {
    notes.push({ index: m.index, text: m[0] })
  }
  if (notes.length === 0) return musicLine
  const continuations = new Set(melismaContinuations)
  // 260825-ps21 v2: walk the string token-by-token instead of splicing
  // (...) into the original positions. The previous splice approach
  // produced empty `()` groups when an open and close landed at the same
  // character offset (close of one note = start of the next adjacent
  // note) — the `(` got inserted before the just-inserted `)`, giving
  // `e'2)(f'` instead of `e'2)(f'`. Walking the tokens in order avoids
  // the offset-shift bug entirely.
  //
  // A slur opens at note n if n is NOT a continuation AND the next note
  // is. A slur closes at note n if n is a continuation AND the next note
  // is NOT (or n is the last note).
  let result = ''
  let inSlur = false
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]!
    // Copy everything from the previous note's end up to this note's start.
    if (i === 0) {
      result += musicLine.slice(0, note.index)
    } else {
      result += musicLine.slice(notes[i - 1]!.index + notes[i - 1]!.text.length, note.index)
    }
    const isContinuation = continuations.has(i)
    const nextIsContinuation = i + 1 < notes.length && continuations.has(i + 1)
    // Open: we're entering a slur.
    if (!isContinuation && nextIsContinuation && !inSlur) {
      result += '('
      inSlur = true
    }
    result += note.text
    // Close: we're leaving a slur.
    if (isContinuation && !nextIsContinuation && inSlur) {
      result += ')'
      inSlur = false
    }
  }
  // Append any trailing content (barlines, whitespace) after the last note.
  if (notes.length > 0) {
    const last = notes[notes.length - 1]!
    result += musicLine.slice(last.index + last.text.length)
  }
  return result
}

// 260825-slur-flatten: same logic as wrapMelismaSlurs but operates on an
// array of abc note tokens (the form the flatten path produces after
// per-note LPT). Each token is checked against a predicate so callers
// from different paths can supply their own continuation logic — e.g.
// the flatten path keys continuations on the note's WITHIN-PHRASE index,
// not its position in the sub-staff.
function wrapMelismaSlursFromTokens(
  tokens: string[],
  isContinuation: (subStaffIdx: number) => boolean,
  separator: string = ' ',
): string {
  if (tokens.length === 0) return ''
  const parts: string[] = []
  let inSlur = false
  // 260826-chord-slur-skip: abcjs slur parser mishandles `( f' c' )` —
  // it parses both `(` characters as slur opens (startSlur counter
  // increments once for the outer `(`, but the close `)` then matches
  // only one of them), leaving slur 8 unclosed. That open slur carries
  // to the end of the staff as an abcjs-end-edge tie ellipse
  // (abcjs/src/write/draw/tie.js line 37-38). Skip slur-wrap when the
  // resulting group would be two bare-pitch tokens (no duration digit)
  // that abcjs would re-parse as a chord-with-slur artifact.
  const isBarePitch = (t: string): boolean => /^[A-Ga-gzZ][',]*$/.test(t)
  for (let i = 0; i < tokens.length; i++) {
    const isCont = isContinuation(i)
    const nextIsCont = i + 1 < tokens.length && isContinuation(i + 1)
    const wouldWrapChord =
      isBarePitch(tokens[i]!) &&
      i + 1 < tokens.length &&
      isBarePitch(tokens[i + 1]!)
    if (!isCont && nextIsCont && !inSlur && !wouldWrapChord) {
      parts.push('(')
      inSlur = true
    }
    parts.push(tokens[i]!)
    if (isCont && !nextIsCont && inSlur) {
      parts.push(')')
      inSlur = false
    }
  }
  // 260825-slur-close-end: if the last note of the chunk is a continuation
  // (melisma group runs off the end of this sub-staff), DO NOT close the
  // slur here — abcjs interprets `)` at end-of-line as an unmatched edge
  // and renders it as a wide tie ellipse (abcjs/src/write/draw/tie.js
  // line 37-38). Suppress the slur-open at the LAST note of any chunk to
  // prevent that artifact. Trade-off: cross-chunk melisma groups lose
  // their trailing slur arc on the receiving sub-staff. Intra-chunk
  // groups still render correctly (the small, clean arcs the user sees).
  //
  // We achieve this by STRIPPING the trailing open `(` if no close `)`
  // ever fires. Walk the output parts in reverse to find the last `(`,
  // and if there is no matching `)` between it and the end, drop it.
  if (inSlur) {
    // Strip the trailing unmatched `(` instead of adding a closing `)`.
    let openIdx = -1
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] === ')') break
      if (parts[i] === '(') { openIdx = i; break }
    }
    if (openIdx >= 0) {
      parts.splice(openIdx, 1)
    }
    inSlur = false
  }
  return parts.join(separator)
}

// 260826-phrase-bound-overflow: when A+ has been pressed, distribute the
// extra sub-staves (rows beyond phraseCount) to the longest phrases (by
// measure count), ties broken by lower phrase index. Each phrase gets at
// least one sub-staff; the longest phrases get extra rows proportionally to
// how many measures they contain. Within each phrase, measures stay
// CONTIGUOUS (no interleaving), preserving melody order across the split.
function allocatePhraseSubs(
  phraseData: ReadonlyArray<{ readonly measures: ReadonlyArray<unknown> }>,
  totalSubs: number,
): number[] {
  const n = phraseData.length
  if (n === 0) return []
  if (totalSubs <= n) return Array.from({ length: n }, () => 1)
  const subs: number[] = Array.from({ length: n }, () => 1)
  const counts = phraseData.map((pd) => pd.measures.length)
  let extras = totalSubs - n
  while (extras > 0) {
    // Greedy: pick the phrase with the most measures, ties broken by
    // lower index. After every phrase has been bumped once the next pass
    // starts picking again from the longest, so a long phrase can absorb
    // multiple extras (e.g. a 6-measure phrase gets subs [3] at A+5 with
    // 4 phrases while a 1-measure phrase stays at [1]).
    let bestIdx = 0
    let bestCount = counts[0] ?? 0
    for (let i = 1; i < n; i++) {
      const c = counts[i] ?? 0
      if (c > bestCount) {
        bestIdx = i
        bestCount = c
      }
    }
    subs[bestIdx] = (subs[bestIdx] ?? 1) + 1
    extras--
  }
  return subs
}

export function NotationRenderer({
  abc,
  lyrics,
  scoreJpgUrl,
  solfegeJpgUrl,
  tuneName,
  tuneMeter,
  phraseShapeOverride,
  stanzaMeter,
  showLyrics = true,
  // Default w-line emission to `showLyrics` so existing call sites that
  // pass neither flag keep their current behaviour. Tune-page callers
  // pass showLyrics:false + renderWLineUnderStaff:true to emit w: lines
  // (for melisma `_` marks) while still suppressing the StanzaList panel.
  renderWLineUnderStaff,
  onViewModeChange,
  viewMode: viewModeProp,
  baseSize: baseSizeProp,
  onBaseSizeChange,
  showOriginal: showOriginalProp,
  onShowOriginalChange,
  notationBaseSize,
  rowDelta: rowDeltaProp,
  chromeless = false,
  tunePageMode = false,
  onStanzaChange,
  stanzaPage,
  onStanzaPageChange,
  youtubeUrl = null,
  soundcloudUrl = null,
  lyricsStructured,
  doubleLength,
  solfegeOcrText = null,
  melismaPositions = null,
  staffPages = [],
  solfegePages = [],
  staffInlineApproved = true,
}: NotationRendererProps) {
  // chromeless mode permanently disables the FS overlay; the singing view IS the fullscreen.
  const allowFullscreen = !chromeless
  // ── Derived: phrases & cycles ──────────────────────────────────────────────
  // Plan 04.9.6-05 (D-01, D-15): use the canonical structured-lyrics path
  // when populated; otherwise parse the legacy blob into a transient
  // `Stanza[]` so the downstream grid consumer (`mapCycleToPhraseSyllableLines`)
  // remains uniform across both paths. The 6 quarantined psalm-versions
  // (Plan 03 SUMMARY) flow through the fallback branch with no visual change.
  const stanzas = useMemo<Stanza[]>(() => {
    if (lyricsStructured && lyricsStructured.length > 0) {
      return lyricsStructured
    }
    return (lyrics ?? '')
      .split(/\n\s*\n/)
      .map((s, idx) => ({
        index: idx,
        lines: s
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
          .map((text) => ({ text })),
      }))
      .filter((st) => st.lines.length > 0)
  }, [lyricsStructured, lyrics])

  const cycles = useMemo(
    () => groupStanzasIntoCycles(stanzas, doubleLength),
    [stanzas, doubleLength],
  )

  // Plan 04.9.9: Parse solfège OCR JSON for melisma-aware w: generation.
  // T-04.9.9-05: try/catch + per-field type guards — null on any failure.
  const solfegeVoices = useMemo(() => {
    if (!solfegeOcrText) return null
    try {
      const parsed = JSON.parse(solfegeOcrText) as Record<string, unknown>
      const soprano = typeof parsed.soprano === 'string' ? parsed.soprano : null
      const doh     = typeof parsed.doh     === 'string' ? parsed.doh     : null
      const time    = typeof parsed.time    === 'string' ? parsed.time    : 'C'
      if (!soprano || !doh) return null
      return { soprano, doh, time }
    } catch {
      return null
    }
  }, [solfegeOcrText])

  const totalStanzaPages = Math.max(1, Math.ceil(cycles.length / CYCLES_PER_PAGE))

  // ── State ──────────────────────────────────────────────────────────────────
  const isStanzaPageControlled = stanzaPage !== undefined
  const [cyclePageInternal, setCyclePageInternal] = useState(0)
  const cyclePage = isStanzaPageControlled
    ? Math.max(0, (stanzaPage as number) - 1)
    : cyclePageInternal
  const setCyclePage = (updater: number | ((prev: number) => number)) => {
    if (isStanzaPageControlled) {
      const nextRaw = typeof updater === 'function' ? updater(cyclePage) : updater
      const next = Math.max(0, Math.min(nextRaw, totalStanzaPages - 1))
      onStanzaPageChange?.(next + 1)
      return
    }
    setCyclePageInternal((prev) => {
      const nextRaw = typeof updater === 'function' ? updater(prev) : updater
      return Math.max(0, Math.min(nextRaw, totalStanzaPages - 1))
    })
  }
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
  // 2026-08-16 (Phase 16 R3): STORAGE_MODE_KEY is a single localStorage key
  // shared across every NotationRenderer instance app-wide (line 184/354). A
  // user who picked inline 'solfege' or 'lyrics' on /psalms/[id] Sing view
  // would otherwise land on /tunes/[slug] with that stale mode restored —
  // 'solfege' hits the "coming soon" placeholder (never the JPG fallback),
  // and 'lyrics' has no button to get back from since showLyrics is false
  // here. Normalize both to their tune-page equivalents on mount/prop-change.
  useEffect(() => {
    if (!tunePageMode) return
    if (viewMode === 'solfege') setViewMode('solfege-split')
    else if (viewMode === 'staff' && !abc.trim()) setViewMode('staff-split')
  }, [tunePageMode, viewMode, abc])
  // UI-SPEC §3: multi-page solfège — selected image page. Reset when the
  // active page-array identity changes (tune switch / legacy URL change).
  const [pageIndex, setPageIndex] = useState(0)
  useEffect(() => { setPageIndex(0) }, [staffPages?.[0], solfegePages?.[0]])
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Lifted from AbcPlayer so NotationRenderer knows when the legacy JPG is
  // shown (and can therefore hide the stanza-pagination row, which is
  // meaningless when the image is displayed).
  const isShowOriginalControlled = showOriginalProp !== undefined
  const [showOriginalInternal, setShowOriginalInternal] = useState(false)
  const showOriginal = isShowOriginalControlled ? (showOriginalProp as boolean) : showOriginalInternal
  const setShowOriginal = (next: boolean) => {
    if (isShowOriginalControlled) {
      onShowOriginalChange?.(next)
    } else {
      setShowOriginalInternal(next)
      onShowOriginalChange?.(next)
    }
  }
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
    try {
      localStorage.setItem(STORAGE_SIZE_FS_KEY, String(fullscreenSize))
    } catch {
      /* ignore */
    }
  }, [fullscreenSize])

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

  // Report stanza nav up to parent (SingingView reads this to drive the
  // GlassBottomBar centre indicator). 1-indexed `current` so consumers can
  // render `Stanza ${current} / ${total}` without re-deriving.
  useEffect(() => {
    onStanzaChange?.(cyclePage + 1, totalStanzaPages)
  }, [cyclePage, totalStanzaPages, onStanzaChange])

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

  // ── Pagination handlers (cycle-page only) ──────────────────────────────────
  const atStart = cyclePage === 0
  const atEnd = cyclePage === totalStanzaPages - 1

  function next() {
    setCyclePage((p) => Math.min(p + 1, totalStanzaPages - 1))
  }
  function prev() {
    setCyclePage((p) => Math.max(p - 1, 0))
  }

  // 04.9.14-01 (Task 4): decouple notation rendering scale from lyrics font
  // size in split-leaf mode. In split-leaf, A-/A+ (baseSize) drives ONLY
  // `--staff-base-size` (lyrics/verse text CSS var) via rootStyle below;
  // the notation itself renders at a fixed scale so the staff never grows
  // or shrinks when the user zooms lyrics text. Non-split modes keep the
  // original coupled behaviour (scale tracks baseSize) — unchanged.
  const scale = computeNotationScale({ viewMode, chromeless, baseSize, notationBaseSize })

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
  // Split-leaf layout axis: stacked (lyrics under notation) only in narrow
  // portrait, where there isn't width to spare. Any wider viewport — phone
  // landscape, tablet, desktop — lays lyrics out beside the notation instead.
  const isNarrowPortrait = useMediaQuery('(orientation: portrait) and (max-width: 767px)')
  // MOBILE-09: the fit gates below (staffWidthFactor + compactSplitMobile)
  // were width-only (viewportW < 768), so they correctly caught narrow
  // portrait phones but missed phone landscape — wide (768-926px, escapes
  // the mobile branch) yet just as height-constrained (390-430px tall).
  // Reuse the exact phone/orientation detection already established in
  // SingingView.tsx (isPhone state + '(orientation: landscape) and
  // (max-width: 926px)' query) rather than inventing a new gate. isPhone is
  // SSR-safe (navigator-based, set in an effect); the media query hook is
  // called unconditionally at top level, then combined with isPhone — never
  // short-circuited into the hook call itself, to keep hooks order stable.
  const [isPhone, setIsPhone] = useState(false)
  useEffect(() => {
    setIsPhone(isPhoneDevice())
  }, [])
  const isPhoneLandscapeMQ = useMediaQuery('(orientation: landscape) and (max-width: 926px)')
  const isPhoneLandscapeForFit = isPhone && isPhoneLandscapeMQ
  // Quick 260712-kov fix: the sub-1 narrowing factor above exists to force
  // abcjs to WRAP a single long phrase into more systems (more notes fit per
  // requested staffwidth than the viewport can show, so a narrower target
  // makes abcjs break earlier). That wrap-forcing only matters for the
  // splitMusicIntoSubLines code path. SingingView always supplies
  // melismaPositions, so buildUnifiedAbc takes the Phase 04.9.12
  // melisma-positions branch instead, which emits ONE already-fixed music
  // line per phrase (never auto-wrapped) — the narrowing factor no longer
  // controls system count there, it just compresses note spacing.
  // Diagnosed via tests/diagnostics/split-leaf-staff-diff.mjs: inline Staff
  // (with w: lyric lines) ends up compensating for this compression because
  // abcjs widens note spacing to fit long lyric syllables under a compressed
  // staffwidth ("MOBILE-03" behaviour, see AbcPlayer.tsx) — an accidental
  // side effect of lyrics being present. Split-leaf Staff has NO lyrics to
  // trigger that compensation, so the SAME narrow factor renders it visibly
  // smaller/differently-proportioned than inline (viewBox width diverged
  // ~2x at mobile in the diagnostic). Fix: split-leaf renders at the full
  // (uncompressed) factor — there is no wrap-count reason to narrow it, and
  // this restores parity with inline's effective geometry. Inline Staff,
  // inline Solfège, and split-leaf Solfège (JPG) are unaffected.
  const isSplitForWidth = isSplitMode(viewMode)
  const staffWidthFactor = chromeless
    ? isSplitForWidth
      ? 1
      : viewportW < 768 || isPhoneLandscapeForFit
      ? 0.55
      // Quick task 260823-stretch: desktop/tablet SingingView staff mode.
      // 0.85 was producing a noticeable right-edge gap because the viewBox
      // came out narrower than the container (AbcPlayer handles the SVG
      // anchoring + stretchlast to neutralise that gap, but widening the
      // staff here too means more music per system and the gap shrinks
      // faster). 0.95 still forces ≥3 systems on desktop viewports; tested
      // against /psalms/9 in desktop Chrome via Playwright daemon.
      : 0.95
    : 1

  // 260712-szw: mobile-only compact spacing + height-fit for split-leaf
  // Staff. UAT on Ps 78 (Azmon/Denfield, CM) found mobile split-leaf has too
  // much whitespace above/below the staff (no lyrics reserve space for) and
  // the 4th system requires scrolling. Diagnostic VERDICT
  // (tests/diagnostics/split-leaf-staff-diff.mjs): spacing reduction alone
  // is NOT sufficient (434px -> 299px, still above the ~260px mobile
  // notation-slot budget) — both compact spacing AND a height-fit scale are
  // required.
  //
  // 260716: extended to inline (non-split) Staff too. The whole-tune inline
  // view had NO height-fit at all on mobile — a CM tune's 8 sub-staves could
  // exceed the chromeless notation-viewarea height and force a page scroll,
  // even though the surrounding comment/design intent (UAT v6 issue #3) says
  // Staff mode should never need to scroll. Gated to chromeless && (staff OR
  // split-leaf) && <768px so desktop and non-chromeless callers (/tunes/[id],
  // /study) stay byte-identical; inline/split-leaf Solfège (JPG-based, sized
  // separately) are unaffected.
  //
  // 260824-rowscroll: bypass height-fit-scale when rowDelta > 0. The user has
  // explicitly asked for MORE rows via A+ — those rows should render at
  // natural size and the viewarea should scroll, not silently shrink the SVG
  // to fit and hide the overflow. This is what re-enables vertical scroll on
  // mobile after A+ presses (SingingView's rowCountBypass already sets
  // `overflow-y: auto` inline, but the height-fit-scale would otherwise make
  // scrollHeight == clientHeight, leaving nothing to scroll).
  const compactSplitMobile =
    chromeless &&
    (viewportW < 768 || isPhoneLandscapeForFit) &&
    (viewMode === 'staff' || viewMode === 'staff-split') &&
    (rowDeltaProp ?? 0) === 0

  // 04.9.15.1-03 checkpoint fix: reserve top (portrait + landscape) / bottom
  // (landscape only) breathing room around inline (non-split) Staff on
  // mobile. CRITICAL: this padding must NOT land directly on
  // `data-notation-viewarea`/`data-notation-fit-slot` — that's the exact
  // element AbcPlayer's height-fit pass measures via `clientHeight` to
  // compute its SVG scale (see AbcPlayer.tsx's `slotHeight`/`fitScale`).
  // Padding placed on THAT element would inflate its own clientHeight
  // without shrinking the space actually available to content, so the
  // SVG would be scaled to fill the padded (larger) height and overflow by
  // the padding amount, reintroducing MOBILE-09's scroll bug. Instead the
  // padding lives on a plain wrapper OUTSIDE that element (see render below)
  // — flexbox content-box math then naturally reduces the inner fit-slot's
  // OWN clientHeight by the padding amount, so AbcPlayer's fit computation
  // sees the already-reduced budget and scales correctly within it.
  const isInlineStaffFitMobile =
    chromeless && viewMode === 'staff' && (viewportW < 768 || isPhoneLandscapeForFit)

  // How many sub-systems to break each source phrase into. abcjs only wraps
  // music where the ABC source contains an explicit newline; staffwidth alone
  // does not split a single music-line.
  //
  // MOBILE-LYRIC-FIX: On narrow non-chromeless screens (< 480px), abcjs
  // internally wraps long phrases (e.g. 8-note CM lines across 2 bars)
  // when the staffwidth doesn't fit all notes in one row. When abcjs wraps
  // internally, w: lyrics only land on the FIRST wrapped segment — the second
  // segment renders notes with no lyrics underneath. Fix: force
  // baseSubdivisions=2 on narrow screens so music is EXPLICITLY split at
  // barlines, then proportionally distribute the w: line across sub-staves.
  //
  // 260716: the chromeless (<1280) branch of this forced-split rule is
  // REMOVED. The design doc this rule cited (mobile-psalm-display-design.md
  // §Body) actually specifies "4 staff systems like the reference
  // screenshot" for a CM tune — i.e. ONE system per phrase, matching the
  // phrase count. Forcing every phrase to split in half doubled that to 8
  // systems, which is what the doc was trying to AVOID, not achieve.
  // 2026-08-16 (Phase 16 R3 sign-off round 2): tunePageMode is excluded from
  // this forced-split rule too. The MOBILE-LYRIC-FIX concern above (w: lyrics
  // losing sync across an abcjs-internal wrap) cannot occur on the tune page
  // — showLyrics:false + renderWLineUnderStaff:false mean there are no w:
  // lines to begin with. Without this exclusion CM tunes rendered 8 staff
  // systems on mobile instead of the 4 that /psalms/[id]'s Sing view (and
  // the 260716 fix above) already established as correct.
  const baseSubdivisions = !chromeless && !tunePageMode && viewportW < 480 ? 2 : 1
  // 2026-08-23 (row-count knob): in Inline Staff mode, A+/A− drives
  // `rowDelta` (parent-controlled) which is added to baseSubdivisions
  // to determine total sub-staves per phrase. The dynamic lyric solver
  // picks the largest font that fits each row automatically — overflow
  // cannot occur because the user is choosing row count, not font size.
  // Outside Inline Staff (Staff Split Leaf, Lyrics, Solfège, tune page),
  // rowDelta stays at 0 so notation scale is unaffected.
  const extraSubdivisions = rowDeltaProp ?? 0
  // 2026-08-23 (row-count knob, distribution step): distribute the user-
  // requested extra rows (rowDelta) ACROSS phrases so that the TOTAL row
  // count = meterMin + rowDelta (where meterMin = phrasesForMeter(tuneMeter)).
  // For CM (meterMin=4), rowDelta=1 → total 5: one phrase gets +1 (whichever
  // falls out of the round-robin), the rest stay at base. Distribution is
  // round-robin from the LAST phrase — climactic lines (Ps 23's "I shall
  // dwell") tend to be denser and benefit most from extra room.
  //
  // Fallback when the meter is unknown: 1 (no round-robin possible, so
  // every phrase gets all the extra — fine for the small/unknown-meter case
  // since the user will see N*phraseSubdivisions rows and can reason about
  // it from the total).
  const meterMinForDistribution = phrasesForMeter(tuneMeter ?? null)
  // 2026-08-24: distribute extraSubdivisions UNIFORMLY across phrases so the
  // user sees equal-width sub-staves (and therefore equal font sizes when
  // the dynamic solver runs). Each phrase gets:
  //   baseSubdivisions + floor(extraSubdivisions / meterMin)
  //   + (i < extraSubdivisions % meterMin ? 1 : 0)
  // Total rows = meterMin × baseSubdivisions + extraSubdivisions
  //            = meterMin + extraSubdivisions  (when baseSubdivisions=1)
  // The first N phrases get the +1 from the remainder (not the last) so the
  // top of the staff (which is typically the higher / less-climactic lines)
  // absorbs the extra room first — easier to scan visually since the dense
  // climactic lines stay at full natural width below.
  function phraseSubdivisionsFor(i: number): number {
    if (meterMinForDistribution <= 1) {
      return baseSubdivisions + extraSubdivisions
    }
    const baseExtra = Math.floor(extraSubdivisions / meterMinForDistribution)
    const remainder = extraSubdivisions % meterMinForDistribution
    const isFirstPhrases = i < remainder
    return baseSubdivisions + baseExtra + (isFirstPhrases ? 1 : 0)
  }

  // ── w: lines for one phrase ────────────────────────────────────────────────
  // Plan 04.9.6-05: visibleCycles is canonical `Stanza[][]` (see useMemo
  // above). `mapCycleToPhraseSyllableLines` returns a T-element `string[][]`
  // grid; the `grid[i] ?? ['']` flatMap is the B1 shape-preservation contract
  // inherited unchanged from Plan 04.
  // RENDER-07b (Phase 4.9.7 Plan 03): returns one `string[]` per visible
  // cycle. Inner array length === linesPerPhrase — each entry is one
  // metrical line's syllabified text. The sub-staff loop below indexes
  // `sub` into each cycle's inner array, emitting exactly one w: line per
  // metrical line per stanza per sub-staff. Cross-stanza alignment is
  // structural: same meter → identical inner length across all cycles.
  function wLinesForPhrase(i: number): string[][] {
    // Per-tune phrase-shape override (e.g. [8,6,8,6,6] for Abbeyville) wins
    // over meter-derived count. When set, also pad each cycle's lines by
    // repeating the last line so cycles 2+ render a 5th phrase's lyrics.
    const effectivePhraseCount = phraseShapeOverride && phraseShapeOverride.length > 0
      ? phraseShapeOverride.length
      : phrasesForMeter(tuneMeter)
    return visibleCycles.map((cycle) => {
      let workingCycle = cycle
      if (
        phraseShapeOverride &&
        phraseShapeOverride.length > 0
      ) {
        const flatLineCount = cycle.reduce((sum, s) => sum + s.lines.length, 0)
        if (flatLineCount > 0 && flatLineCount < effectivePhraseCount) {
          // Pad the last stanza's last line until we hit the target count.
          const padded = cycle.map(s => ({ ...s, lines: [...s.lines] }))
          const lastStanza = padded[padded.length - 1]!
          const lastLine = lastStanza.lines[lastStanza.lines.length - 1]
          while (
            padded.reduce((sum, s) => sum + s.lines.length, 0) < effectivePhraseCount &&
            lastLine
          ) {
            lastStanza.lines.push({ ...lastLine })
          }
          workingCycle = padded
        }
      }
      const grid = mapCycleToPhraseSyllableLines(workingCycle, effectivePhraseCount)
      if (i >= grid.length && typeof console !== 'undefined') {
        // Lyric would be silently dropped because the cycle has fewer metrical
        // lines than the meter/override expects. Surface this in dev so the
        // root cause (insufficient lines in lyrics) is debuggable.
        console.warn(
          `[NotationRenderer] meter expects ${effectivePhraseCount} phrases but cycle ${visibleCycles.indexOf(cycle)} has only ${grid.length} (phrase ${i} dropped). ` +
          `tuneMeter=${tuneMeter ?? 'null'}, phraseShapeOverride=${JSON.stringify(phraseShapeOverride ?? null)}, doubleLength=${doubleLength}.`,
        )
      }
      return grid[i] ?? []
    })
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
        variant={viewMode === 'staff' || viewMode === 'staff-split' ? 'default' : 'outline'}
        size="xs"
        // 2026-08-16 (Phase 16 R3): on the tune page, clicking Staff routes to
        // staff-split (scanned JPG) when there's no abcjs to render inline —
        // mirrors the Gear → Solfège routing on /psalms/1 (line 90 of
        // GearPopover). On other surfaces we keep the inline 'staff' default.
        onClick={() => setViewMode(tunePageMode && !abc.trim() ? 'staff-split' : 'staff')}
        aria-pressed={viewMode === 'staff' || viewMode === 'staff-split'}
      >
        Staff
      </Button>
      <Button
        variant={viewMode === 'solfege' || viewMode === 'solfege-split' ? 'default' : 'outline'}
        size="xs"
        // 2026-08-16: abcjs has no tonic sol-fa support, so 'solfege' routes
        // to 'solfege-split' (scanned JPG) on the tune page. Without this
        // gate, clicking would land on the "coming soon" placeholder
        // (line 1510).
        onClick={() => setViewMode(tunePageMode ? 'solfege-split' : 'solfege')}
        aria-pressed={viewMode === 'solfege' || viewMode === 'solfege-split'}
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

  // Chromeless Size row / Stanza nav removed in 04.9.4-chrome-dedup.
  // SingingView now owns A−/A+ and stanza prev/next via GlassBottomBar.
  // NotationRenderer exposes pagination via the `stanzaPage` controlled prop
  // and the `onStanzaChange` callback.

  const divider = <div className="h-6 w-px bg-border" aria-hidden />

  // Quick 260822-fgb: tune-page-only Digital / Original scan swap. /psalms/[id] and
  // /precent/[id]/sing/[pos] get this from GearPopover instead (quick 260822-di9);
  // the tune page never renders GearPopover, and AbcPlayer's own control is hidden
  // here by hidePlayerControls={… || tunePageMode} (line ~1518).
  const tuneStaffScanUrl = staffPages[0] ?? scoreJpgUrl
  const showTuneScanToggle = computeScanToggleVisible({
    tunePageMode,
    viewMode,
    hasAbc: Boolean(abc.trim()),
    staffScanUrl: tuneStaffScanUrl,
    staffInlineApproved,
  })

  const scanToggleGroup = showTuneScanToggle ? (
    <div className="flex items-center gap-1" data-tune-scan-toggle role="group" aria-label="Score source">
      <Button
        variant={!showOriginal ? 'default' : 'outline'}
        size="xs"
        onClick={() => setShowOriginal(false)}
        aria-pressed={!showOriginal}
      >
        Digital
      </Button>
      <Button
        variant={showOriginal ? 'default' : 'outline'}
        size="xs"
        onClick={() => setShowOriginal(true)}
        aria-pressed={showOriginal}
      >
        Original scan
      </Button>
    </div>
  ) : null

  const controlBar = (
    <div className="flex flex-wrap items-center gap-2">
      {/* 2026-08-16 (Phase 16 R3): tunePageMode keeps the view-mode toggle
          (Staff / Solfège) but drops sizeGroup (A+/A-), pagination, and
          fullscreen. Audio lives above the tabs in the page chrome. */}
      {!tunePageMode && sizeGroup}
      {!tunePageMode && divider}
      {viewGroup}
      {scanToggleGroup && (
        <>
          {divider}
          {scanToggleGroup}
        </>
      )}
      {!tunePageMode && showPagination && (
        <>
          {divider}
          {paginationGroup}
        </>
      )}
      {!tunePageMode && (
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
      )}
    </div>
  )

  // ── Unified multi-staff ABC body (D-19 — one AbcPlayer per visible cycle) ──
  // abcjs renders each newline-separated music line as a separate staff line
  // within ONE rendered tune. We compose: header → for each visible phrase i,
  // emit its body line followed by one `w:` line per stanza-portion. This
  // gives the visual effect of N stacked phrase rows while remaining a single
  // tune for the synth (Play traverses end-to-end naturally).
  // Builds the single Staff view `unifiedAbc` body from `abc`, composing
  // header → for each visible phrase, its music line followed by one `w:`
  // line per stanza-portion (~250 lines of w:-line / melisma-position logic).
  function buildUnifiedAbc(sourceAbc: string): string {
    const localSplit = splitOnPhraseBreaks(sourceAbc)
    const localT = localSplit.phrases.length
    const localEffectivePhraseTotal = Math.max(localT, phraseShapeOverride?.length ?? 0)
    const localVisiblePhraseIndices = Array.from({ length: localEffectivePhraseTotal }, (_, i) => i)

    // Strip header lines that produce visible chrome we already render elsewhere:
    //   - `T:` titles — abcjs renders these as staff title; page UI already
    //      shows the tune name.
    //   - `Q:` tempo lines (chromeless only) — singing view has no tempo
    //      indication; the global synth BPM is controlled via FAB audio
    //      controls instead. Stripping prevents "♩ = 76" emission. (UAT v6)
    //      INTENTIONAL cross-route divergence (WR-11): the study/tune page
    //      (`chromeless=false`) DOES show the engraved tempo because the
    //      study view's purpose is musicological reference, where preserving
    //      the original source tempo is informative. The singing view's
    //      purpose is performance, where BPM is a live control. Reviewer
    //      asked this be documented here rather than equalised across routes.
    // We also strip the `name="..."` attribute from any `V:` voice declaration
    // in chromeless mode so abcjs doesn't print "Soprano" beside the stave.
    const cleanedHeader = localSplit.header
      .split('\n')
      .filter((l) => {
        const t = l.trim()
        if (/^T:/.test(t)) return false
        if (chromeless && /^Q:/.test(t)) return false
        return true
      })
      // Strip `name="..."` ONLY on V: voice declarations — other header
      // directives (%%score, %%MIDI, %%text, macros) can legally contain
      // `name="..."` and must not be mutated. (BL-04)
      .map((l) => (chromeless && /^V:/.test(l.trim()) ? l.replace(/\s*name="[^"]*"/g, '') : l))
      .join('\n')
    if (localSplit.phrases.length === 0) return cleanedHeader
    // 260826-vocalspace: inject `%%vocalspace 10` to add ~13.33px gap above
    // each sub-staff's lyric line. Empirical gap math (verified 2026-08-26
    // via Playwright + standalone abcjs render at viewport 800x2000):
    //   vs=0  → gap=13.27   baseline
    //   vs=3  → gap=17.27   (+4.00)
    //   vs=5  → gap=19.94   (+6.67)
    //   vs=10 → gap=26.61   (+13.34)
    //   vs=20 → gap=39.94   (+26.67)
    //   vs=50 → gap=79.94   (+66.67)
    // Ratio is exactly 4/3 (vocalspace N → +1.333*N px), matching
    // abcjs renderer.js:168 (formatting.vocalspace * 4 / 3).
    //
    // Why 10 (not the earlier 5): on PS23 mobile (390x800), with vocalspace=5
    // the staff-bottom → lyric-top gap was only 8.04px. The first note's
    // stem extends 5.52px below the staff (stem-down quarter/eighth note),
    // so effective stem-to-lyric clearance was 2.52px — the stem visibly
    // touched "The" (user complaint, 260826). At A+1 the staff scales up
    // to 31.2px and the stem extends 7.3px below, eating the gap entirely
    // (0.9px actual overlap). Bumping to vocalspace=10 adds +6.67px to
    // the base gap, giving ~14px staff-to-lyric clearance on default zoom
    // and ~7px stem-to-lyric clearance after stem extension. Desktop
    // layout absorbs the extra gap without visible regression because the
    // staff + lyric dwarf the additional ~6px.
    //
    // Applies to every layout path (per-phrase, melisma, flatten).
    // Related: [feedback-abcjs-vocalspace-gap-math].
    const parts: string[] = [cleanedHeader, '%%vocalspace 10']

    // splitMusicIntoSubLines extracted to ./splitMusicIntoSubLines.ts
    // (Quick 260601-i5d): now appends trailing `|` to every emitted sub-line
    // so abcjs synth resets accidental scope at phrase boundaries. Fixes
    // Contemplation "sharps play as naturals" audio bug. See
    // .planning/debug/contemplation-sharps-as-naturals.md.

    // TODO(RENDER-07b): proportional w: split retired by Phase 4.9.7 Plan 03;
    // remove once no other callers added. (Sub-staff loop now indexes per-line
    // entries directly from mapCycleToPhraseSyllableLines' inner array.)
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

    // Plan 04.9.9: per-phrase helper that uses buildWLineFromSolfa when solfège
    // OCR data is available, falling back to syllabifyForAbc otherwise.
    // Defined inside useMemo so it closes over solfegeVoices, tuneMeter, and
    // doubleLength. `metricalLineIndex` is the position of this w: line within
    // the stanza's sequence of metrical lines (0..shape.length-1), used to
    // look up the expected syllable count. Doubled/compound phrases must pass
    // `phraseIndex * linesPerPhrase + sub` so the index points at the right
    // element of the doubled shape; defaults to `phraseIndex` for the
    // single-line-per-phrase path.
    function wLineForSyllables(
      rawText: string,
      phraseIndex: number,
      musicForPhrase?: string,
      metricalLineIndex: number = phraseIndex,
    ): string {
      const text = rawText.replace(/\n/g, ' ')
      let raw: string
      if (solfegeVoices && tuneMeter) {
        const warnings: string[] = []
        raw = buildWLineFromSolfa(
          solfegeVoices.soprano,
          solfegeVoices.doh,
          solfegeVoices.time,
          phraseIndex,
          tuneMeter,
          text,
          warnings,
          musicForPhrase,
        )
      } else {
        raw = syllabifyForAbc(text)
      }
      let tokens = raw.split(/\s+/).filter(Boolean)

      // Reconcile a syllable deficit against the phrase's actual note count
      // BEFORE falling back to the meter-shape word-splitter. A repeated-pitch
      // note run (the psalm-singing "reciting note" / "point" convention —
      // lyric-to-note-alignment.md §4 Mechanism 1) can absorb the deficit as
      // melisma continuations (`_`), which is the musically correct reading
      // when the source OCR lost the underline data. Without this, the
      // meter-shape fallback below invents a fake mid-word split (e.g. "soul"
      // → "sou-" + "l") purely to hit the expected token count — technically
      // count-correct but nonsensical text that visually collides with
      // neighbouring syllables once notes are packed tightly (mobile
      // sub-staves).
      if (musicForPhrase) {
        const noteCount = countNoteHeads(musicForPhrase)
        if (noteCount > 0 && tokens.length < noteCount) {
          const deficit = noteCount - tokens.length
          const continuations = detectRepeatedPitchContinuations(musicForPhrase, deficit)
          if (continuations.length > 0) {
            const contSet = new Set(continuations)
            const merged: string[] = []
            let tIdx = 0
            for (let noteIdx = 0; noteIdx < noteCount; noteIdx++) {
              if (contSet.has(noteIdx)) {
                merged.push('_')
              } else if (tIdx < tokens.length) {
                merged.push(tokens[tIdx++])
              }
            }
            while (tIdx < tokens.length) merged.push(tokens[tIdx++])
            tokens = merged
          }
        }
      }

      const expectedShape = expectedSyllablesByLine(tuneMeter, doubleLength)
      if (expectedShape) {
        const expected = expectedShape[metricalLineIndex]
        if (expected !== undefined && tokens.length !== expected) {
          const { fixed } = forceMatchMeterShape([tokens], [expected])
          return (fixed[0] ?? tokens).join(' ')
        }
      }
      return tokens.join(' ')
    }

    // Plan 04.9.9-05 gap closure: note-count safety net. Pads short w: outputs
    // so abcjs never leaves trailing note heads unaligned. NEVER truncates —
    // if tokens already match or exceed note count, returns unchanged.
    function padWLineToNoteCount(wLine: string, musicSubLine: string): string {
      try {
        const tokens = wLine.split(/\s+/).filter(Boolean)
        const noteCount = countNoteHeads(musicSubLine)
        if (noteCount <= 0 || tokens.length >= noteCount) return wLine
        const padding = Array(noteCount - tokens.length).fill('·').join(' ')
        return wLine + ' ' + padding
      } catch {
        return wLine
      }
    }

    // 2026-08-24 (Inline Staff, flatten path): when A+ has been pressed, the
    // per-phrase sub-staff model produces structurally uneven syllable
    // distribution because meter phrases have inherently different syllable
    // counts (CM phrases are typically 8/6/8/6 or similar). With
    // rowDelta=N+M we want N+M rows of roughly equal syllables, not N+M
    // arbitrary phrase slices.
    //
    // The flatten path treats the whole tune as a single measure stream and
    // uses an LPT scheduler to distribute measures across the requested N+M
    // sub-staves, balancing syllable counts. Default (rowDelta=0) is
    // UNCHANGED — N sub-staves = N phrases, full phrase per sub-staff.
    //
    // Gating:
    //   - rowDelta > 0              (only subdivide on user request)
    //   - viewMode === 'staff'      (Inline Staff only)
    //   - melismaPositions === null (melisma branch owns its own subdivision)
    //   - no phraseShapeOverride    (one metrical line per phrase)
    //   - no doubled-length         (single-line per phrase is the trivial case)
    const flattenMode =
      extraSubdivisions > 0 &&
      viewMode === 'staff' &&
      (phraseShapeOverride == null || phraseShapeOverride.length === 0) &&
      !doubleLength

    if (!flattenMode) for (const i of localVisiblePhraseIndices) {
      // For repeated-last-line tunes (phraseShapeOverride has more entries than
      // ABC phrases), indices beyond T reuse the last ABC phrase's music.
      const phraseBody = (localSplit.phrases[Math.min(i, localSplit.phrases.length - 1)] ?? '').trim()
      if (!phraseBody) continue

      // ── Phase 04.9.12: melisma-positions branch ──────────────────────
      // When this phrase has melisma positions (from tunes.melisma_positions),
      // generate w: lines for ALL visible cycles using the real stanza syllables
      // + positions. This fixes the stanza-page-2+ bug: cycle 0 is no longer
      // emitted verbatim with stanza-1 text; all cycles use real stanza text.
      //
      // Algorithm (lyric-to-note-alignment.md §6):
      //   1. Get each cycle's syllable text via wLinesForPhrase(i)
      //   2. Syllabify via wLineForSyllables to get a token list
      //   3. Build the w: line: for each intra-phrase note index k,
      //      emit `_` if k is in melismaPositions[i], else consume the next syllable.
      //
      // ONLY takes this branch when emitWLines=true AND positions data exists.
      // Phase 16 / D-02: gate on emitWLines (default = showLyrics) rather
      // than showLyrics directly, so the tune page can render melisma `_`
      // marks without showing lyrics.
      const emitWLines = renderWLineUnderStaff ?? showLyrics
      const phrasePositions = melismaPositions?.[i]
      if (emitWLines && phrasePositions != null) {
        const posSet = new Set(phrasePositions)

        // Count note heads in this phrase to know total slot count.
        const phraseBodyForCount = (localSplit.phrases[Math.min(i, localSplit.phrases.length - 1)] ?? '').trim()
        const musicOnlyForCount = phraseBodyForCount.split('\n').filter(l => !/^\s*w:/.test(l)).join('\n')
        const noteCount = countNoteHeads(musicOnlyForCount)
        const nonMelismaSlots = Math.max(0, noteCount - phrasePositions.length)

        // Build the cleaned phrase body (no w: lines, music lines merged).
        const phraseLines = phraseBody.split('\n')
        let cleanedBodyForPositions = phraseLines
          .filter((l) => !/^w:/.test(l.trim()))
          .reduce<string[]>((acc, line) => {
            if (/^\s*[A-Za-z]:/.test(line)) {
              acc.push(line)
            } else if (acc.length > 0 && !/^\s*[A-Za-z]:/.test(acc[acc.length - 1])) {
              acc[acc.length - 1] += ' ' + line.trim()
            } else {
              acc.push(line)
            }
            return acc
          }, [])
          .join('\n')
          .trim()
        // Phase 04.9.20 quick task 260825-slur: wrap melisma groups in
        // (...) so abcjs draws a proper slur arc. Replaces the previous
        // DOM-overlay approach (commit 1d477d6) which drew arcs that
        // anchored at note CENTERS, producing arcs that look "stuck on"
        // the noteheads. abcjs's native slur drawer anchors to the
        // notehead's stem-side edge, which is the correct musical
        // position. melismaPositions[i] gives continuation note indices
        // (0-based in the per-phrase stream); group consecutive ones
        // with the preceding syllable-start note and wrap in ().
        const slurPositions = melismaPositions?.[i]
        if (slurPositions && slurPositions.length > 0) {
          cleanedBodyForPositions = wrapMelismaSlurs(
            cleanedBodyForPositions,
            slurPositions,
          )
        }

        // 2026-08-23 (row-count knob): when A+/A− subdivides a melisma phrase,
        // mirror the non-melisma path's splitMusicIntoSubLines strategy.
        // Computed once per phrase, BEFORE the cycle loop, so it's available
        // for every cycle's emit step. phraseSubdivisions drives target count
        // (baseSubdivisions + parent rowDelta). When 1 we keep the original
        // "single staff + full w: line" render path verbatim.
        const melismaTargetSubdivisions = phraseSubdivisionsFor(i)
        const melismaMusicSubLines = melismaTargetSubdivisions > 1
          ? splitMusicIntoSubLines(cleanedBodyForPositions, melismaTargetSubdivisions)
          : [cleanedBodyForPositions]
        const melismaActualSubdivisions = melismaMusicSubLines.length
        // Per-sub-staff note-head counts — drives weighted syllable split.
        const melismaSubNoteCounts = melismaActualSubdivisions > 1
          ? melismaMusicSubLines.map((m) => countNoteHeads(m))
          : []

        // T-04.9.12-07: skip positions branch when noteCount=0 (defensive).
        if (noteCount > 0) {
          const cycleWLinesGrid = wLinesForPhrase(i)
          const cycleCount = visibleCycles.length

          for (let cycleIdx = 0; cycleIdx < cycleCount; cycleIdx++) {
            const cycleLines = cycleWLinesGrid[cycleIdx] ?? []
            const rawText = cycleLines[0] ?? ''
            // Use raw syllabification, NOT wLineForSyllables, because
            // wLineForSyllables force-matches to the meter's total syllable
            // count (e.g. 8 for LM), but nonMelismaSlots = noteCount - melismas
            // can be smaller (e.g. 6 when 3 notes are holds). Using
            // wLineForSyllables first would truncate syllables from the end
            // when the second forceMatch reduces to nonMelismaSlots.
            let syllTokens: string[] = rawText.trim()
              ? syllabifyForAbc(rawText.replace(/\n/g, ' ')).split(/\s+/).filter(Boolean)
              : []

            // Force-fit to the exact number of non-melisma note slots.
            if (nonMelismaSlots > 0 && syllTokens.length !== nonMelismaSlots) {
              const { fixed } = forceMatchMeterShape([syllTokens], [nonMelismaSlots])
              syllTokens = fixed[0] ?? syllTokens
            }

            // Build w: token stream: `_` at melisma positions, syllable elsewhere.
            let syllIdx = 0
            const wTokens: string[] = []
            for (let noteIdx = 0; noteIdx < noteCount; noteIdx++) {
              if (posSet.has(noteIdx)) {
                wTokens.push('_')
              } else {
                wTokens.push(syllTokens[syllIdx++] ?? '·')
              }
            }

            const wLine = wTokens.length > 0 ? `w: ${wTokens.join(' ')}` : null

            // 2026-08-23 (row-count knob): chunk the w: token stream across
            // the N sub-staves, weighting by each sub-line's note-head count
            // (same strategy as the non-melisma path). Then enforce the
            // melisma-stick-together rule: if a chunk boundary falls inside
            // a melisma group (`_` run), pull it forward so the whole group
            // stays in one chunk. We do this for each cycle independently
            // since `wTokens` is rebuilt per cycle from the cycle's lyrics.
            if (cycleIdx === 0 && melismaActualSubdivisions > 1) {
              // Subdivided render: push one music line + one w: line per
              // sub-staff. Done inside the cycle-0 branch because music
              // body is identical across cycles — only the lyrics differ.
              const baseChunks = splitWLineByNoteCounts(
                wTokens.length > 0 ? wTokens.join(' ') : '',
                melismaSubNoteCounts,
              )
              // Melisma-stick-together: walk chunk boundaries. If a chunk
              // starts with `_` AND the previous chunk ended with `_`, the
              // melisma was split — pull tokens from the start of the next
              // chunk until the boundary sits between two non-melisma
              // tokens. The LAST chunk always absorbs everything (per
              // splitWLineByNoteCounts contract), so its tail is safe.
              const adjustedChunks: string[][] = []
              const chunkTokenLists = baseChunks.map((c) =>
                c.trim() === '' ? [] : c.trim().split(/\s+/).filter(Boolean),
              )
              for (let c = 0; c < chunkTokenLists.length; c++) {
                if (c === 0) {
                  adjustedChunks.push(chunkTokenLists[c])
                  continue
                }
                const cur = chunkTokenLists[c].slice()
                // If previous chunk ends mid-melisma (last token was `_`),
                // pull from `cur` until we land on a non-`_` token (the
                // melisma's first non-held note), then put the pulled `_`
                // tokens back onto the END of the previous chunk.
                const prev = adjustedChunks[c - 1]
                while (cur.length > 0 && cur[0] === '_' && prev.length > 0 && prev[prev.length - 1] === '_') {
                  prev.push(cur.shift()!)
                }
                adjustedChunks.push(cur)
              }
              const finalChunks = adjustedChunks.map((tl) => tl.join(' '))
              for (let sub = 0; sub < melismaMusicSubLines.length; sub++) {
                // 2026-08-24 (padding fix — see non-melisma path above for
                // the full rationale). Same rule: inject `%%staffsep` before
                // every sub-staff after the first so down-facing bars
                // don't overlap the lyric line beneath.
                if (sub > 0) parts.push('%%staffsep 14')
                parts.push(melismaMusicSubLines[sub])
                if (!showLyrics) continue
                const chunk = finalChunks[sub]
                if (!chunk || !chunk.trim()) continue
                parts.push(`w: ${padWLineToNoteCount(chunk, melismaMusicSubLines[sub])}`)
              }
            } else {
              // Single-sub-staff render (no subdivision): original code path.
              if (cycleIdx === 0) {
                // Push music lines once (for cycle 0 only).
                for (const line of cleanedBodyForPositions.split('\n')) parts.push(line)
              }
              if (wLine) {
                parts.push(wLine)
              }
            }
          }
          continue
        }
      }
      // ── END Phase 04.9.12 branch ──────────────────────────────────────

      // Strip any pre-existing w: lines from the phrase body (defensive).
      // Also join music lines that span multiple ABC text lines into a single
      // text line so abcjs renders exactly one staff system per phrase when
      // targetSubdivisions=1. Phrases from insertPhraseBreaks may span multiple
      // ABC text lines when the source tune encodes multiple metrical lines on
      // one text line but the PHRASE_BREAK splits mid-line — leaving a leading
      // fragment on the next text line inside the same phrase. Joining with a
      // space is safe: abcjs ignores whitespace between ABC tokens. Info-field
      // lines (V:, K:, M:, w:) are kept on their own lines.
      const phraseLines = phraseBody.split('\n')
      const cleanedBody = phraseLines
        .filter((l) => !/^w:/.test(l.trim()))
        .reduce<string[]>((acc, line) => {
          if (/^\s*[A-Za-z]:/.test(line)) {
            // Info-field line: keep on its own line
            acc.push(line)
          } else if (acc.length > 0 && !/^\s*[A-Za-z]:/.test(acc[acc.length - 1])) {
            // Previous entry is also a music line: merge with space
            acc[acc.length - 1] += ' ' + line.trim()
          } else {
            acc.push(line)
          }
          return acc
        }, [])
        .join('\n')
        .trim()

      // 2026-08-23 (row-count knob): when A+/A− subdivides a melisma phrase,
      // mirror the non-melisma path's splitMusicIntoSubLines +
      // splitWLineByNoteCounts strategy. The split lines are pre-computed
      // ABOVE this loop (see melismaMusicSubLines / melismaSubNoteCounts
      // near cleanedBodyForPositions). Melismas must stay together — if a
      // candidate chunk boundary would land inside a melisma group (`_`
      // continuation), pull the boundary forward to keep the whole group
      // in one chunk (whichever chunk contains its FIRST `_`).

      // RENDER-07b (Phase 4.9.7 Plan 03): wLines is one string[] per visible
      // cycle. Inner array length = linesPerPhrase. Cross-stanza alignment
      // guarantee: same meter → identical inner length across all cycles.
      //
      // Phase 16 / D-02: gate w-line emission on renderWLineUnderStaff
      // (default = showLyrics). On the tune page we suppress the StanzaList
      // panel (showLyrics=false) but still need w: lines so abcjs renders
      // `_` melisma continuation marks from tunes.melisma_positions.
      // (emitWLines is declared ABOVE this loop — used by the melisma-
      // positions branch at the top of the loop body.)
      const wLines: string[][] = emitWLines ? wLinesForPhrase(i) : []
      const linesPerPhrase = wLines[0]?.length ?? 0

      // Each metrical line gets its own sub-staff. Bump subdivisions when
      // the metrical-line count exceeds the music's natural subdivision
      // count so every w: line lands under its OWN music slice — no
      // proportional splitting.
      const naturalSubdivisions = phraseSubdivisionsFor(i)
      const targetSubdivisions = Math.max(naturalSubdivisions, linesPerPhrase || 1)
      const musicSubLines = splitMusicIntoSubLines(cleanedBody, targetSubdivisions)
      const actualSubdivisions = musicSubLines.length

      // When mobile subdivision splits music into more sub-staves than there
      // are lyric lines (linesPerPhrase=1, actualSubdivisions=2), use
      // proportional word-count splitting so each sub-staff gets its share
      // of the lyric. This only applies when linesPerPhrase===1 (single
      // metrical line per phrase) — multi-line phrases keep structured layout.
      const needsProportionalSplit =
        linesPerPhrase === 1 && actualSubdivisions > 1

      // Per-sub-staff note-head counts, computed once per phrase. Used to
      // weight syllable distribution by actual note count instead of equal
      // token count — restores strict 1:1 syllable-to-note alignment when a
      // phrase is subdivided unevenly (e.g. a held final note in its own
      // measure). See splitWLineByNoteCounts.
      const subNoteCounts = needsProportionalSplit
        ? musicSubLines.map((m) => countNoteHeads(m))
        : []

      for (let sub = 0; sub < actualSubdivisions; sub++) {
        // 2026-08-24 (row-count knob, padding fix): when A+ has split the
        // staff into multiple sub-staves, the lyric line below each one
        // sits very close to the staff above — close enough that
        // down-facing note stems / barlines can overlap the lyric text.
        // Inject an `%%staffsep` directive BEFORE each sub-staff (after
        // the first) — abcjs applies it to control the gap above the
        // staff it precedes. So the directive between sub 0's w: line and
        // sub 1's music widens the gap exactly where sub 0's lyrics sit.
        // 260825-bug1: also inject one before sub 0 (every phrase, including
        // A+=0) — without it, the first sub-staff of every phrase has no
        // preceding staff to push it down, and the lyric clips the bottom
        // of the staff's own down-facing note stems. abcjs interprets the
        // directive as additional vertical space above the staff that
        // follows, which moves the staff's bounding box (and the lyric
        // anchored to it) downward by 30 px — clearing the stem/lyric
        // collision at the top of every phrase.
        if (sub === 0) {
          parts.push('%%staffsep 30')
        } else if (actualSubdivisions > 1) {
          // 2026-08-24 (padding fix v2): the lyric line that follows each
          // sub-staff sits at a fixed offset below the staff bottom — it
          // does NOT scale with staffsep. To guarantee the lyric top
          // clears the staff lines + any down-facing note stems even at
          // the max A+ font (20.8 px), the gap between consecutive
          // sub-staves must exceed the lyric font height. 30 px covers
          // 20.8 px font (top-of-cap ~16 px) + 8 px stem clearance + 6 px
          // breathing room.
          parts.push('%%staffsep 30')
        }
        // 2026-08-24 (row-count knob, full-width rows): inject `%%stretchlast`
        // before each sub-staff so the last measure of each one stretches to
        // fill the staff width — notes (and their tied lyrics) spread out to
        // the full row. 2026-08-24 (v2): applied unconditionally for
        // viewMode='staff', not just when subdivided. Without it, the LAST
        // phrase of a tune (which often has fewer notes than the earlier
        // phrases) renders a half-width staff at desktop /psalms/[id]
        // because there's no earlier sub-staff to push the staffsep and the
        // last measure's natural width is the only thing governing row
        // length. Gated to viewMode === 'staff' (not other render modes).
        if (viewMode === 'staff') {
          parts.push('%%stretchlast')
        }
        parts.push(musicSubLines[sub])
        if (!showLyrics) continue
        for (const cycleLines of wLines) {
          if (needsProportionalSplit) {
            // Distribute the single lyric line across sub-staves, weighted
            // by each sub-staff's real note-head count (not equal token
            // count) — matches the desktop single-staff 1:1 alignment.
            const rawText = cycleLines[0]
            if (!rawText || !rawText.trim()) continue
            const syllabified = wLineForSyllables(rawText, Math.min(i, localSplit.phrases.length - 1), cleanedBody)
            const chunks = splitWLineByNoteCounts(syllabified, subNoteCounts)
            const chunk = chunks[sub]
            if (!chunk || !chunk.trim()) continue
            const padded = padWLineToNoteCount(chunk, musicSubLines[sub])
            parts.push(`w: ${padded}`)
          } else {
            // Normal case: one lyric line per sub-staff (structured metrical layout).
            // When sub >= linesPerPhrase the music has extended past the lyric;
            // emit no w: line for that sub-staff.
            const text = cycleLines[sub]
            if (!text || !text.trim()) continue
            // i is the ABC phrase index; sub is the sub-line within the phrase.
            // Combined, they form the position in the doubled shape — required
            // for `expectedSyllablesByLine` to find the correct expected count.
            const phraseIdx = Math.min(i, localSplit.phrases.length - 1)
            const metricalIdx = phraseIdx * linesPerPhrase + sub
            const wRaw = wLineForSyllables(text, phraseIdx, musicSubLines[sub], metricalIdx)
            parts.push(`w: ${padWLineToNoteCount(wRaw, musicSubLines[sub])}`)
          }
        }
      }
    }

    // ── Flatten path: rowDelta > 0 + Inline Staff ──────────────────────────
    // See the `flattenMode` block above for the activation gates. When active,
    // we treat the whole tune as a single NOTE stream and LPT-distribute
    // individual notes across (meterMin + rowDelta) sub-staves balanced by
    // note count. Sub-staves whose last note falls mid-measure emit a `\`
    // continuation so abcjs continues the measure on the next system without
    // inserting a bar line — and the corresponding `w:` line carries the
    // matching syllable + melisma `_` continuation.
    //
    // Why per-NOTE and not per-measure (the previous behaviour):
    //   Scottish Psalter tunes in CM (8.6.8.6) compress some phrases into
    //   one dense measure (e.g. Psalm 23 phrase 3 m1 has 9 notes for
    //   "pas-ture green: he lead-eth me"). Per-measure LPT cannot split
    //   that measure, so one sub-staff always carries a 9-note row while
    //   others carry 3-5 notes — visibly uneven. Per-note LPT fragments
    //   the dense measure across sub-staves, equalising rendered density.
    if (flattenMode) {
      const flattenSubStaffCount = meterMinForDistribution + extraSubdivisions

      // Per-phrase preprocessing: clean body, tokenize measures, count notes,
      // extract per-cycle syllable tokens aligned to notes via cumulative
      // note-position offsets within the phrase. Each cycle has its own
      // syllable stream — we run wLineForSyllables once per cycle per phrase
      // to get the same token list the per-phrase path would emit, just
      // split across notes here.
      interface FlatPhraseData {
        phraseIdx: number
        measures: string[]
        noteCounts: number[]
        cycleTokenLists: string[][]  // [cycleIdx][tokenIdx]; length == noteCount
      }

      const flattenPhraseData: FlatPhraseData[] = []
      for (const i of localVisiblePhraseIndices) {
        const phraseBody = (localSplit.phrases[Math.min(i, localSplit.phrases.length - 1)] ?? '').trim()
        if (!phraseBody) continue
        // Clean body: strip w: lines, merge consecutive music lines into one
        // (same logic as the standard branch's cleanedBody at lines 1334-1350).
        const phraseLines = phraseBody.split('\n')
        const cleanedBody = phraseLines
          .filter((l) => !/^w:/.test(l.trim()))
          .reduce<string[]>((acc, line) => {
            if (/^\s*[A-Za-z]:/.test(line)) {
              acc.push(line)
            } else if (acc.length > 0 && !/^\s*[A-Za-z]:/.test(acc[acc.length - 1])) {
              acc[acc.length - 1] += ' ' + line.trim()
            } else {
              acc.push(line)
            }
            return acc
          }, [])
          .join('\n')
          .trim()
        if (!cleanedBody) continue
        const measures = tokenizeMeasures(cleanedBody)
        if (measures.length === 0) continue
        const noteCounts = measures.map(countNoteHeads)

        // Per-cycle w: line tokens. Pull from wLinesForPhrase(i) which already
        // returns one string[] per visible cycle (length = linesPerPhrase).
        // We only run this for single-line-per-phrase (the flatten gate
        // enforces this), so we read cycleLines[0] — the one metrical line.
        //
        // When melismaPositions is populated for this phrase, we follow the
        // existing melisma branch's algorithm: build a token list of
        // syllable + `_` markers, with `_` at the melisma note positions.
        const emitWLines = renderWLineUnderStaff ?? showLyrics
        const cycleTokenLists: string[][] = []
        if (emitWLines) {
          const phraseIdx = Math.min(i, localSplit.phrases.length - 1)
          const phrasePositions = melismaPositions?.[phraseIdx]
          const wLines = wLinesForPhrase(i)
          for (let c = 0; c < wLines.length; c++) {
            const cycleLines = wLines[c] ?? []
            const text = cycleLines[0] ?? ''
            if (!text || !text.trim()) {
              cycleTokenLists.push([])
              continue
            }
            if (phrasePositions != null) {
              const syllableTokens = syllabifyForAbc(text).split(/\s+/).filter(Boolean)
              const noteCount = countNoteHeads(cleanedBody)
              const nonMelismaSlots = Math.max(0, noteCount - phrasePositions.length)
              const fitted = forceMatchMeterShape([syllableTokens], [nonMelismaSlots])
              const fittedTokens = fitted.fixed[0] ?? syllableTokens
              const posSet = new Set(phrasePositions)
              const wTokens: string[] = []
              let tIdx = 0
              for (let noteIdx = 0; noteIdx < noteCount; noteIdx++) {
                if (posSet.has(noteIdx)) {
                  wTokens.push('_')
                } else if (tIdx < fittedTokens.length) {
                  wTokens.push(fittedTokens[tIdx] ?? '')
                  tIdx++
                }
              }
              while (tIdx < fittedTokens.length) {
                wTokens.push(fittedTokens[tIdx] ?? '')
                tIdx++
              }
              cycleTokenLists.push(wTokens)
            } else {
              const tokens = wLineForSyllables(text, phraseIdx, cleanedBody, phraseIdx)
                .split(/\s+/)
                .filter(Boolean)
              cycleTokenLists.push(tokens)
            }
          }
        }

        flattenPhraseData.push({
          phraseIdx: Math.min(i, localSplit.phrases.length - 1),
          measures,
          noteCounts,
          cycleTokenLists,
        })
      }

      // 260825-phrase-bound: build per-phrase measure entries. Each phrase's
      // measures stay contiguous (no cross-phrase mixing on one sub-staff),
      // so the user reads each sub-staff as one coherent phrase. Overflow
      // distribution (`allocatePhraseSubs` below) decides how many sub-staves
      // each phrase contributes; within a phrase, per-measure LPT balances
      // syllable counts across the phrase's own chunks.
      //
      // Replaces the previous across-all-measures LPT (260825-flatten-measure)
      // which concatenated measure 0 of phrase 1 with measure 0 of phrase 4
      // on sub 0 at A+1 — the user reported that as "the tune changes"
      // because sub 0 contained a Frankenstein of two different phrases.
      const phraseMeasureEntries: MeasureEntry[][] = Array.from(
        { length: flattenPhraseData.length },
        () => [],
      )
      for (let pi = 0; pi < flattenPhraseData.length; pi++) {
        const pd = flattenPhraseData[pi]!
        let cumNoteIdx = 0
        for (let m = 0; m < pd.measures.length; m++) {
          const measureNoteCount = pd.noteCounts[m] ?? 0
          const perCycleTokens: string[][] = []
          for (let c = 0; c < pd.cycleTokenLists.length; c++) {
            const tokens = pd.cycleTokenLists[c] ?? []
            const slice: string[] = []
            for (let k = 0; k < measureNoteCount; k++) {
              const tok = tokens[cumNoteIdx + k] ?? ''
              slice.push(tok.length > 0 ? tok : '_')
            }
            perCycleTokens.push(slice)
          }
          const syllableTokens = perCycleTokens[0] ?? []
          const syllableCount = syllableTokens.filter((t) => t && t !== '_').length
          phraseMeasureEntries[pi]!.push({
            phraseIdx: pd.phraseIdx,
            measureIdx: m,
            musicText: pd.measures[m] ?? '',
            noteCount: measureNoteCount,
            perCycleTokens,
            syllableTokens,
            syllableCount,
          })
          cumNoteIdx += measureNoteCount
        }
      }

      // 260826-phrase-bound-flush: phrase-bound distribution with overflow
      // split. Each phrase keeps its measures CONTIGUOUS (preserves melody
      // order across the split) and gets `subsPerPhrase[i]` sub-staves.
      // Extra sub-staves (rows beyond phraseCount at A+1+) are greedily
      // assigned to the longest phrases by measure count, ties by lower
      // phrase index. The final emission walks phrases in order, emitting
      // each phrase's chunks sequentially — every sub-staff is either a
      // full phrase or a contiguous slice of one phrase, never a mix.
      //
      // Replaces the per-note cross-phrase LPT (260825-cross-phrase-note):
      // that algorithm interleaved individual notes from different phrases
      // into the same sub-staff to balance syllable counts, but the user
      // read the result as "the tune changes" because sub 0 ended with a
      // tail of a different phrase's notes than it started with. PS23 at
      // A+1 went from "I'll" (sub 0) → "notwant." (sub 1) → ... → "death's"
      // (sub 0 still) → "darkvale," (sub 1). This violates musical
      // coherence; the user explicitly rejected per-measure LPT in favour
      // of contiguous phrase-bound allocation.
      //
      // Within each chunk the `w:` line carries the per-cycle syllable
      // tokens (already aligned to notes in `phraseMeasureEntries[pi]`),
      // so melisma `_` continuations render as proper slur arcs inside
      // the chunk. No explicit `(...)` slur-wrap is needed; abcjs draws
      // them automatically from the `w:` melisma markers.
      //
      // 260826-staffsep-flatten: use a wider %%staffsep (45 vs default 30)
      // in flatten mode. High-note stems extend ~staff-height × 0.6 above
      // the staff top, and at A+1 staff height is 31.2 px → stems can
      // reach ~18 px above the staff. With staffsep=30 + the inherent gap
      // between consecutive sub-staves, the previous sub-staff's last
      // lyric row sometimes touched the next sub-staff's first-note stem.
      // 45 px gives the previous lyric row clear airspace below the next
      // sub-staff's stem peaks on mobile.
      const subsPerPhrase = allocatePhraseSubs(flattenPhraseData, flattenSubStaffCount)
      const orderedChunks: MeasureEntry[][] = []
      for (let pi = 0; pi < flattenPhraseData.length; pi++) {
        const phraseChunks = splitContiguousByMeasures(
          phraseMeasureEntries[pi] ?? [],
          subsPerPhrase[pi] ?? 1,
        )
        for (const chunk of phraseChunks) orderedChunks.push(chunk)
      }

      const emitWLinesFlat = renderWLineUnderStaff ?? showLyrics
      const cycleCount = flattenPhraseData[0]?.cycleTokenLists.length ?? 0

      for (const chunk of orderedChunks) {
        if (chunk.length === 0) continue
        parts.push('%%staffsep 45')
        // 260826-tie-strip: same rationale as the previous per-note path —
        // strip `-` (abcjs tie mark) so a leftover tie across the chunk
        // boundary doesn't render as a wide cross-system arc. Phrase-
        // bound contiguous measures rarely carry a mid-measure tie, but
        // safer to strip than to risk the wide-arc regression.
        const musicParts: string[] = []
        for (const m of chunk) {
          if (m.musicText) musicParts.push(m.musicText.replace(/-/g, ''))
        }
        const musicLine = musicParts.join(' ').trim()
        if (!musicLine) continue
        parts.push(musicLine)

        if (!emitWLinesFlat) continue
        for (let c = 0; c < cycleCount; c++) {
          const tokens: string[] = []
          for (const m of chunk) {
            for (const t of m.perCycleTokens[c] ?? []) {
              if (t) tokens.push(t)
            }
          }
          if (tokens.length === 0) continue
          parts.push(`w: ${tokens.join(' ')}`)
        }
      }
    }

    const result = parts.join('\n')
    return result
  }
  // wLinesForPhrase depends on visibleCycles, captured by closure.
  // buildUnifiedAbc is intentionally omitted from deps — it's redefined each
  // render as a plain closure (not itself memoized), so including it would
  // defeat the memo; its own inputs are all listed explicitly below.
  const unifiedAbc = useMemo(
    () => buildUnifiedAbc(abc),
    [abc, phraseShapeOverride, visibleCycles, tuneMeter, showLyrics, extraSubdivisions, baseSubdivisions, chromeless, solfegeVoices, melismaPositions, renderWLineUnderStaff],
  )

  // Split-leaf staff view needs ABC without inline w: lyrics (lyrics render in separate column).
  const unifiedAbcNoLyrics = useMemo(
    () => unifiedAbc.split('\n').filter((l) => !/^w:\s/.test(l.trim())).join('\n'),
    [unifiedAbc],
  )

  // ── View area ─────────────────────────────────────────────────────────────
  // Item 2: Play plays once — no chain/repeat. We deliberately do NOT pass
  // autoPlayToken / onPlayStart / onPlaybackComplete so playback stops at end
  // and pagination is fully manual.
  // Item 1: pass renderLyricsBelow so Show Original mode in AbcPlayer can
  // render the same StanzaList below the JPG.
  const lyricsBelow =
    showLyrics && stanzas.length > 0 ? (
      <div className="mt-4 max-h-[60vh] overflow-y-auto overscroll-y-none">
        <StanzaList stanzas={stanzas} />
      </div>
    ) : null

  let viewArea: ReactNode
  const isSplit = isSplitMode(viewMode)
  const usesSolfege = isSolfegeMode(viewMode)

  // Shared scanned-image (JPG) renderer — used by Split-Leaf Solfège (always)
  // and Split-Leaf Staff (only when the active tune is not melisma-approved,
  // see forceStaffJpgFallback below).
  //
  // 260717-mwv round 2: thumbnail strip removed entirely (per user feedback:
  // it wasted vertical space that should go to the JPEG + lyrics). Prev/Next
  // page navigation now flanks the image itself (left/right of the JPEG)
  // instead of living in a separate row below it — maximizes the JPEG's
  // display size and frees vertical space for lyrics underneath.
  function renderScannedPages(pages: string[], fallbackUrl: string | null, altText: string, emptyMessage = 'Score image not available') {
    const hasMultiPages = pages.length > 1
    const currentSrc = pages[pageIndex] ?? fallbackUrl ?? null

    const image = currentSrc ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentSrc}
        alt={altText}
        className={cn(
          'rounded-md border border-border',
          isSplit
            ? chromeless
              // chromeless split-leaf: CONTAIN within the max-h-[50%] flex notation
              // slot — shrink to fit height AND width, never scroll, never crop.
              ? 'max-h-full max-w-full w-auto h-auto object-contain'
              : 'max-h-full w-auto object-contain mx-auto' // non-chromeless grid unchanged
            : 'w-full h-auto',
        )}
        style={chromeless && !isSplit ? { maxWidth: '100%' } : undefined}
      />
    ) : (
      <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
    )

    // 260717-mwv checkpoint round 2 (item 1): the buttons were 44x44 (full
    // touch-target size) with a 4px gap on both sides — on a ~375px mobile
    // viewport that reserved ~100px of horizontal width for navigation,
    // leaving little for the JPEG itself. Narrowed to a slim 28px-wide column
    // (kept reasonably tall for a comfortable tap target) with no gap against
    // the image, so more width goes to the JPEG.
    const navButton = (direction: 'prev' | 'next') => {
      const disabled = direction === 'prev' ? pageIndex === 0 : pageIndex === pages.length - 1
      return (
        <button
          type="button"
          aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
          data-page-prev={direction === 'prev' ? '' : undefined}
          data-page-next={direction === 'next' ? '' : undefined}
          onClick={() =>
            setPageIndex((i) => (direction === 'prev' ? Math.max(0, i - 1) : Math.min(pages.length - 1, i + 1)))
          }
          disabled={disabled}
          className="h-10 w-7 shrink-0 inline-flex items-center justify-center rounded-md text-foreground active:scale-[0.90] transition-transform duration-75 disabled:opacity-40 disabled:pointer-events-none"
        >
          {direction === 'prev' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      )
    }

    const imageBlock = (
      <div className={cn(
        'flex items-center gap-0',
        chromeless && !isSplit ? '-mx-4' : '',
        isSplit && chromeless ? 'flex-1 min-h-0' : '',
      )}>
        {hasMultiPages && navButton('prev')}
        <div className={cn(
          'min-w-0 flex-1 flex justify-center',
          isSplit && chromeless ? 'h-full min-h-0 items-start' : 'items-center',
        )}>
          {image}
        </div>
        {hasMultiPages && navButton('next')}
      </div>
    )

    return { imageBlock }
  }

  // ── Split-leaf layout (Task 1 + Task 2, Phase 04.9.14 Plan 01) ────────────
  // Desktop (≥768px, all callers): lyrics stack UNDER notation — single
  // column, no side-by-side grid (CONTEXT "Desktop Lyrics Stacking Decision").
  // Mobile chromeless (<768px, SingingView only): notation is capped at
  // ≤50% of the available viewport height with its own scroll region;
  // lyrics take the remaining ≥50% with an independent scroll region — this
  // replaces the old shared `max-h-[80vh]` + whole-page-scroll behaviour.
  // Non-chromeless callers (e.g. /tunes/[id], /study) have no fixed-height
  // ancestor, so they always use the simple stacked layout regardless of
  // viewport width.
  //
  // Chromeless callers (SingingView) instead switch axis on `beside`: stacked
  // (lyrics under notation) only in narrow portrait, where there's no width
  // to spare; beside (lyrics beside notation, each half independently
  // scrollable) at any wider viewport — phone landscape, tablet, desktop.
  function renderSplitLeaf(notationSlot: ReactNode, stanzaSlot: ReactNode, capBothHalvesOnDesktop = false): ReactNode {
    if (chromeless) {
      const beside = !isNarrowPortrait
      if (capBothHalvesOnDesktop) {
        // 260712-tmm Bug (a): Solfège split-leaf must keep the 50/50 cap at
        // ALL widths (no md:h-auto / md:max-h-none escape hatch), so the
        // scanned JPG never exceeds 50% of the viewport, guaranteeing lyrics
        // a minimum 50%. SingingView's <main> is fixed-height on desktop
        // (md:h-[calc(100dvh-116px)]) so h-full resolves correctly here.
        return (
          <div className={beside ? 'flex flex-row h-full gap-4 px-4 pt-4' : 'flex flex-col h-full gap-4 px-4 pt-4'}>
            <div
              data-notation-slot
              className={
                beside
                  ? 'flex-1 min-w-0 h-full overflow-hidden flex flex-col'
                  : 'flex-none min-h-0 max-h-[50%] overflow-hidden flex flex-col'
              }
            >
              {notationSlot}
            </div>
            {/* 260717-mwv checkpoint round 1 (item 1 follow-up): this half was
                `overflow-hidden` with no scroll at all — any lyrics beyond
                the 50% slot were silently clipped with no way to reach them.
                That directly contradicted this branch's own stated intent
                ("guaranteeing lyrics a minimum 50%") and became far more
                consequential once Bug 1 routed Split-Leaf Staff's JPG
                fallback through this same branch (previously only Solfège
                used it). Now scrollable, matching the sibling branch below. */}
            <div
              data-lyrics-slot
              className={beside ? 'flex-1 min-w-0 h-full overflow-y-auto overscroll-y-none' : 'flex-1 min-h-0 overflow-y-auto overscroll-y-none'}
            >
              {stanzaSlot}
            </div>
          </div>
        )
      }
      return (
        <div className={beside ? 'flex flex-row h-full gap-4 px-4 pt-4' : 'flex flex-col h-full gap-4 px-4 pt-4 md:h-auto md:gap-4'}>
          {/* 260712-szw: data-notation-slot is a measurement hook for
              tests/diagnostics/split-leaf-staff-diff.mjs (clientHeight vs
              scrollHeight overflow check) — no behaviour change. */}
          <div
            data-notation-slot
            className={
              beside
                ? 'flex-1 min-w-0 h-full overflow-y-auto overscroll-y-none'
                : 'flex-none min-h-0 max-h-[50%] overflow-y-auto md:max-h-none md:overflow-visible overscroll-y-none'
            }
          >
            {notationSlot}
          </div>
          <div
            data-lyrics-slot
            className={
              beside
                ? 'flex-1 min-w-0 h-full overflow-y-auto overscroll-y-none'
                : 'flex-1 min-h-0 overflow-y-auto md:max-h-none md:overflow-visible md:flex-none overscroll-y-none'
            }
          >
            {stanzaSlot}
          </div>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">{notationSlot}</div>
        <div className="space-y-2">{stanzaSlot}</div>
      </div>
    )
  }

  if (viewMode === 'staff' || viewMode === 'staff-split') {
    // Staff ABC: inline (with w: lyrics) or split-leaf (no w: lyrics, StanzaList below)
    const isPartialPage = visibleCycles.length < CYCLES_PER_PAGE
    const applyMinHeight = !chromeless && isPartialPage && minStaffHeight > 0
    const abcForView = isSplit ? unifiedAbcNoLyrics : unifiedAbc
    // Bug 1 (quick task 260717-mwv): Split-Leaf Staff was never gated by
    // tune-approval status (only INLINE Staff was, via SingingView's
    // shouldFallbackToSplit) — so a user correctly bounced from inline to
    // Split-Leaf still saw the unapproved tune's live-rendered abcjs there.
    // Reuse the same scanned-JPG path Split-Leaf Solfège already always uses.
    // 2026-08-16 (Phase 16 R3): also force the JPG when there's NO abc to
    // render at all — many tunes lack digital staff notation, and on the
    // tune page we surface the scanned staff sheet as the default fallback.
    const forceStaffJpgFallback = (isSplit && !staffInlineApproved) || (tunePageMode && !abc.trim())

    const notationBlock: ReactNode = forceStaffJpgFallback
      ? renderScannedPages(
          activePages('staff-split', staffPages, solfegePages),
          scoreJpgUrl,
          `Staff notation for ${tuneName}`,
          tunePageMode ? 'Staff notation not available for this tune yet' : undefined,
        ).imageBlock
      : (
        <div ref={staffRef} style={applyMinHeight ? { minHeight: minStaffHeight } : undefined}>
          <AbcPlayer
            abc={abcForView}
            scale={scale}
            tuneName={tuneName}
            // Quick task 260822-di9 (Rule 1 bug fix): `scoreJpgUrl`/`solfegeJpgUrl`
            // are the raw tunes.score_jpg_url/solfege_jpg_url DB columns, which are
            // NULL for every tune in the database — real scan availability lives in
            // the server-derived `staffPages`/`solfegePages` arrays (deriveTuneJpgPages,
            // filesystem scan), same signal `renderScannedPages` below already uses
            // and the same one `solfegeSplitAvailable` in SingingView already checks.
            // Without this, AbcPlayer's own `hasOriginal` gate was always false and
            // "Show original" could never reveal an image for any tune.
            staffJpgUrl={staffPages[0] ?? scoreJpgUrl}
            solfegeJpgUrl={solfegePages[0] ?? solfegeJpgUrl}
            renderLyricsBelow={isSplit ? undefined : lyricsBelow}
            showOriginal={showOriginal}
            onShowOriginalChange={setShowOriginal}
            hidePlayerControls={isFullscreen || chromeless || tunePageMode}
            staffWidthFactor={staffWidthFactor}
            compactSplitMobile={compactSplitMobile}
            // baseSize drives AbcPlayer's dynamic lyric solver
            // (MIN/POST_BUMP window) in the chromeless mobile path. In
            // Inline Staff mode this stays at the mobile default — A+/A−
            // now drives extraSubdivisions (row count) instead of font.
            baseSize={baseSize}
            // 2026-08-24: when rowDelta > 0, AbcPlayer's solver removes the
            // POST_BUMP_PX cap and grows font proportionally with the extra
            // horizontal room. meterPhraseCount drives the growth factor
            // (so each extra row yields ~40% more font size relative to the
            // current meter baseline).
            rowDelta={extraSubdivisions}
            meterPhraseCount={meterMinForDistribution}
          />
        </div>
      )

    if (isSplit) {
      // 260717-mwv checkpoint round 1 follow-up: this inner div (not the
      // outer data-lyrics-slot wrapper from renderSplitLeaf, which always
      // matches its child's height via h-full) is the ACTUAL scroll
      // container — tagged separately so SingingView's content-fits-viewport
      // measurement targets the real scrollable element.
      const stanzaBlock = showLyrics && stanzas.length > 0 ? (
        <div
          data-lyrics-scroll
          className={cn(
            'h-full overflow-y-auto overscroll-y-none',
            // md:h-auto md:max-h-[80vh] is for the non-chromeless (tune-detail
            // page) context only — chromeless (SingingView) must stay h-full
            // at every width, including ≥768px landscape/tablet beside-layout,
            // or this column stops filling its renderSplitLeaf-provided h-full
            // slot and leaves a blank gap below the text (260723 bug: staff-split
            // showed this gap in phone landscape beside-mode; solfege-split
            // never had it because its chromeless branch already omitted the
            // md: override — see the solfege-split stanzaBlock below).
            !chromeless && 'md:h-auto md:max-h-[80vh]',
            // Checkpoint round 2 (item C) added ~1 stanza (112px) of trailing
            // whitespace so the last lines can be scrolled fully above the
            // bottom bar even if the scroll-hide auto-hide timing isn't
            // perfect; round 4 bumped it to ~176px (roughly 1 stanza + 2
            // more lines) per follow-up feedback. Chromeless-only —
            // desktop/study pages don't have the fixed bottom bar this
            // compensates for.
            chromeless && 'pb-44',
          )}
        >
          <StanzaList stanzas={stanzas} />
        </div>
      ) : null
      viewArea = renderSplitLeaf(notationBlock, stanzaBlock, forceStaffJpgFallback)
    } else {
      viewArea = notationBlock
    }
  } else if (viewMode === 'solfege') {
    // Inline Solfège is not built yet — abcjs has no tonic sol-fa support, and a
    // static JPG does not match what "inline" means for Staff. The gear toggle
    // disables NEW inline-solfège selections; this branch only handles a stale
    // localStorage viewMode:'solfege'. Split-leaf Solfège (the scanned JPG) is
    // handled by the branch below and is unaffected.
    viewArea = (
      <div className={chromeless ? 'px-4 pt-8 flex flex-col items-center text-center gap-2' : 'py-8 flex flex-col items-center text-center gap-2'}>
        <p className="text-sm font-medium">Inline Solfège is coming soon</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tonic sol-fa notation isn&apos;t available inline yet. Use the Split-Leaf layout to view the scanned Solfège, or switch to Staff.
        </p>
      </div>
    )
  } else if (viewMode === 'solfege-split') {
    // Split-leaf Solfège renders the scanned solfège JPG with flanking prev/next nav.
    const { imageBlock } = renderScannedPages(
      activePages(viewMode, staffPages, solfegePages),
      solfegeJpgUrl,
      `Solfège for ${tuneName}`,
      tunePageMode ? 'Solfège notation not available for this tune yet' : undefined,
    )

    // 260717-mwv checkpoint round 1 follow-up: data-lyrics-scroll marks the
    // real scroll container in split mode (see the staff-split branch above
    // for the full rationale).
    // Checkpoint round 2 (item C): pb-44 trailing whitespace (round 4 bump), chromeless
    // split-leaf only — see the staff-split branch above for rationale.
    const stanzaBlock = showLyrics && stanzas.length > 0 ? (
      <div
        data-lyrics-scroll={isSplit ? true : undefined}
        className={
          isSplit
            ? (chromeless ? 'h-full overflow-y-auto overscroll-y-none pb-44' : 'h-full overflow-y-auto md:h-auto md:max-h-[80vh] overscroll-y-none')
            : (chromeless ? '' : 'max-h-[60vh] overflow-y-auto overscroll-y-none')
        }>
        <StanzaList stanzas={stanzas} />
      </div>
    ) : null

    // 2026-08-16 (Phase 16 R3 sign-off round 2): tunePageMode already shows
    // the Staff/Solfège toggle above the score (see viewGroup), so the
    // "Back to notation" button is redundant there — hide it alongside the
    // chromeless case.
    if (isSplit) {
      viewArea = !chromeless && !tunePageMode ? (
        <div className="space-y-4">
          <BackToNotationButton onClick={() => setViewMode('staff')} />
          {renderSplitLeaf(imageBlock, stanzaBlock, true)}
        </div>
      ) : (
        renderSplitLeaf(imageBlock, stanzaBlock, true)
      )
    } else {
      viewArea = (
        <div className={chromeless ? 'space-y-4 px-4 pt-4' : 'space-y-4'}>
          {!chromeless && !tunePageMode && (
            <BackToNotationButton onClick={() => setViewMode('staff')} />
          )}
          {imageBlock}
          {stanzaBlock}
        </div>
      )
    }
  } else {
    // Lyrics-only: single-column scrollable list of all stanzas (D-17 verse numbers).
    // 260517-cm0 #4a: in chromeless (singing) view, apply generous padding +
    // larger base font so lyrics read comfortably without staff context.
    // Checkpoint round 2 (item C): pb-44 trailing whitespace (round 4 bump; chromeless
    // only) roughly the height of a stanza, so the last lines can be
    // scrolled fully above the bottom bar even if the scroll-hide auto-hide
    // timing isn't perfect.
    viewArea =
      stanzas.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No lyrics available.</p>
      ) : (
        <div className={chromeless ? 'px-4 pt-4 pb-44 space-y-4' : ''}>
          <StanzaList stanzas={stanzas} />
        </div>
      )
  }

  const rootStyle = {
    ['--staff-base-size' as string]: `${baseSize}px`,
  } as CSSProperties

  // TUNE-02: warn when the active tune's meter disagrees with the psalm's stated meter.
  // Null-safe — no warning when either meter is missing. Shared predicate with the precentor
  // portal (SetItemRow.tsx) so both surfaces can never drift.
  const meterMismatch = isMeterMismatch(stanzaMeter, tuneMeter)
  const meterMismatchBanner = meterMismatch ? (
    <div
      data-meter-mismatch-banner
      role="status"
      className="rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-3 py-2 text-sm flex-shrink-0"
    >
      <span className="font-semibold text-red-900 dark:text-red-200">Meter mismatch</span>
      <span className="text-red-800 dark:text-red-300">
        {` — psalm is ${stanzaMeter}, tune is ${tuneMeter}. Choose a matching tune or proceed as arranged.`}
      </span>
    </div>
  ) : null

  // TUNE-02b: surface "shape unknown" so silent lyric misalignment becomes visible.
  // Two failure modes from the 260815 audit:
  //   (a) tune.meter is null/empty/unrecognized — no shape available, the
  //       syllable-count fallback cannot rescue off-count lines.
  //   (b) ABC has more phrase breaks than the meter predicts (rare after the
  //       numeric-fallback fix in phrasesForMeter, but still possible if a
  //       tune's meter is genuinely unparseable). Without this banner, the
  //       trailing lines render silently dropped.
  // Banner is intentionally soft (amber, not red) — the tune may still be
  // singable; this just tells the user the alignment is heuristic.
  const shapeUnknown =
    !tuneMeter ||
    !expectedSyllablesByLine(tuneMeter) ||
    phrasesForMeter(tuneMeter) === 1
  const shapeUnknownBanner = shapeUnknown && !meterMismatch ? (
    <div
      data-meter-shape-unknown-banner
      role="status"
      className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2 text-sm flex-shrink-0"
    >
      <span className="font-semibold text-amber-900 dark:text-amber-200">Meter shape unknown</span>
      <span className="text-amber-800 dark:text-amber-300">
        {tuneMeter
          ? ` — phrase count could not be derived from "${tuneMeter}". Lyric alignment is heuristic; cross-check with the tune book.`
          : ' — this tune has no meter recorded. Lyric alignment is heuristic; cross-check with the tune book.'}
      </span>
    </div>
  ) : null

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
          {meterMismatchBanner}
          {shapeUnknownBanner}
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
      {meterMismatchBanner}
      {shapeUnknownBanner}
      {/* 2026-08-16 (Phase 16 R3): tunePageMode keeps controlBar visible but
          suppresses sizeGroup / pagination / fullscreen icon INSIDE it
          (see controlBar definition above) — so /tunes/[slug] gets only the
          view-mode (Staff / Solfège) toggle above the notation view. */}
      {!chromeless && controlBar}
      {chromeless ? (
        <div
          data-notation-viewarea-wrap
          className={cn(
            'flex-1 min-h-0 flex flex-col',
            // See isInlineStaffFitMobile derivation above for why this
            // padding lives on a wrapper OUTSIDE the fit-measured element
            // rather than on it directly.
            isInlineStaffFitMobile && 'pt-2',
            isInlineStaffFitMobile && isPhoneLandscapeForFit && 'pb-2',
          )}
        >
          <div
            data-notation-viewarea
            // 260716: also tagged as a `data-notation-fit-slot` target for
            // AbcPlayer's height-fit-scale pass (see `compactSplitMobile`
            // below) when NOT split. Deliberately a DIFFERENT attribute than
            // split-leaf's `data-notation-slot` (not reused) so the existing
            // `tests/diagnostics/split-leaf-staff-diff.mjs` script's
            // `document.querySelector('[data-notation-slot]')` (a global
            // first-match query, unlike AbcPlayer's ancestor-relative
            // `closest()`) keeps resolving only the split-leaf inner slot.
            data-notation-fit-slot
            className={cn(
              'flex-1 min-h-0',
              // Split-leaf mode composes its OWN two independently-scrolling
              // regions (notation ≤50%, lyrics remainder) below <768px, so this
              // outer wrapper must not also scroll/clip on mobile — it would
              // double-scroll. At ≥768px the split-leaf inner container reverts
              // to simple document flow, so the outer wrapper resumes normal
              // scrolling (Task 1 + Task 2).
              isSplit
                ? 'overflow-hidden md:overflow-y-auto overscroll-y-none'
                // 260716: inline Staff on mobile (compactSplitMobile) — hidden
                // so the AbcPlayer height-fit-scale pass can shrink the SVG to
                // fit without a page scroll. Non-Staff modes (lyrics, inline
                // solfège placeholder) are plain text/JPG with no fit-scale
                // mechanism, so they must keep scrolling — only gate the
                // overflow change to the exact viewMode compactSplitMobile
                // targets, not "any non-split chromeless view."
                : compactSplitMobile
                ? 'overflow-hidden md:overflow-y-auto overscroll-y-none'
                : 'overflow-y-auto overscroll-y-none',
            )}
          >
            {viewArea}
          </div>
        </div>
      ) : (
        viewArea
      )}
      {/* chromelessSizeRow + chromelessStanzaNav are intentionally NOT rendered
         here: SingingView (the only chromeless caller) owns these via the
         GlassBottomBar. Rendering them here produced visible duplicates. */}
    </div>
  )
}
