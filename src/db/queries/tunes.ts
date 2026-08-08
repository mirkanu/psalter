import { cache } from "react"
import { db } from "@/db"
import { eq, asc, and, inArray, isNotNull, desc } from "drizzle-orm"
import { tunes, tuneMelismaDecisions } from "@/db/schema"
import { deriveTuneJpgPages } from "@/lib/tune-jpg-urls"
import { tuneNameToSlug } from "@/lib/tune-slug"

export type MelismaStatus = 'approved' | 'not_approved'

export async function fetchTuneMelismaStatus(tuneId: number): Promise<MelismaStatus | null> {
  const rows = await db
    .select({ status: tuneMelismaDecisions.status })
    .from(tuneMelismaDecisions)
    .where(and(eq(tuneMelismaDecisions.tuneId, tuneId), isNotNull(tuneMelismaDecisions.status)))
    .orderBy(desc(tuneMelismaDecisions.createdAt), desc(tuneMelismaDecisions.id))
    .limit(1)
  return (rows[0]?.status as MelismaStatus | undefined) ?? null
}

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
      slug: tuneNameToSlug(t.name),
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
  /** Server-computed URL slug (see src/lib/tune-slug.ts). Client components must read this
   *  field rather than importing the slug function — tune-jpg-urls.ts pulls in `fs`. */
  slug: string
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
  /**
   * WR-04 fix: per-tune phrase syllable shape override (e.g. [8,6,8,6,6] for
   * Abbeyville), authored in /dev/melisma-editor. NULL = use meter default.
   * Added to the shared type so callers (SingingView) don't need an ad hoc
   * inline type-assertion cast to read it off a TuneOption.
   */
  phraseShapeOverride: number[] | null
  /**
   * 260712-tmm: Server-derived (fs) full ordered JPG page arrays for THIS
   * tune. Populated in fetchTunesByMeter (and each page RSC's primary-tune
   * builder) via deriveTuneJpgPages so client-side tune switches show the
   * correct multi-page scan (260712-tmm bug b). Empty = no pages on disk.
   */
  staffPages: string[]
  solfegePages: string[]
  /**
   * Plan 04.9.15-04: latest explicit `tuneMelismaDecisions.status` for this
   * tune (non-null-latest semantics — see fetchTuneMelismaStatus). NULL when
   * no decision row exists yet. Gates inline Staff (MOBILE-08).
   */
  melismaStatus: MelismaStatus | null
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
      phraseShapeOverride: true,
    },
    orderBy: (t, { asc }) => [asc(t.name)],
  })
  const PLACEHOLDER_PREFIXES = ['use ', 'do not ', 'do NOT ']
  const filtered = rows.filter((t) => !PLACEHOLDER_PREFIXES.some((p) => t.name.toLowerCase().startsWith(p)))
  const ids = filtered.map((t) => t.id)
  const decisionRows = ids.length
    ? await db
        .select({ tuneId: tuneMelismaDecisions.tuneId, status: tuneMelismaDecisions.status })
        .from(tuneMelismaDecisions)
        .where(and(inArray(tuneMelismaDecisions.tuneId, ids), isNotNull(tuneMelismaDecisions.status)))
        .orderBy(desc(tuneMelismaDecisions.createdAt), desc(tuneMelismaDecisions.id))
    : []
  const statusByTune = new Map<number, MelismaStatus>()
  for (const r of decisionRows) {
    if (!statusByTune.has(r.tuneId)) statusByTune.set(r.tuneId, r.status as MelismaStatus) // desc order -> first = latest
  }
  return filtered.map((t) => {
    const { staffPages, solfegePages } = deriveTuneJpgPages(t.name)
    return {
      ...t,
      slug: tuneNameToSlug(t.name),
      staffPages,
      solfegePages,
      melismaStatus: statusByTune.get(t.id) ?? null,
    }
  })
}

/**
 * Slug → tune detail. tunes.name is UNIQUE NOT NULL and tuneNameToSlug is deterministic, but
 * the slug is not a DB column, so match in JS over the (172-row) name list and delegate to the
 * memoised fetchTuneDetail for the heavy relational load.
 */
export const fetchTuneBySlug = cache(async function fetchTuneBySlug(slug: string) {
  const rows = await db.select({ id: tunes.id, name: tunes.name }).from(tunes)
  const match = rows.find((t) => tuneNameToSlug(t.name) === slug)
  if (!match) return undefined
  return fetchTuneDetail(match.id)
})

/** All tune slugs, for generateStaticParams. */
export async function fetchTuneSlugs(): Promise<string[]> {
  const rows = await db.select({ name: tunes.name }).from(tunes).orderBy(asc(tunes.name))
  return rows.map((r) => tuneNameToSlug(r.name)).filter((s) => s.length > 0)
}
