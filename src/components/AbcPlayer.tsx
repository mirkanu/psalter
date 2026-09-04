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
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { SOUNDFONT_URL } from '@/lib/abc-soundfont'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

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
 * directives, scale, fontboxpadding, stafftopmargin) —
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

const CLEF_KEY_SHRINK_SCALE = 0.6
// Leading-glyph classes shrunk by applyLeadingGlyphShrink. Time-signature
// added per user follow-up request on Psalm 31 (post-checkpoint-approval):
// abcjs only draws it on row 0 (it's not repeated on wrapped rows, unlike
// the key signature, which repeats every system) — confirmed live via
// direct DOM inspection of /psalms/31, NOT assumed.
const LEADING_GLYPH_SELECTOR = '.abcjs-clef, .abcjs-key-signature, .abcjs-time-signature'

/**
 * MOBILE-04/MOBILE-07 (Phase 04.9.15 Plan 05, revised after human checkpoint
 * feedback, then extended twice per follow-up user requests): shrinks the
 * repeated clef + key-signature + time-signature glyph group on EVERY row
 * of mobile inline (non-split, chromeless) Staff — including row 1, per
 * explicit user override of the original "row 1 stays full size" plan text
 * — and reflows the freed horizontal space into the following notation/
 * lyrics. Runs as a post-render DOM pass rather than a static CSS rule
 * because CSS alone cannot solve any of the three problems found across
 * checkpoint rounds:
 *
 * 1. Vertical alignment: a static `transform-origin: left center` pivots
 *    around each element's OWN bounding-box center, but these glyphs are
 *    NOT symmetrically positioned around the staff's vertical center
 *    (confirmed live: for one real tune, the key-signature's own bbox
 *    center sat ~24% of its own height ABOVE the staff's actual center — a
 *    fixed CSS percentage cannot account for this per-glyph variance, since
 *    different keys/clefs occupy different staff lines/spaces). This
 *    function measures the ACTUAL staff position per row and computes a
 *    transform-origin Y-percentage relative to the COMBINED group's bbox
 *    that lands exactly on the staff's vertical center.
 * 2. Horizontal space reclaim: a CSS `transform: scale()` only shrinks the
 *    glyph visually — it does not change abcjs's own layout math, so the
 *    following notes/lyrics stay at their original x-position, leaving a
 *    gap where the glyph used to be.
 * 3. Inter-glyph gaps (found on a later round): scaling each glyph
 *    INDEPENDENTLY (each pivoting from its own left edge, as an earlier
 *    version of this function did) only shrinks each glyph's own footprint
 *    — the ORIGINAL full-size whitespace BETWEEN glyphs (sized for
 *    full-size glyphs) is left completely untouched, so the shrunk glyphs
 *    end up floating in oversized gaps (confirmed live on Psalm 31: an
 *    11.8px gap between clef and key-signature, and a 17.3px gap between
 *    key-signature and time-signature, neither of which shrank at all when
 *    each glyph was scaled independently).
 *
 * Fix for all three: wrap ALL the leading glyphs found in a row (whichever
 * of clef/key-signature/time-signature exist — time-signature is often only
 * present on row 0) in a single new `<g>` element, and apply ONE scale
 * transform to that GROUP, pivoting from the group's own combined
 * bounding-box left edge and the staff's vertical center. Because the gaps
 * between glyphs are just empty space WITHIN that combined bounding box,
 * scaling the whole group compresses the gaps by the same factor as the
 * glyphs themselves — closing them proportionally, not just shrinking each
 * glyph in isolation. The total freed width (combined group width times
 * (1 - scale)) is then used to shift every other element in the row (notes,
 * bars, lyrics — not the 5 staff lines, which already span the full row
 * width) left by that full amount.
 *
 * Idempotent / safe to call on every render: the caller always tears down
 * and rebuilds the SVG from scratch first (`el.innerHTML = ''`), so there is
 * no stale transform state or leftover wrapper `<g>` to reset.
 */
function applyLeadingGlyphShrink(containerEl: HTMLElement): void {
  const SVG_NS = 'http://www.w3.org/2000/svg'
  const rows = containerEl.querySelectorAll<SVGGElement>('.abcjs-staff-wrapper')
  rows.forEach((row) => {
    const staffEl = row.querySelector<SVGGraphicsElement>('.abcjs-staff')
    if (!staffEl) return
    const staffBB = staffEl.getBBox()
    if (staffBB.height === 0) return
    const staffCenterY = staffBB.y + staffBB.height / 2

    const shrinkEls = Array.from(
      row.querySelectorAll<SVGGraphicsElement>(LEADING_GLYPH_SELECTOR),
    ).filter((el) => {
      const bb = el.getBBox()
      return bb.width > 0 && bb.height > 0
    })
    if (shrinkEls.length === 0) return

    // Sort left-to-right so the wrapper group's paint order matches the
    // original document order regardless of how the selector matched them.
    shrinkEls.sort((a, b) => a.getBBox().x - b.getBBox().x)

    // Combined bounding box across ALL leading glyphs together — this is
    // what makes the inter-glyph GAPS shrink along with the glyphs.
    let groupLeft = Infinity
    let groupTop = Infinity
    let groupRight = -Infinity
    let groupBottom = -Infinity
    for (const el of shrinkEls) {
      const bb = el.getBBox()
      groupLeft = Math.min(groupLeft, bb.x)
      groupTop = Math.min(groupTop, bb.y)
      groupRight = Math.max(groupRight, bb.x + bb.width)
      groupBottom = Math.max(groupBottom, bb.y + bb.height)
    }
    const groupWidth = groupRight - groupLeft
    const groupHeight = groupBottom - groupTop
    if (groupWidth <= 0 || groupHeight <= 0) return

    const group = document.createElementNS(SVG_NS, 'g') as unknown as SVGGraphicsElement
    group.setAttribute('class', 'abcjs-leading-glyph-shrink-group')
    row.insertBefore(group, shrinkEls[0])
    for (const el of shrinkEls) {
      group.appendChild(el) // appendChild MOVES el (it already has a parent)
    }

    // Percentage (relative to the COMBINED group's bbox height) at which the
    // staff's vertical center falls — correct transform-origin Y so scaling
    // never shifts any of the glyphs off the staff, regardless of shape.
    const originYPercent = ((staffCenterY - groupTop) / groupHeight) * 100
    // CRITICAL: percentage-based transform-origin on an SVG element defaults
    // to being relative to the NEAREST SVG VIEWPORT (the entire multi-row
    // tune's viewBox — hundreds of units tall), NOT this element's own
    // bounding box, unless `transform-box: fill-box` is set explicitly.
    // Without it, the glyphs render far off their intended position.
    group.style.transformBox = 'fill-box'
    group.style.transformOrigin = `left ${originYPercent}%`
    group.style.transform = `scale(${CLEF_KEY_SHRINK_SCALE})`

    // transform-origin's X is "left" (0%), so the group's left edge is fixed
    // and only its right edge moves inward — the freed width is simply the
    // group's total original width times the shrunk fraction, which now
    // correctly includes the inter-glyph gaps (previously only each glyph's
    // own shrink was counted, undercounting the true freed space).
    const freedSpace = groupWidth * (1 - CLEF_KEY_SHRINK_SCALE)
    if (freedSpace <= 0) return

    // Shift everything else in this row left into the reclaimed space —
    // except the 5 staff lines (already span the full row width and must
    // stay put) and the new wrapper group itself.
    for (const child of Array.from(row.children)) {
      if (!(child instanceof SVGGraphicsElement)) continue
      if (child.classList.contains('abcjs-staff')) continue
      if (child === group) continue
      child.style.transform = `translateX(-${freedSpace}px)`
    }
  })
}

