import { cache } from "react"
import { db } from "@/db"
import { eq, asc, and, inArray, isNotNull, desc } from "drizzle-orm"
import { tunes, tuneMelismaDecisions, psalmVersionTunes, psalmVersionHistoricalTunes } from "@/db/schema"
import { deriveTuneJpgPages } from "@/lib/tune-jpg-urls"
import { tuneNameToSlug } from "@/lib/tune-slug"
import { unstable_cache } from "next/cache"

export type MelismaStatus = 'approved' | 'not_approved'

const _fetchTuneMelismaStatus = async (tuneId: number): Promise<MelismaStatus | null> => {
  const rows = await db
    .select({ status: tuneMelismaDecisions.status })
    .from(tuneMelismaDecisions)
    .where(and(eq(tuneMelismaDecisions.tuneId, tuneId), isNotNull(tuneMelismaDecisions.status)))
    .orderBy(desc(tuneMelismaDecisions.createdAt), desc(tuneMelismaDecisions.id))
    .limit(1)
  return (rows[0]?.status as MelismaStatus | undefined) ?? null
}
export const fetchTuneMelismaStatus = cache(async function fetchTuneMelismaStatus(tuneId: number) {
  return await unstable_cache(
    () => _fetchTuneMelismaStatus(tuneId),
    ['tune-melisma-status', String(tuneId)],
    { tags: ['precent'], revalidate: 86400 }
  )()
})

export async function fetchTuneIds(): Promise<number[]> {
  const rows = await db.select({ id: tunes.id }).from(tunes).orderBy(asc(tunes.id))
  return rows.map((r) => r.id)
}

// Placeholder tune names used in Airtable for admin notes — exclude from public listing
const PLACEHOLDER_PREFIXES = ['use ', 'do not ']
function isPlaceholderTuneName(name: string): boolean {
  const lower = name.toLowerCase()
  return PLACEHOLDER_PREFIXES.some((p) => lower.startsWith(p))
}

/**
 * 2026-08-17: total tune catalog size, for the tune-picker's "N tunes (filtered from TOTAL,
 * showing only matching METER meter)" count. Fetches only `name` (not full rows) — filtering
 * mirrors fetchAllTunes()'s isPlaceholderTuneName exclusion exactly so this stays the same
 * number fetchAllTunes()'s callers (e.g. /precent's allTunes.length) already see.
 */
const _fetchTuneCount = async (): Promise<number> => {
  const rows = await db.select({ name: tunes.name }).from(tunes)
  return rows.filter((r) => !isPlaceholderTuneName(r.name)).length
}
export const fetchTuneCount = cache(unstable_cache(_fetchTuneCount, ['tune-count'], { tags: ['precent'], revalidate: 86400 }))

