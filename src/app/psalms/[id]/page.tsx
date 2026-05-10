import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db'
import { psalms, psalmVersions } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import { fetchPsalmDetail } from '@/db/queries/psalms'
import { fetchTunesByMeter } from '@/db/queries/tunes'
import { PsalmTabs } from '@/components/PsalmTabs'
import { parseSlug, deriveVersionSlug, stripStar, slugToDisplayTitle } from '@/lib/psalm-slugs'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const rows = await db
    .select({ psalmId: psalms.id, psalterNumber: psalmVersions.psalterNumber })
    .from(psalms)
    .leftJoin(psalmVersions, eq(psalmVersions.psalmId, psalms.id))
    .orderBy(asc(psalms.id), asc(psalmVersions.id))

  const countById = new Map<number, number>()
  for (const row of rows) {
    if (row.psalmId) countById.set(row.psalmId, (countById.get(row.psalmId) ?? 0) + 1)
  }

  const slugs = new Set<string>()
  for (const row of rows) {
    if (!row.psalmId) continue
    const isMulti = (countById.get(row.psalmId) ?? 1) > 1
    const rawLabel = deriveVersionSlug(row.psalmId, row.psalterNumber, isMulti)
    slugs.add(stripStar(rawLabel))
    // Backward-compat numeric slug for multi-version psalms
    if (isMulti) slugs.add(String(row.psalmId))
  }

  return Array.from(slugs).map((slug) => ({ id: slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: slug } = await params
  const parsed = parseSlug(slug)
  if (!parsed) return { title: `Psalm ${slug} | CPRC Psalter` }
  const { psalmId } = parsed
  const psalm = await fetchPsalmDetail(psalmId)
  const displayTitle = slugToDisplayTitle(slug)
  return {
    title: psalm?.bibleTitle
      ? `${psalm.bibleTitle} | CPRC Psalter`
      : `Psalm ${displayTitle} | CPRC Psalter`,
  }
}

export default async function PsalmPage({ params }: PageProps) {
  const { id: slug } = await params
  const parsed = parseSlug(slug)
  if (!parsed) notFound()

  const { psalmId, versionLetter, verseRange } = parsed
  if (!Number.isFinite(psalmId) || psalmId < 1 || psalmId > 150) notFound()

  const psalm = await fetchPsalmDetail(psalmId)
  if (!psalm) notFound()

  // Find the active version based on the slug
  const sortedVersions = psalm.psalmVersions.slice().sort((a, b) => a.id - b.id)
  let activeVersion = sortedVersions[0] ?? null

  if (versionLetter === 'a') {
    activeVersion =
      psalm.psalmVersions.find((v) => v.psalterNumber?.includes('First')) ??
      sortedVersions[0] ??
      null
  } else if (versionLetter === 'b') {
    activeVersion =
      psalm.psalmVersions.find((v) => v.psalterNumber?.includes('Second')) ??
      sortedVersions[1] ??
      sortedVersions[0] ??
      null
  } else if (verseRange) {
    activeVersion =
      psalm.psalmVersions.find((v) => v.psalterNumber?.includes(`${psalmId}:${verseRange}`)) ??
      sortedVersions[0] ??
      null
  }

  // Derive primary tune from the active version
  const primaryTune =
    activeVersion?.psalmVersionTunes.find((pvt) => pvt.isPrimary)?.tune ??
    activeVersion?.psalmVersionTunes[0]?.tune ??
    null

  // Fetch alternate tunes matching the active version's meter
  const primaryMeter = activeVersion?.meter ?? primaryTune?.meter ?? null
  const alternateTunes = primaryMeter ? await fetchTunesByMeter(primaryMeter) : []

  const displayTitle = slugToDisplayTitle(slug)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">
          Psalm {displayTitle}
        </h1>
        {psalm.bibleTitle && (
          <p className="text-base md:text-lg text-muted-foreground mt-1">
            {psalm.bibleTitle}
          </p>
        )}
      </div>

      <PsalmTabs
        psalm={psalm}
        primaryTune={primaryTune}
        alternateTunes={alternateTunes}
        activeVersionId={activeVersion?.id}
      />
    </div>
  )
}