// STAFF-LINE-EXTEND: extend every staff's right edge to match the SVG viewBox
// width. abcjs's `expandToWidest` only equalizes widths within a SINGLE
// system (a `\n`-separated line), so when Inline Staff emits N separate
// phrases as N systems, the LAST system (which often has fewer notes after
// the flatten path balanced syllables, or simply fewer natural measures
// before any flatten) renders its staff lines only as far as its music
// reaches — leaving a visibly truncated staff on the right. Direct SVG
// getBBox inspection confirmed: with expandToWidest=true + stretchlast=1.0,
// staves 0-2 draw to viewBox.right (900) but stave 3 stops at 466. We
// append additional staff-line segments from each stave's current right
// edge to the SVG's viewBox-right, so every stave spans the full width.
function extendStaffLines(containerEl: HTMLElement): void {
  containerEl.querySelectorAll<SVGSVGElement>('svg').forEach((svg) => {
    const vbStr = svg.getAttribute('viewBox')
    if (!vbStr) return
    const vbParts = vbStr.split(/\s+/).map(Number)
    if (vbParts.length !== 4 || !isFinite(vbParts[2])) return
    const vbX = vbParts[0]
    const vbW = vbParts[2]
    const targetRight = vbX + vbW
    // Find staff-line paths: thin (h < 3), wide (>100), filled rectangles
    const staffLinePaths: SVGPathElement[] = []
    svg.querySelectorAll<SVGPathElement>('path').forEach((p) => {
      let bb: DOMRect
      try { bb = p.getBBox() } catch { return }
      if (bb.height < 3 && bb.width > 100) staffLinePaths.push(p)
    })
    if (staffLinePaths.length === 0) return
    // Group staff-line paths by approximate Y (a stave = 5 lines, ~7 units apart)
    const byY = new Map<number, SVGPathElement[]>()
    staffLinePaths.forEach((p) => {
      let bb: DOMRect
      try { bb = p.getBBox() } catch { return }
      const key = Math.round(bb.y)
      if (!byY.has(key)) byY.set(key, [])
      byY.get(key)!.push(p)
    })
    const sortedYs = Array.from(byY.keys()).sort((a, b) => a - b)
    if (sortedYs.length === 0) return
    // Group consecutive Ys (within 10 units) into staves
    const staves: SVGPathElement[][] = []
    let cur: SVGPathElement[] = []
    let lastY = -Infinity
    sortedYs.forEach((y) => {
      if (y - lastY > 10) {
        if (cur.length > 0) staves.push(cur)
        cur = []
      }
      byY.get(y)!.forEach((p) => cur.push(p))
      lastY = y
    })
    if (cur.length > 0) staves.push(cur)
    // For each stave, find its rightmost edge and append extension segments
    // to bring it to targetRight. Skip if already at full width.
    const svgNS = 'http://www.w3.org/2000/svg'
    staves.forEach((stavePaths) => {
      let maxRight = -Infinity
      let topY = Infinity
      let bottomY = -Infinity
      let stroke = '#000000'
      let strokeWidth = 1
      stavePaths.forEach((p) => {
        let bb: DOMRect
        try { bb = p.getBBox() } catch { return }
        const r = bb.x + bb.width
        if (r > maxRight) maxRight = r
        if (bb.y < topY) topY = bb.y
        if (bb.y + bb.height > bottomY) bottomY = bb.y + bb.height
        // abcjs draws staff lines with stroke="none" + fill="currentColor";
        // copy the FILL (not the stroke) so the extension is visible.
        const f = p.getAttribute('fill')
        if (f) stroke = f
        const sw = p.getAttribute('stroke-width')
        if (sw) strokeWidth = parseFloat(sw) || 1
      })
      if (maxRight < 0 || maxRight >= targetRight - 0.5) return
      // Reuse the existing path's stroke colour/width by copying attrs.
      // Append a new path that extends from maxRight to targetRight at the
      // same y/height as the topmost existing line.
      const samplePath = stavePaths[0]
      if (!samplePath) return
      // abcjs draws a stave as 5 separate thin (h≈0.7) staff-line rects at
      // slightly different Ys. We need to extend ALL 5 lines, not just one.
      // Find each line's Y from the stavePaths we collected, draw a rect
      // from (maxRight, line.y) to (targetRight, line.y + line.h).
      const svgNS = 'http://www.w3.org/2000/svg'
      stavePaths.forEach((p) => {
        let bb: DOMRect
        try { bb = p.getBBox() } catch { return }
        // Only extend lines whose right edge sits at maxRight (the rightmost
        // extension target — same for all 5 lines of one stave).
        if (Math.round(bb.x + bb.width) !== Math.round(maxRight)) return
        const ext = document.createElementNS(svgNS, 'path')
        const extH = bb.height
        ext.setAttribute(
          'd',
          `M ${maxRight.toFixed(2)} ${bb.y.toFixed(2)} L ${targetRight.toFixed(2)} ${bb.y.toFixed(2)} L ${targetRight.toFixed(2)} ${(bb.y + extH).toFixed(2)} L ${maxRight.toFixed(2)} ${(bb.y + extH).toFixed(2)} z`,
        )
        ext.setAttribute('stroke', 'none')
        ext.setAttribute('fill', stroke)
        p.parentNode?.appendChild(ext)
      })
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────

interface AbcPlayerProps {
  abc: string
  title?: string
  staffJpgUrl?: string | null
  solfegeJpgUrl?: string | null
  /**
   * Multi-page scan URLs for "Show original" mode. When the active array has
   * more than one page, prev/next chevron nav flanks the rendered image so
   * the user can page through the scanned sheets (mirrors the JPEG nav in
   * NotationRenderer.renderScannedPages). Single-page and empty arrays fall
   * through to the legacy single-URL `staffJpgUrl`/`solfegeJpgUrl` props,
   * byte-identical to pre-fix behaviour.
   */
  staffPages?: string[]
  solfegePages?: string[]
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
  /**
   * Drives the dynamic lyric-solver window (MIN_LYRIC_FONT_PX floor +
   * POST_BUMP_PX start) in the mobile-gated vertical re-pack block below.
   * Defaults to 14 (the historical hardcoded value) when not supplied so
   * non-chromeless callers are byte-identical.
   *
   * NOTE: in Inline Staff mode (chromeless + viewMode === 'staff') A+/A−
   * no longer changes this value — it now drives extraSubdivisions
   * (row count) in NotationRenderer instead, and the lyric font is
   * auto-sized by the global solver per row. baseSize stays at the
   * mobile default for that mode; this prop still feeds the MIN/POST_BUMP
   * window for the dynamic solver.
   */
  baseSize?: number
  /**
   * 2026-08-24: number of additional sub-staves the parent has requested
   * (0 when no subdivision). When > 0, the dynamic solver REMOVES the
   * POST_BUMP_PX cap and lets font grow proportionally with the extra
   * horizontal room gained. Each extra row grants up to ~40% more font
   * size via `growthFactor = 1 + 0.4 × rowDelta / meterMin` (caller
   * supplies meterMin via the `meterPhraseCount` prop below, since
   * AbcPlayer doesn't read the meter itself).
   */
  rowDelta?: number
  /** Phrase count for the active meter (e.g. 4 for CM). Used by the
   *  growth-factor formula above. Ignored when rowDelta = 0. */
  meterPhraseCount?: number
  /**
   * 2026-09-02: split-half mobile path. When true, passes
   * `responsive: 'none'` to abcjs so the SVG renders at its natural
   * `staffwidth`-driven size and does NOT upscale when the container
   * grows (e.g. when the user enters fullscreen on a non-CMD tune — the
   * overlay gives the SVG more vertical room, but we don't want the
   * notation to fill it by zooming, we want it to stay at the same
   * visual size and scroll if needed). Default false preserves
   * staff-inline behaviour where responsive:resize is desirable.
   */
  noResponsiveResize?: boolean
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
  staffPages,
  solfegePages,
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
  hidePlayerControls = false,
  staffWidthFactor = 1,
  compactSplitMobile = false,
  baseSize,
  rowDelta = 0,
  meterPhraseCount = 1,
  noResponsiveResize = false,
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
  // Which JPEG to show when showOriginal=true. 260822-sou: the Staff/Solfège
  // sub-toggle UI writer (setOriginalMode) was removed — GearPopover and the
  // tune page each own their own Staff/Solfège control now — so this stays
  // pinned at `initialMode` as the fallback preference.
  const [originalMode] = useState<'staff' | 'solfege'>(initialMode)
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
  // 2026-09-02: ref for the scan image wrapper — hosts the swipe listener so
  // users can swipe left/right to advance/regress pages in "Show original".
  const scanImageRef = useRef<HTMLDivElement>(null)
  const [staffWidth, setStaffWidth] = useState(0)
  // Mirror of staffWidth so the settle-window ResizeObserver (which only runs
  // once on mount) can compare against the latest value without re-subscribing
  // every time staffWidth updates.
  const staffWidthRef = useRef(0)

  // Synchronous initial measurement so abcjs never paints at a wrong staffwidth.
  useLayoutEffect(() => {
    const w = outerRef.current?.clientWidth ?? 0
    if (w > 0) setStaffWidth(w)
  }, [])

  // Keep staffwidth in sync on viewport / container resize.
  //
  // iOS Safari quirk: a few ms after `useLayoutEffect` reports its initial
  // clientWidth, Safari fires a ResizeObserver event with the FINAL settled
  // width (usually larger by 6-12 px — the difference between pre- and
  // post-safe-area / pre- and post-toolbar-shrink width). If we accept that
  // event, the staff re-renders ~3% larger, producing the "private vs normal
  // differ" symptom on iPhone (one tab gets the bigger render, the other
  // doesn't — depending on whether the user opens the tab via initial load
  // or via bfcache restore). iOS Private mode doesn't trigger this settling
  // sequence, hence the visual difference between the two tabs.
  //
  // The fix: ignore ResizeObserver events for the first 1.5 seconds after
  // mount. After the settle window, real user-initiated viewport changes
  // (device rotation, split-view resizing) still propagate. The
  // `settled` ref is intentionally mutable (not state) so reading it from
  // the observer callback is synchronous and doesn't cause a re-render.
  //
  // 2026-09-04: also force one re-measure at the END of the settle window.
  // Without this, a layout transition that BEGINS during the settle window
  // (e.g. fullscreen entry — outerRef is briefly 187 wide before settling to
  // 390) leaves staffWidth stuck at the transient value forever, because the
  // ResizeObserver fires for the 187 → 390 transition but the event is
  // ignored, and no further resize event fires once the width stabilises.
  // 2026-09-04b: dependencies dropped from [staffWidth] to [] — the settle
  // window is meant for the iOS Safari mount-time settle event, NOT for every
  // staffWidth change. With [staffWidth], every re-measure restarted the 1.5s
  // window, so a container resize happening within 1.5s of a previous
  // re-measure (fullscreen exit) was also ignored — leaving the staff stuck
  // at the narrow value until something else (orientation change, etc.) broke
  // the loop.
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const settled = { current: false }
    const measure = () => {
      const w = el.clientWidth
      if (w > 0 && Math.abs(w - staffWidthRef.current) >= 8) {
        staffWidthRef.current = w
        setStaffWidth(w)
      }
    }
    const settleTimer = setTimeout(() => {
      settled.current = true
      // Re-measure once at settle end to catch transitions that completed
      // during the ignore window (no subsequent ResizeObserver event).
      measure()
    }, 1500)
    const obs = new ResizeObserver(() => {
      if (!settled.current) return
      measure()
    })
    obs.observe(el)
    return () => {
      obs.disconnect()
      clearTimeout(settleTimer)
    }
  }, [])

  // iOS Safari: ResizeObserver does NOT reliably fire on URL-bar / orientation
  // transitions. Add explicit listeners with rAF debounce + ≥8px threshold.
  // Same settle-window guard as above — the visualViewport can also fire a
  // settling event in the first ~1.5s after load. Real orientation changes
  // happen after settle, so this guard is invisible to the user.
  // 2026-09-04b: dependencies dropped from [staffWidth] to [] (see sibling
  // effect above for the rationale — re-subscribing every re-measure
  // restarted the 1.5s window).
  useEffect(() => {
    if (typeof window === 'undefined') return
    let raf = 0
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const settled = { current: false }
    const settleTimer = setTimeout(() => {
      settled.current = true
      // Re-measure once at settle end to catch transitions that completed
      // during the ignore window (no subsequent resize event).
      const w = outerRef.current?.clientWidth ?? 0
      if (w > 0 && Math.abs(w - staffWidthRef.current) >= 8) {
        staffWidthRef.current = w
        setStaffWidth(w)
      }
    }, 1500)
    const trigger = () => {
      if (!settled.current) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const w = outerRef.current?.clientWidth ?? 0
        if (w > 0 && Math.abs(w - staffWidthRef.current) >= 8) {
          staffWidthRef.current = w
          setStaffWidth(w)
        }
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
      clearTimeout(settleTimer)
      window.removeEventListener('orientationchange', debounced)
      window.visualViewport?.removeEventListener('resize', debounced)
    }
  }, [])

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

    // 2026-09-04: prefer the live container width over the captured
    // staffWidth state when the render fires immediately after mount. The
    // state may be a transient value (e.g. 220 captured during the same
    // tick the FullscreenOverlay closed, before layout settled at 374).
    // Reading `outerRef.current.clientWidth` here gives the CURRENT width,
    // so abcjs paints at the right staffwidth from the first paint.
    const liveW = outerRef.current?.clientWidth ?? 0
    const renderStaffWidth = liveW > 0 && Math.abs(liveW - staffWidth) > 16 ? liveW : staffWidth
    if (renderStaffWidth !== staffWidth) {
      staffWidthRef.current = renderStaffWidth
      setStaffWidth(renderStaffWidth)
    }

    try {
      // staffWidth is measured from outerRef (ResizeObserver + useLayoutEffect).
      // We prefer `renderStaffWidth` here (live clientWidth read) — see comment
      // above. Falls back to the captured staffWidth state on subsequent
      // renders where the discrepancy check passes.
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
      const containerWidth = Math.max(0, (renderStaffWidth || 600) - 16)
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
      // MOBILE-07 (Phase 04.9.15 Plan 05): live Playwright measurement
      // (tests/diagnostics/inline-staff-clef-stretch-diff.mjs) proved the
      // under-fill is NOT abcjs failing to auto-stretch non-last rows to our
      // requested `staffwidth` target — it's that different rows have
      // genuinely different NATURAL minimum content width (note count/lyric
      // length varies per phrase), and every row's natural minimum already
      // EXCEEDS whatever `effectiveStaffWidth` we can reasonably request
      // (confirmed via direct SVG getBBox() inspection: row natural widths
      // 408-450 abcjs-units vs. our ~212-369 unit target in both the old
      // narrowed-factor case AND a wider factor=1 target — neither reaches
      // the rows' natural floor, so calcHorizontalSpacing's compression
      // bottoms out at each row's own minimum instead of stretching, and the
      // narrower rows (lower natural minimum) render visibly smaller once
      // the shared viewBox scales everything down to the container width).
      // abcjs's own `expandToWidest` engraver option (EngraverController,
      // abcjs-basic.js) is the correct built-in fix for exactly this: when a
      // row needs more than the initial target, it reruns layout for EVERY
      // row using that wider natural width as the new shared target, so all
      // non-last rows converge to the SAME width instead of each compressing
      // to its own floor. 2026-08-24: enabled unconditionally — AbcPlayer
      // is only invoked for staff rendering (split-leaf paths render the
      // scanned JPG via renderScannedPages instead), so the previous
      // chromeless-only gate was leaving non-chromeless desktop Inline
      // Staff (e.g. /psalms/[id] on a 1920px monitor) with rows of
      // unequal widths — each row compressed to its own natural floor
      // because expandToWidest never unified them. With it on, every row
      // shares the same target width.
      const expandToWidest = true
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
        // 2026-09-02: split-half path uses 'none' so the SVG does NOT
        // upscale when the container grows (e.g. user enters fullscreen and
        // the overlay gives the SVG more vertical room — we want the
        // notation to stay at the same visual size, scrolling within its
        // h-full slot, not zoom to fill).
        responsive: noResponsiveResize ? 'none' : 'resize',
        // MOBILE-07: see comment above effectiveStaffWidth — lets a row that
        // naturally needs more than our target re-layout every row to match,
        // unifying per-row widths so the last row no longer needs the old
        // last-row-only stretch (removed 2026-08-17 to close the right-side
        // viewBox whitespace that last-row stretch was producing).
        expandToWidest,
        // Quick task 260823-stretch: stretch the LAST line of every staff
        // system fully to the staff edge (abcjs default is 0.8 = only stretch
        // when ≤80% of the page width remains). Eliminates the
        // "empty-staff-after-last-note" band on every system. 2026-08-24:
        // unconditional 1.0 — same rationale as expandToWidest above.
        // AbcPlayer is staff-only, so the previous chromeless-only gate was
        // leaving desktop non-chromeless Inline Staff with half-width last
        // rows.
        stretchlast: 1.0,
        // Quick task 260823-stretch (follow-up): zero out the abcjs default
        // `paddingleft` of 68 (renderer.js:71 — `setPaddingVariable(this, 'left',
        // 'leftmargin', 68, 15)`). abcjs reserves that 68px of leading
        // whitespace on every line as a layout margin for the title/subtitle
        // area; on chromeless inline Staff we render no titles, so the first
        // note can sit flush at the left edge of the staff. Symmetric with
        // the right edge (where the previous stretchlast=1.0 already pinned
        // the last note flush right). Gated to staffWidthFactor < 1 so the
        // non-chromeless paths (study / tunes — factor=1) keep the 68px
        // gutter that their centered title text actually uses.
        paddingleft: staffWidthFactor < 1 ? 0 : undefined,
        paddingright: staffWidthFactor < 1 ? 0 : undefined,
      })
      visualObjRef.current = visualObjs?.[0] ?? null
      // MOBILE-04 (revised): shrink the clef/key-signature/time-signature
      // glyph group on every row — including row 1 — and reflow the freed
      // space into the following notation/lyrics. Gated to the same
      // staffWidthFactor < 1 signal as expandToWidest above (chromeless
      // inline non-split Staff only); split-leaf and desktop non-chromeless
      // are untouched.
      if (staffWidthFactor < 1) {
        applyLeadingGlyphShrink(el)
        // Quick task 260823-stretch: abcjs hard-codes every SVG's
        // preserveAspectRatio to "xMinYMin meet" (see
        // node_modules/abcjs/src/write/svg.js:36 — left+top anchored). When
        // our staffWidthFactor < 1 makes the viewBox narrower than the
        // container, content scales up but stays glued to the LEFT edge,
        // producing an asymmetric right-side gutter that has no musical
        // reason to exist (calcHorizontalSpacing already stretched the
        // music to fill as much of staffwidth as the min-spacing cap
        // allows — the empty band is just a layout anchor). Re-anchor to
        // xMidYMid meet so the residual gap is split symmetrically L/R,
        // and is much less visually load-bearing as a "wasted space"
        // complaint. Gated to the same staffWidthFactor < 1 signal as the
        // leading-glyph shrink above — non-chromeless (factor=1) callers
        // are byte-identical because their viewBox already matches
        // container width and the default xMinYMin meet produces no gap.
        el.querySelectorAll<SVGSVGElement>('svg').forEach((svg) => {
          if (svg.getAttribute('preserveAspectRatio') === 'xMinYMin meet') {
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
          }
        })
        // 260823-stretch v2: bump lyrics font-size on mobile chromeless Staff
        // so the syllable text reads bigger on phone-sized viewports. abcjs
        // renders lyrics as <text> elements with `font-size: 0.7em` relative
        // to the staff font (svg.js:204). Earlier attempts (CSS
        // transform:scale, abcjs scale option, SVG width override) all clipped
        // the right edge because they grew the whole SVG. This pass only
        // multiplies the lyrics <text> elements' font-size by 1.4 — the note
        // glyphs stay exactly the same size, and the wider syllable boxes
        // stay within the already-flush-right staff because each lyric
        // glyph still anchors at the same x-coordinate as its note.
        //
        // Gated to staffWidthFactor < 1 AND viewportW < 768 (mobile).
        // Desktop/tablet/study/tune callers keep abcjs's default 0.7em.
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          // 2026-08-25: dropped the LYRIC_SCALE=1.4 bump. The dynamic solver
          // (PHASE 2 below) now drives font size from `lyricBaseSize` (the
          // user's chosen baseSize) directly at all zoom levels. The bump
          // used to make syllables wider than the row could hold, which
          // the cap then shrank to eliminate overlap — but the cap was
          // reducing font below the legible default the user picked.
          // Without the bump, abcjs renders at 0.7em (natural), and the
          // solver scales up to fill the row until syllables touch.
          void el // no-op
        }
        // 260823-stretch v3 (revised): auto-trim the SVG viewBox to the actual
        // content bounds, with two critical corrections vs the first pass:
        //
        //   (a) RIGHT edge — exclude the 5 staff-line paths from the right
        //       bound. abcjs draws them as one long horizontal line per
        //       staff system (e.g. `M 0 26.78 L 549.47 26.78` — full SVG
        //       width). Using these for the right bound defeats the
        //       entire point of the trim. Filter to paths with a
        //       `data-name` attribute (clefs, accidentals, timesig,
        //       noteheads, beams, etc.) — these are real musical glyphs
        //       that have a meaningful right edge.
        //
        //   (b) BOTTOM edge — text getBBox() is the cap-height box, not
        //       the full glyph box. Descenders (g, j, p, q, y) extend
        //       below. Add 25% of the largest text font-size as
        //       descender padding so the SVG's bottom is past the
        //       lowest descender.
        //
        // Two computations, one viewBox write per SVG. Gated to
        // `staffWidthFactor < 1` (same gate as the other chromeless
        // inline-Staff passes).
        el.querySelectorAll<SVGSVGElement>('svg').forEach((svg) => {
          const vbStr = svg.getAttribute('viewBox')
          if (!vbStr) return
          const [vbX, vbY, vbW, vbH] = vbStr.split(/\s+/).map(Number)

          // Right edge: max X of any path with a data-name (= a real
          // musical glyph, not a staff line). Initialise at -Infinity so
          // the first glyph always sets the bound — abcjs's viewBox is
          // almost always wider than its music, so the rightmost glyph
          // is LEFT of vbX+vbW. Falling back to the existing right
          // would defeat the trim.
          let rightX = -Infinity
          let hasGlyph = false
          svg.querySelectorAll<SVGPathElement>('path[data-name]').forEach((p) => {
            let bb: DOMRect
            try { bb = p.getBBox() } catch { return }
            if (bb.width <= 0 || bb.height <= 0) return
            const r = bb.x + bb.width
            if (r > rightX) rightX = r
            hasGlyph = true
          })
          if (!hasGlyph) rightX = vbX + vbW
          // Bottom edge: max bottom of any <text> + 25% descender padding
          // of the LARGEST text font-size in the SVG. Same -Infinity
          // initialisation rationale: lyric bottoms can sit ABOVE
          // vbY+vbH (if abcjs padded the SVG past the music), so the
          // initial value must let them shrink it.
          let textBottom = -Infinity
          let maxFontSize = 17
          let hasText = false
          svg.querySelectorAll<SVGTextElement>('text').forEach((t) => {
            let bb: DOMRect
            try { bb = t.getBBox() } catch { return }
            if (bb.width <= 0) return
            const b = bb.y + bb.height
            if (b > textBottom) textBottom = b
            const fs = parseFloat(t.getAttribute('font-size') || '17')
            if (fs > maxFontSize) maxFontSize = fs
            hasText = true
          })
          if (!hasText) textBottom = vbY + vbH
          const descenderPad = maxFontSize * 0.25
          const newW = Math.max(1, rightX - vbX)
          const newH = Math.max(1, textBottom + descenderPad - vbY)
          svg.setAttribute('viewBox', `${vbX} ${vbY} ${newW} ${newH}`)
          // 260823-padbottom-fix: abcjs sizes its mount div with the
          // padding-bottom aspect-ratio trick (`padding-bottom: ${H/W}%`
          // where H/W is the original viewBox aspect ratio). When we
          // trim the viewBox above, the mount div's padding-bottom no
          // longer matches the SVG's new intrinsic aspect ratio — so
          // the SVG overflows the mount div and the BOTTOM gets clipped
          // by the div's `overflow: hidden` (which abcjs also sets).
          // Recompute padding-bottom here from the NEW viewBox so
          // container height matches SVG height exactly. Without this,
          // the trailing lyric lines (everything past the original
          // aspect's height) disappear off the bottom.
          const containerEl = svg.parentElement
          if (containerEl) {
            const containerStyle = containerEl.style
            const newAspectPct = (newH / newW) * 100
            containerStyle.paddingBottom = `${newAspectPct.toFixed(4)}%`
          }
        })
        // 260823-stretch v4 (global font solver + vertical re-pack):
        //
        //   PHASE 1 — BUMP (already done above): every lyric <text> gets
        //   a 1.4× font-size multiplier as the STARTING font.
        //
        //   PHASE 2 — GLOBAL FONT SOLVER: instead of letting each row
        //   shrink independently (which produced jagged baselines —
        //   row 1 at 23.8px next to row 7 at 18px), compute the WORST
        //   shrink any single row requires and apply that ONE ratio
        //   to every row uniformly. Single font-size across the whole
        //   staff = consistent rhythm.
        //
        //   The per-row "what's the max font that fits?" check uses two
        //   tests:
        //     (a) per-pair syllable overlap (text[i].right vs text[i+1].x)
        //     (b) row-overflow against staff right edge
        //   Take the smallest ratio across ALL rows → that's the
        //   global ratio. Floor at MIN_LYRIC_FONT_PX so dense psalms
        //   stay readable (derived from baseSize — see below).
        //
        //   PHASE 3 — VERTICAL RE-PACK: abcjs lays out lyric rows at a
        //   fixed ~20-unit vertical pitch regardless of font size. When
        //   the font shrinks (say to 18 px), the visual gap between
        //   rows stays the same — small text in big gaps. Re-pack rows
        //   within each staff system so rowSpacing = fontSize × 1.1
        //   (close to natural line-height). Bold tighter packing when
        //   font shrinks, looser when it grows. Per-system (rows of
        //   different stanzas are not re-packed across staff lines).
        //
        // Gated to staffWidthFactor < 1 (chromeless inline Staff) so
        // desktop / wide-viewport users also get the auto-shrink when
        // the row is tighter than abcjs's default font can fill. The
        // previous `&& viewportW < 768` gate left wide-viewport tabs
        // with overlap (default ~17 px lyrics on rows that couldn't
        // fit them) while mobile users got the solver and ended up
        // smaller — making two tabs on the same iPhone render
        // differently depending on iOS Safari's per-tab viewport state.
        //
        // 2026-08-23 Inline Staff A+/A− integration: the MIN floor and
        // POST_BUMP start are now derived from `baseSize` (the same value
        // the user-adjustable A+/A− buttons drive for the
        // --staff-base-size CSS var) instead of hardcoded constants.
        // Default 14 when not supplied preserves v4 behaviour exactly.
        // Linear mapping:
        //   baseSize 14 (default) → MIN 14, POST_BUMP 16.8 (today's v4)
        //   baseSize 16 (A+ once) → MIN 16, POST_BUMP 19.2 (easier read)
        //   baseSize 12 (A− once) → MIN 12, POST_BUMP 14.4 (more density)
        // MIN floor at 10 px so an aggressive A− can't make lyrics
        // unreadable.
        const lyricBaseSize = baseSize ?? 14
        const MIN_LYRIC_FONT_PX = Math.max(10, lyricBaseSize)
        if (typeof window !== 'undefined') {
          const texts = Array.from(el.querySelectorAll<SVGTextElement>('text'))
          // Group texts into rows by approximate Y. abcjs places lyrics
          // in <text> elements at consistent Y positions; same row =
          // same Y bucket.
          const rowMap = new Map<number, SVGTextElement[]>()
          texts.forEach((t) => {
            let bb: DOMRect
            try { bb = t.getBBox() } catch { return }
            if (bb.width <= 0) return
            const key = Math.round(bb.y / 5) * 5 // 5-unit bucket tolerance
            if (!rowMap.has(key)) rowMap.set(key, [])
            rowMap.get(key)!.push(t)
          })
          // Worst-case ratio across all rows. Each row contributes the
          // SMALLEST ratio that satisfies per-pair-overlap (no other
          // constraint — let the row be visually "empty" at high zoom
          // rather than shrink the font to fit it, which was producing
          // "massive gaps between words" per user feedback 260825).
          //
          // 2026-08-25: use the CYCLE-0 tspan bbox (first <tspan>) instead
          // of the parent <text> bbox. Multi-cycle lyrics render as one
          // <text> with multiple <tspan> children stacked vertically; the
          // parent bbox width = widest cycle (which can be from a different
          // verse), overcounting overlap and shrinking the font too much
          // for the cycle-0 syllables the user actually reads. The first
          // tspan's bbox is the cycle-0 syllable's true visual extent.
          //
          // For each adjacent pair, factor k = largest scaling such that
          // scaled widths still don't overlap:
            //   If already overlapping (aRight > bLeft):
            //     k_max = (bLeft - a.x) / width
            //   If no overlap (gap = bLeft - aRight ≥ 0):
            //     k_max = 1 + gap / width
          const firstTspanBBox = (t: SVGTextElement): DOMRect | null => {
            const ts = t.querySelector('tspan')
            if (ts) {
              try {
                const bb = ts.getBBox()
                if (bb.width > 0) return bb
              } catch { /* fall through */ }
            }
            try { return t.getBBox() } catch { return null }
          }
          let globalRatio = Infinity
          rowMap.forEach((row, yKey) => {
            // Sort by cycle-0 tspan X (notes don't move with font size;
            // tspans within one <text> share an X so the parent sort is
            // equivalent here).
            row.sort((a, b) => {
              const aBB = firstTspanBBox(a) ?? a.getBBox()
              const bBB = firstTspanBBox(b) ?? b.getBBox()
              return aBB.x - bBB.x
            })
            let worstRatio = Infinity
            for (let i = 0; i < row.length - 1; i++) {
              const aBB = firstTspanBBox(row[i]!) ?? row[i]!.getBBox()
              const bBB = firstTspanBBox(row[i + 1]!) ?? row[i + 1]!.getBBox()
              const aRight = aBB.x + aBB.width
              const bLeft = bBB.x
              if (aBB.width <= 0) continue
              let r: number
              if (aRight > bLeft) {
                r = (bLeft - aBB.x) / aBB.width
              } else {
                r = 1 + (bLeft - aRight) / aBB.width
              }
              if (r < worstRatio) worstRatio = r
            }
            if (worstRatio < globalRatio) globalRatio = worstRatio
          })
          // Compute the absolute target font size from the global ratio.
          // abcjs's pre-bump lyric font is 12 px (0.7em of staff 17 px
          // font); the bump above multiplied it 1.4× → lyricBaseSize ×
          // 1.2 (where 1.2 = 1.4 × 0.857 — same ratio as the v4 hardcoded
          // 16.8/14, just expressed against baseSize so it scales with
          // A+/A−). Apply globalRatio on top, then clamp to ABSOLUTE_MIN
          // and ABSOLUTE_MAX.
          //
          // 2026-08-25 (no-overlap font cap, fill staff not fit-staff): the user
          // wants the MAX font that doesn't cause any adjacent cycle-0
          // syllable pair to overlap, at every zoom level. Earlier we also
          // capped against the "rightmost note" as the right edge of the
          // available row — but at A+1+ abcjs auto-shrinks the staff to
          // cluster the split rows, so the rightmost note sits well short
          // of the actual staff width. That cap was wrong: it shrank the
          // font to fit the NOTE distribution, not the staff, leaving
          // massive gaps between words. Now we cap on PER-PAIR overlap
          // only — the largest k such that scaling POST_BUMP_PX by k keeps
          // every adjacent pair of syllables just barely non-overlapping.
          //
          // 2026-08-25 (legible default at A+0): At rowDelta === 0, use
          // lyricBaseSize directly — one phrase per row with full width,
          // no overlap risk.
          const ABSOLUTE_MIN_PX = 6
          const ABSOLUTE_MAX_PX = 24
          const POST_BUMP_PX = lyricBaseSize * 1.2
          // globalRatio is the largest k such that POST_BUMP_PX × k still
          // has no per-pair overlap. Infinity means "no constraint found"
          // (all pairs have wide gaps) — don't cap.
          const pairCap = Number.isFinite(globalRatio) ? POST_BUMP_PX * globalRatio : Infinity
          let targetFont: number
          if (rowDelta === 0) {
            targetFont = Math.max(ABSOLUTE_MIN_PX, lyricBaseSize)
          } else if (rowDelta > 0 && meterPhraseCount > 0) {
            const growthFactor = Math.min(1.6, 1 + 0.25 * rowDelta)
            const wantedFont = lyricBaseSize * growthFactor
            targetFont = Math.min(ABSOLUTE_MAX_PX, Math.max(ABSOLUTE_MIN_PX, Math.min(wantedFont, pairCap)))
          } else {
            targetFont = Math.min(ABSOLUTE_MAX_PX, Math.max(ABSOLUTE_MIN_PX, pairCap))
          }
          // Apply targetFont UNIFORMLY to every lyric <text>.
          texts.forEach((t) => {
            t.setAttribute('font-size', targetFont.toFixed(2))
          })
          // PHASE 3 — re-pack rows vertically within each staff system.
          // Group rows into systems by Y gap: rows within a system are
          // < 50 units apart; rows across systems are > 80 units apart.
          const sortedRowEntries = Array.from(rowMap.entries())
            .sort((a, b) => a[1][0].getBBox().y - b[1][0].getBBox().y)
          const systems: Array<Array<SVGTextElement[]>> = []
          let currentSys: Array<SVGTextElement[]> = []
          let lastY = -Infinity
          sortedRowEntries.forEach(([_, row]) => {
            const y = row[0].getBBox().y
            if (y - lastY > 50 && currentSys.length > 0) {
              systems.push(currentSys)
              currentSys = []
            }
            currentSys.push(row)
            lastY = y
          })
          if (currentSys.length > 0) systems.push(currentSys)
          // Pack each system's rows from the first row's current Y,
          // spacing each row by targetFont × 1.1 (≈ natural line-height
          // — tight enough that descenders just touch ascenders, no
          // floating-pad feel).
          const rowSpacing = targetFont * 1.1
          systems.forEach((sysRows) => {
            if (sysRows.length === 0) return
            const firstY = sysRows[0][0].getBBox().y
            let nextY = firstY
            sysRows.forEach((row, idx) => {
              row.forEach((t) => {
                t.setAttribute('y', nextY.toFixed(2))
              })
              if (idx < sysRows.length - 1) nextY += rowSpacing
            })
          })
        }
      }
      // STAFF-LINE-EXTEND: unconditionally stretch every staff's right edge
      // to the SVG viewBox width (covers desktop half-width last row when
      // abcjs's expandToWidest fails to bridge separately-emitted systems).
      extendStaffLines(el)
      // Melisma slurs are drawn natively by abcjs from (...) syntax in
      // the music line — see NotationRenderer.wrapMelismaSlurs. No DOM
      // pass needed here. (260825-slur v2: replaced applyMelismaSlurs,
      // which drew arcs at note CENTERS and looked "stuck on" the
      // noteheads; abcjs's drawArc anchors to the stem side instead.)
    } catch (e) {
      console.error('abcjs render failed:', e)
      setAudioError('Could not render notation.')
      visualObjRef.current = null
    }
  }, [abc, transpose, bpm, scale, showOriginal, stopAudio, staffWidth, staffWidthFactor, compactSplitMobile, baseSize, rowDelta, meterPhraseCount])

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
  }, [abc, transpose, bpm, scale, showOriginal, staffWidth, staffWidthFactor, compactSplitMobile, slotHeight, baseSize])

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

  // ── Mobile chromeless Staff — lyrics scale-up via abcjs `scale` (260823-stretch v2) ──
  // After the abcjs render + padding-left/right-zero pass above, every
  // staff line is already flush edge-to-edge on most rows. But on the
  // trailing short rows of CM (the 6-syllable halves) abcjs still leaves
  // ~14% of the staff trailing empty past the last note, and on phone-sized
  // viewports the lyrics inside the abcjs SVG (rendered at abcjs's natural
  // font-size for the staff height) feel tight to read.
  //
  // Earlier iterations of this fix tried (a) a CSS `transform: scale(1.18)`
  // on the SVG, and (b) setting the SVG's CSS `width` to 118% — both clip
  // the right edge and cut syllables in half because the scaled SVG
  // physically overflows the viewport. The correct lever is abcjs's own
  // `scale` option, which causes abcjs to compute a wider viewBox at render
  // time so the SAME physical width contains BIGGER glyphs. No clipping,
  // no scrollbar, no visual transform on the DOM.
  //
  // Implementation: bump abcjs `scale` from 1.0 to 1.18 on mobile chromeless
  // Staff. Scale is read from the existing `scale` prop (line 597) which is
  // currently a no-op for chromeless Staff because NotationRenderer always
  // passes `scale={1}`. We override it here via a state-injected prop and
  // trigger a re-render via the same dep set as the render effect above.
  //
  // Gated to: staffWidthFactor < 1 (chromeless Staff) AND viewportW < 768
  // (mobile). Desktop/tablet/study/tune pages are byte-identical because
  // the gate excludes them.

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
  // Multi-page scans: derive the active page array + selected page index.
  // Resets to 0 whenever the array identity changes (tune switch / page
  // source swap). Falls back to the single-URL props when the array is
  // empty/undefined so legacy callers are byte-identical.
  const originalPages: string[] = originalMode === 'solfege'
    ? (solfegePages && solfegePages.length > 0 ? solfegePages : [])
    : (staffPages && staffPages.length > 0 ? staffPages : [])
  const [scanPageIndex, setScanPageIndex] = useState(0)
  useEffect(() => { setScanPageIndex(0) }, [originalPages[0]])
  const hasMultiPages = originalPages.length > 1
  const originalSrc = hasMultiPages
    ? originalPages[scanPageIndex] ?? originalPages[0]
    : (originalMode === 'solfege' ? (solfegeJpgUrl ?? staffJpgUrl) : (staffJpgUrl ?? solfegeJpgUrl))

  // 2026-09-02: swipe left/right to advance/regress scan pages when there
  // are multiple pages — alternative to the chevron buttons underneath.
  useSwipeGesture(scanImageRef, {
    enabled: hasMultiPages,
    onSwipeLeft: () => setScanPageIndex((i) => Math.min(originalPages.length - 1, i + 1)),
    onSwipeRight: () => setScanPageIndex((i) => Math.max(0, i - 1)),
  })

  return (
    <div
      ref={outerRef}
      className="w-full max-w-full overflow-x-hidden px-2 space-y-3"
      aria-label={title ? `Music player for ${title}` : 'Music player'}
    >
      {/* Notation area: SVG OR original JPEG */}
      {showOriginal ? (
        <div className="relative w-full space-y-1">
          {originalSrc ? (
            <>
              {/* 2026-09-02: image now full-width; prev/next + "Page X of Y"
                  moved to a row UNDERNEATH the image so the chevrons no
                  longer steal horizontal space on a 390px mobile viewport.
                  Swipe on the image is also supported (scanImageRef). */}
              <div ref={scanImageRef} className="w-full flex justify-center touch-pan-y">
                {/* R2-hosted JPG with unknown intrinsic dimensions — next/image
                    requires either width/height or fill+sized parent, which
                    the surrounding aspect-fitting layout doesn't provide.
                    Match the disable used elsewhere (SiteHeader.tsx). (WR-09) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalSrc}
                  alt={`Original score for ${tuneName ?? 'tune'}`}
                  className="max-w-full max-h-full w-full h-auto object-contain rounded-md border border-border mx-auto"
                />
              </div>
              {hasMultiPages && (
                <div className="flex items-center justify-center gap-1 -mt-1">
                  <button
                    type="button"
                    aria-label="Previous page"
                    data-page-prev
                    onClick={() => setScanPageIndex((i) => Math.max(0, i - 1))}
                    disabled={scanPageIndex === 0}
                    className="min-h-10 w-9 shrink-0 inline-flex items-center justify-center rounded-md text-foreground active:scale-[0.90] transition-transform duration-75 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap px-1">
                    Page {scanPageIndex + 1} of {originalPages.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Next page"
                    data-page-next
                    onClick={() => setScanPageIndex((i) => Math.min(originalPages.length - 1, i + 1))}
                    disabled={scanPageIndex === originalPages.length - 1}
                    className="min-h-10 w-9 shrink-0 inline-flex items-center justify-center rounded-md text-foreground active:scale-[0.90] transition-transform duration-75 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
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