const _fetchAllTunes = async () => {
  const rows = await db.query.tunes.findMany({
    columns: {
      id: true, name: true, meter: true, scoreJpgUrl: true,
      inPrcaPsalter: true, hasFamousHymn: true, famousHymn: true,
      numberIn1979RpPsalter: true, numInPrcaPsalter: true, soundcloudUrl: true,
      abcNotation: true,
      abcSatb: true,
      phraseShapeOverride: true,
      meterVariant: true,
      solfegeOcrText: true,
      weightedHistoricalFrequency: true,
      solfegeJpgUrl: true,
      youtubeUrl: true,
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
    .filter((t) => !isPlaceholderTuneName(t.name))
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
      solfegeJpgUrl: t.solfegeJpgUrl ?? null,
      youtubeUrl: t.youtubeUrl ?? null,
      abcNotation: t.abcNotation ?? null,
      abcSatb: t.abcSatb ?? null,
      phraseShapeOverride: t.phraseShapeOverride ?? null,
      doubleLength: (t.meterVariant ?? []).includes('double_length'),
      meterVariant: t.meterVariant ?? [],
      solfegeOcrText: t.solfegeOcrText ?? null,
      // TierableTune requires a number; sortTunesByTier treats it as a tie-breaker inside the 'other' tier only.
      weightedHistoricalFrequency: t.weightedHistoricalFrequency ?? 0,
      ...deriveTuneJpgPages(t.name),   // -> staffPages: string[], solfegePages: string[]
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
export const fetchAllTunes = cache(
  unstable_cache(_fetchAllTunes, ['all-tunes'], { tags: ['precent'], revalidate: 86400 })
)

/**
 * Enrich AlternateTune[] (e.g. from fetchTunesByMeter) into the full TuneRow[]
 * shape that TuneTable / TunePickerDialog (Mode A) expect.
 *
 * Phase 16 R3: without this enrichment the /psalms/[id] picker passed
 * AlternateTune[] directly into TunePickerDialog, where the cast to TuneRow[]
 * left `inPrcaPsalter`, `hasFamousHymn`, `recommendedPsalmIds`, `moods`, etc.
 * as undefined — silently breaking:
 *   - the In PRCA filter (`onlyPrca` check), since undefined is falsy
 *   - the Famous Hymn filter (same reason)
 *   - psalm-number search inside the picker (uses recommendedPsalmIds.includes)
 *   - the default sort by recommendedPsalmIds.length
 *   - the per-row "Recommended for this psalm" highlight
 *   - the Recommended Psalms column count
 *   - the In PRCA column (always '—')
 *
 * Implementation: joins against the React.cache()-memoised fetchAllTunes() by
 * id, so within a single RSC render the second call is essentially free (cache
 * hit). Return type intersects the inferred TuneRow shape with the AlternateTune
 * fields fetchAllTunes doesn't query (`melismaPositions`, `melismaStatus`,
 * `historicalUsageCount`) — those are populated by fetchTunesByMeter and
 * merged in by the helper, so the result satisfies BOTH shapes structurally.
 */
type FetchAllTunesRow = Awaited<ReturnType<typeof fetchAllTunes>>[number]
export type EnrichedTuneRow = FetchAllTunesRow &
  Pick<AlternateTune, 'melismaPositions' | 'melismaStatus' | 'historicalUsageCount'>

/**
 * Like fetchAllTunes(), but only for the supplied ids. Avoids pulling the full
 * 600-row catalog for the /precent tune picker (issue #72). Returns the same
 * `FetchAllTunesRow` shape, preserving `inPrcaPsalter`, `hasFamousHymn`,
 * `recommendedPsalmIds`, `moods`, `meterVariant`, etc.
 */
async function fetchTunesByIds(ids: number[]) {
  if (ids.length === 0) return []
  const rows = await db.query.tunes.findMany({
    where: inArray(tunes.id, ids),
    columns: {
      id: true, name: true, meter: true, scoreJpgUrl: true,
      inPrcaPsalter: true, hasFamousHymn: true, famousHymn: true,
      numberIn1979RpPsalter: true, numInPrcaPsalter: true, soundcloudUrl: true,
      abcNotation: true,
      abcSatb: true,
      phraseShapeOverride: true,
      meterVariant: true,
      solfegeOcrText: true,
      weightedHistoricalFrequency: true,
      solfegeJpgUrl: true,
      youtubeUrl: true,
    },
    with: {
      tuneMoods: { with: { mood: { columns: { name: true } } } },
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
    .filter((t) => !isPlaceholderTuneName(t.name))
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
      solfegeJpgUrl: t.solfegeJpgUrl ?? null,
      youtubeUrl: t.youtubeUrl ?? null,
      abcNotation: t.abcNotation ?? null,
      abcSatb: t.abcSatb ?? null,
      phraseShapeOverride: t.phraseShapeOverride ?? null,
      doubleLength: (t.meterVariant ?? []).includes('double_length'),
      meterVariant: t.meterVariant ?? [],
      solfegeOcrText: t.solfegeOcrText ?? null,
      weightedHistoricalFrequency: t.weightedHistoricalFrequency ?? 0,
      ...deriveTuneJpgPages(t.name),
      moods: t.tuneMoods.map((tm) => tm.mood.name).filter(Boolean) as string[],
      recommendedPsalmIds: [
        ...new Set(
          t.psalmVersionTunes
            .map((pvt) => pvt.psalmVersion?.psalm?.id)
            .filter((id): id is number => id != null)
        ),
      ].sort((a, b) => a - b),
    }))
}

export async function enrichAlternateTunesToTuneRows(
  alternates: AlternateTune[],
): Promise<EnrichedTuneRow[]> {
  if (alternates.length === 0) return []
  const rich = await fetchTunesByIds(alternates.map((a) => a.id))
  const byId = new Map<number, FetchAllTunesRow>()
  for (const t of rich) byId.set(t.id, t)

  return alternates.map((alt) => {
    const extra: Pick<AlternateTune, 'melismaPositions' | 'melismaStatus' | 'historicalUsageCount'> = {
      melismaPositions: alt.melismaPositions,
      melismaStatus: alt.melismaStatus,
      historicalUsageCount: alt.historicalUsageCount,
    }
    const hit = byId.get(alt.id)
    if (hit) return { ...hit, ...extra }
    // Fallback for tunes not in fetchTunesByIds — same shape, safe defaults.
    return {
      id: alt.id,
      name: alt.name,
      slug: alt.slug,
      meter: alt.meter,
      scoreJpgUrl: alt.scoreJpgUrl,
      inPrcaPsalter: false,
      hasFamousHymn: false,
      famousHymn: null,
      numberIn1979RpPsalter: null,
      numInPrcaPsalter: null,
      moods: [],
      recommendedPsalmIds: [],
      soundcloudUrl: alt.soundcloudUrl,
      solfegeJpgUrl: alt.solfegeJpgUrl,
      youtubeUrl: alt.youtubeUrl,
      abcNotation: alt.abcNotation,
      abcSatb: alt.abcSatb,
      phraseShapeOverride: alt.phraseShapeOverride,
      doubleLength: (alt.meterVariant ?? []).includes('double_length'),
      meterVariant: alt.meterVariant ?? [],
      solfegeOcrText: alt.solfegeOcrText,
      weightedHistoricalFrequency: alt.weightedHistoricalFrequency,
      staffPages: alt.staffPages,
      solfegePages: alt.solfegePages,
      ...extra,
    } satisfies EnrichedTuneRow
  })
}

/**
 * Memoised with React cache() so that generateMetadata and the page
 * component share a single DB query per request rather than making two.
 */
const _fetchTuneDetail = async (id: number) => {
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
}
export const fetchTuneDetail = cache(async function fetchTuneDetail(id: number) {
  return await unstable_cache(
    () => _fetchTuneDetail(id),
    ['tune-detail', String(id)],
    { tags: ['precent'], revalidate: 86400 }
  )()
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
  /** D-11 canonical signal driving stanza-cycle pairing (DCM marker).
   *  Derived from `meterVariant.includes('double_length')` for renderer convenience. */
  doubleLength: boolean
  /** Multi-select variant flags — possible values: 'double_length', 'repeat_last_line'.
   *  Use this when you need to distinguish variant types (e.g. melisma-editor UI). */
  meterVariant: string[]
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
  /**
   * TUNE-04 tie-breaker within the "other matching-meter tunes" tier: Airtable's
   * "Weighted historical CPRC psalm frequency for CPRC Standard" rollup (0-1 fraction).
   * NOT the Historical tier signal itself — that is per-psalm-version, see
   * fetchPsalmVersionTuneTiers.
   */
  weightedHistoricalFrequency: number
  /** Global per-tune count, companion to weightedHistoricalFrequency; not itself a sort key. */
  historicalUsageCount: number
}

const _fetchTunesByMeter = async (meter: string): Promise<AlternateTune[]> => {
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
      meterVariant: true,
      solfegeOcrText: true,
      melismaPositions: true,
      phraseShapeOverride: true,
      weightedHistoricalFrequency: true,
      historicalUsageCount: true,
    },
    orderBy: (t, { asc }) => [asc(t.name)],
  })
  const filtered = rows.filter((t) => !isPlaceholderTuneName(t.name))
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
      doubleLength: (t.meterVariant ?? []).includes('double_length'),
      melismaStatus: statusByTune.get(t.id) ?? null,
    }
  })
}
export const fetchTunesByMeter = cache(async function fetchTunesByMeter(meter: string) {
  return await unstable_cache(
    () => _fetchTunesByMeter(meter),
    ['tunes-by-meter', meter],
    { tags: ['precent'], revalidate: 86400 }
  )()
})

