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
  /** Full ordered list of staff-score image paths for the active tune (server-derived in page.tsx via deriveTuneJpgPages — NOT derived here). Enables multi-page thumbnail nav in split-leaf view. */
  staffPages?: string[]
  /** Full ordered list of solfège image paths for the active tune (server-derived in page.tsx via deriveTuneJpgPages — NOT derived here). Enables multi-page thumbnail nav in split-leaf view. */
  solfegePages?: string[]
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
  staffPages = [],
  solfegePages = [],
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

  // ViewMode + baseSize state (owned here; passed controlled to NotationRenderer)
  const showLyrics = !!lyrics
  const [viewMode, setViewMode] = useState<ViewMode>('staff')
  const [baseSize, setBaseSize] = useState<number>(14)
  const [mounted, setMounted] = useState(false)

  // 04.9.4-03: Proportional zoom heuristic — refs avoid stale closures in the
  // debounced resize handler. `referenceWidthRef` tracks the viewport width at
  // the moment of the last manual A+/A− override (or initial mount).
  const referenceWidthRef = useRef<number>(
    typeof window !== 'undefined' ? window.innerWidth : 375
  )
  const baseSizeRef = useRef<number>(baseSize)

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

  // Fetch melisma approval status for the active tune (drives GearPopover gray-out)
  useEffect(() => {
    if (!activeTune?.id) { setMelismaStatus(null); return }
    let cancelled = false
    fetch(`/api/dev/melisma-decision?tuneId=${activeTune.id}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setMelismaStatus(data.status ?? null) })
      .catch(() => { if (!cancelled) setMelismaStatus(null) })
    return () => { cancelled = true }
  }, [activeTune?.id])

  // 04.9.4-03: Proportional zoom heuristic.
  // On viewport width change (resize / orientation flip / visualViewport),
  // recompute baseSize as clamp(current * newWidth / refWidth, 8, 40).
  // Debounced 150ms; ignores deltas < 8px to suppress mobile URL-bar churn.
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
        const current = baseSizeRef.current
        const computed = current * (newWidth / refWidth)
        const clamped = Math.max(8, Math.min(40, computed))
        const rounded = Math.round(clamped)
        referenceWidthRef.current = newWidth
        if (rounded !== current) {
          setBaseSize(rounded)
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

  // 04.9.4-03: Manual A+/A− override resets the reference width so subsequent
  // viewport changes scale from the new reference.
  const handleBaseSizeChange = useCallback((newSize: number) => {
    if (typeof window !== 'undefined') {
      referenceWidthRef.current = window.innerWidth
    }
    setBaseSize(newSize)
  }, [])

  // Sheet open state
  const [psalmSelectorOpen, setPsalmSelectorOpen] = useState(false)
  const [tuneSwitcherOpen, setTuneSwitcherOpen] = useState(false)

  // 04.9.4-02 lifted state: audio + gear drawer + stanza indicator
  const [isPlaying, setIsPlaying] = useState(false)
  const [gearOpen, setGearOpen] = useState(false)
  const [melismaStatus, setMelismaStatus] = useState<'approved' | 'not_approved' | null>(null)
  const [miniBarMounted, setMiniBarMounted] = useState(false)
  const [miniBarVisible, setMiniBarVisible] = useState(false)
  const [currentStanza, setCurrentStanza] = useState<number | null>(null)
  const [totalStanzas, setTotalStanzas] = useState<number | null>(null)
  const [stanzaPage, setStanzaPage] = useState<number>(1)
  const [tourKey, setTourKey] = useState<number>(0)

  const handleRestartTour = useCallback(() => {
    try {
      localStorage.removeItem('psalter_tour_v1')
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
        data-notation-region
        className="overflow-x-hidden flex flex-col h-[calc(100dvh-104px)] md:h-[calc(100dvh-116px)] pb-11 md:pb-13"
      >
        {abc ? (
          <NotationRendererClient
            abc={abc}
            lyrics={lyrics}
            scoreJpgUrl={scoreJpgUrl}
            solfegeJpgUrl={solfegeJpgUrl}
            tuneName={tuneName}
            tuneMeter={meter}
            phraseShapeOverride={(activeTune as { phraseShapeOverride?: number[] | null } | undefined)?.phraseShapeOverride ?? null}
            stanzaMeter={stanzaMeter}
            lyricsStructured={lyricsStructured}
            doubleLength={activeTune?.doubleLength ?? false}
            solfegeOcrText={activeTune?.solfegeOcrText ?? null}
            melismaPositions={(activeTune as { melismaPositions?: number[][] | null } | undefined)?.melismaPositions ?? null}
            showLyrics={showLyrics}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            baseSize={baseSize}
            onBaseSizeChange={handleBaseSizeChange}
            chromeless={true}
            onStanzaChange={handleStanzaChange}
            stanzaPage={stanzaPage}
            onStanzaPageChange={setStanzaPage}
            youtubeUrl={youtubeUrl}
            soundcloudUrl={soundcloudUrl}
            staffPages={staffPages}
            solfegePages={solfegePages}
          />
        ) : (
          <div className="p-6 text-sm text-muted-foreground italic">
            No notation available for this psalm.
          </div>
        )}
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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        baseSize={baseSize}
        onBaseSizeChange={handleBaseSizeChange}
        currentStanza={viewMode === 'staff' ? currentStanza : null}
        totalStanzas={viewMode === 'staff' ? totalStanzas : null}
        onStanzaPrev={handleStanzaPrev}
        onStanzaNext={handleStanzaNext}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        onGearOpen={() => setGearOpen(true)}
        showLyricsOption={!!showLyrics}
        gear={
          <GearPopover
            open={gearOpen}
            onOpenChange={setGearOpen}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            studyHref={studyHref}
            onRestartTour={handleRestartTour}
            showLyricsOption={!!showLyrics}
            staffAvailable={!!(activeTune?.abcNotation || activeTune?.abcSatb) && melismaStatus === 'approved'}
            solfegeAvailable={!!(activeTune?.solfegeOcrText || (activeTune as { solfegeSopranoEdited?: string | null })?.solfegeSopranoEdited) && melismaStatus === 'approved'}
          />
        }
      />
      {abc && (
        <PlayMiniBar
          abc={abc}
          mounted={miniBarMounted}
          visible={miniBarVisible}
          onCollapse={() => setMiniBarVisible(false)}
          isPlaying={isPlaying}
          onPlayingChange={handlePlayingChange}
          soundcloudUrl={soundcloudUrl}
          tuneName={tuneName}
          variant="inline"
        />
      )}
      {/* GearDrawer removed — settings now via GearPopover rendered in GlassBottomBar gear slot */}
      <OnboardingTour key={tourKey} />
    </div>
  )
}
