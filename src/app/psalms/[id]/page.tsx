import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchPsalmDetail, fetchPsalmIds } from '@/db/queries/psalms'
import { PsalmTabs } from '@/components/PsalmTabs'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const ids = await fetchPsalmIds()
  return ids.map((id) => ({ id: String(id) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const psalm = await fetchPsalmDetail(Number(id))
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

  // Derive primary tune and lyrics for below-tabs section
  const allPvts = psalm.psalmVersions.flatMap((pv) => pv.psalmVersionTunes)
  const primaryTune = allPvts.find((pvt) => pvt.isPrimary)?.tune ?? allPvts[0]?.tune ?? null
  const primaryVersion = psalm.psalmVersions.slice().sort((a, b) => a.id - b.id)[0] ?? null
  const lyrics = primaryVersion?.lyrics ?? null

  // Split lyrics into stanzas for display
  const stanzas = lyrics
    ? lyrics.split('\n\n').map((s) => s.trim()).filter(Boolean)
    : []

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

      {/* Tab strip + tab content (D-04/D-05: 7 desktop / 8 mobile tabs) */}
      <PsalmTabs psalm={psalm} primaryTune={primaryTune} />

      {/* ── Below-tabs always-visible section (D-01/D-02/D-03) ──────────── */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">

        {/* Left column: lyrics heading + stanzas + notation player slot (D-01) */}
        <div>
          {stanzas.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Metrical Lyrics
              </h2>
              <div className="space-y-4 mb-6">
                {stanzas.map((stanza, i) => (
                  <p
                    key={i}
                    className="text-foreground leading-relaxed whitespace-pre-line"
                  >
                    {stanza}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* NOTATION PLAYER SLOT — PsalmNotationPlayer wired here in Plan 03 */}
          {primaryTune && (
            <div className="mt-2 p-4 border border-dashed border-muted-foreground/30 rounded-md text-muted-foreground text-sm">
              Notation player (coming in Plan 03)
            </div>
          )}
        </div>

        {/* Right column: SoundCloud embed — hidden on mobile (D-03: SoundCloud is in Tune tab on mobile) */}
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
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(primaryTune.soundcloudUrl)}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false`}
              className="rounded-md border border-border"
            />
          </div>
        )}
      </div>
    </div>
  )
}
