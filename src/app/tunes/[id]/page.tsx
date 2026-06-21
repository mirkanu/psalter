export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { fetchTuneDetail, fetchTuneIds } from "@/db/queries/tunes"
import { fetchPsalmsByMeter } from "@/db/queries/psalms"
import { deriveVersionSlug, stripStar } from "@/lib/psalm-slugs"
import { Badge } from "@/components/ui/badge"
import { NotationRendererClient } from "@/components/notation/NotationRendererClient"
import { TuneDetailClient } from "@/components/TuneDetailClient"
import { PsalmsByTuneSection } from "@/components/PsalmsByTuneSection"
import { deriveTuneJpgPages } from "@/lib/tune-jpg-urls"
import { sopranoOnly, pickAbcWithMarkers } from "@/lib/utils"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  try {
  const ids = await fetchTuneIds()
  return ids.map((id) => ({ id: String(id) }))
  } catch { return [] }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const tune = await fetchTuneDetail(Number(id))
  return {
    title: tune?.name ? `${tune.name} | CPRC Psalter Tunes` : `Tune ${id} | CPRC Psalter`,
  }
}

export default async function TunePage({ params }: PageProps) {
  const { id } = await params
  const tuneId = Number(id)
  if (!Number.isFinite(tuneId) || tuneId < 1) notFound()
  const tune = await fetchTuneDetail(tuneId)
  if (!tune) notFound()

  // Deduplicate by psalmVersion (not psalm) so 55a and 55b appear as separate cards
  interface VersionEntry {
    psalmVersionId: number
    id: number
    bibleTitle: string | null
    firstLine: string | null
    slug: string
    displayLabel: string
    isPrimary: boolean
  }
  const seenVersionIds = new Set<number>()
  const versionEntries: VersionEntry[] = []
  for (const pvt of tune.psalmVersionTunes) {
    const pv = pvt.psalmVersion
    const p = pv?.psalm
    if (!pv || p?.id == null || seenVersionIds.has(pv.id)) continue
    seenVersionIds.add(pv.id)
    const pn = pv.psalterNumber ?? ''
    const isMultiVersion = !!(pn.includes('First') || pn.includes('Second') || /\d+:\d+/.test(pn))
    const rawLabel = deriveVersionSlug(p.id, pv.psalterNumber ?? null, isMultiVersion)
    versionEntries.push({
      psalmVersionId: pv.id,
      id: p.id,
      bibleTitle: p.bibleTitle ?? null,
      firstLine: pv.firstLine ?? null,
      slug: stripStar(rawLabel),
      displayLabel: rawLabel,
      isPrimary: pvt.isPrimary ?? false,
    })
  }
  versionEntries.sort((a, b) => a.id - b.id || a.psalmVersionId - b.psalmVersionId)

  const recommendedPsalms = versionEntries.filter((e) => e.isPrimary)
  const otherPsalms = versionEntries.filter((e) => !e.isPrimary)

  // Derive staff and solfège JPEG pages from filesystem (DB columns are NULL for all tunes)
  const { staffPages, solfegePages } = deriveTuneJpgPages(tune.name)

  // All psalms with the same meter (for "Select different Psalm" dialog)
  const psalmsForMeter = tune.meter ? await fetchPsalmsByMeter(tune.meter) : []

  const moods = tune.tuneMoods.map((tm) => tm.mood.name).filter(Boolean) as string[]
  const rawAbc = pickAbcWithMarkers(tune.abcSatb, tune.abcNotation)
  const bestAbc = rawAbc ? sopranoOnly(rawAbc) : null
  const hasAbc = !!bestAbc
  const hasImages = staffPages.length > 0 || solfegePages.length > 0
  const hasAudio = !!(tune.soundcloudUrl || tune.youtubeUrl)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-8">

      {/* Title + meter badge */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Tune</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            {tune.name ?? `Tune ${tune.id}`}
          </h1>
          {tune.meter && (
            <Badge variant="secondary" className="text-base px-2.5 py-0.5">
              {tune.meter}
            </Badge>
          )}
        </div>
      </header>

      {/* Metadata — only render non-empty fields */}
      {(moods.length > 0 || tune.numberIn1979RpPsalter || tune.numInPrcaPsalter || tune.precentingComment || (tune.hasFamousHymn && tune.famousHymn)) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {moods.length > 0 && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-36 shrink-0">Mood</span>
              <span>{moods.join(', ')}</span>
            </div>
          )}
          {tune.numberIn1979RpPsalter && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-36 shrink-0">RP Psalter (1979)</span>
              <span>#{tune.numberIn1979RpPsalter}</span>
            </div>
          )}
          {tune.numInPrcaPsalter && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-36 shrink-0">PR Psalter</span>
              <span>#{tune.numInPrcaPsalter}</span>
            </div>
          )}
          {tune.hasFamousHymn && tune.famousHymn && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-36 shrink-0">Famous hymn</span>
              <span>{tune.famousHymn}</span>
            </div>
          )}
          {tune.precentingComment && (
            <div className="flex gap-2 sm:col-span-2">
              <span className="text-muted-foreground w-36 shrink-0">Precenting notes</span>
              <span className="text-foreground">{tune.precentingComment}</span>
            </div>
          )}
        </section>
      )}

      {/* Score — ABC notation with interactive player */}
      {hasAbc && (() => {
        const firstLinkedPsalmVersion = tune.psalmVersionTunes?.[0]?.psalmVersion ?? null
        const tunesLyrics = firstLinkedPsalmVersion?.lyricsImportedRaw ?? ''
        return (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Score
            </h2>
            <NotationRendererClient
              abc={bestAbc!}
              lyrics={tunesLyrics}
              scoreJpgUrl={staffPages[0] ?? null}
              solfegeJpgUrl={solfegePages[0] ?? null}
              tuneName={tune.name ?? `Tune ${tune.id}`}
              tuneMeter={tune.meter ?? null}
              phraseShapeOverride={tune.phraseShapeOverride ?? null}
              stanzaMeter={firstLinkedPsalmVersion?.meter ?? null}
              lyricsStructured={(firstLinkedPsalmVersion?.lyricsStructured ?? null) as import('@/lib/lyrics-structured').StructuredLyrics | null}
              doubleLength={tune.doubleLength ?? false}
              showLyrics={false}
            />
          </section>
        )
      })()}

      {/* Score — image-based with Staff/Solfège tabs, multi-page arrows, play button */}
      {!hasAbc && (hasImages || hasAudio) && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Score
          </h2>
          <TuneDetailClient
            tuneName={tune.name ?? `Tune ${tune.id}`}
            staffPages={staffPages}
            solfegePages={solfegePages}
            soundcloudUrl={tune.soundcloudUrl}
            youtubeUrl={tune.youtubeUrl}
          />
        </section>
      )}

      {/* For ABC tunes that also have audio: show play button below notation */}
      {hasAbc && hasAudio && (
        <section>
          <TuneDetailClient
            tuneName={tune.name ?? `Tune ${tune.id}`}
            staffPages={[]}
            solfegePages={solfegePages}
            soundcloudUrl={tune.soundcloudUrl}
            youtubeUrl={tune.youtubeUrl}
          />
        </section>
      )}

      {/* Sing this tune — recommended + other psalms */}
      <PsalmsByTuneSection
        recommendedPsalms={recommendedPsalms}
        otherPsalms={otherPsalms}
        psalmsForMeter={psalmsForMeter}
        tuneId={tuneId}
        meter={tune.meter}
      />
    </div>
  )
}
