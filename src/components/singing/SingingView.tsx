'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { NotationRendererClient } from '@/components/notation/NotationRendererClient'
import { PsalmTopBar } from './PsalmTopBar'
import { GlassBottomBar } from './GlassBottomBar'
import { PlayMiniBar } from './PlayMiniBar'
import { GearDrawer } from './GearDrawer'
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
  psalmListRows: PsalmRow[]
  studyHref: string
}

function readStoredViewMode(showLyrics: boolean): ViewMode {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_MODE_KEY) : null
    if (raw === 'staff' || raw === 'solfege' || raw === 'lyrics') {
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
  psalmListRows,
  studyHref,
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

  // Sheet open state
  const [psalmSelectorOpen, setPsalmSelectorOpen] = useState(false)
  const [tuneSwitcherOpen, setTuneSwitcherOpen] = useState(false)

  // 04.9.4-02 lifted state: audio + gear drawer + stanza indicator
  const [isPlaying, setIsPlaying] = useState(false)
  const [gearOpen, setGearOpen] = useState(false)
  const [miniBarMounted, setMiniBarMounted] = useState(false)
  const [miniBarVisible, setMiniBarVisible] = useState(false)
  const [currentStanza, setCurrentStanza] = useState<number | null>(null)
  const [totalStanzas, setTotalStanzas] = useState<number | null>(null)

  const handleStanzaChange = useCallback((current: number, total: number) => {
    setCurrentStanza(current)
    setTotalStanzas(total)
  }, [])

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

  return (
    <div data-singing-view className="relative">
      <PsalmTopBar
        prev={prevSlug}
        next={nextSlug}
        currentSlug={currentSlug}
        psalmId={psalm.id}
        tuneName={tuneName || null}
        onOpenPsalmSelector={() => setPsalmSelectorOpen(true)}
        onOpenTuneSwitcher={() => setTuneSwitcherOpen(true)}
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
        className="overflow-x-hidden flex flex-col h-[calc(100dvh-104px)] md:h-[calc(100dvh-116px)] pb-14 md:pb-15"
      >
        {abc ? (
          <NotationRendererClient
            abc={abc}
            lyrics={lyrics}
            scoreJpgUrl={scoreJpgUrl}
            solfegeJpgUrl={solfegeJpgUrl}
            tuneName={tuneName}
            tuneMeter={meter}
            stanzaMeter={stanzaMeter}
            showLyrics={showLyrics}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            baseSize={baseSize}
            onBaseSizeChange={setBaseSize}
            chromeless={true}
            onStanzaChange={handleStanzaChange}
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
        onBaseSizeChange={setBaseSize}
        currentStanza={currentStanza}
        totalStanzas={totalStanzas}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        onGearOpen={() => setGearOpen(true)}
        showLyricsOption={!!showLyrics}
      />
      {abc && (
        <PlayMiniBar
          abc={abc}
          mounted={miniBarMounted}
          visible={miniBarVisible}
          onCollapse={() => setMiniBarVisible(false)}
          isPlaying={isPlaying}
          onPlayingChange={handlePlayingChange}
        />
      )}
      <GearDrawer
        open={gearOpen}
        onOpenChange={setGearOpen}
        psalm={psalm}
        meter={meter}
        studyHref={studyHref}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showLyricsOption={!!showLyrics}
      />
    </div>
  )
}
