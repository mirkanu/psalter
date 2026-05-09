'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { PsalmDetail } from '@/db/queries/psalms'

// Tune type derived from the query result
type TuneRow = NonNullable<
  PsalmDetail['psalmVersions'][number]['psalmVersionTunes'][number]['tune']
>

interface PsalmTabsProps {
  psalm: PsalmDetail
  primaryTune: TuneRow | null
}

export function PsalmTabs({ psalm, primaryTune }: PsalmTabsProps) {
  // Primary psalmVersion (lowest serial id)
  const primaryVersion = psalm.psalmVersions.slice().sort((a, b) => a.id - b.id)[0] ?? null

  // Daily reading entry
  const dailyEntry = psalm.dailyReadings?.[0] ?? null

  // Backup tunes (non-primary, de-duped)
  const primaryTuneId = primaryTune?.id ?? null
  const allPvts = psalm.psalmVersions.flatMap((pv) => pv.psalmVersionTunes)
  const backupTunes = allPvts
    .filter((pvt) => !pvt.isPrimary)
    .map((pvt) => pvt.tune)
    .filter((t): t is NonNullable<typeof t> => !!t && t.id !== primaryTuneId)

  // Messianic data
  const messianic = psalm.messianicPsalms[0] ?? null

  // KJV verses sorted by verse number
  const kjvVerses = psalm.verses.slice().sort((a, b) => (a.verseNumber ?? 0) - (b.verseNumber ?? 0))

  // Scottish Psalter lyrics from primary version (for Parallel tab)
  const lyrics = primaryVersion?.lyrics ?? null

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-transparent p-0">

        {/* ── "Tune" tab — MOBILE ONLY (D-05) — hidden on desktop via CSS ── */}
        <TabsTrigger value="tune" className="md:hidden">
          Tune
        </TabsTrigger>

        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="365days">365 Days</TabsTrigger>
        <TabsTrigger value="study">Study</TabsTrigger>
        <TabsTrigger value="messianic">Messianic</TabsTrigger>
        <TabsTrigger value="parallel">Parallel</TabsTrigger>
        <TabsTrigger value="backup-tunes">Backup Tunes</TabsTrigger>
        <TabsTrigger value="historical-tunes">Historical Tunes</TabsTrigger>
      </TabsList>

      {/* ── TAB: TUNE (mobile only — D-06) ────────────────────────────────── */}
      <TabsContent value="tune" className="space-y-6">
        {primaryTune ? (
          <>
            <div className="space-y-1">
              <p className="font-medium text-foreground">{primaryTune.name}</p>
              {primaryTune.meter && (
                <p className="text-sm text-muted-foreground">Meter: {primaryTune.meter}</p>
              )}
              {primaryTune.precentingComment && (
                <p className="text-sm text-muted-foreground">{primaryTune.precentingComment}</p>
              )}
            </div>
            {primaryTune.soundcloudUrl && (
              <iframe
                title={`SoundCloud: ${primaryTune.name}`}
                width="100%"
                height="96"
                allow="autoplay"
                sandbox="allow-scripts allow-same-origin"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(primaryTune.soundcloudUrl)}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false`}
                className="rounded-md border border-border"
              />
            )}
          </>
        ) : (
          <p className="text-muted-foreground italic">No tune assigned to this psalm.</p>
        )}
      </TabsContent>

      {/* ── TAB 1: OVERVIEW — metadata only (D-07) ────────────────────────── */}
      {/* NO lyrics. NO SoundCloud. Those live below the tabs in page.tsx.    */}
      <TabsContent value="overview" className="space-y-6">
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
      </TabsContent>

      {/* ── TAB 2: 365 DAYS ─────────────────────────────────────────────────── */}
      <TabsContent value="365days" className="space-y-6">
        {dailyEntry ? (
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
        ) : (
          <p className="text-muted-foreground italic">No reading plan entry for this psalm.</p>
        )}
      </TabsContent>

      {/* ── TAB 3: STUDY ────────────────────────────────────────────────────── */}
      <TabsContent value="study" className="space-y-6">
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
                className="text-primary underline underline-offset-2"
              >
                SermonAudio — Psalm {psalm.id}
              </a>
            </li>
            <li>
              <a
                href={`https://www.spurgeon.org/resource-library/treasury-of-david/psalm-${psalm.id}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Spurgeon&apos;s Treasury of David
              </a>
            </li>
            <li>
              <a
                href={`https://relight.app/psalm/${psalm.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Relight.app
              </a>
            </li>
          </ul>
        </section>
      </TabsContent>

      {/* ── TAB 4: MESSIANIC ────────────────────────────────────────────────── */}
      <TabsContent value="messianic" className="space-y-6">
        {messianic ? (
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
        ) : (
          <p className="text-muted-foreground italic">
            No messianic data recorded for this psalm.
          </p>
        )}
      </TabsContent>

      {/* ── TAB 5: PARALLEL ─────────────────────────────────────────────────── */}
      <TabsContent value="parallel" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Scottish Psalter
            </h2>
            {lyrics ? (
              <div className="space-y-3">
                {lyrics.split('\n\n').filter(Boolean).map((stanza, i) => {
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
              <p className="text-muted-foreground italic text-sm">
                No metrical lyrics available.
              </p>
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
      </TabsContent>

      {/* ── TAB 6: BACKUP TUNES ─────────────────────────────────────────────── */}
      <TabsContent value="backup-tunes" className="space-y-6">
        {backupTunes.length > 0 ? (
          <ul className="space-y-3">
            {backupTunes.map((tune) => (
              <li
                key={tune.id}
                className="flex items-center justify-between border-b border-border pb-2"
              >
                <span className="font-medium text-foreground">{tune.name}</span>
                {tune.meter && <Badge variant="outline">{tune.meter}</Badge>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground italic">
            No backup tunes recorded for this psalm.
          </p>
        )}
      </TabsContent>

      {/* ── TAB 7: HISTORICAL TUNES ─────────────────────────────────────────── */}
      <TabsContent value="historical-tunes" className="space-y-6">
        <p className="text-muted-foreground italic">No historical tunes recorded.</p>
      </TabsContent>
    </Tabs>
  )
}
