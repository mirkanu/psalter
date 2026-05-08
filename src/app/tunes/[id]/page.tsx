import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { fetchTuneDetail, fetchTuneIds } from "@/db/queries/tunes"
import { YouTubeEmbed } from "@/components/YouTubeEmbed"
import { Badge } from "@/components/ui/badge"
import { AbcNotationSection } from "@/components/AbcNotationSection"
import { toEmbedUrl } from "@/lib/youtube"

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

  const youtubeUrl = tune.youtubeUrl

  function isSafeExternalUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'https:' || parsed.protocol === 'http:'
    } catch {
      return false
    }
  }

  const isYouTube = youtubeUrl != null && toEmbedUrl(youtubeUrl) !== null
  const isOtherMedia = youtubeUrl != null && !isYouTube && isSafeExternalUrl(youtubeUrl)

  // Deduplicate psalm references (a tune can be linked from multiple versions of the same psalm)
  const psalmsUsingTune = new Map<number, string>()
  for (const pvt of tune.psalmVersionTunes) {
    const p = pvt.psalmVersion?.psalm
    if (p?.id != null) {
      psalmsUsingTune.set(p.id, p.bibleTitle ?? `Psalm ${p.id}`)
    }
  }
  const psalmList = Array.from(psalmsUsingTune.entries()).sort(([a], [b]) => a - b)

  // TUNE-03 second part: render verses 2+ as numbered stanzas below the notation.
  // Choose the first linked psalmVersion (by id) with non-empty lyrics — same source used by Plan 02 for verse 1 in the ABC w: field.
  const sortedPvts = [...tune.psalmVersionTunes].sort(
    (a, b) => (a.psalmVersion?.id ?? 0) - (b.psalmVersion?.id ?? 0)
  )
  const lyricsSource = sortedPvts.find((pvt) => pvt.psalmVersion?.lyrics)?.psalmVersion?.lyrics ?? null
  const allStanzas = lyricsSource
    ? lyricsSource.split('\n\n').map((s) => s.trim()).filter(Boolean)
    : []
  // When ABC notation is present, verse 1 appears under the staff via w: fields → show verses 2+.
  // When no ABC, verse 1 would be invisible if we skip it → show all stanzas.
  const stanzasToShow = allStanzas
    .slice(tune.abcNotation ? 1 : 0)
    .map((s) => s.replace(/^\d+\s+/, '').trim())

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-8">
      <header className="flex items-baseline gap-3 flex-wrap">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">
          {tune.name ?? `Tune ${tune.id}`}
        </h1>
        {tune.meter && <Badge variant="secondary">{tune.meter}</Badge>}
      </header>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Score
        </h2>
        {tune.abcNotation ? (
          <AbcNotationSection abc={tune.abcNotation} title={tune.name ?? undefined} />
        ) : tune.scoreJpgUrl ? (
          <div className="relative w-full max-w-2xl mx-auto aspect-[3/2]">
            <Image
              src={tune.scoreJpgUrl}
              alt={`Score for ${tune.name ?? `tune ${tune.id}`}`}
              fill
              className="object-contain rounded-md border border-border"
            />
          </div>
        ) : (
          <p className="text-muted-foreground italic">Score image not yet available.</p>
        )}
      </section>

      {stanzasToShow.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Verses
          </h2>
          <ol
            start={tune.abcNotation ? 2 : 1}
            className="list-decimal list-outside pl-8 space-y-4 max-w-3xl mx-auto"
          >
            {stanzasToShow.map((stanza, idx) => (
              <li key={idx + (tune.abcNotation ? 2 : 1)} className="text-foreground leading-relaxed">
                {stanza.split('\n').map((line, lineIdx) => (
                  <span key={lineIdx} className="block">
                    {line}
                  </span>
                ))}
              </li>
            ))}
          </ol>
        </section>
      )}

      {isYouTube && youtubeUrl && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Listen
          </h2>
          <YouTubeEmbed url={youtubeUrl} title={`Listen: ${tune.name ?? `tune ${tune.id}`}`} />
        </section>
      )}

      {isOtherMedia && youtubeUrl && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            External recording
          </h2>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline break-all"
          >
            {youtubeUrl}
          </a>
        </section>
      )}

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
    </div>
  )
}
