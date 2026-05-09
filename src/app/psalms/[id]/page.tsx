import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchPsalmDetail, fetchPsalmIds } from '@/db/queries/psalms'
import { PsalmTabs } from '@/components/PsalmTabs'
import { PsalmNotationPlayerClient } from '@/components/PsalmNotationPlayerClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const ids = await fetchPsalmIds()
  return ids.map((id) => ({ id: String(id) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const psalmId = Number(id)
  if (!Number.isFinite(psalmId) || psalmId < 1 || psalmId > 150) {
    return { title: `Psalm ${id} | CPRC Psalter` }
  }
  const psalm = await fetchPsalmDetail(psalmId)
  return {
    title: psalm?.bibleTitle
      ? `${psalm.bibleTitle} | CPRC Psalter`
      : `Psalm ${id} | CPRC Psalter`,
  }
}

export default async function PsalmPage({ params }: PageProps) {
  const { id } = await params
  const psalmId = Number(id)
  if (!Number.isFinite(psalmId) || psalmId < 1 || psalmId > 150) notFound()
  const psalm = await fetchPsalmDetail(psalmId)
  if (!psalm) notFound()

  // Derive primary tune and lyrics
  const allPvts = psalm.psalmVersions.flatMap((pv) => pv.psalmVersionTunes)
  const primaryTune = allPvts.find((pvt) => pvt.isPrimary)?.tune ?? allPvts[0]?.tune ?? null
  const primaryVersion = psalm.psalmVersions.slice().sort((a, b) => a.id - b.id)[0] ?? null
  const lyrics = primaryVersion?.lyrics ?? null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Psalm header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          Psalm {psalm.id}
        </span>
      </div>
      <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
        {psalm.bibleTitle ?? `Psalm ${psalm.id}`}
      </h1>

      {/* Notation section FIRST (D-01) — 2-col desktop (D-02) */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 mb-8">
        <div>
          {primaryTune ? (
            <PsalmNotationPlayerClient
              abc={primaryTune.abcNotation ?? null}
              lyrics={lyrics ?? ''}
              solfegeJpgUrl={primaryTune.solfegeJpgUrl ?? null}
              tuneName={primaryTune.name}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No notation available for this psalm.
            </p>
          )}
        </div>
        {primaryTune?.soundcloudUrl && (
          <div className="hidden md:block">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Listen
            </h2>
            <iframe
              title={`SoundCloud: ${primaryTune.name}`}
              width="100%"
              height="96"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(primaryTune.soundcloudUrl)}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false`}
              className="rounded-md border border-border"
            />
          </div>
        )}
      </div>

      {/* Divider between notation and tabs */}
      <hr className="border-border mb-8" />

      {/* Tab section BELOW (D-01) */}
      <PsalmTabs psalm={psalm} primaryTune={primaryTune} />
    </div>
  )
}
