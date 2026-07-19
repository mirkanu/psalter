'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { NotationRendererClient } from '@/components/notation/NotationRendererClient'
import { PsalmTopBar } from './PsalmTopBar'
import { GlassBottomBar } from './GlassBottomBar'
import { PlayMiniBar } from './PlayMiniBar'
import { GearPopover } from './GearPopover'
import { OnboardingTour } from './OnboardingTour'
import { PsalmSelectorSheet } from './PsalmSelectorSheet'
import { TuneSwitcherSheet } from './TuneSwitcherSheet'
import type { TuneOption, TuneSwitcherSections } from './types'
import type { PsalmDetail } from '@/db/queries/psalms'
import type { PsalmRow } from '@/components/PsalmListingGrid'
import type { ViewMode } from '@/components/notation/NotationRenderer'
import { setChromeHidden } from '@/lib/chrome-hidden-store'
import { resolveStaffInlineApproved, shouldFallbackToSplit } from '@/lib/inline-staff-gating'
import { toast } from 'sonner'

const STORAGE_MODE_KEY = 'psalter-score-mode'
const STORAGE_SIZE_KEY = 'psalter-staff-size'

interface Props {
  psalm: PsalmDetail
  currentSlug: string
  prevSlug: string | null
  nextSlug: string | null
  primaryTune: TuneOption | null
  alternateTunes: TuneOption[]
  editoriallyLinkedTuneIds: number[]
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

function readStoredBaseSize(): number {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_SIZE_KEY) : null
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
  const [baseSize, setBaseSize] = useState<number>(14)
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

  // Hydrate from localStorage AFTER first paint to avoid SSR mismatch — this
  // component itself is server-rendered (the notation child is dynamic ssr:false).
  // Runs ONCE on mount; we don't want re-hydration to clobber the user's
  // in-memory viewMode when showLyrics flips. (WR-01)
  useEffect(() => {
    // Bug 3 (260717-mwv): never restore a stored Staff/Split preference for a
    // tune with no notation at all — the forced-Lyrics-Only effect below
    // would immediately override it anyway, but this avoids a flash of a
    // broken Split-Leaf view before that effect fires.
    setViewMode(hasAnyNotation ? readStoredViewMode(showLyrics) : 'lyrics')
    setBaseSize(readStoredBaseSize())
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  // checkpoint round 2 (item 3, REVERSAL) restored it — the automatic switch
  // to Lyrics Only needs its own explanation on load too, in addition to (not
  // instead of) the tap-triggered message in GearPopover's musicNotesBlocked
  // handling. Both triggers now show the same message.
  const lastNoNotationTuneIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (!mounted) return
    if (hasAnyNotation) return
    if (lastNoNotationTuneIdRef.current === (activeTune?.id ?? null)) return
    lastNoNotationTuneIdRef.current = activeTune?.id ?? null
    setViewMode('lyrics')
    toast('No staff or solfège notation available for this tune — showing Lyrics Only. Audio may still be available via Play.')
  }, [activeTune, hasAnyNotation, mounted])

  // Persist (skip pre-mount window so we don't clobber storage with defaults)
  useEffect(() => {
    if (!mounted) return
    try { localStorage.setItem(STORAGE_MODE_KEY, viewMode) } catch { /* ignore */ }
  }, [viewMode, mounted])
  useEffect(() => {
    if (!mounted) return
    try { localStorage.setItem(STORAGE_SIZE_KEY, String(baseSize)) } catch { /* ignore */ }
  }, [baseSize, mounted])

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

  // 04.9.15-02: A+/A− now drives ONLY the lyric-only baseSize. It no longer
  // resets referenceWidthRef — that ref belongs exclusively to the
  // notationBaseSize resize heuristic above, and a lyric-only A+/A− press
  // must not perturb the notation scale's resize reference.
  const handleBaseSizeChange = useCallback((newSize: number) => {
    setBaseSize(newSize)
  }, [])

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

