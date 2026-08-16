'use client'

import { useCallback, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotationRendererClient } from '@/components/notation/NotationRendererClient'
import { TuneScoreSection } from '@/components/TuneScoreSection'
import { TuneMiniBarSection } from '@/components/TuneMiniBarSection'
import { TuneDetailClient } from '@/components/TuneDetailClient'
import { PsalmsByTuneSection } from '@/components/PsalmsByTuneSection'
import type { CoreNotationProps } from '@/lib/notation-renderer-props'
import type { PsalmRow } from '@/components/PsalmListingGrid'

export interface TunePageVersionEntry {
  psalmVersionId: number
  id: number
  bibleTitle: string | null
  firstLine: string | null
  slug: string
  displayLabel: string
  isPrimary: boolean
}

export interface TunePagePsalmForMeter {
  id: number
  bibleTitle: string | null
  firstLine: string | null
  lyricsImportedRaw: string | null
}

export type TunePageTab = 'details' | 'notation'

export interface TunePageTabsProps {
  tuneName: string
  tuneId: number
  meter: string | null
  moods: string[]
  numberIn1979RpPsalter: number | null
  numInPrcaPsalter: number | null
  hasFamousHymn: boolean
  famousHymn: string | null
  precentingComment: string | null
  recommendedPsalms: TunePageVersionEntry[]
  otherPsalms: TunePageVersionEntry[]
  psalmsForMeter: TunePagePsalmForMeter[]
  allPsalmRows: PsalmRow[]
  /** Server-built core props from buildNotationRendererProps() — JSON-serialisable, no callbacks. */
  notationProps: CoreNotationProps
  staffPages: string[]
  solfegePages: string[]
  bestAbc: string | null
  soundcloudUrl: string | null
  youtubeUrl: string | null
}

function parseTab(value: string | null): TunePageTab {
  return value === 'notation' ? 'notation' : 'details'
}

// Match the exact TabsList + TabsTrigger class string used on /psalms/[slug]
// (PsalmTabs.tsx desktop layout) so /tunes/[slug] is visually indistinguishable
// from the existing tabbed surface.
const TAB_TRIGGER_CLASS =
  'rounded-none border-b-[3px] border-b-transparent -mb-px data-[active]:border-b-foreground data-[active]:bg-transparent data-[active]:text-foreground'

/**
 * SingThisTuneSection — the canonical "Sing this tune" panel reused in two places
 * per Round 2 feedback (2026-08-16):
 *   1. Inside the Notation tab — as the tab's content (so the tab remains useful).
 *   2. At page level, below the tabs — so the panel is always visible regardless of
 *      which tab is active.
 *
 * Order matches the user's spec for the simplified /psalms/[slug] notation view:
 *   1. NotationRendererClient — emits the inline Gear Icon view-mode toggle
 *      (Staff / Solfege single row) at the top of its own controls.
 *   2. Audio mini-bar — SoundCloud + abc switcher via PlayMiniBarClient.
 *   3. Score — same renderer chain, no lyrics (showLyrics:false already in props).
 *
 * Two render modes:
 *   - hasAbc — ABC available: render full notation renderer + mini-bar.
 *   - !hasAbc but has images or audio — render TuneDetailClient (image-based fallback).
 *   - neither — render a small "Notation not available" note.
 */
interface SingThisTuneSectionProps {
  hasAbc: boolean
  hasImages: boolean
  hasAudio: boolean
  notationProps: CoreNotationProps
  staffPages: string[]
  solfegePages: string[]
  bestAbc: string | null
  soundcloudUrl: string | null
  youtubeUrl: string | null
  tuneName: string
}

function SingThisTuneSection({
  hasAbc,
  hasImages,
  hasAudio,
  notationProps,
  staffPages,
  solfegePages,
  bestAbc,
  soundcloudUrl,
  youtubeUrl,
  tuneName,
}: SingThisTuneSectionProps) {
  if (hasAbc) {
    return (
      <div className="space-y-6">
        <TuneScoreSection
          notationProps={notationProps}
          staffPages={staffPages}
          solfegePages={solfegePages}
        />
        <TuneMiniBarSection abc={bestAbc!} soundcloudUrl={soundcloudUrl} tuneName={tuneName} />
      </div>
    )
  }

  if (hasImages || hasAudio) {
    return (
      <TuneDetailClient
        tuneName={tuneName}
        staffPages={staffPages}
        solfegePages={solfegePages}
        soundcloudUrl={soundcloudUrl}
        youtubeUrl={youtubeUrl}
      />
    )
  }

  return (
    <p className="text-sm text-muted-foreground italic">Notation not available for this tune.</p>
  )
}

