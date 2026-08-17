'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { NotationRendererClient } from '@/components/notation/NotationRendererClient'
import { PsalmTopBarClient } from './PsalmTopBarClient'
import { GlassBottomBar } from './GlassBottomBar'
import { PlayMiniBarClient } from './PlayMiniBarClient'
import { GearPopoverClient } from './GearPopoverClient'
import { OnboardingTourClient } from './OnboardingTourClient'
import { StanzaDotIndicator } from './StanzaDotIndicator'
import { PsalmPickerModalClient } from '@/components/PsalmPickerModalClient'
import { TunePickerDialog } from '@/components/tune-picker/TunePickerDialog'
import type { TuneOption } from './types'
import type { AlternateTune } from '@/db/queries/tunes'
import type { TuneRow } from '@/components/TuneTable'
import type { PsalmDetail } from '@/db/queries/psalms'
import type { PsalmRow } from '@/components/PsalmListingGrid'
import type { ViewMode } from '@/components/notation/NotationRenderer'
import { buildNotationRendererProps } from '@/lib/notation-renderer-props'
import { setChromeHidden } from '@/lib/chrome-hidden-store'
import { resolveStaffInlineApproved, shouldFallbackToSplit } from '@/lib/inline-staff-gating'
import { isIOSDevice, isStandaloneDisplayMode, isPhoneDevice } from '@/lib/device'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { toast } from 'sonner'

const STORAGE_MODE_KEY = 'psalter-score-mode'
// Tracks the last non-'lyrics' viewMode separately from STORAGE_MODE_KEY
// (which is overwritten with 'lyrics' the moment the user switches to Lyrics
// Only). GearPopover's "Music Notes" toggle reads THIS key to restore the
// exact prior Music Notes selection (e.g. staff-split) instead of always
// falling back to plain 'staff'.
const STORAGE_LAST_MUSIC_MODE_KEY = 'psalter-score-mode-last-music'
// Split-leaf (staff-split/solfege-split) + inline solfège share one stored
// size; Lyrics Only has its own — see `readStoredSize`/`activeBaseSize` below.
const STORAGE_SIZE_KEY = 'psalter-staff-size'
const STORAGE_LYRICS_SIZE_KEY = 'psalter-lyrics-size'

interface Props {
  psalm: PsalmDetail
  currentSlug: string
  prevSlug: string | null
  nextSlug: string | null
  primaryTune: TuneOption | null
  alternateTunes: TuneOption[]
  /** @deprecated superseded by tuneTiers in Phase 11; retained for the route call sites */
  editoriallyLinkedTuneIds: number[]
  /**
   * TSEL-01/D-13: per-psalm-version Backup/Historical tune ids, fetched by the route via
   * fetchPsalmVersionTuneTiers. Undefined when there is no active psalm version — the tune switcher then
   * renders every tune in the 'other' tier.
   */
  tuneTiers?: import('@/db/queries/tunes').PsalmVersionTuneTiers
  /**
   * 2026-08-17: true tune-catalog size — alternateTunes here is already meter-scoped
   * (fetchTunesByMeter), so alternateTunes.length isn't the total the tune-picker's "filtered
   * from N" count text needs. See TuneTable's totalTuneCount doc.
   */
  totalTuneCount?: number
  meter: string | null
  stanzaMeter: string | null
  lyrics: string
  /** Plan 04.9.6-05 (D-01): canonical structured-lyrics payload for the active
   *  psalm-version. Null for the 6 quarantined rows (D-15 legacy fallback). */
  lyricsStructured: import('@/lib/lyrics-structured').StructuredLyrics | null
  psalmListRows: PsalmRow[]
  studyHref: string
  /** Verse range for individual Psalm 119 (etc) versifications, e.g. "45-85". */
  versePartLabel?: string | null
  /** Precenting mode: override left arrow href. Null = disabled, undefined = not precenting. */
  precentingPrevHref?: string | null
  /** Precenting mode: override right arrow href. Null = disabled, undefined = not precenting. */
  precentingNextHref?: string | null
  /** Precenting mode: verse range from the set item (e.g. "1-6"), shown in the topbar. */
  precentingVerseRange?: string | null
  /** For multi-version psalms (a/b), the full list of versions with slugs and current marker. */
  versionSiblings?: { slug: string; displayLabel: string; isCurrent: boolean }[]
  /**
   * Whether the active psalm-version's `psalterNumber` field contains the
   * 'Recommended' marker — see `deriveVersionSlug` in `src/lib/psalm-slugs.ts`.
   * Drives the "no tune selected yet" message when no active tune exists.
   * Default true (single-version psalms / unknown = treat as recommended,
   * keep the existing generic message).
   */
  isRecommendedVersion?: boolean
}

function readStoredViewMode(showLyrics: boolean): ViewMode {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_MODE_KEY) : null
    if (raw === 'staff' || raw === 'solfege' || raw === 'staff-split' || raw === 'solfege-split' || raw === 'lyrics') {
      if (raw === 'lyrics' && !showLyrics) return 'staff'
      return raw
    }
  } catch { /* ignore */ }
  return 'staff'
}

function readStoredSize(key: string): number {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    const n = raw ? Number(raw) : NaN
    if (Number.isFinite(n) && n >= 4 && n <= 120) return n
  } catch { /* ignore */ }
  // UI-SPEC §3 defaults: 13 mobile, 14 ≥768px
  if (typeof window !== 'undefined' && window.innerWidth < 768) return 13
  return 14
}