export interface PsalmVersionTuneTiers {
  /** Tunes flagged psalmVersionTunes.isPrimary=true for THIS psalm version — the canonical
   *  recommended tune(s). Distinct from backupTuneIds: DB check (2026-08-16) found only 8 rows
   *  where isPrimary and isBackup both hold, vs 176 primary-only and 31 backup-only — these are
   *  largely different tunes, not aliases of the same concept. */
  recommendedTuneIds: number[]
  /** Tunes flagged as the 2024 CPRC backup for THIS psalm version. */
  backupTuneIds: number[]
  /** Tunes historically sung for THIS psalm version (Airtable "Historical CPRC Usage"). */
  historicalTuneIds: number[]
}

/**
 * Per-psalm-version tune tiers for the Change Tune dialog (TUNE-04).
 *
 * Deliberately psalm-version-scoped: "Historical" answers "what did we sing for THIS psalm",
 * not "how popular is this tune overall". The global tunes.weightedHistoricalFrequency stat is
 * only a tie-breaker inside the fourth (Other) tier.
 */
const _fetchPsalmVersionTuneTiers = async (psalmVersionId: number): Promise<PsalmVersionTuneTiers> => {
  const [recommendedRows, backupRows, historicalRows] = await Promise.all([
    db.select({ tuneId: psalmVersionTunes.tuneId })
      .from(psalmVersionTunes)
      .where(and(
        eq(psalmVersionTunes.psalmVersionId, psalmVersionId),
        eq(psalmVersionTunes.isPrimary, true),
      )),
    db.select({ tuneId: psalmVersionTunes.tuneId })
      .from(psalmVersionTunes)
      .where(and(
        eq(psalmVersionTunes.psalmVersionId, psalmVersionId),
        eq(psalmVersionTunes.isBackup, true),
      )),
    db.select({ tuneId: psalmVersionHistoricalTunes.tuneId })
      .from(psalmVersionHistoricalTunes)
      .where(eq(psalmVersionHistoricalTunes.psalmVersionId, psalmVersionId)),
  ])
  return {
    recommendedTuneIds: recommendedRows.map((r) => r.tuneId),
    backupTuneIds: backupRows.map((r) => r.tuneId),
    historicalTuneIds: historicalRows.map((r) => r.tuneId),
  }
}
export const fetchPsalmVersionTuneTiers = cache(async function fetchPsalmVersionTuneTiers(psalmVersionId: number) {
  return await unstable_cache(
    () => _fetchPsalmVersionTuneTiers(psalmVersionId),
    ['psalm-version-tune-tiers', String(psalmVersionId)],
    { tags: ['precent'], revalidate: 86400 }
  )()
})

