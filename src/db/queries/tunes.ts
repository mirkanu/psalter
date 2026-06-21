import { cache } from "react"
import { db } from "@/db"
import { eq, asc } from "drizzle-orm"
import { tunes } from "@/db/schema"

export async function fetchTuneIds(): Promise<number[]> {
  const rows = await db.select({ id: tunes.id }).from(tunes).orderBy(asc(tunes.id))
  return rows.map((r) => r.id)
}

// Placeholder tune names used in Airtable for admin notes — exclude from public listing
const PLACEHOLDER_PREFIXES = ['use ', 'do NOT ', 'do not ']

export async function fetchAllTunes() {
  const rows = await db.query.tunes.findMany({
    columns: {
      id: true, name: true, meter: true, scoreJpgUrl: true,
      inPrcaPsalter: true, hasFamousHymn: true, famousHymn: true,
      numberIn1979RpPsalter: true, numInPrcaPsalter: true, soundcloudUrl: true,
    },
    with: {
      tuneMoods: {
        with: { mood: { columns: { name: true } } },
      },
      psalmVersionTunes: {
        with: {
          psalmVersion: {
            columns: {},
            with: { psalm: { columns: { id: true } } },
          },
        },
      },
    },
  })

  return rows
    .filter((t) => !PLACEHOLDER_PREFIXES.some((p) => t.name.toLowerCase().startsWith(p)))
    .map((t) => ({
      id: t.id,
      name: t.name,
      meter: t.meter,
      scoreJpgUrl: t.scoreJpgUrl,
      inPrcaPsalter: t.inPrcaPsalter ?? false,
      hasFamousHymn: t.hasFamousHymn ?? false,
      famousHymn: t.famousHymn,
      numberIn1979RpPsalter: t.numberIn1979RpPsalter,
      numInPrcaPsalter: t.numInPrcaPsalter,
      soundcloudUrl: t.soundcloudUrl ?? null,
      moods: t.tuneMoods.map((tm) => tm.mood.name).filter(Boolean) as string[],
      recommendedPsalmIds: [
        ...new Set(
          t.psalmVersionTunes
            .map((pvt) => pvt.psalmVersion?.psalm?.id)
            .filter((id): id is number => id != null)
        ),
      ].sort((a, b) => a - b),
    }))
    .sort((a, b) => b.recommendedPsalmIds.length - a.recommendedPsalmIds.length || a.name.localeCompare(b.name))
}

/**
 * Memoised with React cache() so that generateMetadata and the page
 * component share a single DB query per request rather than making two.
 */
export const fetchTuneDetail = cache(async function fetchTuneDetail(id: number) {
  return db.query.tunes.findFirst({
    where: eq(tunes.id, id),
    with: {
      psalmVersionTunes: {
        columns: { isPrimary: true },
        with: {
          psalmVersion: {
            columns: { id: true, lyricsImportedRaw: true, lyricsStructured: true, firstLine: true, meter: true, psalterNumber: true },
            with: { psalm: true },
          },
        },
      },
      tuneMoods: { with: { mood: true } },
    },
  })
})

export type TuneDetail = NonNullable<Awaited<ReturnType<typeof fetchTuneDetail>>>

export interface AlternateTune {
  id: number
  name: string
  meter: string | null
  abcNotation: string | null
  abcSatb: string | null
  scoreJpgUrl: string | null
  solfegeJpgUrl: string | null
  soundcloudUrl: string | null
  youtubeUrl: string | null
  /** D-11 canonical signal driving stanza-cycle pairing (DCM marker). */
  doubleLength: boolean
  /**
   * Plan 04.9.9: Raw solfège OCR JSON string from DB. When non-null and containing
   * soprano/doh/time fields, used by NotationRenderer to build melisma-aware w: lines
   * via buildWLineFromSolfa. When null, falls back to syllabifyForAbc.
   */
  solfegeOcrText: string | null
  /**
   * Plan 04.9.12: Per-phrase melisma note indices saved by the melisma editor.
   * melismaPositions[phraseIdx][k] = 0-based intra-phrase note index that is a
   * melisma continuation (w: `_` token). NULL = use heuristic path.
   */
  melismaPositions: number[][] | null
}

export async function fetchTunesByMeter(meter: string): Promise<AlternateTune[]> {
  const rows = await db.query.tunes.findMany({
    where: eq(tunes.meter, meter),
    columns: {
      id: true,
      name: true,
      meter: true,
      abcNotation: true,
      abcSatb: true,
      scoreJpgUrl: true,
      solfegeJpgUrl: true,
      soundcloudUrl: true,
      youtubeUrl: true,
      doubleLength: true,
      solfegeOcrText: true,
      melismaPositions: true,
    },
    orderBy: (t, { asc }) => [asc(t.name)],
  })
  const PLACEHOLDER_PREFIXES = ['use ', 'do not ', 'do NOT ']
  return rows.filter((t) => !PLACEHOLDER_PREFIXES.some((p) => t.name.toLowerCase().startsWith(p)))
}
