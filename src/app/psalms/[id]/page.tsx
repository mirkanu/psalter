import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db'
import { psalms, psalmVersions } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import { fetchPsalmDetail } from '@/db/queries/psalms'
import { fetchTunesByMeter } from '@/db/queries/tunes'
import { PsalmTabs } from '@/components/PsalmTabs'
import { PsalmNav } from '@/components/PsalmNav'
import { parseSlug, deriveVersionSlug, stripStar, slugToDisplayTitle } from '@/lib/psalm-slugs'
import { deriveTuneJpgPages } from '@/lib/tune-jpg-urls'
import { getPsalmNeighbors } from '@/lib/psalm-navigation'

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
  const rawTune =
    activeVersion?.psalmVersionTunes.find((pvt) => pvt.isPrimary)?.tune ??
    activeVersion?.psalmVersionTunes[0]?.tune ??
    null

  // Detect placeholder tunes ("use aots..." / "do NOT use aots...")
  const isPlaceholderTune = !!rawTune?.name?.toLowerCase().includes('aots')
  const primaryTune = isPlaceholderTune ? null : rawTune

  // If placeholder, find the recommended version and compute its slug
  let recommendedVersionSlug: string | null = null
  if (isPlaceholderTune && psalm.psalmVersions.length > 1) {
    const recVersion = psalm.psalmVersions.find(
      (v) => v.psalterNumber?.includes('Recommended') && v.id !== activeVersion?.id
    )
    if (recVersion) {
      const rawLabel = deriveVersionSlug(psalmId, recVersion.psalterNumber, true)
      recommendedVersionSlug = stripStar(rawLabel)
    }
  }

  // Fetch alternate tunes matching the active version's meter
  const primaryMeter = activeVersion?.meter ?? rawTune?.meter ?? null
  const rawAlternateTunes = primaryMeter ? await fetchTunesByMeter(primaryMeter) : []

  // Enrich alternate tunes with filesystem-derived JPEG URLs (DB columns are NULL)
  const alternateTunes = rawAlternateTunes.map((t) => {
    const { staffPages, solfegePages } = deriveTuneJpgPages(t.name)
    return {
      ...t,
      scoreJpgUrl: staffPages[0] ?? t.scoreJpgUrl,
      solfegeJpgUrl: solfegePages[0] ?? t.solfegeJpgUrl,
    }
  })

  // Derive JPEG URLs for the primary tune from filesystem
  const primaryTuneDerivedStaffUrl = primaryTune
    ? (deriveTuneJpgPages(primaryTune.name).staffPages[0] ?? null)
    : null
  const primaryTuneDerivedSolfegeUrl = primaryTune
    ? (deriveTuneJpgPages(primaryTune.name).solfegePages[0] ?? null)
    : null

  const displayTitle = slugToDisplayTitle(slug)
  const { prev, next } = await getPsalmNeighbors(slug)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            Psalm {displayTitle}
          </h1>
          <PsalmNav prev={prev} next={next} />
        </div>
        {psalm.bibleTitle && (
          <p className="text-sm md:text-base text-muted-foreground mt-3">
            {psalm.bibleTitle}
          </p>
        )}
      </div>

      <PsalmTabs
        psalm={psalm}
        primaryTune={primaryTune}
        primaryTuneDerivedStaffUrl={primaryTuneDerivedStaffUrl}
        primaryTuneDerivedSolfegeUrl={primaryTuneDerivedSolfegeUrl}
        alternateTunes={alternateTunes}
        activeVersionId={activeVersion?.id}
        recommendedVersionSlug={recommendedVersionSlug}
      />
    </div>
  )
}
