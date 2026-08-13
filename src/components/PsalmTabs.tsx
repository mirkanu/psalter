'use client'

import { useRef, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { NotationRendererClient } from '@/components/notation/NotationRendererClient'
import type { ViewMode } from '@/components/notation/NotationRenderer'
import { ChangeTuneDialog } from '@/components/ChangeTuneDialog'
import type { PsalmDetail } from '@/db/queries/psalms'
import type { AlternateTune, PsalmVersionTuneTiers } from '@/db/queries/tunes'
import { sopranoOnly } from '@/lib/utils'
import { buildNotationRendererProps } from '@/lib/notation-renderer-props'

type TuneRow = NonNullable<
  PsalmDetail['psalmVersions'][number]['psalmVersionTunes'][number]['tune']
>

interface PsalmTabsProps {
  psalm: PsalmDetail
  primaryTune: TuneRow | null
  /** Filesystem-derived staff JPEG URL for the primary tune (DB column is NULL) */
  primaryTuneDerivedStaffUrl?: string | null
  /** Filesystem-derived solfège JPEG URL for the primary tune (DB column is NULL) */
  primaryTuneDerivedSolfegeUrl?: string | null
  /** Server-computed slug for primaryTune (raw DB rows have no slug field). */
  primaryTuneSlug?: string | null
  alternateTunes: AlternateTune[]
  activeVersionId?: number
  recommendedVersionSlug?: string | null
  /** Per-psalm-version Backup/Historical tune ids for the Change Tune list (TUNE-04). */
  tuneTiers?: PsalmVersionTuneTiers
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

function StudyContent({
  psalm,
  kjvVerses,
}: {
  psalm: PsalmDetail
  kjvVerses: PsalmDetail['verses']
}) {
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

// ── Mobile tab labels ────────────────────────────────────────────────────────

const MOBILE_TABS = [
  { value: 'sing', label: 'Sing' },
  { value: 'overview', label: 'Overview' },
  { value: '365days', label: '365 Days' },
  { value: 'study', label: 'Study' },
  { value: 'messianic', label: 'Messianic' },
  { value: 'parallel', label: 'Parallel' },
]

const DESKTOP_TABS = MOBILE_TABS.filter((t) => t.value !== 'sing')

// ── Main component ───────────────────────────────────────────────────────────

export function PsalmTabs({ psalm, primaryTune, primaryTuneDerivedStaffUrl, primaryTuneDerivedSolfegeUrl, primaryTuneSlug, alternateTunes, activeVersionId, recommendedVersionSlug, tuneTiers }: PsalmTabsProps) {
  const mobileTabsRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const [noRecDialogOpen, setNoRecDialogOpen] = useState(false)
  const [changeTuneOpen, setChangeTuneOpen] = useState(false)
  // Tracks the active notation view mode so the desktop layout can switch
  // between stacked (Staff/Solfège) and 2-column (Lyrics only).
  const [notationViewMode, setNotationViewMode] = useState<ViewMode>('staff')
  // Preserve the active desktop tab when the layout mode switches.
  const [desktopTab, setDesktopTab] = useState('overview')

  // Pre-select a tune when navigating from a tune page via ?tune={id}
  const tuneParam = searchParams.get('tune')
  const preselectedTune = tuneParam
    ? alternateTunes.find((t) => String(t.id) === tuneParam) ?? null
    : null
  const [overrideTune, setOverrideTune] = useState<AlternateTune | null>(preselectedTune)

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
  const stanzas = (lyrics ?? '')
    .split('\n\n')
    .map((s) => s.trim().replace(/^(\d+)([A-Za-z])/, '$1 $2'))
    .filter(Boolean)

  // Derive active tune — override wins when set.
  // For the primary tune, use filesystem-derived JPEG URLs (DB columns are NULL for all tunes).
  const activeTune = overrideTune
    ? {
        id: overrideTune.id,
        name: overrideTune.name,
        slug: overrideTune.slug,
        meter: overrideTune.meter,
        abcNotation: sopranoOnly(overrideTune.abcSatb?.trim() || overrideTune.abcNotation || ''),
        scoreJpgUrl: overrideTune.scoreJpgUrl,
        solfegeJpgUrl: overrideTune.solfegeJpgUrl,
        soundcloudUrl: overrideTune.soundcloudUrl,
        youtubeUrl: overrideTune.youtubeUrl,
        doubleLength: overrideTune.doubleLength ?? false,
        solfegeOcrText: overrideTune.solfegeOcrText ?? null,
        precentingComment: null,
      }
    : primaryTune
      ? {
          ...primaryTune,
          slug: primaryTuneSlug ?? String(primaryTune.id),
          scoreJpgUrl: primaryTuneDerivedStaffUrl ?? primaryTune.scoreJpgUrl,
          solfegeJpgUrl: primaryTuneDerivedSolfegeUrl ?? primaryTune.solfegeJpgUrl,
        }
      : null

  const makeSingPanel = (stickyScoreMode: boolean, mobileStickyScore: boolean = false) => (
    <div className={stickyScoreMode ? 'flex flex-col h-full' : 'space-y-4'}>
      {recommendedVersionSlug && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2.5 text-sm flex-shrink-0">
          <Link
            href={`/psalms/${recommendedVersionSlug}`}
            className="font-semibold underline underline-offset-2 text-amber-900 dark:text-amber-200 hover:no-underline"
          >
            Psalm {recommendedVersionSlug}
          </Link>
          <span className="text-amber-800 dark:text-amber-300"> is recommended instead</span>
        </div>
      )}
      {activeTune ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              Tune{activeTune.meter ? ` (${activeTune.meter})` : ''}:
            </span>
            <Link
              href={`/tunes/${activeTune.slug}`}
              className="text-sm font-medium text-foreground underline underline-offset-2 hover:no-underline"
            >
              {activeTune.name ?? 'Tune'}
            </Link>
            {alternateTunes.length > 0 && (
              <Button
                variant="default"
                size="xs"
                onClick={() => setChangeTuneOpen(true)}
                aria-label="Change tune"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <NotationRendererClient
            {...buildNotationRendererProps(
              {
                abcNotation: activeTune.abcNotation ?? null,
                abcSatb: (activeTune as { abcSatb?: string | null }).abcSatb ?? null,
                name: activeTune.name ?? null,
                meter: activeTune.meter ?? null,
                phraseShapeOverride: (activeTune as { phraseShapeOverride?: number[] | null }).phraseShapeOverride ?? null,
                doubleLength: activeTune.doubleLength ?? false,
                solfegeOcrText: (activeTune as { solfegeOcrText?: string | null }).solfegeOcrText ?? null,
                scoreJpgUrl: activeTune.scoreJpgUrl ?? null,
                solfegeJpgUrl: activeTune.solfegeJpgUrl ?? null,
              },
              {
                lyrics: lyrics ?? '',
                stanzaMeter: primaryVersion?.meter ?? null,
                lyricsStructured: primaryVersion?.lyricsStructured ?? null,
              },
              { onViewModeChange: setNotationViewMode },
            )}
          />
          <ChangeTuneDialog
            open={changeTuneOpen}
            onClose={() => setChangeTuneOpen(false)}
            currentTuneId={activeTune.id}
            tunes={alternateTunes}
            tuneTiers={tuneTiers}
            onSelect={(tune) => { setOverrideTune(tune); setChangeTuneOpen(false) }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Tune: no recommendation</span>
            {alternateTunes.length > 0 && (
              <Button
                variant="default"
                size="xs"
                onClick={() => setNoRecDialogOpen(true)}
                aria-label="Select tune"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {stanzas.length > 0 ? (
            <div className="space-y-4 py-2">
              {stanzas.map((stanza, i) => (
                <p key={i} className="text-foreground leading-relaxed whitespace-pre-line text-base">
                  {stanza}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No lyrics available.</p>
          )}
          <ChangeTuneDialog
            open={noRecDialogOpen}
            onClose={() => setNoRecDialogOpen(false)}
            currentTuneId={null}
            tunes={alternateTunes}
            tuneTiers={tuneTiers}
            onSelect={(tune) => { setOverrideTune(tune); setNoRecDialogOpen(false) }}
          />
        </div>
      )}
    </div>
  )

  const sharedTabContents = (pb: string) => (
    <>
      <TabsContent value="overview" className={pb}>
        <OverviewContent psalm={psalm} primaryTune={primaryTune} primaryVersion={primaryVersion} />
      </TabsContent>
      <TabsContent value="365days" className={pb}>
        <DaysContent dailyEntry={dailyEntry} />
      </TabsContent>
      <TabsContent value="study" className={pb}>
        <StudyContent psalm={psalm} kjvVerses={kjvVerses} />
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
      <div className="md:hidden">
        <Tabs defaultValue="sing">
          {/* Top scrollable tab list — horizontal scroll only */}
          <div
            ref={mobileTabsRef}
            className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden sticky top-14 z-10 bg-background"
            style={{
              maskImage: 'linear-gradient(to right, black calc(100% - 2.5rem), transparent)',
            }}
          >
            <TabsList className="flex h-auto gap-0 bg-transparent p-0 w-max border-b border-border">
              {MOBILE_TABS.map(({ value, label }) => (
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

          <TabsContent value="sing" className="pb-4">
            {makeSingPanel(false, true)}
          </TabsContent>
          {sharedTabContents('pb-4')}
        </Tabs>
      </div>

      {/* ══ DESKTOP / LANDSCAPE LAYOUT (≥ md) ══════════════════════════════ */}
      {/* Stacked layout when notation (Staff/Solfège) is active — notation
          spans full width at top, tabs scroll below. Reverts to the original
          2-column sticky layout when Lyrics-only mode is active. */}
      {notationViewMode !== 'lyrics' ? (
        <div className="hidden md:block space-y-8">
          <div>{makeSingPanel(false)}</div>
          <div>
            <Tabs value={desktopTab} onValueChange={setDesktopTab}>
              <TabsList className="flex flex-wrap h-auto gap-0 mb-6 bg-transparent p-0 border-b border-border">
                {DESKTOP_TABS.map(({ value, label }) => (
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
      ) : (
        <div className="hidden md:grid md:grid-cols-2 gap-8 sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden pb-8">{makeSingPanel(true)}</div>
          <div className="overflow-y-auto h-full pb-8">
            <Tabs value={desktopTab} onValueChange={setDesktopTab}>
              <TabsList className="flex flex-wrap h-auto gap-0 mb-6 bg-transparent p-0 border-b border-border">
                {DESKTOP_TABS.map(({ value, label }) => (
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
      )}
    </>
  )
}
