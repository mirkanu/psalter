'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { PsalmDetail } from '@/db/queries/psalms'

type TuneRow = NonNullable<
  PsalmDetail['psalmVersions'][number]['psalmVersionTunes'][number]['tune']
>

interface PsalmTabsProps {
  psalm: PsalmDetail
  primaryTune: TuneRow | null
  activeVersionId?: number
  recommendedVersionSlug?: string | null
  /** id -> explore slug, built server-side via buildNavesSlugMap; plain object crosses the RSC boundary. */
  navesSlugMap: Record<string, string>
}

// ── Content section components (shared between mobile/desktop) ───────────────

function OverviewContent({
  psalm,
  primaryTune,
  primaryVersion,
}: {
  psalm: PsalmDetail
  primaryTune: TuneRow | null
  primaryVersion: PsalmDetail['psalmVersions'][number] | null
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {psalm.book && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Book:</span> {psalm.book}
          </p>
        )}
        {psalm.author && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Author:</span> {psalm.author}
          </p>
        )}
        {primaryVersion?.meter && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Meter:</span> {primaryVersion.meter}
          </p>
        )}
        {primaryTune?.precentingComment && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Precenting note:</span>{' '}
            {primaryTune.precentingComment}
          </p>
        )}
      </div>
      {psalm.sectionHeadings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Divisions
          </h3>
          <ul className="space-y-1">
            {psalm.sectionHeadings.map((sh) => (
              <li key={sh.id} className="text-sm text-foreground">
                {sh.verseStart && (
                  <span className="text-muted-foreground font-mono text-xs mr-2">
                    v.{sh.verseStart}
                  </span>
                )}
                {sh.heading}
              </li>
            ))}
          </ul>
        </div>
      )}
      {psalm.psalmTopics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {psalm.psalmTopics.map((pt) => (
              <Badge key={pt.topic.id} variant="secondary">
                {pt.topic.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DaysContent({ dailyEntry }: { dailyEntry: PsalmDetail['dailyReadings'][number] | null }) {
  if (!dailyEntry) {
    return <p className="text-muted-foreground italic">No reading plan entry for this psalm.</p>
  }
  return (
    <div className="space-y-2">
      <p className="text-foreground">
        <span className="font-medium">Day {dailyEntry.dayNumber}</span>
        {dailyEntry.readingDate && (
          <span className="text-muted-foreground ml-2">— {dailyEntry.readingDate}</span>
        )}
      </p>
      {dailyEntry.notes && (
        <p className="text-sm text-muted-foreground">{dailyEntry.notes}</p>
      )}
    </div>
  )
}

export function StudyContent({
  psalm,
  kjvVerses,
  navesSlugMap,
}: {
  psalm: PsalmDetail
  kjvVerses: PsalmDetail['verses']
  navesSlugMap: Record<string, string>
}) {
  const xrefVerses = psalm.verses
    .filter((v) => v.verseNavesTopics.length > 0 || v.verseDoctrines.length > 0)
    .map((v) => {
      const topics = v.verseNavesTopics
        .map((vnt) => vnt.navesTopic)
        .filter((t): t is NonNullable<typeof t> => !!t && !!t.name)
      const doctrines = v.verseDoctrines
        .map((vd) => vd.doctrine)
        .filter((d): d is NonNullable<typeof d> => !!d && !!d.name)
      const uniqueTopics = Array.from(new Map(topics.map((t) => [t.id, t])).values())
      const uniqueDoctrines = Array.from(new Map(doctrines.map((d) => [d.id, d])).values())
      return { verseNumber: v.verseNumber, topics: uniqueTopics, doctrines: uniqueDoctrines }
    })
    .filter((v) => v.topics.length > 0 || v.doctrines.length > 0)

  return (
    <div className="space-y-6">
      {psalm.haddingtonIntro && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Haddington Introduction
          </h2>
          <p className="text-foreground leading-relaxed whitespace-pre-line">
            {psalm.haddingtonIntro}
          </p>
        </section>
      )}
      {xrefVerses.length > 0 && (
        <section data-testid="study-xref">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Cross-References
          </h2>
          <div className="space-y-3">
            {xrefVerses.map((v) => (
              <div key={v.verseNumber} data-testid={`study-xref-verse-${v.verseNumber}`}>
                <span className="text-xs text-muted-foreground font-mono mr-2">
                  v.{v.verseNumber}
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {v.topics.map((topic) => {
                    const slug = navesSlugMap[String(topic.id)]
                    const badge = <Badge variant="secondary">{topic.name}</Badge>
                    return slug ? (
                      <Link key={`topic-${topic.id}`} href={`/explore/naves/${slug}`}>
                        {badge}
                      </Link>
                    ) : (
                      <span key={`topic-${topic.id}`}>{badge}</span>
                    )
                  })}
                  {v.doctrines.map((doctrine) => (
                    <Badge key={`doctrine-${doctrine.id}`} variant="outline">
                      {doctrine.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {kjvVerses.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            KJV Text
          </h2>
          <div className="space-y-2">
            {kjvVerses.map((v) => (
              <p key={v.id} className="text-foreground leading-relaxed">
                <span className="text-xs text-muted-foreground font-mono mr-2">
                  {v.verseNumber}
                </span>
                {v.kjvText}
              </p>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          External Resources
        </h2>
        <ul className="space-y-1 text-sm">
          <li>
            <a
              href={`https://www.sermonaudio.com/search/?keyword=psalm+${psalm.id}&keywordtype=4`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
            >
              SermonAudio — Psalm {psalm.id}
            </a>
          </li>
          <li>
            <a
              href={`https://www.spurgeon.org/resource-library/treasury-of-david/psalm-${psalm.id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
            >
              Spurgeon&apos;s Treasury of David
            </a>
          </li>
          <li>
            <a
              href={`https://relight.app/psalm/${psalm.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
            >
              Relight.app
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}

function MessianicContent({
  messianic,
}: {
  messianic: PsalmDetail['messianicPsalms'][number] | null
}) {
  if (!messianic) {
    return (
      <p className="text-muted-foreground italic">
        No messianic data recorded for this psalm.
      </p>
    )
  }
  return (
    <div className="space-y-6">
      {messianic.classification && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Classification
          </h2>
          <p className="text-foreground">{messianic.classification}</p>
        </div>
      )}
      {messianic.ntVerification && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            NT Verification
          </h2>
          <p className="text-foreground">{messianic.ntVerification}</p>
        </div>
      )}
      {messianic.messianicVerses && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Messianic Verses
          </h2>
          <p className="text-foreground">{messianic.messianicVerses}</p>
        </div>
      )}
    </div>
  )
}

function ParallelContent({
  lyrics,
  kjvVerses,
}: {
  lyrics: string | null
  kjvVerses: PsalmDetail['verses']
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Scottish Psalter
        </h2>
        {lyrics ? (
          <div className="space-y-3">
            {lyrics
              .split('\n\n')
              .filter(Boolean)
              .map((stanza, i) => {
                const display = stanza.trim().replace(/^(\d+)([A-Za-z])/, '$1 $2')
                return (
                  <p
                    key={i}
                    className="text-foreground leading-relaxed whitespace-pre-line text-sm"
                  >
                    {display}
                  </p>
                )
              })}
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm">No metrical lyrics available.</p>
        )}
      </div>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          KJV
        </h2>
        {kjvVerses.length > 0 ? (
          <div className="space-y-2">
            {kjvVerses.map((v) => (
              <p key={v.id} className="text-foreground leading-relaxed text-sm">
                <span className="text-xs text-muted-foreground font-mono mr-1">
                  {v.verseNumber}
                </span>
                {v.kjvText}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm">No KJV text available.</p>
        )}
      </div>
    </div>
  )
}

// ── Tab labels (shared between mobile/desktop) ─────────────────────────────

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: '365days', label: '365 Days' },
  { value: 'study', label: 'Study' },
  { value: 'messianic', label: 'Messianic' },
  { value: 'parallel', label: 'Parallel' },
]

// ── Main component ───────────────────────────────────────────────────────────

export function PsalmTabs({ psalm, primaryTune, activeVersionId, recommendedVersionSlug, navesSlugMap }: PsalmTabsProps) {
  const mobileTabsRef = useRef<HTMLDivElement>(null)
  // Preserve the active desktop tab across renders.
  const [desktopTab, setDesktopTab] = useState('overview')

  useEffect(() => {
    if (mobileTabsRef.current) {
      mobileTabsRef.current.scrollLeft = 0
    }
  }, [])

  const sortedVersions = psalm.psalmVersions.slice().sort((a, b) => a.id - b.id)
  const primaryVersion = activeVersionId
    ? (psalm.psalmVersions.find((v) => v.id === activeVersionId) ?? sortedVersions[0] ?? null)
    : (sortedVersions[0] ?? null)
  const dailyEntry = psalm.dailyReadings?.[0] ?? null
  const messianic = psalm.messianicPsalms[0] ?? null
  const kjvVerses = psalm.verses
    .slice()
    .sort((a, b) => (a.verseNumber ?? 0) - (b.verseNumber ?? 0))
  const lyrics = primaryVersion?.lyricsImportedRaw ?? null

  const recommendedBanner = recommendedVersionSlug ? (
    <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2.5 text-sm">
      <Link
        href={`/psalms/${recommendedVersionSlug}`}
        className="font-semibold underline underline-offset-2 text-amber-900 dark:text-amber-200 hover:no-underline"
      >
        Psalm {recommendedVersionSlug}
      </Link>
      <span className="text-amber-800 dark:text-amber-300"> is recommended instead</span>
    </div>
  ) : null

  const sharedTabContents = (pb: string) => (
    <>
      <TabsContent value="overview" className={pb}>
        <OverviewContent psalm={psalm} primaryTune={primaryTune} primaryVersion={primaryVersion} />
      </TabsContent>
      <TabsContent value="365days" className={pb}>
        <DaysContent dailyEntry={dailyEntry} />
      </TabsContent>
      <TabsContent value="study" className={pb}>
        <StudyContent psalm={psalm} kjvVerses={kjvVerses} navesSlugMap={navesSlugMap} />
      </TabsContent>
      <TabsContent value="messianic" className={pb}>
        <MessianicContent messianic={messianic} />
      </TabsContent>
      <TabsContent value="parallel" className={pb}>
        <ParallelContent lyrics={lyrics} kjvVerses={kjvVerses} />
      </TabsContent>
    </>
  )

  return (
    <>
      {/* ══ MOBILE LAYOUT (< md) ════════════════════════════════════════════ */}
      <div className="md:hidden space-y-4">
        {recommendedBanner}
        <Tabs defaultValue="overview">
          {/* Top scrollable tab list — horizontal scroll only */}
          <div
            ref={mobileTabsRef}
            className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden sticky top-14 z-10 bg-background"
            style={{
              maskImage: 'linear-gradient(to right, black calc(100% - 2.5rem), transparent)',
            }}
          >
            <TabsList className="flex h-auto gap-0 bg-transparent p-0 w-max border-b border-border">
              {TABS.map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-shrink-0 text-base font-semibold px-4 py-2 h-auto rounded-none border-b-[3px] border-b-transparent -mb-px data-[active]:border-b-foreground data-[active]:bg-transparent data-[active]:text-foreground"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="h-4 bg-background" />

          {sharedTabContents('pb-4')}
        </Tabs>
      </div>

      {/* ══ DESKTOP / LANDSCAPE LAYOUT (≥ md) ══════════════════════════════ */}
      <div className="hidden md:block space-y-8">
        {recommendedBanner}
        <div>
          <Tabs value={desktopTab} onValueChange={setDesktopTab}>
            <TabsList className="flex flex-wrap h-auto gap-0 mb-6 bg-transparent p-0 border-b border-border">
              {TABS.map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-none border-b-[3px] border-b-transparent -mb-px data-[active]:border-b-foreground data-[active]:bg-transparent data-[active]:text-foreground"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {sharedTabContents('')}
          </Tabs>
        </div>
      </div>
    </>
  )
}
