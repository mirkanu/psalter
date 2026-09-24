'use client'

import { useRef, useEffect, useState } from 'react'
import Link from "@/components/Link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { PsalmDetail } from '@/db/queries/psalms'
import { dayOfYearToDate, formatOrdinalDate, formatPsalmRef, parseReadingDate } from '@/lib/daily'
import { buildParallelRows } from '@/lib/parallel-verses'
import type { StructuredLyrics } from '@/lib/lyrics-structured'
import { isVerseInRange, rangesOverlap, type VerseRange } from '@/lib/verse-range'

// ── Shared collapsible section helper (Study tab) ────────────────────────────

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between min-h-[44px] hover:bg-muted rounded-md px-1 py-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

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
  /** topic id -> /explore/topics/{slug}, built server-side via buildTopicSlugMap; plain object crosses the RSC boundary. */
  topicSlugMap: Record<string, string>
  /** Active Psalm-119 sub-division range (e.g. slug "119-17-24"). Null/absent for
   *  normal single-range psalms — filtering is strictly opt-in. */
  activeVerseRange?: VerseRange | null
}

// ── Content section components (shared between mobile/desktop) ───────────────

export function OverviewContent({
  psalm,
  primaryTune,
  primaryVersion,
  topicSlugMap,
}: {
  psalm: PsalmDetail
  primaryTune: TuneRow | null
  primaryVersion: PsalmDetail['psalmVersions'][number] | null
  topicSlugMap: Record<string, string>
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {psalm.book && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Book:</span> {psalm.book}
          </p>
        )}
        {psalm.nkjvTitle && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Suggested Title (NKJV):</span>{' '}
            {psalm.nkjvTitle}
          </p>
        )}
        {psalm.author && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Author:</span>{' '}
            <Link
              href="/explore?tab=authors"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {psalm.author}
            </Link>
          </p>
        )}
        {psalm.occasion && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Occasion:</span> {psalm.occasion}
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
            {psalm.psalmTopics.map((pt) => {
              const slug = topicSlugMap[String(pt.topic.id)]
              const badge = <Badge variant="secondary">{pt.topic.name}</Badge>
              return slug ? (
                <Link
                  key={pt.topic.id}
                  href={`/explore/topics/${slug}`}
                  data-testid="overview-category"
                >
                  {badge}
                </Link>
              ) : (
                <span key={pt.topic.id} data-testid="overview-category">
                  {badge}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function DaysContent({
  entries,
  psalmId,
}: {
  entries: PsalmDetail['dailyReadings']
  psalmId: number
}) {
  return (
    <div className="space-y-4">
      {entries.length === 0 ? (
        <p className="text-muted-foreground italic">No reading plan entry for this psalm.</p>
      ) : (
        <div className="space-y-4" data-testid="days-entries">
          {entries.map((entry) => {
            const parsed = entry.readingDate ? parseReadingDate(entry.readingDate) : null
            const displayDate = formatOrdinalDate(parsed ?? dayOfYearToDate(entry.dayNumber))
            return (
              <div key={entry.id} className="space-y-1" data-testid="days-entry">
                <p className="text-foreground">
                  <span className="font-medium">{displayDate}</span>
                  <span className="text-muted-foreground ml-2">
                    {formatPsalmRef(psalmId, entry.startingVerse, entry.endingVerse, true)}
                  </span>
                </p>
                {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
              </div>
            )
          })}
        </div>
      )}
      <Link
        href="/daily"
        className="inline-block text-sm text-blue-600 dark:text-blue-400 underline underline-offset-2"
        data-testid="days-view-all"
      >
        View all 365 days →
      </Link>
    </div>
  )
}

export function StudyContent(props: {
  psalm: PsalmDetail
  // Kept in the exported signature for backwards compatibility with existing
  // call sites (see task 3 plan note) — no longer rendered here now that the
  // KJV Text section has moved to the Parallel tab. Intentionally not
  // destructured below (unused).
  kjvVerses?: PsalmDetail['verses']
  navesSlugMap: Record<string, string>
  /** Active Psalm-119 sub-division range. Null/absent shows every verse's
   *  cross-references — filtering is strictly opt-in. */
  activeVerseRange?: VerseRange | null
}) {
  const { psalm, navesSlugMap, activeVerseRange } = props
  const xrefVerses = psalm.verses
    .filter((v) => v.verseNavesTopics.length > 0 || v.verseDoctrines.length > 0)
    .filter((v) => !activeVerseRange || isVerseInRange(v.verseNumber, activeVerseRange))
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
          <CollapsibleSection title="Haddington Introduction" defaultOpen={false}>
            <p className="text-foreground leading-relaxed whitespace-pre-line px-1 py-2">
              {psalm.haddingtonIntro}
            </p>
          </CollapsibleSection>
        </section>
      )}
      {xrefVerses.length > 0 && (
        <section data-testid="study-xref">
          <CollapsibleSection title="Cross-References" defaultOpen={false}>
            <div className="space-y-3 px-1 py-2">
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
          </CollapsibleSection>
        </section>
      )}
      <section>
        <CollapsibleSection title="External Resources" defaultOpen={false}>
          <ul className="space-y-1 text-sm px-1 py-2">
            <li>
              <a
                href={`https://www.sermonaudio.com/gb/sermons/scripture/PSA/${psalm.id}?searchKeyword=%22protestant+reformed%22`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
              >
                PRCA Sermons
              </a>
            </li>
            <li>
              <a
                href={`https://gracegems.org/Spurgeon/${String(psalm.id).padStart(3, '0')}.htm`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
              >
                Spurgeon&apos;s Commentary
              </a>
            </li>
            <li>
              <a
                href={`https://relight.app/bible/Ps.${psalm.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
              >
                Commentaries by Calvin, Henry, Geneva and more
              </a>
            </li>
          </ul>
        </CollapsibleSection>
      </section>
    </div>
  )
}

export function MessianicContent({
  messianic,
}: {
  messianic: PsalmDetail['messianicPsalms'][number] | null
}) {
  return (
    <div className="space-y-6">
      {!messianic ? (
        <p className="text-muted-foreground italic">
          No messianic data recorded for this psalm.
        </p>
      ) : (
        <>
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
        </>
      )}
      <Link
        href="/explore?tab=messianic"
        className="inline-block text-sm text-blue-600 dark:text-blue-400 underline underline-offset-2"
        data-testid="messianic-view-all"
      >
        View all messianic psalms →
      </Link>
    </div>
  )
}

export function ParallelContent({
  structured,
  lyrics,
  kjvVerses,
}: {
  structured: StructuredLyrics | null
  lyrics: string | null
  kjvVerses: PsalmDetail['verses']
}) {
  const rows =
    structured !== null
      ? buildParallelRows(
          structured,
          kjvVerses.map((v) => ({ verseNumber: v.verseNumber, kjvText: v.kjvText })),
        )
      : []

  if (structured !== null && rows.length > 0) {
    return (
      <Table data-testid="parallel-table" className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[10%] whitespace-normal text-center">Verse</TableHead>
            <TableHead className="w-[45%] whitespace-normal text-center">Scottish Psalter</TableHead>
            <TableHead className="w-[45%] whitespace-normal text-center">KJV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.verseNumber ?? 'null'} data-testid="parallel-row">
              <TableCell className="align-top font-mono text-xs tabular-nums text-muted-foreground">
                {row.verseNumber ?? '—'}
              </TableCell>
              <TableCell className="align-top whitespace-pre-line text-sm leading-relaxed">
                {row.psalterLines.join('\n')}
              </TableCell>
              <TableCell className="align-top whitespace-normal text-sm leading-relaxed">
                {row.kjvText ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" data-testid="parallel-fallback">
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

export function PsalmTabs({ psalm, primaryTune, activeVersionId, recommendedVersionSlug, navesSlugMap, topicSlugMap, activeVerseRange }: PsalmTabsProps) {
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
  const messianic = psalm.messianicPsalms[0] ?? null
  const kjvVerses = psalm.verses
    .slice()
    .sort((a, b) => (a.verseNumber ?? 0) - (b.verseNumber ?? 0))
    .filter((v) => !activeVerseRange || isVerseInRange(v.verseNumber, activeVerseRange))
  const dailyEntries = (psalm.dailyReadings ?? []).filter(
    (e) => !activeVerseRange || rangesOverlap(activeVerseRange, e.startingVerse, e.endingVerse),
  )
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
        <OverviewContent
          psalm={psalm}
          primaryTune={primaryTune}
          primaryVersion={primaryVersion}
          topicSlugMap={topicSlugMap}
        />
      </TabsContent>
      <TabsContent value="365days" className={pb}>
        <DaysContent entries={dailyEntries} psalmId={psalm.id} />
      </TabsContent>
      <TabsContent value="study" className={pb}>
        <StudyContent
          psalm={psalm}
          kjvVerses={kjvVerses}
          navesSlugMap={navesSlugMap}
          activeVerseRange={activeVerseRange}
        />
      </TabsContent>
      <TabsContent value="messianic" className={pb}>
        <MessianicContent messianic={messianic} />
      </TabsContent>
      <TabsContent value="parallel" className={pb}>
        <ParallelContent
          structured={primaryVersion?.lyricsStructured ?? null}
          lyrics={lyrics}
          kjvVerses={kjvVerses}
        />
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
