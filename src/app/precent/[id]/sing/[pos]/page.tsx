export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { precentingSets, setItems } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import {
  fetchPsalmDetail,
  getEditoriallyLinkedTuneIdsForPsalm,
  fetchPsalmListRows,
} from '@/db/queries/psalms'
import { fetchTunesByMeter, type AlternateTune } from '@/db/queries/tunes'
import { SingingView } from '@/components/singing/SingingView'
import { PrecentingBar } from '@/components/precent/PrecentingBar'
import { deriveTuneJpgPages } from '@/lib/tune-jpg-urls'
import { deriveVersionSlug, stripStar } from '@/lib/psalm-slugs'

interface PageProps {
  params: Promise<{ id: string; pos: string }>
}

export default async function PrecentSingPage({ params }: PageProps) {
  const { id, pos } = await params
  const setId = parseInt(id)
  const position = parseInt(pos) - 1   // 1-based URL → 0-based index

  if (isNaN(setId) || isNaN(position) || position < 0) notFound()

  const set = await db.query.precentingSets.findFirst({
    where: eq(precentingSets.id, setId),
    with: { setItems: { orderBy: [asc(setItems.position)] } },
  })
  if (!set || !set.setItems[position]) notFound()

  const item = set.setItems[position]
  const total = set.setItems.length

  // Replicate /psalms/[id]/page.tsx data-fetch pipeline using item.psalmId
  const psalm = await fetchPsalmDetail(item.psalmId)
  if (!psalm) notFound()

  // Active version selection — prefer psalmVersionId if set (e.g. version b from paste), else first
  const sortedVersions = psalm.psalmVersions.slice().sort((a, b) => a.id - b.id)
  const activeVersion = (item.psalmVersionId
    ? sortedVersions.find((v) => v.id === item.psalmVersionId) ?? sortedVersions[0]
    : sortedVersions[0]) ?? null

  // Derive primary tune from the active version
  const rawTune =
    activeVersion?.psalmVersionTunes.find((pvt) => pvt.isPrimary)?.tune ??
    activeVersion?.psalmVersionTunes[0]?.tune ??
    null
  const isPlaceholderTune = !!rawTune?.name?.toLowerCase().includes('aots')
  const primaryTuneRow = isPlaceholderTune ? null : rawTune

  const primaryMeter = activeVersion?.meter ?? rawTune?.meter ?? null
  const rawAlternateTunes = primaryMeter ? await fetchTunesByMeter(primaryMeter) : []
  const alternateTunes = rawAlternateTunes.map((t) => ({
    ...t,
    scoreJpgUrl: t.staffPages[0] ?? t.scoreJpgUrl,
    solfegeJpgUrl: t.solfegePages[0] ?? t.solfegeJpgUrl,
  }))

  // Tune override: if item.tuneId is set, prefer the assigned tune as primaryTune
  let primaryTune: AlternateTune | null = null

  if (item.tuneId) {
    // Find the assigned tune in alternateTunes (same meter) or use the tune row directly
    const assignedInAlternates = alternateTunes.find((t) => t.id === item.tuneId)
    if (assignedInAlternates) {
      primaryTune = assignedInAlternates
    } else {
      // Tune is outside the psalm's default meter — fetch it from the DB via set item tune relation
      // Fallback: still use the psalm's default tune
      primaryTune = primaryTuneRow ? buildTuneOption(primaryTuneRow) : null
    }
  } else {
    primaryTune = primaryTuneRow ? buildTuneOption(primaryTuneRow) : null
  }

  const editorialSet = await getEditoriallyLinkedTuneIdsForPsalm(psalm.id)
  const psalmListRows = await fetchPsalmListRows()

  const lyrics = activeVersion?.lyricsImportedRaw ?? ''
  const lyricsStructured = (activeVersion?.lyricsStructured ?? null) as
    | import('@/lib/lyrics-structured').StructuredLyrics
    | null
  const stanzaMeter = activeVersion?.meter ?? null

  // Derive "N:start-end" range label from psalterNumber (same as PsalmPage)
  const rangeMatch = activeVersion?.psalterNumber?.match(/^\d+:(\d+(?:-\d+)?)/) ?? null
  const versePartLabel = rangeMatch ? rangeMatch[1] : null

  const allVersionsSorted = psalm.psalmVersions.slice().sort((a, b) => a.id - b.id)
  const hasABVersions = allVersionsSorted.some((v) => v.psalterNumber?.includes('First')) &&
    allVersionsSorted.some((v) => v.psalterNumber?.includes('Second'))
  const versionSiblings: { slug: string; displayLabel: string; isCurrent: boolean }[] =
    hasABVersions
      ? allVersionsSorted
          .map((v) => {
            const rawLabel = deriveVersionSlug(psalm.id, v.psalterNumber, true)
            const siblingSlug = stripStar(rawLabel)
            const letter = siblingSlug.replace(String(psalm.id), '')
            if (letter !== 'a' && letter !== 'b') return null
            return {
              slug: siblingSlug,
              displayLabel: rawLabel,
              isCurrent: v.id === activeVersion?.id,
            }
          })
          .filter((x): x is { slug: string; displayLabel: string; isCurrent: boolean } => x !== null)
      : []

  const precentingPrevHref = position > 0 ? `/precent/${setId}/sing/${position}` : null
  const precentingNextHref = position + 1 < total ? `/precent/${setId}/sing/${position + 2}` : null

  return (
    <>
      <PrecentingBar setId={setId} pos={position + 1} total={total} />
      <SingingView
        psalm={psalm}
        currentSlug={String(psalm.id)}
        prevSlug={null}
        nextSlug={null}
        primaryTune={primaryTune}
        alternateTunes={alternateTunes}
        editoriallyLinkedTuneIds={Array.from(editorialSet)}
        meter={primaryMeter}
        stanzaMeter={stanzaMeter}
        lyrics={lyrics}
        lyricsStructured={lyricsStructured}
        psalmListRows={psalmListRows}
        studyHref={`/psalms/${psalm.id}/study`}
        versePartLabel={versePartLabel}
        precentingPrevHref={precentingPrevHref}
        precentingNextHref={precentingNextHref}
        precentingVerseRange={item.verseRange ?? null}
        versionSiblings={versionSiblings}
      />
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTuneOption(tune: Record<string, any>): AlternateTune {
  const { staffPages, solfegePages } = deriveTuneJpgPages(tune.name as string)
  return {
    id: tune.id as number,
    name: tune.name as string,
    meter: (tune.meter ?? null) as string | null,
    abcNotation: (tune.abcNotation ?? null) as string | null,
    abcSatb: (tune.abcSatb ?? null) as string | null,
    scoreJpgUrl: (staffPages[0] ?? tune.scoreJpgUrl ?? null) as string | null,
    solfegeJpgUrl: (solfegePages[0] ?? tune.solfegeJpgUrl ?? null) as string | null,
    soundcloudUrl: (tune.soundcloudUrl ?? null) as string | null,
    youtubeUrl: (tune.youtubeUrl ?? null) as string | null,
    doubleLength: (tune.doubleLength ?? false) as boolean,
    solfegeOcrText: (tune.solfegeOcrText ?? null) as string | null,
    melismaPositions: (tune.melismaPositions ?? null) as number[][] | null,
    // WR-04: phraseShapeOverride added to the shared AlternateTune type.
    phraseShapeOverride: (tune.phraseShapeOverride ?? null) as number[] | null,
    staffPages,
    solfegePages,
  }
}