export function SingingView({
  psalm,
  currentSlug,
  prevSlug,
  nextSlug,
  primaryTune,
  alternateTunes,
  editoriallyLinkedTuneIds,
  tuneTiers,
  totalTuneCount,
  meter,
  stanzaMeter,
  lyrics,
  lyricsStructured,
  psalmListRows,
  studyHref,
  versePartLabel = null,
  precentingPrevHref,
  precentingNextHref,
  precentingVerseRange,
  versionSiblings,
  isRecommendedVersion = true,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tuneParam = searchParams?.get('tune') ?? null

  // Build whitelist for ?tune= validation — include current primary AND all alts
  const allTuneOptions = useMemo<TuneOption[]>(() => {
    const list: TuneOption[] = []
    if (primaryTune) list.push(primaryTune)
    for (const t of alternateTunes) {
      if (!primaryTune || t.id !== primaryTune.id) list.push(t)
    }
    return list
  }, [primaryTune, alternateTunes])

  const overrideTune = useMemo<TuneOption | null>(() => {
    if (!tuneParam) return null
    const asNum = Number(tuneParam)
    if (!Number.isFinite(asNum)) return null
    return allTuneOptions.find((t) => t.id === asNum) ?? null
  }, [tuneParam, allTuneOptions])

  const activeTune: TuneOption | null = overrideTune ?? primaryTune

  // Plan 04.9.15-04 (MOBILE-08): explicit-approval gate for inline Staff —
  // derived from the active tune's latest tuneMelismaDecisions.status.
  const staffInlineApproved = resolveStaffInlineApproved(activeTune?.melismaStatus ?? null)

  // 260712-tmm bug (b): page arrays now travel WITH each tune (server-derived
  // in fetchTunesByMeter / page.tsx builders), so a client-side tune switch
  // always reflects the ACTIVE tune's own arrays instead of stale page props.
  const activeStaffPages = activeTune?.staffPages ?? []
  const activeSolfegePages = activeTune?.solfegePages ?? []

  // Bugs 2 & 3 (quick task 260717-mwv): hasAnyNotation distinguishes "tune
  // has zero staff/solfège notation in any form" (force Lyrics Only, Bug 3)
  // from "no tune is active at all" (Bug 2's "not recommended" messaging).
  const staffAvailable = !!(activeTune?.abcNotation || activeTune?.abcSatb)
  const solfegeSplitAvailable = !!(activeTune?.solfegeJpgUrl || activeSolfegePages.length > 0)
  const hasAnyNotation = staffAvailable || solfegeSplitAvailable

  // ViewMode + baseSize state (owned here; passed controlled to NotationRenderer)
  const showLyrics = !!lyrics
  const [viewMode, setViewMode] = useState<ViewMode>('staff')
  // `baseSize` = solfège (inline) + both split-leaf modes (staff-split,
  // solfege-split); `lyricsBaseSize` = Lyrics Only, stored separately so
  // zooming one doesn't affect the other. `activeBaseSize` below picks
  // whichever applies to the current viewMode.
  const [baseSize, setBaseSize] = useState<number>(14)
  const [lyricsBaseSize, setLyricsBaseSize] = useState<number>(14)
  // 04.9.15-02: notationBaseSize is a SECOND, independent size state driving
  // ONLY the chromeless inline-Staff abcjs scale (via computeNotationScale).
  // It is seeded at the pre-existing inline-Staff mobile default (13, matches
  // NotationRenderer's MOBILE_DEFAULT_SIZE_CHROMELESS) and is driven EXCLUSIVELY
  // by the viewport-resize proportional-zoom heuristic below — never by A+/A−
  // button presses. `baseSize` (above) is now lyric-only: driven ONLY by A+/A−.
  const [notationBaseSize, setNotationBaseSize] = useState<number>(13)
  const [mounted, setMounted] = useState(false)

  // 04.9.4-03: Proportional zoom heuristic — refs avoid stale closures in the
  // debounced resize handler. `referenceWidthRef` tracks the viewport width at
  // the moment of the last manual A+/A− override (or initial mount).
  // 04.9.15-02: this reference width now belongs to the NOTATION heuristic
  // (notationBaseSize), not the lyric baseSize — see handleBaseSizeChange below.
  const referenceWidthRef = useRef<number>(
    typeof window !== 'undefined' ? window.innerWidth : 375
  )
  const baseSizeRef = useRef<number>(baseSize)
  const notationBaseSizeRef = useRef<number>(notationBaseSize)

  // Checkpoint round 4 (item 3 refinement): tracks whether the user's
  // most-recently-used view mode (BEFORE the current transition) was a Music
  // Notes mode (not Lyrics Only) — decides whether the zero-notation
  // auto-toast below should fire. Two distinct "before" signals feed it:
  //   - Seeded from the PERSISTED localStorage preference in the
  //     mount-hydration effect below, which is the only reliable source at
  //     that exact moment (that same effect may itself force viewMode to
  //     'lyrics' for a zero-notation tune, which would otherwise clobber the
  //     signal before anything else gets to read it).
  //   - Kept in sync afterward by the small effect further below, which only
  //     updates it while hasAnyNotation is true (i.e. only ever records a
  //     GENUINE, non-forced viewMode as "the last real preference").
  const wasMusicNotesBeforeRef = useRef<boolean>(false)

  // Hydrate from localStorage AFTER first paint to avoid SSR mismatch — this
  // component itself is server-rendered (the notation child is dynamic ssr:false).
  // Runs ONCE on mount; we don't want re-hydration to clobber the user's
  // in-memory viewMode when showLyrics flips. (WR-01)
  useEffect(() => {
    const stored = readStoredViewMode(showLyrics)
    wasMusicNotesBeforeRef.current = stored !== 'lyrics'
    // Bug 3 (260717-mwv): never restore a stored Staff/Split preference for a
    // tune with no notation at all — the forced-Lyrics-Only effect below
    // would immediately override it anyway, but this avoids a flash of a
    // broken Split-Leaf view before that effect fires.
    setViewMode(hasAnyNotation ? stored : 'lyrics')
    setBaseSize(readStoredSize(STORAGE_SIZE_KEY))
    setLyricsBaseSize(readStoredSize(STORAGE_LYRICS_SIZE_KEY))
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keeps wasMusicNotesBeforeRef in sync for LATER (mid-session) tune
  // switches into a zero-notation tune — see the ref's declaration above for
  // the full rationale. Deliberately excludes updates while hasAnyNotation is
  // false so a forced 'lyrics' state is never mistaken for a real preference.
  useEffect(() => {
    if (!mounted) return
    if (!hasAnyNotation) return
    wasMusicNotesBeforeRef.current = viewMode !== 'lyrics'
  }, [viewMode, hasAnyNotation, mounted])

  // Fallback: if showLyrics flips off while user is in 'lyrics' mode, drop to staff.
  useEffect(() => {
    if (mounted && !showLyrics && viewMode === 'lyrics') setViewMode('staff')
  }, [showLyrics, viewMode, mounted])

  // Item 2a (260717-mwv checkpoint round 1): no tune is active at all on a
  // non-recommended versification (e.g. Ps 45a) — real lyrics render in
  // Lyrics Only mode by default (see the top-level render below), but we
  // still surface the "not recommended" context as a one-time toast rather
  // than blocking the actual lyrics content behind a message.
  const notRecommendedToastShownRef = useRef(false)
  useEffect(() => {
    if (!mounted) return
    if (activeTune) return
    if (isRecommendedVersion) return
    if (notRecommendedToastShownRef.current) return
    notRecommendedToastShownRef.current = true
    toast('Please select a tune. Note that this versification of this psalm is not recommended.')
  }, [mounted, activeTune, isRecommendedVersion])

  // Plan 04.9.15-04 (MOBILE-08): if navigation (next/prev psalm, tune switch,
  // or a stale localStorage restore) lands the user in inline Staff on a
  // non-approved tune, fall back to Split-Leaf and surface the locked toast.
  // Guarded by a ref keyed to the active tune id so the toast fires once per
  // transition into this state, not on every render while it persists.
  const lastFallbackTuneIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (!mounted) return
    // Bug 3 (260717-mwv): a tune with no notation at all takes the dedicated
    // forced-Lyrics-Only effect below instead — Split-Leaf would have
    // nothing to render.
    if (!hasAnyNotation) return
    if (!shouldFallbackToSplit({ viewMode, staffInlineApproved })) return
    if (lastFallbackTuneIdRef.current === (activeTune?.id ?? null)) return
    lastFallbackTuneIdRef.current = activeTune?.id ?? null
    setViewMode('staff-split')
    toast('Inline Staff not available for this tune — showing Split-Leaf. Pick a different view in Settings.')
  }, [activeTune, staffInlineApproved, viewMode, mounted, hasAnyNotation])

  // Bug 3 (260717-mwv): a tune with NO notation source at all (no staff
  // ABC/JPG, no solfège JPG in any form) must force Lyrics Only rather than
  // the above effect's Split-Leaf fallback, which would render a blank
  // notation slot. Guarded by a tune-id ref (same pattern as
  // lastFallbackTuneIdRef) so it only fires once per transition.
  //
  // Checkpoint round 1 (item 3a) removed this toast on load/tune-switch;
  // checkpoint round 2 (item 3, REVERSAL) restored it unconditionally;
  // checkpoint round 4 (item 3 refinement) narrowed it further — only
  // auto-show it if the user's most-recently-used view mode (before this
  // transition — see wasMusicNotesBeforeRef above) was a Music Notes mode.
  // If they were already in Lyrics Only, they weren't expecting notation, so
  // there's nothing to explain. The tap-triggered message in GearPopover's
  // musicNotesBlocked handling always fires regardless of this check.
  const lastNoNotationTuneIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (!mounted) return
    if (hasAnyNotation) return
    if (lastNoNotationTuneIdRef.current === (activeTune?.id ?? null)) return
    lastNoNotationTuneIdRef.current = activeTune?.id ?? null
    setViewMode('lyrics')
    if (wasMusicNotesBeforeRef.current) {
      toast('No staff or solfège notation available for this tune — showing Lyrics Only. Audio may still be available via Play.')
    }
  }, [activeTune, hasAnyNotation, mounted])

  // Persist (skip pre-mount window so we don't clobber storage with defaults)
  useEffect(() => {
    if (!mounted) return
    try { localStorage.setItem(STORAGE_MODE_KEY, viewMode) } catch { /* ignore */ }
  }, [viewMode, mounted])
  useEffect(() => {
    if (!mounted) return
    if (viewMode === 'lyrics') return
    try { localStorage.setItem(STORAGE_LAST_MUSIC_MODE_KEY, viewMode) } catch { /* ignore */ }
  }, [viewMode, mounted])
  useEffect(() => {
    if (!mounted) return
    try { localStorage.setItem(STORAGE_SIZE_KEY, String(baseSize)) } catch { /* ignore */ }
  }, [baseSize, mounted])
  useEffect(() => {
    if (!mounted) return
    try { localStorage.setItem(STORAGE_LYRICS_SIZE_KEY, String(lyricsBaseSize)) } catch { /* ignore */ }
  }, [lyricsBaseSize, mounted])

  // 04.9.4-03: Keep baseSizeRef in sync with state so the resize handler always
  // reads the latest value without re-binding listeners.
  useEffect(() => {
    baseSizeRef.current = baseSize
  }, [baseSize])
  // 04.9.15-02: Keep notationBaseSizeRef in sync — mirrors the baseSizeRef
  // pattern above, but for the notation-only viewport-resize heuristic.
  useEffect(() => {
    notationBaseSizeRef.current = notationBaseSize
  }, [notationBaseSize])

  // When switching to lyrics-only, auto-close the mini-bar and reset playback.
  // Split-leaf and solfege modes still use the abcjs synth, so the mini-bar stays.
  const prevViewModeRef = useRef<ViewMode>(viewMode)
  useEffect(() => {
    const prev = prevViewModeRef.current
    prevViewModeRef.current = viewMode
    if (prev === viewMode) return
    if (viewMode === 'lyrics') {
      setIsPlaying(false)
      setMiniBarVisible(false)
    }
  }, [viewMode])

  // 04.9.4-03: Proportional zoom heuristic.
  // On viewport width change (resize / orientation flip / visualViewport),
  // recompute notationBaseSize as clamp(current * newWidth / refWidth, 8, 40).
  // Debounced 150ms; ignores deltas < 8px to suppress mobile URL-bar churn.
  // 04.9.15-02: REPURPOSED from driving `baseSize` to driving `notationBaseSize`
  // — the lyric-only baseSize is no longer touched by viewport resize, only by
  // A+/A−. This keeps the inline-Staff notation rescaling on resize/orientation
  // change exactly as before, decoupled only from the A+/A− lyric control.
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Replace the SSR fallback (375) with the real viewport width post-hydration.
    referenceWidthRef.current = window.innerWidth

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const handler = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const newWidth = window.innerWidth
        const refWidth = referenceWidthRef.current
        if (refWidth <= 0) {
          referenceWidthRef.current = newWidth
          return
        }
        if (Math.abs(newWidth - refWidth) < 8) return
        const current = notationBaseSizeRef.current
        const computed = current * (newWidth / refWidth)
        const clamped = Math.max(8, Math.min(40, computed))
        const rounded = Math.round(clamped)
        referenceWidthRef.current = newWidth
        if (rounded !== current) {
          setNotationBaseSize(rounded)
        }
      }, 150)
    }
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    window.visualViewport?.addEventListener('resize', handler)
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
      window.visualViewport?.removeEventListener('resize', handler)
    }
  }, [])

  // Best-effort portrait lock — the singing view's landscape layout is
  // unusable (chromeless notation was never designed for it), so we try to
  // keep the device pinned to portrait. Works on some Android Chrome
  // versions; silently no-ops on iOS Safari, which doesn't expose the API.
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(screen.orientation as any)?.lock?.('portrait')?.catch?.(() => {})
    } catch { /* ignore */ }

    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(screen.orientation as any)?.unlock?.()
      } catch { /* ignore */ }
    }
  }, [])

  // iOS Safari never exposes screen.orientation.lock, so the lock above is a
  // no-op there. But landscape is only actually broken in a plain browser
  // tab — once "Added to Home Screen" as a standalone PWA, iOS renders the
  // singing view fine in landscape. Gate a blocking rotate-prompt overlay to
  // exactly that unsupported case: iOS + browser tab + phone-width landscape.
  // (iPad landscape is intentionally excluded — max-width below is narrower
  // than any iPad's landscape viewport.)
  const [blockLandscapeOnIOS, setBlockLandscapeOnIOS] = useState(false)
  useEffect(() => {
    setBlockLandscapeOnIOS(isIOSDevice() && !isStandaloneDisplayMode())
  }, [])
  const isPhoneLandscape = useMediaQuery('(orientation: landscape) and (max-width: 926px)')
  const showRotatePrompt = blockLandscapeOnIOS && isPhoneLandscape

  // Phones (not tablets) get the chrome bars hidden immediately on rotating
  // into a landscape that's actually supported (i.e. not blocked above),
  // rather than only via the scroll-driven hide below — landscape has too
  // little vertical room to spare on the bars regardless of scroll position.
  // They come back only on rotating back to portrait (see the merge into the
  // scroll-hide effect below), not via scroll-up — landscape has no "reveal"
  // gesture, by design.
  const [isPhone, setIsPhone] = useState(false)
  useEffect(() => {
    setIsPhone(isPhoneDevice())
  }, [])
  const isLandscapeOrientation = useMediaQuery('(orientation: landscape)')
  const phoneLandscapeChromeHide = isPhone && isLandscapeOrientation && !showRotatePrompt

  // MOBILE-10: SSR-safe touch-capability detection (mirrors isPhone above) —
  // read in a mount-only effect, never in the render body, so the first
  // client render matches SSR output (false) and no hydration mismatch
  // occurs. Combined with totalStanzas > 1 below (render-body derivation,
  // no window/navigator access there).
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  // 04.9.15-02: A+/A− now drives ONLY the lyric-only baseSize. It no longer
  // resets referenceWidthRef — that ref belongs exclusively to the
  // notationBaseSize resize heuristic above, and a lyric-only A+/A− press
  // must not perturb the notation scale's resize reference.
  const handleBaseSizeChange = useCallback((newSize: number) => {
    if (viewMode === 'lyrics') {
      setLyricsBaseSize(newSize)
    } else {
      setBaseSize(newSize)
    }
  }, [viewMode])

  // The size that actually applies to the current view — Lyrics Only reads/
  // writes its own bucket, everything else (solfège inline + both split-leaf
  // modes) shares `baseSize`. Inline Staff ignores this entirely (driven by
  // `notationBaseSize` instead — see computeNotationScale) so its A+/A−
  // controls are hidden rather than wired to either bucket.
  const activeBaseSize = viewMode === 'lyrics' ? lyricsBaseSize : baseSize

  // Sheet open state
  const [psalmSelectorOpen, setPsalmSelectorOpen] = useState(false)
  const [tuneSwitcherOpen, setTuneSwitcherOpen] = useState(false)
  // 260717-mwv checkpoint round 1 (items 2b/2c): when the user tries to open
  // Music Notes or Play with no active tune, we proactively open the tune
  // switcher instead of showing a dead-end message. This tracks WHY it was
  // opened so the post-selection effect below can route correctly: picking a
  // tune from the "Music Notes" path loads INLINE Staff; picking one from the
  // "Play" path stays in Lyrics Only and opens the Play panel.
  const [pendingTuneIntent, setPendingTuneIntent] = useState<'music-notes' | 'play' | null>(null)

  // 04.9.4-02 lifted state: audio + gear drawer + stanza indicator
  const [isPlaying, setIsPlaying] = useState(false)
  const [gearOpen, setGearOpen] = useState(false)
  const [miniBarMounted, setMiniBarMounted] = useState(false)
  const [miniBarVisible, setMiniBarVisible] = useState(false)
  // Task 3 (04.9.14-03): scroll-driven auto-hide, kept separate from the
  // user's manual visibility toggle (collapse button / play state) so a
  // manual collapse is NOT undone by scrolling up — see effective visibility
  // derivation below.
  const [miniBarAutoHidden, setMiniBarAutoHidden] = useState(false)
  // Task 4 (04.9.14-03): actual rendered height of PlayMiniBar, reported via
  // ResizeObserver — used to reserve exact bottom padding in the scrollable
  // notation region (0 when the bar isn't effectively visible).
  const [miniBarHeight, setMiniBarHeight] = useState(0)
  const [currentStanza, setCurrentStanza] = useState<number | null>(null)
  const [totalStanzas, setTotalStanzas] = useState<number | null>(null)
  const [stanzaPage, setStanzaPage] = useState<number>(1)
  const [tourKey, setTourKey] = useState<number>(0)

  // Task 3 (04.9.14-01): scroll-hide navigation state + ref. See the effect
  // below (after `abc` is derived) for the scroll-listener wiring.
  const mainRef = useRef<HTMLElement | null>(null)
  const [topBarHidden, setTopBarHidden] = useState(false)
  const [bottomBarHidden, setBottomBarHidden] = useState(false)

  const handleRestartTour = useCallback(() => {
    try {
      localStorage.removeItem('psalter_tour_v1')
      // Task 5 (04.9.14-01): tour version bumped to v2 (scroll-hide steps
      // added) — clear both keys so restart works regardless of which
      // version a given browser last completed.
      localStorage.removeItem('psalter_tour_v2')
      // 04.9.15.1-03: bumped v2 → v3 (swipe step added) — clear the current
      // key too, same precedent, so "Restart tour" keeps working.
      localStorage.removeItem('psalter_tour_v3')
    } catch {
      /* ignore */
    }
    setTourKey((k) => k + 1)
  }, [])

  const handleStanzaChange = useCallback((current: number, total: number) => {
    setCurrentStanza(current)
    setTotalStanzas(total)
    setStanzaPage(current)
  }, [])

  // Checkpoint round 3 (post-commit slide/fade stanza transition): tracks
  // WHICH direction the most recent handleStanzaNext/handleStanzaPrev call
  // was, so the animation effect below (keyed on stanzaPage) knows which way
  // to slide from. Set INSIDE the handler, read+cleared inside the effect —
  // deliberately NOT derived by diffing old/new stanzaPage in the effect
  // itself (avoids off-by-one edge cases at the first/last page, where the
  // clamped setStanzaPage updater may be a no-op and never actually change
  // stanzaPage). Left null (no animation) for any stanzaPage change that
  // did NOT originate from these two handlers — e.g. NotationRenderer's
  // onStanzaChange sync-back on tune switch, or its own auto-advance during
  // synth playback (both call setStanzaPage directly, bypassing these
  // handlers) — matching the requested scope (swipe + bottom-bar buttons
  // only, both of which route through these same two handlers).
  const stanzaAnimDirectionRef = useRef<'next' | 'prev' | null>(null)

  const handleStanzaPrev = useCallback(() => {
    stanzaAnimDirectionRef.current = 'prev'
    setStanzaPage((p) => Math.max(1, p - 1))
  }, [])
  const handleStanzaNext = useCallback(() => {
    stanzaAnimDirectionRef.current = 'next'
    setStanzaPage((p) => (totalStanzas ? Math.min(totalStanzas, p + 1) : p + 1))
  }, [totalStanzas])

  // Checkpoint round 3: brief (180ms) post-commit slide+fade on the
  // notation region when stanzaPage changes via the handlers above. Applied
  // via the Web Animations API to a STABLE wrapper (notationAnimRef) that
  // never unmounts/remounts the NotationRendererClient subtree — a
  // transform/opacity-only .animate() call never touches layout (no effect
  // on any clientHeight/offsetHeight measurement, including the compact-fit
  // height-fit-scale pass in AbcPlayer.tsx / the padding wrapper in
  // NotationRenderer.tsx), so it's safe to fire regardless of view mode or
  // orientation. `<main>` already has overflow-hidden, so the brief
  // horizontal offset never causes a page-level scroll/overflow.
  const notationAnimRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const direction = stanzaAnimDirectionRef.current
    stanzaAnimDirectionRef.current = null
    if (!direction) return
    const el = notationAnimRef.current
    if (!el || typeof el.animate !== 'function') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const offset = direction === 'next' ? 24 : -24
    el.animate(
      [
        { transform: `translateX(${offset}px)`, opacity: 0.4 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
      { duration: 180, easing: 'ease-out' },
    )
  }, [stanzaPage])

  // MOBILE-10: swipe left/right over the notation region pages stanza-sets,
  // reusing the SAME handlers already wired to GlassBottomBar's prev/next
  // buttons — no parallel pagination path. Touch-only (desktop mouse-only
  // never attaches); disabled entirely when there's only one stanza-set.
  const enableSwipe = isTouchDevice && (totalStanzas ?? 0) > 1
  useSwipeGesture(mainRef, {
    onSwipeLeft: handleStanzaNext,
    onSwipeRight: handleStanzaPrev,
    enabled: enableSwipe,
  })

  const handlePlayToggle = useCallback(() => {
    // Item 2c: no tune active at all — open the tune selector instead of
    // toggling a play state with nothing to play (audio needs a tune).
    if (!activeTune) {
      setPendingTuneIntent('play')
      setTuneSwitcherOpen(true)
      return
    }
    setIsPlaying((prev) => {
      const next = !prev
      if (next) {
        if (!miniBarMounted) {
          setMiniBarMounted(true)
          requestAnimationFrame(() => setMiniBarVisible(true))
        } else {
          setMiniBarVisible(true)
        }
      }
      return next
    })
  }, [miniBarMounted, activeTune])

  // Item 2b: opens the tune switcher when the user taps "Music Notes" with
  // no active tune (passed to GearPopover).
  const handleRequestTuneSelection = useCallback(() => {
    setPendingTuneIntent('music-notes')
    setTuneSwitcherOpen(true)
  }, [])

  // If the tune switcher closes WITHOUT a tune having been picked (activeTune
  // is still null at close time), drop any pending intent so a later,
  // unrelated tune change doesn't retroactively trigger the item 2b/2c
  // routing below.
  const handleTuneSwitcherOpenChange = useCallback((open: boolean) => {
    setTuneSwitcherOpen(open)
    if (!open && !activeTune) {
      setPendingTuneIntent(null)
    }
  }, [activeTune])

  // 2026-08-16 (Sing-view picker parity): the tune switcher is now
  // TunePickerDialog (the same /tunes-table modal /precent and the Study tab
  // use), which — unlike the old TuneSwitcherSheet — calls its `onClose` prop
  // synchronously right after `onSelect`, with no built-in delay. Without a
  // delay, `router.replace` hasn't landed yet, so `activeTune` in THIS
  // closure is still stale/null when onClose's check above runs — it would
  // wrongly treat a successful pick as "closed without picking" and clear
  // pendingTuneIntent before the activeTune-watching effect (below) gets a
  // chance to resolve it. tuneJustSelectedRef distinguishes the two cases
  // instead of relying on activeTune's (still-stale) value at close time.
  const tuneJustSelectedRef = useRef(false)
  const handleTuneSelect = useCallback((tune: AlternateTune & TuneRow) => {
    tuneJustSelectedRef.current = true
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.set('tune', String(tune.id))
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])
  const handleTunePickerClose = useCallback(() => {
    if (tuneJustSelectedRef.current) {
      tuneJustSelectedRef.current = false
      setTuneSwitcherOpen(false)
      return
    }
    handleTuneSwitcherOpenChange(false)
  }, [handleTuneSwitcherOpenChange])

  // Resolves pendingTuneIntent once a real tune becomes active (i.e. the user
  // picked one from the tune switcher opened by handleRequestTuneSelection /
  // handlePlayToggle above). Keyed off activeTune?.id actually CHANGING (not
  // merely re-rendering) via a ref, since activeTune is re-derived every
  // render from searchParams.
  const prevActiveTuneIdRef = useRef<number | null>(activeTune?.id ?? null)
  useEffect(() => {
    const prevId = prevActiveTuneIdRef.current
    const currentId = activeTune?.id ?? null
    prevActiveTuneIdRef.current = currentId
    if (prevId === currentId) return
    if (!pendingTuneIntent) return
    if (currentId == null) return // still no tune — nothing to resolve yet
    if (pendingTuneIntent === 'music-notes') {
      // Checkpoint round 2 (item 2, REVERSAL of round-1 item 2b): do NOT
      // silently commit to inline Staff. Set Music Notes as the active
      // category (so the popover shows it selected) and hand control back
      // to the Gear popover — re-open it so the user explicitly picks
      // Staff/Solfège and Inline/Split-Leaf themselves.
      setViewMode('staff')
      setGearOpen(true)
    } else if (pendingTuneIntent === 'play') {
      // Item 2c: stay in Lyrics Only, but open the Play panel immediately.
      if (!miniBarMounted) {
        setMiniBarMounted(true)
        requestAnimationFrame(() => setMiniBarVisible(true))
      } else {
        setMiniBarVisible(true)
      }
      setIsPlaying(true)
    }
    setPendingTuneIntent(null)
  }, [activeTune, pendingTuneIntent, miniBarMounted])

  const handlePlayingChange = useCallback((p: boolean) => {
    setIsPlaying(p)
    if (p && !miniBarMounted) {
      setMiniBarMounted(true)
      requestAnimationFrame(() => setMiniBarVisible(true))
    } else if (p) {
      setMiniBarVisible(true)
    }
  }, [miniBarMounted])

  // TSEL-01/D-13: one flat, tier-sorted list. The active tune is included so it can sort into its real tier
  // (Backup/Historical/Other) with an isCurrent highlight, instead of being hoisted into its own section.
  const switcherTunes = useMemo<TuneOption[]>(() => {
    const list = [...alternateTunes]
    // A precenting override can assign a tune outside the psalm's meter, so it may be absent from the
    // meter-filtered alternates. Make sure the active tune is always selectable.
    if (activeTune && !list.some((t) => t.id === activeTune.id)) list.push(activeTune)
    return list
  }, [activeTune, alternateTunes])

  // ABC sources
  const abc = activeTune?.abcNotation ?? ''
  const scoreJpgUrl = activeTune?.scoreJpgUrl ?? null
  const solfegeJpgUrl = activeTune?.solfegeJpgUrl ?? null
  const tuneName = activeTune?.name ?? ''
  const youtubeUrl = activeTune?.youtubeUrl ?? null
  const soundcloudUrl = activeTune?.soundcloudUrl ?? null

  // Task 3 (04.9.14-03): final visibility passed to PlayMiniBar combines the
  // manual toggle (collapse button / play state) with scroll-driven
  // auto-hide. A manual collapse (miniBarVisible=false) is NOT restored by
  // scrolling up — only the auto-hide layer reacts to scroll.
  const effectiveMiniBarVisible = miniBarVisible && !miniBarAutoHidden

  // Task 3 (04.9.14-01, hardened in quick task 260712-kd1): scroll-hide
  // navigation. Top bar hides past 40px of scroll (while scrolling down),
  // bottom bar past 100px. Both reappear immediately on any upward scroll.
  // The actual scrollable region is the NotationRenderer chromeless viewarea
  // (`[data-notation-viewarea]`) in non-split modes, OR one of the two
  // independent split-leaf inner scroll regions — the page itself never
  // scrolls at the window level (fixed-height flex layout), so
  // `window.scrollY` never fires here.
  //
  // 260712-kd1 fix: attach a single CAPTURE-phase listener directly on
  // `mainRef` instead of querySelector-ing a single target. Capture phase
  // catches `scroll` events bubbling (in capture terms, trickling down then
  // triggered) from ANY descendant scroll container — the non-split
  // `[data-notation-viewarea]` AND both split-leaf inner `overflow-y-auto`
  // regions — which is why the previous single-target listener never fired
  // in split-leaf modes. A WeakMap tracks last scrollTop per scrolling
  // element since split-leaf has two independent regions; a single scalar
  // would corrupt direction detection when the user alternates between them.
  //
  // Checkpoint round 1 (items 3c/4 + follow-up clarification): two additional
  // fixes layered onto the above:
  //   - 3c root cause: this effect used to gate on `if (!abc) return`, so it
  //     NEVER attached at all for a tune with no ABC (Ps 45b, or no tune at
  //     all) — scroll-hide silently did nothing regardless of content height.
  //     Now keyed off `[activeTune?.id, viewMode]` instead, so it (re)attaches
  //     for every real state transition, abc or not.
  //   - Item 4 (content-fits-viewport gating): when the active scrollable
  //     region's content actually FITS inside its own viewport slot
  //     (scrollHeight <= clientHeight, small tolerance for sub-pixel
  //     rounding), scrolling is disabled entirely for that region (forced
  //     `overflow-y: hidden`) and the hide-on-scroll behavior never activates
  //     — there's nothing to scroll against. This is deliberately MOBILE-ONLY
  //     (matches the rest of this feature's scope — desktop never hides bars).
  //     Forcing overflow:auto unconditionally in the "barely fits" case was
  //     the root cause of the "last lines unreachable" bug: a sliver of
  //     accidental scroll range (from bottom padding reserved for the bars)
  //     had hide/show math that broke right at that boundary. Disabling
  //     scroll entirely when content fits sidesteps the boundary case rather
  //     than trying to patch its arithmetic.
  useEffect(() => {
    // CR-03 fix: reset the scroll-hide flags whenever this effect (re)attaches
    // — e.g. on a tune switch or view-mode change, which detaches/reattaches
    // the listener on a fresh scroll container. Without this, hidden chrome
    // from the previous state's scroll position could stay hidden after
    // switching, since the container starts at scrollTop 0 and may never
    // produce the upward-scroll delta needed to reveal it again.
    setTopBarHidden(false)
    setBottomBarHidden(false)
    setMiniBarAutoHidden(false)

    // Phone landscape: force chrome hidden immediately, overriding the reset
    // above. All guards below additionally check this flag so nothing else
    // in this effect (the fits-viewport gate, the mql-crossing handler) can
    // flip it back to visible while still in landscape — it only clears on
    // the next run of this effect, when phoneLandscapeChromeHide itself
    // flips false (rotated back to portrait).
    if (phoneLandscapeChromeHide) {
      setTopBarHidden(true)
      setBottomBarHidden(true)
      setMiniBarAutoHidden(true)
    }

    const main = mainRef.current
    if (!main) return

    // Quick task 260712-sny (bug b fix): scroll-hide must only apply below
    // the `md` 768px breakpoint. Desktop has ample vertical room and hiding
    // chrome there is jarring — gate the handler so it's a no-op above 767px,
    // and force-reset all hidden flags if the viewport crosses into desktop
    // while scrolled down (resize / orientation flip while hidden).
    const mql = window.matchMedia('(max-width: 767px)')
    const SCROLL_FIT_TOLERANCE = 2

    // Split-leaf has two INDEPENDENT scroll regions (notation half, lyrics
    // half); non-split modes (Lyrics Only, inline Staff/Solfège) share one.
    // The non-split outer wrapper (`data-notation-viewarea`) is intentionally
    // excluded in split mode — it's already `overflow-hidden` there by design
    // (its two children scroll independently), so measuring ITS scrollHeight
    // would spuriously read as "needs scroll" and defeat the fits-viewport
    // gate below. `data-lyrics-scroll` (not `data-lyrics-slot`) is used for
    // the lyrics half specifically because `data-lyrics-slot` is only a
    // structural wrapper that always matches its child's height via `h-full`
    // — the REAL scroll container is the inner StanzaList wrapper div, which
    // is what needs measuring (found empirically via Playwright: the outer
    // wrapper's scrollHeight always equalled its clientHeight regardless of
    // actual lyrics length, defeating the fits-viewport check entirely).
    const isSplitViewMode = viewMode === 'staff-split' || viewMode === 'solfege-split'
    const selector = isSplitViewMode
      ? '[data-notation-slot], [data-lyrics-scroll]'
      : '[data-notation-viewarea]'

    const observedEls = new Set<HTMLElement>()

    function applyScrollGate() {
      const candidates = main!.querySelectorAll<HTMLElement>(selector)
      let anyNeedsScroll = false
      candidates.forEach((el) => {
        if (!observedEls.has(el)) {
          observedEls.add(el)
          ro.observe(el)
        }
        // Checkpoint round 2 (item B): `el`'s OWN border-box is fixed by the
        // surrounding flex layout, so it never itself resizes when its
        // CONTENT grows/shrinks asynchronously (e.g. abcjs finishing an SVG
        // render after mount, or a scanned JPEG's intrinsic size arriving
        // after `onload`) — only `el.scrollHeight` changes, which
        // ResizeObserver does not track on `el` itself. Observing the first
        // child (the actual, naturally-sized content wrapper: AbcPlayer's
        // wrapper div for Staff, the image/StanzaList wrapper for split-leaf)
        // means THIS callback re-fires the moment that async content settles,
        // instead of only ever measuring the pre-render snapshot.
        const child = el.firstElementChild
        if (child instanceof HTMLElement && !observedEls.has(child)) {
          observedEls.add(child)
          ro.observe(child)
        }
        if (!mql.matches) {
          // Desktop: never touch overflow — this mobile-only feature simply
          // doesn't apply; leave the existing CSS classes in control.
          el.style.overflowY = ''
          return
        }
        const fits = el.scrollHeight <= el.clientHeight + SCROLL_FIT_TOLERANCE
        el.style.overflowY = fits ? 'hidden' : ''
        if (!fits) anyNeedsScroll = true
      })
      if (!anyNeedsScroll && !phoneLandscapeChromeHide) {
        setTopBarHidden(false)
        setBottomBarHidden(false)
        setMiniBarAutoHidden(false)
      }
    }

    const ro = new ResizeObserver(() => applyScrollGate())
    ro.observe(main)
    applyScrollGate()
    // Defensive re-checks: abcjs's SVG render and image `onload` sizing can
    // settle on a timer that occasionally lands between ResizeObserver
    // callback batches (e.g. a font swap reflowing text width without a
    // height change at the observed node). A couple of delayed re-runs catch
    // anything the observer-driven path alone might miss.
    const settleTimers = [300, 800, 1500].map((ms) => setTimeout(applyScrollGate, ms))

    const lastByEl = new WeakMap<EventTarget, number>()
    const handleScroll = (e: Event) => {
      // Landscape has no scroll-driven reveal — bars stay hidden until the
      // device rotates back to portrait (see phoneLandscapeChromeHide above).
      if (phoneLandscapeChromeHide) return
      if (!mql.matches) return
      const el = e.target as HTMLElement | null
      if (!el || typeof el.scrollTop !== 'number') return
      const maxTop = Math.max(0, el.scrollHeight - el.clientHeight)
      // Item 4: a region whose content fits has its overflow forced to
      // 'hidden' above so this shouldn't fire in practice — defensive only.
      if (maxTop <= SCROLL_FIT_TOLERANCE) return
      // iOS Safari rubber-band overscroll reports scrollTop OUTSIDE the natural
      // [0, maxTop] range and oscillates rapidly at the boundary. Clamp to the
      // valid range so bounce frames collapse to a constant boundary value
      // (delta ~0) instead of registering as real up/down movement.
      const scrollTop = Math.min(Math.max(el.scrollTop, 0), maxTop)
      const last = lastByEl.get(el) ?? 0
      const delta = scrollTop - last
      // Ignore sub-threshold jitter (bounce settle / tiny finger tremor). Normal
      // scrolling easily exceeds 4px; slow real scrolls still accumulate because
      // we do NOT advance `last` until the threshold is crossed.
      if (Math.abs(delta) < 4) return
      const scrollingDown = delta > 0
      setTopBarHidden(scrollTop > 40 && scrollingDown)
      setBottomBarHidden(scrollTop > 100 && scrollingDown)
      // Task 3 (04.9.14-03): PlayMiniBar auto-hides on scroll down (same
      // 100px threshold as the bottom bar, since it sits directly above
      // it) and reappears on any upward scroll — independent of the
      // manual collapse state (see `effectiveMiniBarVisible`).
      setMiniBarAutoHidden(scrollTop > 100 && scrollingDown)
      lastByEl.set(el, scrollTop)
    }

    const handleMql = () => {
      applyScrollGate()
      if (!mql.matches && !phoneLandscapeChromeHide) {
        setTopBarHidden(false); setBottomBarHidden(false); setMiniBarAutoHidden(false)
      }
    }
    mql.addEventListener('change', handleMql)

    main.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => {
      main.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions)
      mql.removeEventListener('change', handleMql)
      ro.disconnect()
      settleTimers.forEach(clearTimeout)
      observedEls.forEach((el) => { el.style.overflowY = '' })
    }
  }, [activeTune?.id, viewMode, phoneLandscapeChromeHide])

  // Quick task 260712-kd1 (bug b fix): drive the shared chrome-hidden store
  // from the top-bar hidden flag so the root-layout SiteHeader hides together
  // with the singing view's own top bar. The tune-switch reset above already
  // sets topBarHidden(false), which propagates here on the next commit — no
  // extra call needed there.
  useEffect(() => {
    setChromeHidden(topBarHidden)
  }, [topBarHidden])

  // Always restore the global header on unmount (e.g. navigating away from
  // the singing view while scrolled down/hidden) so it never gets stuck
  // hidden on a non-singing page.
  useEffect(() => {
    return () => setChromeHidden(false)
  }, [])

  // Checkpoint round 4 (item 5, real root cause): the singing view is meant
  // to be a fixed, app-shell-style experience with its own internal bottom
  // bar — never page-scrollable. Found via Playwright that
  // document.documentElement.scrollTop moved on a wheel scroll even after
  // every data-notation-viewarea/slot-level content-fit check reported no
  // overflow, and even after <main data-notation-region> itself got
  // overflow-hidden. Root cause: the ROOT LAYOUT unconditionally renders
  // <SiteFooter> as a SIBLING immediately after <main>{children}</main> —
  // its height still contributes to the total document height regardless of
  // this page's own fixed-height design, so the window/html itself remained
  // scrollable to reveal it. Locking documentElement's overflow while this
  // component is mounted is the correct, targeted fix — restored on
  // unmount so every other (normally page-scrolling) route is unaffected.
  useEffect(() => {
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevOverflow
    }
  }, [])

  // iOS Safari URL-bar shrink: SingingView's locked-to-staff layout (overflow:
  // hidden on html, fixed-height <main>, nested overflow-y-auto on the
  // notation viewarea) means the document body never receives a scroll event,
  // so iOS refuses to shrink its bottom URL bar. A single 1px scrollTo on the
  // user's first touch promotes the page to iOS's "scrolling document" state
  // so subsequent scrolls (even inside nested containers) trigger the bar
  // shrink. The onceRef ensures we only do this once per mount — repeated
  // calls would cause visible micro-jitter. Pairs with the
  // `overscroll-behavior-y: contain` baseline in globals.css.
  //
  // The sibling effect above locks documentElement.style.overflow = 'hidden',
  // which would normally swallow the first-touch scrollTo (no scrollable
  // document → iOS doesn't see a scroll target). Briefly unset overflow for
  // one paint frame so iOS observes a real scroll, then re-lock. The blink
  // is invisible (~16ms) and the lock is restored on the very next frame.
  const onceRef = useRef(false)
  useEffect(() => {
    const handler = () => {
      if (onceRef.current) return
      onceRef.current = true
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('pointerdown', handler)
      // Unlock documentElement for one paint so iOS sees a scroll target
      document.documentElement.style.overflow = ''
      requestAnimationFrame(() => {
        window.scrollTo(0, 0)
        requestAnimationFrame(() => {
          document.documentElement.style.overflow = 'hidden'
        })
      })
    }
    window.addEventListener('touchstart', handler, { passive: true, once: false })
    window.addEventListener('pointerdown', handler, { passive: true, once: false })
    return () => {
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('pointerdown', handler)
    }
  }, [])

  return (
    <div data-singing-view className="relative">
      {showRotatePrompt && (
        // Layered on top rather than replacing the tree below — swapping out
        // <main ref={mainRef}> here would unmount/remount it on every
        // rotation, silently detaching the scroll-hide listener effect below
        // (keyed on [activeTune?.id, viewMode], not on this overlay).
        <div
          role="alert"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background px-8 text-center"
        >
          <RotateCcw className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-base font-medium">Please rotate your device to portrait</p>
          <p className="text-sm text-muted-foreground">
            Landscape isn&apos;t supported here yet. Tip: adding this site to your Home Screen lets it work in landscape too.
          </p>
        </div>
      )}
      <PsalmTopBarClient
        prev={prevSlug}
        next={nextSlug}
        currentSlug={currentSlug}
        psalmId={psalm.id}
        versePartLabel={versePartLabel}
        tuneName={tuneName || null}
        onOpenPsalmSelector={() => setPsalmSelectorOpen(true)}
        onOpenTuneSwitcher={() => setTuneSwitcherOpen(true)}
        precentingPrevHref={precentingPrevHref}
        precentingNextHref={precentingNextHref}
        precentingVerseRange={precentingVerseRange}
        versionSiblings={versionSiblings}
        hidden={topBarHidden}
      />

      {/* Body — single scroll container, hard horizontal clamp.
         IMPORTANT: this wrapper deliberately has NO horizontal padding.
         AbcPlayer's outer wrapper (Plan 01 hardening) is the padded element
         (`px-2` → 8px L+R) and its staffwidth derivation subtracts 16px to
         account for that. Adding `px-N` here would double-pad and force
         horizontal clipping. The `overflow-x-hidden` is defensive only. */}
      {/*
         104 = 56 SiteHeader + 48 topbar (mobile).
         116 = 56 SiteHeader + 60 topbar (≥md).
         260723-cpt: both the height calc and the hide-margin also subtract
         env(safe-area-inset-top), so the layout accounts for the iOS
         standalone/notch safe area (SiteHeader now reserves that inset as
         top padding — see SiteHeader.tsx). This collapses to the exact old
         104/116/-104 math whenever the inset is 0 (any browser tab, and
         iPhone landscape — the notch becomes inset-left/right there, not
         inset-top), so there is zero visual change outside standalone
         portrait mode.
         Glass bottom bar is fixed (z-40), accounted via pb-14/pb-15.
         overflow-y is controlled by NotationRenderer's chromeless wrapper —
         BUT 260717-mwv round 4 (item 5) found this assumption breaks
         whenever the wrapper's measured height doesn't PERFECTLY match its
         content (any small mismatch, or the dynamic PlayMiniBar spacer div
         also inside <main>, tipping the total over): without its own
         overflow constraint, <main> let that excess silently spill into the
         page, growing <body> taller than the viewport and making the WHOLE
         PAGE scrollable at the window/html level — invisible to every
         data-notation-viewarea/slot-level content-fit check, since none of
         those measure <main> itself. overflow-hidden here is a hard outer
         backstop: <main> now NEVER leaks overflow into the page regardless
         of any inner measurement being slightly off.
      */}
      <main
        ref={mainRef}
        data-notation-region
        data-tour-target="scroll-area"
        aria-label={enableSwipe ? 'Swipe left or right for previous or next stanza group' : undefined}
        className="overflow-hidden flex flex-col h-[calc(100dvh_-_104px_-_env(safe-area-inset-top))] md:h-[calc(100dvh_-_116px_-_env(safe-area-inset-top))] pb-11 md:pb-13 transition-[height,margin-top,padding-bottom] duration-200 ease-out motion-reduce:transition-none"
        style={{
          height: topBarHidden ? '100dvh' : undefined,
          marginTop: topBarHidden ? 'calc(-104px - env(safe-area-inset-top))' : undefined,
          paddingBottom: bottomBarHidden ? '0px' : undefined,
        }}
      >
        {/* Item 2a (260717-mwv checkpoint round 1): lyrics come from the psalm
           VERSION (lyrics/lyricsStructured), not the tune — so real Lyrics
           Only content renders identically whether or not a tune is active.
           Rendering unconditionally means a psalm-version with no active tune
           at all gets the exact same Lyrics Only render path (no special
           casing) as any other Lyrics Only view; viewMode is kept at 'lyrics'
           until a tune is chosen (see the hasAnyNotation-gated effects above
           and GearPopover's tune-selection-request flow). */}
        <div ref={notationAnimRef} className="flex-1 min-h-0 flex flex-col">
          <NotationRendererClient
            {...buildNotationRendererProps(
              activeTune
                ? {
                    abcNotation: activeTune.abcNotation ?? null,
                    abcSatb: activeTune.abcSatb ?? null,
                    name: activeTune.name ?? null,
                    // TUNE-02 fix (commit 9a23059): this is the ACTIVE TUNE's meter, never the psalm's `meter`
                    // prop — otherwise isMeterMismatch() compares the psalm meter against itself and the
                    // mismatch banner can never fire. The shared helper is what stops this fix from drifting
                    // out of the other call sites again.
                    meter: activeTune.meter ?? null,
                    phraseShapeOverride: activeTune.phraseShapeOverride ?? null,
                    doubleLength: activeTune.doubleLength ?? false,
                    solfegeOcrText: activeTune.solfegeOcrText ?? null,
                    scoreJpgUrl: scoreJpgUrl,
                    solfegeJpgUrl: solfegeJpgUrl,
                  }
                : null,
              { lyrics, stanzaMeter, lyricsStructured },
              { showLyrics, onViewModeChange: setViewMode, fallbackTuneName: '' },
            )}
            // SingingView deliberately renders the RAW abcNotation rather than the helper's
            // pickAbcWithMarkers/sopranoOnly pick. Changing that is a notation-behaviour change and is out of
            // Phase 11's locked scope (D-02/D-03 cover prop plumbing only), so the override is explicit here.
            abc={abc}
            melismaPositions={activeTune?.melismaPositions ?? null}
            viewMode={viewMode}
            baseSize={activeBaseSize}
            onBaseSizeChange={handleBaseSizeChange}
            notationBaseSize={notationBaseSize}
            chromeless={true}
            onStanzaChange={handleStanzaChange}
            stanzaPage={stanzaPage}
            onStanzaPageChange={setStanzaPage}
            youtubeUrl={youtubeUrl}
            soundcloudUrl={soundcloudUrl}
            staffPages={activeStaffPages}
            solfegePages={activeSolfegePages}
            staffInlineApproved={staffInlineApproved}
          />
        </div>
        {/* Task 4 (04.9.14-03): dynamic spacer reserving exact room for
           PlayMiniBar (on top of the pb-11/md:pb-13 already reserved for
           GlassBottomBar), so content never sits hidden behind the two
           stacked fixed bars. Height comes from PlayMiniBar's own
           ResizeObserver report (0 when collapsed/auto-hidden). */}
        <div
          aria-hidden
          style={{ height: effectiveMiniBarVisible ? miniBarHeight : 0 }}
          className="shrink-0 transition-[height] duration-200 ease-out"
        />
      </main>

      <PsalmPickerModalClient
        open={psalmSelectorOpen}
        onClose={() => setPsalmSelectorOpen(false)}
        psalms={psalmListRows}
      />
      {/* 2026-08-16 (Sing-view picker parity, user sign-off): the tune switcher
          is now the SAME modal /precent and the Study tab use — TunePickerDialog
          in Mode A (full /tunes TuneTable: search, Advanced Filters, Recommended/
          Backup/Historical/Other tiering) — replacing the old TuneSwitcherSheet
          bottom-sheet list. useTable implies hideExport internally. */}
      <TunePickerDialog
        useTable
        open={tuneSwitcherOpen}
        onClose={handleTunePickerClose}
        tunes={switcherTunes}
        currentTuneId={activeTune?.id ?? null}
        tuneTiers={tuneTiers}
        psalmMeter={meter}
        psalmId={psalm.id}
        totalTuneCount={totalTuneCount}
        onSelect={handleTuneSelect}
      />

      <GlassBottomBar
        baseSize={activeBaseSize}
        onBaseSizeChange={handleBaseSizeChange}
        hideSizeControls={viewMode === 'staff'}
        currentStanza={viewMode === 'staff' ? currentStanza : null}
        totalStanzas={viewMode === 'staff' ? totalStanzas : null}
        onStanzaPrev={handleStanzaPrev}
        onStanzaNext={handleStanzaNext}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        onGearOpen={() => setGearOpen(true)}
        hidden={bottomBarHidden}
        gear={
          <GearPopoverClient
            open={gearOpen}
            onOpenChange={setGearOpen}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            studyHref={studyHref}
            onRestartTour={handleRestartTour}
            showLyricsOption={!!showLyrics}
            staffAvailable={staffAvailable}
            // Inline Solfège rendering is not built yet (abcjs has no tonic
            // sol-fa) — permanently disabled until real rendering exists.
            solfegeInlineAvailable={false}
            solfegeSplitAvailable={solfegeSplitAvailable}
            staffInlineApproved={staffInlineApproved}
            hasActiveTune={!!activeTune}
            onRequestTuneSelection={handleRequestTuneSelection}
          />
        }
      />
      {(abc || soundcloudUrl) && (
        <PlayMiniBarClient
          abc={abc}
          mounted={miniBarMounted}
          visible={effectiveMiniBarVisible}
          onCollapse={() => setMiniBarVisible(false)}
          isPlaying={isPlaying}
          onPlayingChange={handlePlayingChange}
          soundcloudUrl={soundcloudUrl}
          tuneName={tuneName}
          onHeightChange={setMiniBarHeight}
          variant="inline"
        />
      )}
      {/* GearDrawer removed — settings now via GearPopover rendered in GlassBottomBar gear slot */}
      {/* MOBILE-10: dot indicator replaces GlassBottomBar's (now-invisible)
         stanza display exactly when the bar auto-hides in phone landscape —
         the two are mutually exclusive by construction. */}
      {phoneLandscapeChromeHide && (totalStanzas ?? 0) > 1 && (
        <StanzaDotIndicator current={currentStanza ?? 1} total={totalStanzas as number} />
      )}
      <OnboardingTourClient key={tourKey} totalStanzas={totalStanzas} />
    </div>
  )
}
