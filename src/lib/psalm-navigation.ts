import 'server-only'
import { db } from '@/db'
import { psalms, psalmVersions } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import { deriveVersionSlug, stripStar } from '@/lib/psalm-slugs'

/**
 * Builds the canonical ordered list of psalm slugs used for prev/next navigation.
 *
 * Mirrors the data source and ordering of `generateStaticParams` in
 * `src/app/psalms/[id]/page.tsx`, with one difference: for multi-version psalms
 * we keep ONLY the versioned slug (e.g. "45a") and EXCLUDE the bare numeric
 * backward-compat slug ("45"). This way arrow-key/prev-next stepping walks the
 * canonical versioned slugs only. The bare numeric slug still RESOLVES via the
 * static-params backward-compat path; if a user lands on `/psalms/45`, we still
 * locate it in the canonical list and return correct neighbors.
 */

let cachedOrderedSlugs: string[] | null = null
let cachedNumericToCanonical: Map<number, string> | null = null

async function buildOrderedSlugs(): Promise<{
  ordered: string[]
  numericToCanonical: Map<number, string>
}> {
  if (cachedOrderedSlugs && cachedNumericToCanonical) {
    return { ordered: cachedOrderedSlugs, numericToCanonical: cachedNumericToCanonical }
  }

  const rows = await db
    .select({ psalmId: psalms.id, psalterNumber: psalmVersions.psalterNumber })
    .from(psalms)
    .leftJoin(psalmVersions, eq(psalmVersions.psalmId, psalms.id))
    .orderBy(asc(psalms.id), asc(psalmVersions.id))

  const countById = new Map<number, number>()
  for (const row of rows) {
    if (row.psalmId) countById.set(row.psalmId, (countById.get(row.psalmId) ?? 0) + 1)
  }

  const ordered: string[] = []
  const seen = new Set<string>()
  // For multi-version psalms, map the bare numeric id (e.g. 45) to its first canonical
  // versioned slug (e.g. "45a") so that landing on a backward-compat URL still finds
  // a position in the navigation order.
  const numericToCanonical = new Map<number, string>()

  for (const row of rows) {
    if (!row.psalmId) continue
    const isMulti = (countById.get(row.psalmId) ?? 1) > 1
    const rawLabel = deriveVersionSlug(row.psalmId, row.psalterNumber, isMulti)
    const slug = stripStar(rawLabel)
    if (!seen.has(slug)) {
      seen.add(slug)
      ordered.push(slug)
      if (isMulti && !numericToCanonical.has(row.psalmId)) {
        numericToCanonical.set(row.psalmId, slug)
      }
    }
  }

  cachedOrderedSlugs = ordered
  cachedNumericToCanonical = numericToCanonical
  return { ordered, numericToCanonical }
}

export async function getPsalmNeighbors(
  slug: string,
): Promise<{ prev: string | null; next: string | null }> {
  const { ordered, numericToCanonical } = await buildOrderedSlugs()

  let idx = ordered.indexOf(slug)
  if (idx === -1) {
    // Backward-compat: bare numeric slug for a multi-version psalm
    const asNum = parseInt(slug, 10)
    if (Number.isFinite(asNum)) {
      const canonical = numericToCanonical.get(asNum)
      if (canonical) idx = ordered.indexOf(canonical)
    }
  }
  if (idx === -1) return { prev: null, next: null }

  return {
    prev: idx > 0 ? ordered[idx - 1] : null,
    next: idx < ordered.length - 1 ? ordered[idx + 1] : null,
  }
}
