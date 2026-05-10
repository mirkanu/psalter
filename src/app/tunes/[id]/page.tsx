import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { fetchTuneDetail, fetchTuneIds } from "@/db/queries/tunes"
import { fetchPsalmsByMeter } from "@/db/queries/psalms"
import { Badge } from "@/components/ui/badge"
import { AbcNotationSection } from "@/components/AbcNotationSection"
import { TuneDetailClient } from "@/components/TuneDetailClient"
import { Button } from "@/components/ui/button"

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

  // Psalms using this tune (deduplicated)
  const psalmsUsingTune = new Map<number, string>()
  for (const pvt of tune.psalmVersionTunes) {
    const p = pvt.psalmVersion?.psalm
    if (p?.id != null) {
      psalmsUsingTune.set(p.id, p.bibleTitle ?? `Psalm ${p.id}`)
    }
  }
  const psalmList = Array.from(psalmsUsingTune.entries()).sort(([a], [b]) => a - b)

  // Multi-page score images: primary + additional pages
  const additionalUrls: string[] = Array.isArray(tune.additionalScoreUrls)
    ? (tune.additionalScoreUrls as string[]).filter((u) => typeof u === 'string')
    : []
  const staffPages = tune.scoreJpgUrl
    ? [tune.scoreJpgUrl, ...additionalUrls]
    : additionalUrls
  const solfegePages = tune.solfegeJpgUrl ? [tune.solfegeJpgUrl] : []

  // Psalms with the same meter for "Select Psalm" dialog
  const psalmsForMeter = tune.meter ? await fetchPsalmsByMeter(tune.meter) : []

  // Moods
  const moods = tune.tuneMoods.map((tm) => tm.mood.name).filter(Boolean) as string[]

  const hasAbc = !!(tune.abcNotation?.trim())
  const hasImages = staffPages.length > 0 || solfegePages.length > 0

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

      {/* Metadata */}
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

      {/* Score — ABC notation (with built-in staff renderer) */}
      {hasAbc && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Score
          </h2>
          <AbcNotationSection abc={tune.abcNotation!} title={tune.name ?? undefined} />
        </section>
      )}

      {/* Score — image-based (staff + solfege tabs, multi-page, play button) */}
      {!hasAbc && (hasImages || tune.soundcloudUrl || tune.youtubeUrl) && (
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
            psalmsForMeter={psalmsForMeter}
            meter={tune.meter}
          />
        </section>
      )}

      {/* ABC tunes: play button + select psalm below the notation */}
      {hasAbc && (tune.soundcloudUrl || tune.youtubeUrl) && (
        <section>
          <TuneDetailClient
            tuneName={tune.name ?? `Tune ${tune.id}`}
            staffPages={[]}
            solfegePages={solfegePages}
            soundcloudUrl={tune.soundcloudUrl}
            youtubeUrl={tune.youtubeUrl}
            psalmsForMeter={psalmsForMeter}
            meter={tune.meter}
          />
        </section>
      )}

      {/* Psalms using this tune */}
      {psalmList.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Psalms using this tune
          </h2>
          <ul className="flex flex-wrap gap-2">
            {psalmList.map(([psalmId, title]) => (
              <li key={psalmId}>
                <Link
                  href={`/psalms/${psalmId}`}
                  className="inline-flex items-center px-3 py-1 rounded-md border border-border bg-card hover:border-primary hover:text-primary transition-colors text-sm"
                >
                  <span className="font-mono mr-2 text-muted-foreground">{psalmId}</span>
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* "Select Psalm" for ABC-only tunes that have no audio player shown above */}
      {hasAbc && !tune.soundcloudUrl && !tune.youtubeUrl && psalmsForMeter.length > 0 && (
        <section>
          <TuneDetailClient
            tuneName={tune.name ?? `Tune ${tune.id}`}
            staffPages={[]}
            solfegePages={[]}
            soundcloudUrl={null}
            youtubeUrl={null}
            psalmsForMeter={psalmsForMeter}
            meter={tune.meter}
          />
        </section>
      )}
    </div>
  )
}
