// ISR: re-render at most once every 24h. Psalm metadata is editorial
// and only changes when an admin re-saves the psalm, so a long cache horizon
// is safe. Tune selection (?tune=…) lives on /psalms/[id]/sing and is a
// Client Component, so the server-rendered HTML here does not depend on
// query params.
export const revalidate = 86400
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
import { fetchTunesByMeterEnriched, fetchTuneMelismaStatus, fetchPsalmVersionTuneTiers, fetchTuneCount } from '@/db/queries/tunes'
import { SingingView } from '@/components/singing/SingingView'
import { parseSlug, deriveVersionSlug, stripStar, slugToDisplayTitle } from '@/lib/psalm-slugs'
import { deriveTuneJpgPages } from '@/lib/tune-jpg-urls'
import { tuneNameToSlug } from '@/lib/tune-slug'
import { getPsalmNeighbors } from '@/lib/psalm-navigation'
import { stripDoubleMeterSuffix } from '@/lib/meter-abbrev'

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

  // Bug 2 (quick task 260717-mwv): drives the "please select a tune, this
  // versification is not recommended" messaging in SingingView when no tune
  // is active yet.
  const isRecommendedVersion = sortedVersions.length <= 1
    ? true
    : (activeVersion?.psalterNumber?.includes('Recommended') ?? false)

  // Derive primary tune from the active version
  const rawTune =
    activeVersion?.psalmVersionTunes.find((pvt) => pvt.isPrimary)?.tune ??
    activeVersion?.psalmVersionTunes[0]?.tune ??
    null
  const isPlaceholderTune = !!rawTune?.name?.toLowerCase().includes('aots')
  const primaryTuneRow = isPlaceholderTune ? null : rawTune

  // stripDoubleMeterSuffix: a psalm version's meter can carry a trailing " D" (e.g. "66 66 D" for
  // a doubled/DCM-style version), but tunes.meter never does — a doubled psalm is sung to two
  // repetitions of the same non-doubled tune. Without stripping, fetchTunesByMeter finds zero
  // matches for any Double-meter psalm (confirmed live: Psalm 143 Second Version showed "0 tunes"
  // in the Sing view's tune picker before this fix — /precent's picker already stripped this
  // inline in SetDetail.tsx's handleTuneClick).
  const primaryMeter = stripDoubleMeterSuffix(activeVersion?.meter ?? rawTune?.meter ?? null)
  const alternateTunes = primaryMeter ? await fetchTunesByMeterEnriched(primaryMeter) : []
  // Phase 16 R3: enrich to full TuneRow shape so TunePickerDialog (Mode A, the
  // precentor-style table) receives all the metadata fields it reads
  // (`inPrcaPsalter`, `recommendedPsalmIds`, `moods`, `weightedHistoricalFrequency`,
  // etc.). Without this the picker silently breaks the In-PRCA filter, psalm-
  // number search, default sort, "Recommended for this psalm" highlight, and
  // the Recommended Psalms + In PRCA columns. See db/queries/tunes.ts for the
  // full breakage list.
  // TSEL-01/D-13: per-psalm-version Backup/Historical tune ids for the tune-switcher sheet.
  // Mirrors src/app/psalms/[id]/study/page.tsx, which already does this for the Study tab.
  const tuneTiers = activeVersion ? await fetchPsalmVersionTuneTiers(activeVersion.id) : undefined
  // 2026-08-17: alternateTunes above is already meter-scoped (fetchTunesByMeter), so its length
  // isn't the true catalog size the tune-picker's count text needs — see TuneTable's
  // totalTuneCount doc.
  const totalTuneCount = await fetchTuneCount()

  // Wrap primaryTune in TuneOption (AlternateTune) shape — used uniformly by SingingView
  const primaryTune = primaryTuneRow
    ? await (async () => {
        const { staffPages, solfegePages } = deriveTuneJpgPages(primaryTuneRow.name)
        const melismaStatus = await fetchTuneMelismaStatus(primaryTuneRow.id)
        return {
          id: primaryTuneRow.id,
          name: primaryTuneRow.name,
          slug: tuneNameToSlug(primaryTuneRow.name),
          meter: primaryTuneRow.meter ?? null,
          abcNotation: primaryTuneRow.abcNotation ?? null,
          abcSatb: (primaryTuneRow as { abcSatb?: string | null }).abcSatb ?? null,
          scoreJpgUrl: staffPages[0] ?? primaryTuneRow.scoreJpgUrl ?? null,
          solfegeJpgUrl: solfegePages[0] ?? primaryTuneRow.solfegeJpgUrl ?? null,
          soundcloudUrl: primaryTuneRow.soundcloudUrl ?? null,
          youtubeUrl: primaryTuneRow.youtubeUrl ?? null,
          doubleLength: ((primaryTuneRow.meterVariant ?? []).includes('double_length')) as boolean,
          meterVariant: (primaryTuneRow.meterVariant ?? []) as string[],
          solfegeOcrText: (primaryTuneRow as { solfegeOcrText?: string | null }).solfegeOcrText ?? null,
          phraseShapeOverride: (primaryTuneRow as { phraseShapeOverride?: number[] | null }).phraseShapeOverride ?? null,
          melismaPositions: (primaryTuneRow as { melismaPositions?: number[][] | null }).melismaPositions ?? null,
          staffPages,
          solfegePages,
          melismaStatus,
          weightedHistoricalFrequency: primaryTuneRow.weightedHistoricalFrequency ?? 0,
          historicalUsageCount: primaryTuneRow.historicalUsageCount ?? 0,
        }
      })()
    : null

  // Compute sibling version slugs (only for a/b psalms, not Psalm 119 range sections)
  const allVersionsSorted = psalm.psalmVersions.slice().sort((a, b) => a.id - b.id)
  const hasABVersions = allVersionsSorted.some((v) => v.psalterNumber?.includes('First')) &&
    allVersionsSorted.some((v) => v.psalterNumber?.includes('Second'))
  const versionSiblings: { slug: string; displayLabel: string; isCurrent: boolean }[] =
    hasABVersions
      ? allVersionsSorted
          .map((v) => {
            const rawLabel = deriveVersionSlug(psalmId, v.psalterNumber, true)
            const siblingSlug = stripStar(rawLabel)
            const letter = siblingSlug.replace(String(psalmId), '')
            if (letter !== 'a' && letter !== 'b') return null
            return {
              slug: siblingSlug,
              displayLabel: rawLabel, // e.g. "55a*" or "55b"
              isCurrent: siblingSlug === slug,
            }
          })
          .filter((x): x is { slug: string; displayLabel: string; isCurrent: boolean } => x !== null)
      : []

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
    <div className="max-w-4xl mx-auto">
      <SingingView
        psalm={psalm}
        subtitle={psalm?.bibleTitle ?? null}
        currentSlug={slug}
        prevSlug={prev}
        nextSlug={next}
        primaryTune={primaryTune}
        alternateTunes={alternateTunes}
        editoriallyLinkedTuneIds={Array.from(editorialSet)}
        tuneTiers={tuneTiers}
        totalTuneCount={totalTuneCount}
        meter={primaryMeter}
        stanzaMeter={stanzaMeter}
        lyrics={lyrics}
        lyricsStructured={lyricsStructured}
        psalmListRows={psalmListRows}
        studyHref={`/psalms/${slug}/study`}
        versePartLabel={versePartLabel}
        versionSiblings={versionSiblings}
        isRecommendedVersion={isRecommendedVersion}
      />
    </div>
  )
}
