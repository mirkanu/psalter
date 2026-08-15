'use client'

import { useCallback, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TuneScoreSection } from '@/components/TuneScoreSection'
import { TuneMiniBarSection } from '@/components/TuneMiniBarSection'
import { PsalmsByTuneSection } from '@/components/PsalmsByTuneSection'
import { TuneDetailClient } from '@/components/TuneDetailClient'
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

const TAB_TRIGGER_CLASS =
  'rounded-none border-b-[3px] border-b-transparent -mb-px data-[active]:border-b-foreground data-[active]:bg-transparent data-[active]:text-foreground'

/**
 * TunePageTabs — owns the Details/Notation tabbed surface for /tunes/[slug] (TPAGE-03, Phase 16).
 *
 * The active tab is synced to the `?tab=` URL search param via `router.replace(..., { scroll:
 * false })` — NOT `router.push`, which would add a history entry and reset scroll on switch.
 * `?tab=` is validated against a strict allowlist ('details' | 'notation'); any other value falls
 * back to 'details' (threat T-16-05).
 *
 * Deviation from the 16-03 plan text (Rule 1 — avoid regression): the plan's Task 2 "done"
 * criteria described removing the `TuneDetailClient` import entirely and replacing the no-ABC
 * case with a static "Notation not available" placeholder. Plan 16-02 (commit 3b79121) already
 * confirmed and documented that `TuneDetailClient`'s two JPG-only fallback call sites must stay,
 * "per the plan's explicit instruction not to regress image-only tunes." Dropping them here would
 * silently break every tune without approved ABC notation (currently ~102/172 tunes not yet
 * approved in /dev/melisma-editor — see PROJECT.md Backlog). The Notation tab therefore preserves
 * all three branches from the pre-tabs page.tsx: the ABC path (TuneScoreSection +
 * TuneMiniBarSection), the JPG-only fallback (TuneDetailClient), and the ABC+audio-without-
 * embedded-player combination (TuneDetailClient with staffPages=[]). The plan's literal "Notation
 * not available" placeholder is kept as a last-resort empty state for the (currently nonexistent)
 * case where a tune has none of ABC, JPGs, or audio.
 */
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
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList
        variant="line"
        className="flex flex-wrap h-auto gap-0 mb-6 bg-transparent p-0 border-b border-border"
      >
        <TabsTrigger value="details" className={TAB_TRIGGER_CLASS}>
          Details
        </TabsTrigger>
        <TabsTrigger value="notation" className={TAB_TRIGGER_CLASS}>
          Notation
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Tune
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">{tuneName}</h1>
            {meter && (
              <Badge variant="secondary" className="text-base px-2.5 py-0.5">
                {meter}
              </Badge>
            )}
          </div>
        </header>

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

      <TabsContent value="notation" className="space-y-8">
        {/* ABC path — same NotationRendererClient chain as /psalms/[slug]'s Study tab
            (TPAGE-02, plan 16-02). This is the primary notation experience. */}
        {hasAbc && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Score
            </h2>
            <TuneScoreSection
              notationProps={notationProps}
              staffPages={staffPages}
              solfegePages={solfegePages}
            />
            <TuneMiniBarSection abc={bestAbc!} soundcloudUrl={soundcloudUrl} tuneName={tuneName} />
          </section>
        )}

        {/* Image-based fallback for tunes with NO ABC notation. TPAGE-02/03 do not change this
            path — kept verbatim per plan 16-02's explicit no-regression decision. */}
        {!hasAbc && (hasImages || hasAudio) && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Score
            </h2>
            <TuneDetailClient
              tuneName={tuneName}
              staffPages={staffPages}
              solfegePages={solfegePages}
              soundcloudUrl={soundcloudUrl}
              youtubeUrl={youtubeUrl}
            />
          </section>
        )}

        {/* ABC tunes that also have audio: a secondary Solfège+play-button block below the
            notation. JPG-only fallback — kept verbatim per plan 16-02. */}
        {hasAbc && hasAudio && (
          <section>
            <TuneDetailClient
              tuneName={tuneName}
              staffPages={[]}
              solfegePages={solfegePages}
              soundcloudUrl={soundcloudUrl}
              youtubeUrl={youtubeUrl}
            />
          </section>
        )}

        {!hasAbc && !hasImages && !hasAudio && (
          <p className="text-sm text-muted-foreground italic">
            Notation not available for this tune.
          </p>
        )}
      </TabsContent>
    </Tabs>
  )
}
