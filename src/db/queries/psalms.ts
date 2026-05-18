import { cache } from "react"
import { db } from "@/db"
import { eq, asc, sql, and } from "drizzle-orm"
import { psalms, psalmVersions, psalmVersionTunes, tunes } from "@/db/schema"
import type { PsalmRow } from "@/components/PsalmListingGrid"
import { deriveVersionSlug, stripStar } from "@/lib/psalm-slugs"

export async function fetchPsalmIds(): Promise<number[]> {
  const rows = await db.select({ id: psalms.id }).from(psalms).orderBy(asc(psalms.id))
  return rows.map((r) => r.id)
}

/**
 * Memoised with React cache() so that generateMetadata and the page
 * component share a single DB query per request rather than making two.
 */
export const fetchPsalmDetail = cache(async function fetchPsalmDetail(id: number) {
  return db.query.psalms.findFirst({
    where: eq(psalms.id, id),
    with: {
      psalmVersions: {
        // Plan 04.9.6-05: explicit column list so lyricsStructured (D-01) is
        // hydrated for the renderer's structured alignment path, alongside the
        // immutable lyricsImportedRaw snapshot (D-02). Per D-15, when
        // lyricsStructured is NULL the renderer falls back to the legacy blob.
        columns: {
          id: true,
          airtableId: true,
          psalmId: true,
          psalterNumber: true,
          lyricsImportedRaw: true,
          lyricsStructured: true,
          meter: true,
          versionLabel: true,
          firstLine: true,
        },
        with: {
          psalmVersionTunes: {
            with: {
              // tune: true selects all columns including doubleLength (D-11
              // canonical signal driving stanza-cycle pairing in Plan 04+).
              tune: true,
            },
          },
        },
      },
      verses: {
        with: {
          verseNavesTopics: { with: { navesTopic: true } },
          verseDoctrines: { with: { doctrine: true } },
        },
        orderBy: (v, { asc }) => [asc(v.verseNumber)],
      },
      sectionHeadings: { orderBy: (s, { asc }) => [asc(s.verseStart)] },
      messianicPsalms: true,
      dailyReadings: {
        columns: { id: true, dayNumber: true, readingDate: true, notes: true },
        limit: 1,
      },
      psalmTopics: {
        with: { topic: { columns: { id: true, name: true, topicType: true } } },
      },
    },
  })
})

export type PsalmDetail = NonNullable<Awaited<ReturnType<typeof fetchPsalmDetail>>>

export type PsalmDailyEntry = NonNullable<PsalmDetail['dailyReadings']>[number]
export type PsalmTuneLink = NonNullable<
  PsalmDetail['psalmVersions'][number]['psalmVersionTunes'][number]
>

/** Returns unique psalms that have at least one version with the given meter. */
export async function fetchPsalmsByMeter(meter: string): Promise<{ id: number; bibleTitle: string | null; firstLine: string | null; lyricsImportedRaw: string | null }[]> {
  const rows = await db.query.psalmVersions.findMany({
    where: eq(psalmVersions.meter, meter),
    columns: { psalmId: true, firstLine: true, lyricsImportedRaw: true },
    with: { psalm: { columns: { id: true, bibleTitle: true } } },
  })
  const seen = new Map<number, string | null>()
  const result: { id: number; bibleTitle: string | null; firstLine: string | null; lyricsImportedRaw: string | null }[] = []
  for (const row of rows) {
    const psalm = row.psalm
    if (psalm?.id != null && !seen.has(psalm.id)) {
      seen.set(psalm.id, row.firstLine ?? null)
      result.push({ id: psalm.id, bibleTitle: psalm.bibleTitle, firstLine: row.firstLine ?? null, lyricsImportedRaw: row.lyricsImportedRaw ?? null })
    }
  }
  return result.sort((a, b) => a.id - b.id)
}

/**
 * Returns the numeric tune IDs editorially linked via psalmVersionTunes
 * for ANY version of the given psalm. Used by SingingView/TuneSwitcherSheet
 * to split "Recommended" (in this set) from "Other" (meter-matched alts
 * not in this set). Open Q §1 resolution.
 */
export async function getEditoriallyLinkedTuneIdsForPsalm(psalmId: number): Promise<Set<number>> {
  const rows = await db
    .select({ tuneId: psalmVersionTunes.tuneId })
    .from(psalmVersionTunes)
    .innerJoin(psalmVersions, eq(psalmVersionTunes.psalmVersionId, psalmVersions.id))
    .where(eq(psalmVersions.psalmId, psalmId))
  const ids = new Set<number>()
  for (const r of rows) if (r.tuneId != null) ids.add(r.tuneId)
  return ids
}

/**
 * Returns the canonical PsalmRow[] used by <PsalmListingGrid>. This is the
 * exact query that was previously inlined in /psalms/page.tsx — extracted
 * here so SingingView's PsalmSelectorSheet can reuse it without duplication.
 * Behaviour byte-identical to the prior inline query.
 */
export async function fetchPsalmListRows(): Promise<PsalmRow[]> {
  const rows = await db
    .select({
      id: psalms.id,
      versionId: psalmVersions.id,
      firstLine: psalmVersions.firstLine,
      meter: psalmVersions.meter,
      psalterNumber: psalmVersions.psalterNumber,
      kjvExcerpt: sql<string>`LEFT(${psalms.kjvText}, 120)`.as('kjv_excerpt'),
      recommendedTune: tunes.name,
    })
    .from(psalms)
    .leftJoin(psalmVersions, eq(psalmVersions.psalmId, psalms.id))
    .leftJoin(
      psalmVersionTunes,
      and(
        eq(psalmVersionTunes.psalmVersionId, psalmVersions.id),
        eq(psalmVersionTunes.isPrimary, true)
      )
    )
    .leftJoin(tunes, eq(tunes.id, psalmVersionTunes.tuneId))
    .orderBy(asc(psalms.id), asc(psalmVersions.id))

  const countById = new Map<number, number>()
  for (const row of rows) {
    countById.set(row.id, (countById.get(row.id) ?? 0) + 1)
  }

  function extractSectionNum(pn: string | null): number | null {
    if (!pn) return null
    const m = pn.match(/\((\d+)\)$/)
    return m ? parseInt(m[1], 10) : null
  }
  function versionOrder(pn: string | null): number {
    if (!pn) return 0
    if (pn.includes('First')) return 0
    if (pn.includes('Second')) return 1
    return 0
  }

  const sorted = [...rows].sort((a, b) => {
    if (a.id !== b.id) return a.id - b.id
    const aNum = extractSectionNum(a.psalterNumber)
    const bNum = extractSectionNum(b.psalterNumber)
    if (aNum !== null && bNum !== null) return aNum - bNum
    return versionOrder(a.psalterNumber) - versionOrder(b.psalterNumber)
  })

  return sorted.map((row) => {
    const isMulti = (countById.get(row.id) ?? 1) > 1
    const rawLabel = deriveVersionSlug(row.id, row.psalterNumber, isMulti)
    const slug = stripStar(rawLabel)
    return {
      id: row.id,
      displayLabel: rawLabel.replace(/^(\d+)-(\d+-\d+)$/, '$1:$2'),
      slug,
      firstLine: row.firstLine,
      meter: row.meter,
      kjvExcerpt: row.kjvExcerpt,
      recommendedTune: row.recommendedTune,
    }
  })
}
