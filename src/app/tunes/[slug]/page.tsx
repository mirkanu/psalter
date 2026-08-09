export const dynamic = 'force-dynamic'
import { notFound, permanentRedirect } from "next/navigation"
import type { Metadata } from "next"
import { fetchTuneDetail, fetchTuneBySlug, fetchTuneSlugs } from "@/db/queries/tunes"
import { fetchPsalmsByMeter, fetchPsalmListRows } from "@/db/queries/psalms"
import { deriveVersionSlug, stripStar } from "@/lib/psalm-slugs"
import { tuneNameToSlug, isNumericTuneSlug } from "@/lib/tune-slug"
import { Badge } from "@/components/ui/badge"
import { TuneDetailClient } from "@/components/TuneDetailClient"
import { PsalmsByTuneSection } from "@/components/PsalmsByTuneSection"
import { TuneMiniBarSection } from "@/components/TuneMiniBarSection"
import { TuneScoreSection } from "@/components/TuneScoreSection"
import { deriveTuneJpgPages } from "@/lib/tune-jpg-urls"
import { sopranoOnly, pickAbcWithMarkers } from "@/lib/utils"
import { buildNotationRendererProps } from "@/lib/notation-renderer-props"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const slugs = await fetchTuneSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch { return [] }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tune = isNumericTuneSlug(slug)
    ? await fetchTuneDetail(Number(slug))
    : await fetchTuneBySlug(slug)
  return {
    title: tune?.name ? `${tune.name} | CPRC Psalter Tunes` : `Tune | CPRC Psalter`,
  }
}

export default async function TunePage({ params }: PageProps) {
  const { slug } = await params

  // TUNE-05: legacy numeric ids (/tunes/169) permanently redirect to the name-based slug.
  // src/middleware.ts is the primary mechanism (issues a real HTTP 308 before any rendering
  // starts) — this branch only runs as a fallback for the WR-01 edge case where a tune name
  // itself slugifies to a bare integer, which middleware deliberately leaves unhandled to
  // avoid redirecting into another numeric-looking path. The redirect target is derived
  // server-side from the DB-looked-up tune name — never from the request — so there is no
  // open-redirect surface. isNumericTuneSlug is a strict /^\d+$/ test, so anything else falls
  // through to the slug lookup.
  if (isNumericTuneSlug(slug)) {
    const legacyId = Number(slug)
    if (!Number.isFinite(legacyId) || legacyId < 1) notFound()
    const legacyTune = await fetchTuneDetail(legacyId)
    if (!legacyTune) notFound()
    permanentRedirect(`/tunes/${tuneNameToSlug(legacyTune.name)}`)
  }

  const tune = await fetchTuneBySlug(slug)
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
  const allPsalmRows = await fetchPsalmListRows()

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
            <TuneScoreSection
              notationProps={buildNotationRendererProps(
                {
                  abcNotation: tune.abcNotation ?? null,
                  abcSatb: tune.abcSatb ?? null,
                  name: tune.name ?? null,
                  meter: tune.meter ?? null,
                  phraseShapeOverride: tune.phraseShapeOverride ?? null,
                  doubleLength: tune.doubleLength ?? false,
                  // D-02: solfegeOcrText was MISSING at this call site before Phase 11.
                  solfegeOcrText: tune.solfegeOcrText ?? null,
                  // Note: JPG urls come from the filesystem-derived page arrays, not the
                  // (always-NULL) DB columns — see src/lib/tune-jpg-urls.ts.
                  scoreJpgUrl: staffPages[0] ?? null,
                  solfegeJpgUrl: solfegePages[0] ?? null,
                },
                {
                  lyrics: tunesLyrics,
                  stanzaMeter: firstLinkedPsalmVersion?.meter ?? null,
                  lyricsStructured: (firstLinkedPsalmVersion?.lyricsStructured ?? null) as import('@/lib/lyrics-structured').StructuredLyrics | null,
                },
                // showLyrics stays false: /tunes/[slug] is a tune-only page and never shows lyrics (D-02, UI-SPEC §Patterns 4).
                // onViewModeChange is deliberately NOT passed here — an RSC cannot serialise a function across the
                // client boundary; TuneScoreSection attaches it, which is where D-02's second prop is satisfied.
                { showLyrics: false, fallbackTuneName: `Tune ${tune.id}` },
              )}
              staffPages={staffPages}
              solfegePages={solfegePages}
            />
            <TuneMiniBarSection
              abc={bestAbc!}
              soundcloudUrl={tune.soundcloudUrl ?? null}
              tuneName={tune.name ?? `Tune ${tune.id}`}
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
        allPsalmRows={allPsalmRows}
        tuneId={tune.id}
        meter={tune.meter}
      />
    </div>
  )
}
