'use client'

import { useCallback, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TuneScoreSection } from '@/components/TuneScoreSection'
import { TuneDetailClient } from '@/components/TuneDetailClient'
import type { CoreNotationProps } from '@/lib/notation-renderer-props'

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
 * SingThisTuneSection — the canonical "Sing this tune" panel rendered inside the
 * Notation tab on /tunes/[slug]. Matches the user's spec for the simplified
 * /psalms/[slug] main-sing-view notation panel:
 *   1. NotationRendererClient emits the inline Staff / Solfège single-row toggle
 *      at the top of its own controlBar (showLyrics:false suppresses the
 *      "Lyrics only" button, leaving exactly the two buttons the spec calls for).
 *   2. Audio mini-bar — SoundCloud + abc switcher via PlayMiniBarClient (same
 *      component /psalms/[slug] uses via SingingView's PlayMiniBarClient slot).
 *   3. Score — same renderer chain, no lyrics (showLyrics:false already in props).
 *
 * Three render branches:
 *   - hasAbc — ABC available: render the NotationRenderer via TuneScoreSection.
 *     Audio lives ABOVE the tabs (page.tsx), not inside this tab — Phase 16 R3.
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
  soundcloudUrl,
  youtubeUrl,
  tuneName,
}: SingThisTuneSectionProps) {
  if (hasAbc) {
    return (
      <TuneScoreSection
        notationProps={notationProps}
        staffPages={staffPages}
        solfegePages={solfegePages}
      />
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
        </TabsContent>

        <TabsContent value="notation" className="space-y-6">
          {/* Notation tab — simplified version of /psalms/[slug]'s main Sing view:
              NotationRendererClient emits the inline Staff/Solfege single-row
              toggle (showLyrics:false suppresses the "Lyrics only" button) at the
              top of its own controlBar, followed by the score. Same
              NotationRendererClient used on /psalms/[slug], so notation behaviour
              changes there propagate here automatically. Audio lives ABOVE the
              tabs (see /tunes/[slug]/page.tsx), not inside this tab — Phase 16
              R3 user spec. */}
          <SingThisTuneSection
            hasAbc={hasAbc}
            hasImages={hasImages}
            hasAudio={hasAudio}
            notationProps={notationProps}
            staffPages={staffPages}
            solfegePages={solfegePages}
            soundcloudUrl={soundcloudUrl}
            youtubeUrl={youtubeUrl}
            tuneName={tuneName}
          />
        </TabsContent>
    </Tabs>
  )
}
