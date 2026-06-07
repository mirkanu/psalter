export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db'
import { psalms, psalmVersions } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import {
  fetchPsalmDetail,
  getEditoriallyLinkedTuneIdsForPsalm,
  fetchPsalmListRows,
} from '@/db/queries/psalms'
import { fetchTunesByMeter } from '@/db/queries/tunes'
import { SingingView } from '@/components/singing/SingingView'
import { parseSlug, deriveVersionSlug, stripStar, slugToDisplayTitle } from '@/lib/psalm-slugs'
import { deriveTuneJpgPages } from '@/lib/tune-jpg-urls'
import { getPsalmNeighbors } from '@/lib/psalm-navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  try {
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
  } catch { return [] }
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

  // Find the active version based on the slug — verbatim from prior version
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
  const isPlaceholderTune = !!rawTune?.name?.toLowerCase().includes('aots')
  const primaryTuneRow = isPlaceholderTune ? null : rawTune

  const primaryMeter = activeVersion?.meter ?? rawTune?.meter ?? null
  const rawAlternateTunes = primaryMeter ? await fetchTunesByMeter(primaryMeter) : []
  const alternateTunes = rawAlternateTunes.map((t) => {
    const { staffPages, solfegePages } = deriveTuneJpgPages(t.name)
    return {
      ...t,
      scoreJpgUrl: staffPages[0] ?? t.scoreJpgUrl,
      solfegeJpgUrl: solfegePages[0] ?? t.solfegeJpgUrl,
    }
  })

  // Wrap primaryTune in TuneOption (AlternateTune) shape — used uniformly by SingingView
  const primaryTune = primaryTuneRow
    ? (() => {
        const { staffPages, solfegePages } = deriveTuneJpgPages(primaryTuneRow.name)
        return {
          id: primaryTuneRow.id,
          name: primaryTuneRow.name,
          meter: primaryTuneRow.meter ?? null,
          abcNotation: primaryTuneRow.abcNotation ?? null,
          abcSatb: (primaryTuneRow as { abcSatb?: string | null }).abcSatb ?? null,
          scoreJpgUrl: staffPages[0] ?? primaryTuneRow.scoreJpgUrl ?? null,
          solfegeJpgUrl: solfegePages[0] ?? primaryTuneRow.solfegeJpgUrl ?? null,
          soundcloudUrl: primaryTuneRow.soundcloudUrl ?? null,
          youtubeUrl: primaryTuneRow.youtubeUrl ?? null,
          doubleLength: primaryTuneRow.doubleLength ?? false,
          solfegeOcrText: (primaryTuneRow as { solfegeOcrText?: string | null }).solfegeOcrText ?? null,
          phraseShapeOverride: (primaryTuneRow as { phraseShapeOverride?: number[] | null }).phraseShapeOverride ?? null,
        }
      })()
    : null

  const editorialSet = await getEditoriallyLinkedTuneIdsForPsalm(psalmId)
  const psalmListRows = await fetchPsalmListRows()
  const { prev, next } = await getPsalmNeighbors(slug)

  const lyrics = activeVersion?.lyricsImportedRaw ?? ''
  const lyricsStructured = (activeVersion?.lyricsStructured ?? null) as
    | import('@/lib/lyrics-structured').StructuredLyrics
    | null
  const stanzaMeter = activeVersion?.meter ?? null

  // 260517-cm0 #3 — derive "N:start-end" range from psalterNumber so the topbar
  // can render e.g. "Ps 119:45-85" for individual Psalm 119 versifications.
  // psalterNumber values look like "119:45-85 (8)" or "119:1-8 (1)".
  const rangeMatch = activeVersion?.psalterNumber?.match(/^\d+:(\d+(?:-\d+)?)/) ?? null
  const versePartLabel = rangeMatch ? rangeMatch[1] : null

  return (
    <SingingView
      psalm={psalm}
      currentSlug={slug}
      prevSlug={prev}
      nextSlug={next}
      primaryTune={primaryTune}
      alternateTunes={alternateTunes}
      editoriallyLinkedTuneIds={Array.from(editorialSet)}
      meter={primaryMeter}
      stanzaMeter={stanzaMeter}
      lyrics={lyrics}
      lyricsStructured={lyricsStructured}
      psalmListRows={psalmListRows}
      studyHref={`/psalms/${slug}/study`}
      versePartLabel={versePartLabel}
    />
  )
}
