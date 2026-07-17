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
    setViewMode(readStoredViewMode(showLyrics))
    setBaseSize(readStoredBaseSize())
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fallback: if showLyrics flips off while user is in 'lyrics' mode, drop to staff.
  useEffect(() => {
    if (mounted && !showLyrics && viewMode === 'lyrics') setViewMode('staff')
  }, [showLyrics, viewMode, mounted])

  // Plan 04.9.15-04 (MOBILE-08): if navigation (next/prev psalm, tune switch,
  // or a stale localStorage restore) lands the user in inline Staff on a
  // non-approved tune, fall back to Split-Leaf and surface the locked toast.
  // Guarded by a ref keyed to the active tune id so the toast fires once per
  // transition into this state, not on every render while it persists.
  const lastFallbackTuneIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (!mounted) return
    if (!shouldFallbackToSplit({ viewMode, staffInlineApproved })) return
    if (lastFallbackTuneIdRef.current === (activeTune?.id ?? null)) return
    lastFallbackTuneIdRef.current = activeTune?.id ?? null
    setViewMode('staff-split')
    toast('Inline Staff not available for this tune — showing Split-Leaf. Pick a different view in Settings.')
  }, [activeTune, staffInlineApproved, viewMode, mounted])

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
  }, [miniBarMounted])

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
  useEffect(() => {
    if (!abc) return
    // CR-03 fix: reset the scroll-hide flags whenever this effect (re)attaches
    // — e.g. on a tune switch, which changes `abc` and detaches/reattaches
    // the listener on a fresh scroll container. Without this, hidden chrome
    // from the previous tune's scroll position could stay hidden after
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

    const lastByEl = new WeakMap<EventTarget, number>()
    const handleScroll = (e: Event) => {
      if (!mql.matches) return
      const el = e.target as HTMLElement | null
      if (!el || typeof el.scrollTop !== 'number') return
      // iOS Safari rubber-band overscroll reports scrollTop OUTSIDE the natural
      // [0, maxTop] range and oscillates rapidly at the boundary. Clamp to the
      // valid range so bounce frames collapse to a constant boundary value
      // (delta ~0) instead of registering as real up/down movement.
      const maxTop = Math.max(0, el.scrollHeight - el.clientHeight)
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
      if (!mql.matches) {
        setTopBarHidden(false); setBottomBarHidden(false); setMiniBarAutoHidden(false)
      }
    }
    mql.addEventListener('change', handleMql)

    main.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => {
      main.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions)
      mql.removeEventListener('change', handleMql)
    }
  }, [abc])

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
        {abc ? (
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
        ) : (
          <div className="p-6 text-sm text-muted-foreground italic">
            No notation available for this psalm.
          </div>
        )}
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
        onOpenChange={setTuneSwitcherOpen}
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
            staffAvailable={!!(activeTune?.abcNotation || activeTune?.abcSatb)}
            // Inline Solfège rendering is not built yet (abcjs has no tonic
            // sol-fa) — permanently disabled until real rendering exists.
            solfegeInlineAvailable={false}
            solfegeSplitAvailable={!!(solfegeJpgUrl || activeSolfegePages.length > 0)}
            staffInlineApproved={staffInlineApproved}
          />
        }
      />
      {abc && (
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