/**
 * Slug → tune detail. tunes.name is UNIQUE NOT NULL and tuneNameToSlug is deterministic, but
 * the slug is not a DB column, so match in JS over the (172-row) name list and delegate to the
 * memoised fetchTuneDetail for the heavy relational load.
 */
const _fetchTuneBySlug = async (slug: string) => {
  const rows = await db.select({ id: tunes.id, name: tunes.name }).from(tunes)
  const match = rows.find((t) => !isPlaceholderTuneName(t.name) && tuneNameToSlug(t.name) === slug)
  if (!match) return undefined
  return fetchTuneDetail(match.id)
}
export const fetchTuneBySlug = cache(async function fetchTuneBySlug(slug: string) {
  return await unstable_cache(
    () => _fetchTuneBySlug(slug),
    ['tune-by-slug', slug],
    { tags: ['precent'], revalidate: 86400 }
  )()
})

/** All tune slugs, for generateStaticParams. */
export async function fetchTuneSlugs(): Promise<string[]> {
  const rows = await db.select({ name: tunes.name }).from(tunes).orderBy(asc(tunes.name))
  return rows
    .filter((r) => !isPlaceholderTuneName(r.name))
    .map((r) => tuneNameToSlug(r.name))
    .filter((s) => s.length > 0)
}

/**
 * id -> current slug, for the legacy numeric-id redirect (TUNE-05). Deliberately minimal
 * (no relational load) since this runs in middleware on every /tunes/<number> request.
 */
export async function fetchTuneSlugById(id: number): Promise<string | null> {
  const rows = await db.select({ name: tunes.name }).from(tunes).where(eq(tunes.id, id)).limit(1)
  const name = rows[0]?.name
  return name ? tuneNameToSlug(name) : null
}
