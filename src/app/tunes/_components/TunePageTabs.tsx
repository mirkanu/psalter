'use client'

import { useCallback, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TuneScoreSection } from '@/components/TuneScoreSection'
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
}

function parseTab(value: string | null): TunePageTab {
  return value === 'notation' ? 'notation' : 'details'
}

// Match the exact TabsList + TabsTrigger class string used on /psalms/[slug]
// (PsalmTabs.tsx desktop layout) so /tunes/[slug] is visually indistinguishable
// from the existing tabbed surface.
const TAB_TRIGGER_CLASS =
  'rounded-none border-b-[3px] border-b-transparent -mb-px data-[active]:border-b-foreground data-[active]:bg-transparent data-[active]:text-foreground'

export function TunePageTabs(props: TunePageTabsProps) {
  const {
    tuneName,
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
              NotationRendererClient (via TuneScoreSection) emits the Staff/Solfège
              toggle (tunePageMode suppresses A+/A-, Stanza nav, fullscreen, and the
              bottom Play/Key/BPM bar — see buildNotationRendererProps' tunePageMode
              option) followed by the score. Always rendered regardless of whether
              this tune has digital abc — NotationRenderer's own tunePageMode JPG
              fallback (staff-split / solfege-split) and "not available" message
              cover the no-abc and no-image cases, so a single component handles
              every tune instead of branching into a separate TuneDetailClient
              fallback (removed 2026-08-16 — it duplicated the audio player that
              now lives above the tabs). Audio lives ABOVE the tabs
              (see /tunes/[slug]/page.tsx), not inside this tab — Phase 16 R3
              user spec. */}
          <TuneScoreSection
            notationProps={notationProps}
            staffPages={staffPages}
            solfegePages={solfegePages}
          />
        </TabsContent>
    </Tabs>
  )
}