export function TunePageTabs(props: TunePageTabsProps) {
  const {
    tuneName,
    tuneId,
    meter,
    moods,
    numberIn1979RpPsalter,
    numInPrcaPsalter,
    hasFamousHymn,
    famousHymn,
    precentingComment,
    recommendedPsalms,
    otherPsalms,
    psalmsForMeter,
    allPsalmRows,
    notationProps,
    staffPages,
    solfegePages,
    bestAbc,
    soundcloudUrl,
    youtubeUrl,
  } = props

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TunePageTab>(() => parseTab(searchParams.get('tab')))

  const handleTabChange = useCallback(
    (value: string) => {
      const next = parseTab(value)
      setActiveTab(next)
      router.replace(`${pathname}?tab=${next}`, { scroll: false })
    },
    [router, pathname],
  )

  const hasAbc = !!bestAbc
  const hasImages = staffPages.length > 0 || solfegePages.length > 0
  const hasAudio = !!(soundcloudUrl || youtubeUrl)
  const hasMetadata =
    moods.length > 0 ||
    !!numberIn1979RpPsalter ||
    !!numInPrcaPsalter ||
    !!precentingComment ||
    (hasFamousHymn && !!famousHymn)

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap h-auto gap-0 mb-6 bg-transparent p-0 border-b border-border">
          <TabsTrigger value="details" className={TAB_TRIGGER_CLASS}>
            Details
          </TabsTrigger>
          <TabsTrigger value="notation" className={TAB_TRIGGER_CLASS}>
            Notation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-8">
          {hasMetadata && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {moods.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-36 shrink-0">Mood</span>
                  <span>{moods.join(', ')}</span>
                </div>
              )}
              {numberIn1979RpPsalter && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-36 shrink-0">RP Psalter (1979)</span>
                  <span>#{numberIn1979RpPsalter}</span>
                </div>
              )}
              {numInPrcaPsalter && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-36 shrink-0">PR Psalter</span>
                  <span>#{numInPrcaPsalter}</span>
                </div>
              )}
              {hasFamousHymn && famousHymn && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-36 shrink-0">Famous hymn</span>
                  <span>{famousHymn}</span>
                </div>
              )}
              {precentingComment && (
                <div className="flex gap-2 sm:col-span-2">
                  <span className="text-muted-foreground w-36 shrink-0">Precenting notes</span>
                  <span className="text-foreground">{precentingComment}</span>
                </div>
              )}
            </section>
          )}

          <PsalmsByTuneSection
            recommendedPsalms={recommendedPsalms}
            otherPsalms={otherPsalms}
            psalmsForMeter={psalmsForMeter}
            allPsalmRows={allPsalmRows}
            tuneId={tuneId}
            meter={meter}
          />
        </TabsContent>

        <TabsContent value="notation" className="space-y-6">
          {/* Notation tab — simplified /psalms/[slug]-style view: the gear-icon
              view-mode toggle is inline at top of NotationRendererClient (via its
              onViewModeChange hook), then audio player, then score without lyrics. */}
          <SingThisTuneSection
            hasAbc={hasAbc}
            hasImages={hasImages}
            hasAudio={hasAudio}
            notationProps={notationProps}
            staffPages={staffPages}
            solfegePages={solfegePages}
            bestAbc={bestAbc}
            soundcloudUrl={soundcloudUrl}
            youtubeUrl={youtubeUrl}
            tuneName={tuneName}
          />
        </TabsContent>
      </Tabs>

      {/* "Sing this tune" panel — page-level, BELOW both Details and Notation tabs,
          so it's always visible without needing to click the Notation tab. Uses the
          same SingThisTuneSection as the Notation tab (same components, same order)
          so changing notation behaviour at /psalms/[slug] will also change it here. */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Sing this tune
        </h2>
        <SingThisTuneSection
          hasAbc={hasAbc}
          hasImages={hasImages}
          hasAudio={hasAudio}
          notationProps={notationProps}
          staffPages={staffPages}
          solfegePages={solfegePages}
          bestAbc={bestAbc}
          soundcloudUrl={soundcloudUrl}
          youtubeUrl={youtubeUrl}
          tuneName={tuneName}
        />
      </section>
    </>
  )
}
