import { existsSync } from "fs"
import { join } from "path"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { fetchTuneDetail, fetchTuneIds } from "@/db/queries/tunes"
import { fetchPsalmsByMeter } from "@/db/queries/psalms"
import { Badge } from "@/components/ui/badge"
import { AbcNotationSection } from "@/components/AbcNotationSection"
import { TuneDetailClient } from "@/components/TuneDetailClient"
import { PsalmsByTuneSection } from "@/components/PsalmsByTuneSection"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const ids = await fetchTuneIds()
  return ids.map((id) => ({ id: String(id) }))
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

  // Deduplicate psalms using this tune, collecting firstLine from any linked version
  const psalmsMap = new Map<number, { bibleTitle: string | null; firstLine: string | null }>()
  for (const pvt of tune.psalmVersionTunes) {
    const p = pvt.psalmVersion?.psalm
    if (p?.id != null && !psalmsMap.has(p.id)) {
      psalmsMap.set(p.id, {
        bibleTitle: p.bibleTitle ?? null,
        firstLine: pvt.psalmVersion?.firstLine ?? null,
      })
    }
  }
  const psalmList = Array.from(psalmsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([id, data]) => ({ id, ...data }))

  // Multi-page score images
  const additionalUrls: string[] = Array.isArray(tune.additionalScoreUrls)
    ? (tune.additionalScoreUrls as string[]).filter((u): u is string => typeof u === 'string')
    : []
  const staffPages = tune.scoreJpgUrl ? [tune.scoreJpgUrl, ...additionalUrls] : additionalUrls

  // Derive solfege additional pages from staff pattern (e.g. -staff-1.jpg → -solfege-1.jpg)
  // check filesystem at build time to confirm the file exists before including
  const solfegeAdditional = additionalUrls
    .map((u) => u.replace('-staff-', '-solfege-'))
    .filter((u) => existsSync(join(process.cwd(), 'public', u)))
  const solfegePages = [
    ...(tune.solfegeJpgUrl ? [tune.solfegeJpgUrl] : []),
    ...solfegeAdditional,
  ]

  // All psalms with the same meter (for "Select different Psalm" dialog)
  const psalmsForMeter = tune.meter ? await fetchPsalmsByMeter(tune.meter) : []

  const moods = tune.tuneMoods.map((tm) => tm.mood.name).filter(Boolean) as string[]
  const hasAbc = !!(tune.abcNotation?.trim())
  const hasImages = staffPages.length > 0 || solfegePages.length > 0
  const hasAudio = !!(tune.soundcloudUrl || tune.youtubeUrl)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-8">

      {/* Title + meter badge */}
      <header className="flex items-baseline gap-3 flex-wrap">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">
          {tune.name ?? `Tune ${tune.id}`}
        </h1>
        {tune.meter && (
          <Badge variant="secondary" className="text-base px-2.5 py-0.5">
            {tune.meter}
          </Badge>
        )}
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

      {/* Score — ABC notation */}
      {hasAbc && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Score
          </h2>
          <AbcNotationSection abc={tune.abcNotation!} title={tune.name ?? undefined} />
        </section>
      )}

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

      {/* Psalms using this tune — card grid with first line + "Select different Psalm" */}
      {psalmList.length > 0 && (
        <PsalmsByTuneSection
          psalms={psalmList}
          psalmsForMeter={psalmsForMeter}
          tuneId={tuneId}
          meter={tune.meter}
        />
      )}
    </div>
  )
}
