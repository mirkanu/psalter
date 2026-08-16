import { cache } from "react"
import { db } from "@/db"
import { eq, asc, and, inArray, isNotNull, desc } from "drizzle-orm"
import { tunes, tuneMelismaDecisions, psalmVersionTunes, psalmVersionHistoricalTunes } from "@/db/schema"
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
const PLACEHOLDER_PREFIXES = ['use ', 'do not ']
function isPlaceholderTuneName(name: string): boolean {
  const lower = name.toLowerCase()
  return PLACEHOLDER_PREFIXES.some((p) => lower.startsWith(p))
}

export async function fetchAllTunes() {
  const rows = await db.query.tunes.findMany({
    columns: {
      id: true, name: true, meter: true, scoreJpgUrl: true,
      inPrcaPsalter: true, hasFamousHymn: true, famousHymn: true,
      numberIn1979RpPsalter: true, numInPrcaPsalter: true, soundcloudUrl: true,
      abcNotation: true,
      abcSatb: true,
      phraseShapeOverride: true,
      doubleLength: true,
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
      doubleLength: t.doubleLength ?? false,
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

export async function enrichAlternateTunesToTuneRows(
  alternates: AlternateTune[],
): Promise<EnrichedTuneRow[]> {
  if (alternates.length === 0) return []
  const allTunes = await fetchAllTunes()
  const byId = new Map<number, FetchAllTunesRow>()
  for (const t of allTunes) byId.set(t.id, t)

  // fetchAllTunes doesn't query `melismaPositions`/`melismaStatus`/
  // `historicalUsageCount` — those live on AlternateTune. Index the input
  // alternates by id so the rich-lookup path can layer those fields back on.
  const altById = new Map<number, AlternateTune>()
  for (const a of alternates) altById.set(a.id, a)

  return alternates.map((alt) => {
    const rich = byId.get(alt.id)
    const extra: Pick<AlternateTune, 'melismaPositions' | 'melismaStatus' | 'historicalUsageCount'> = {
      melismaPositions: alt.melismaPositions,
      melismaStatus: alt.melismaStatus,
      historicalUsageCount: alt.historicalUsageCount,
    }
    if (rich) return { ...rich, ...extra }
    // Fallback: shape derived purely from AlternateTune, with the missing
    // fields filled to safe defaults so TuneTable still renders. This path is
    // hit only for tunes that exist in fetchTunesByMeter but not in
    // fetchAllTunes — i.e. a stale cache or a tune added since the last
    // fetchAllTunes call.
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
      doubleLength: alt.doubleLength,
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
      melismaStatus: statusByTune.get(t.id) ?? null,
    }
  })
}

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
export const fetchPsalmVersionTuneTiers = cache(async function fetchPsalmVersionTuneTiers(
  psalmVersionId: number,
): Promise<PsalmVersionTuneTiers> {
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
})

/**
 * Slug → tune detail. tunes.name is UNIQUE NOT NULL and tuneNameToSlug is deterministic, but
 * the slug is not a DB column, so match in JS over the (172-row) name list and delegate to the
 * memoised fetchTuneDetail for the heavy relational load.
 */
export const fetchTuneBySlug = cache(async function fetchTuneBySlug(slug: string) {
  const rows = await db.select({ id: tunes.id, name: tunes.name }).from(tunes)
  const match = rows.find((t) => !isPlaceholderTuneName(t.name) && tuneNameToSlug(t.name) === slug)
  if (!match) return undefined
  return fetchTuneDetail(match.id)
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
