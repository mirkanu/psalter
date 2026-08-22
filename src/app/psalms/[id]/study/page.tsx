export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { db } from '@/db'
import { psalms, psalmVersions } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import { fetchPsalmDetail } from '@/db/queries/psalms'
import { fetchNavesTopicsWithCounts, fetchAllTopicsWithCounts } from '@/db/queries/explore'
import { PsalmTabs } from '@/components/PsalmTabs'
import { PsalmNav } from '@/components/PsalmNav'
import { parseSlug, deriveVersionSlug, stripStar, slugToDisplayTitle } from '@/lib/psalm-slugs'
import { buildNavesSlugMap } from '@/lib/naves-slugs'
import { buildTopicSlugMap } from '@/lib/topic-slugs'
import { getPsalmNeighbors } from '@/lib/psalm-navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  try {
  // Same enumeration as /psalms/[id]/page.tsx — verbatim duplication is
  // intentional so /study has its own static-param surface.
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
    if (isMulti) slugs.add(String(row.psalmId))
  }
  return Array.from(slugs).map((slug) => ({ id: slug }))
  } catch { return [] }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: slug } = await params
  const parsed = parseSlug(slug)
  if (!parsed) return { title: `Psalm ${slug} — Study | CPRC Psalter` }
  const psalm = await fetchPsalmDetail(parsed.psalmId)
  const displayTitle = slugToDisplayTitle(slug)
  return {
    title: psalm?.bibleTitle
      ? `${psalm.bibleTitle} — Study | CPRC Psalter`
      : `Psalm ${displayTitle} — Study | CPRC Psalter`,
  }
}

export default async function PsalmStudyPage({ params }: PageProps) {
  const { id: slug } = await params
  const parsed = parseSlug(slug)
  if (!parsed) notFound()

  const { psalmId, versionLetter, verseRange } = parsed
  if (!Number.isFinite(psalmId) || psalmId < 1 || psalmId > 150) notFound()

  const psalm = await fetchPsalmDetail(psalmId)
  if (!psalm) notFound()

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

  const rawTune =
    activeVersion?.psalmVersionTunes.find((pvt) => pvt.isPrimary)?.tune ??
    activeVersion?.psalmVersionTunes[0]?.tune ??
    null
  const isPlaceholderTune = !!rawTune?.name?.toLowerCase().includes('aots')
  const primaryTune = isPlaceholderTune ? null : rawTune

  let recommendedVersionSlug: string | null = null
  if (isPlaceholderTune && psalm.psalmVersions.length > 1) {
    const recVersion = psalm.psalmVersions.find(
      (v) => v.psalterNumber?.includes('Recommended') && v.id !== activeVersion?.id,
    )
    if (recVersion) {
      const rawLabel = deriveVersionSlug(psalmId, recVersion.psalterNumber, true)
      recommendedVersionSlug = stripStar(rawLabel)
    }
  }

  const navesTopicRows = await fetchNavesTopicsWithCounts()
  const navesSlugMap = Object.fromEntries(buildNavesSlugMap(navesTopicRows))

  const topicRows = await fetchAllTopicsWithCounts()
  const topicSlugMap = Object.fromEntries(
    buildTopicSlugMap(topicRows.filter((t): t is typeof t & { name: string } => t.name !== null)),
  )

  const displayTitle = slugToDisplayTitle(slug)
  const { prev, next } = await getPsalmNeighbors(slug)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-4">
        <Link
          href={`/psalms/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors active:bg-muted active:translate-y-px transition-all duration-75"
          data-testid="study-back-to-singing"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to singing view</span>
        </Link>
      </div>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            Psalm {displayTitle} — Study
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
        activeVersionId={activeVersion?.id}
        recommendedVersionSlug={recommendedVersionSlug}
        navesSlugMap={navesSlugMap}
        topicSlugMap={topicSlugMap}
      />
    </div>
  )
}