  const handleStanzaPrev = useCallback(() => {
    setStanzaPage((p) => Math.max(1, p - 1))
  }, [])
  const handleStanzaNext = useCallback(() => {
    setStanzaPage((p) => (totalStanzas ? Math.min(totalStanzas, p + 1) : p + 1))
  }, [totalStanzas])

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
  // is still null at close time — TuneSwitcherSheet delays onOpenChange(false)
  // by 120ms after a real selection specifically so the router update lands
  // first), drop any pending intent so a later, unrelated tune change doesn't
  // retroactively trigger the item 2b/2c routing below.
  const handleTuneSwitcherOpenChange = useCallback((open: boolean) => {
    setTuneSwitcherOpen(open)
    if (!open && !activeTune) {
      setPendingTuneIntent(null)
    }
  }, [activeTune])

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

  // Compute TuneSwitcherSections
  const tuneSections = useMemo<TuneSwitcherSections>(() => {
    const editorialSet = new Set(editoriallyLinkedTuneIds)
    const recommended: TuneOption[] = []
    const other: TuneOption[] = []
    for (const t of alternateTunes) {
      if (activeTune && t.id === activeTune.id) continue
      if (editorialSet.has(t.id)) recommended.push(t)
      else other.push(t)
    }
    recommended.sort((a, b) => a.name.localeCompare(b.name))
    other.sort((a, b) => a.name.localeCompare(b.name))
    return {
      current: activeTune,
      recommended,
      other,
    }
  }, [activeTune, alternateTunes, editoriallyLinkedTuneIds])

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
      if (!anyNeedsScroll) {
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
      if (!mql.matches) {
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
  }, [activeTune?.id, viewMode])

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

  return (
    <div data-singing-view className="relative">
      <PsalmTopBar
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
         Glass bottom bar is fixed (z-40), accounted via pb-14/pb-15.
         overflow-y is controlled by NotationRenderer's chromeless wrapper.
      */}
      <main
        ref={mainRef}
        data-notation-region
        data-tour-target="scroll-area"
        className="overflow-x-hidden flex flex-col h-[calc(100dvh-104px)] md:h-[calc(100dvh-116px)] pb-11 md:pb-13 transition-[height,margin-top,padding-bottom] duration-200 ease-out motion-reduce:transition-none"
        style={{
          height: topBarHidden ? '100dvh' : undefined,
          marginTop: topBarHidden ? '-104px' : undefined,
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
        <NotationRendererClient
          abc={abc}
          lyrics={lyrics}
          scoreJpgUrl={scoreJpgUrl}
          solfegeJpgUrl={solfegeJpgUrl}
          tuneName={tuneName}
          tuneMeter={meter}
          phraseShapeOverride={activeTune?.phraseShapeOverride ?? null}
          stanzaMeter={stanzaMeter}
          lyricsStructured={lyricsStructured}
          doubleLength={activeTune?.doubleLength ?? false}
          solfegeOcrText={activeTune?.solfegeOcrText ?? null}
          melismaPositions={activeTune?.melismaPositions ?? null}
          showLyrics={showLyrics}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          baseSize={baseSize}
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

      <PsalmSelectorSheet
        open={psalmSelectorOpen}
        onOpenChange={setPsalmSelectorOpen}
        psalms={psalmListRows}
      />
      <TuneSwitcherSheet
        open={tuneSwitcherOpen}
        onOpenChange={handleTuneSwitcherOpenChange}
        sections={tuneSections}
        meterLabel={meter}
      />

      <GlassBottomBar
        baseSize={baseSize}
        onBaseSizeChange={handleBaseSizeChange}
        currentStanza={viewMode === 'staff' ? currentStanza : null}
        totalStanzas={viewMode === 'staff' ? totalStanzas : null}
        onStanzaPrev={handleStanzaPrev}
        onStanzaNext={handleStanzaNext}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        onGearOpen={() => setGearOpen(true)}
        hidden={bottomBarHidden}
        gear={
          <GearPopover
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
        <PlayMiniBar
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
      <OnboardingTour key={tourKey} viewMode={viewMode} />
    </div>
  )
}
