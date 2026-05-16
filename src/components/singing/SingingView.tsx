'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { NotationRendererClient } from '@/components/notation/NotationRendererClient'
import { PsalmTopBar } from './PsalmTopBar'
import { TuneSubBar } from './TuneSubBar'
import { PsalmActionsFAB } from './PsalmActionsFAB'
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
  useEffect(() => {
    setViewMode(readStoredViewMode(showLyrics))
    setBaseSize(readStoredBaseSize())
    setMounted(true)
  }, [showLyrics])

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
        onOpenPsalmSelector={() => setPsalmSelectorOpen(true)}
      />
      <TuneSubBar
        tuneName={tuneName || null}
        meter={meter}
        onOpenSwitcher={() => setTuneSwitcherOpen(true)}
      />

      {/* Body — single scroll container, hard horizontal clamp.
         IMPORTANT: this wrapper deliberately has NO horizontal padding.
         AbcPlayer's outer wrapper (Plan 01 hardening) is the padded element
         (`px-2` → 8px L+R) and its staffwidth derivation subtracts 16px to
         account for that. Adding `px-N` here would double-pad and force
         horizontal clipping. The `overflow-x-hidden` is defensive only. */}
      <main
        data-notation-region
        className="overflow-x-hidden"
        style={{
          // 144px = 56 SiteHeader + 48 topbar + 40 subbar mobile;
          // 156px = 56 + 56 + 44 ≥md.
          // overflow-y is controlled by NotationRenderer per view mode (Staff:
          // hidden / no-scroll; Lyrics & Solfège: auto).
          height: 'calc(100dvh - 144px)',
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            [data-notation-region] { height: calc(100dvh - 156px) !important; }
          }
        `}</style>
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
          />
        ) : (
          <div className="p-6 text-sm text-muted-foreground italic">
            No notation available for this psalm.
          </div>
        )}
      </main>

      <PsalmActionsFAB
        psalm={psalm}
        meter={meter}
        studyHref={studyHref}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        baseSize={baseSize}
        onBaseSizeChange={setBaseSize}
        abcForAudio={abc || null}
      />

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
    </div>
  )
}
