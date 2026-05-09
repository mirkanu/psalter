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
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Psalm header — number is main title, bibleTitle is subtitle */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">
          Psalm {psalm.id}
        </h1>
        {psalm.bibleTitle && (
          <p className="text-base md:text-lg text-muted-foreground mt-1">
            {psalm.bibleTitle}
          </p>
        )}
      </div>

      {/* Sing + Tabs: split on desktop/landscape, stacked on mobile */}
      <PsalmTabs psalm={psalm} primaryTune={primaryTune} />
    </div>
  )
}
