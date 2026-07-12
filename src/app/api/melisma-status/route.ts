/**
 * GET /api/melisma-status?tuneId=N
 *   → { currentStatus: 'approved'|'not_approved'|null }
 *
 * CR-02 fix: stable, intentionally PUBLIC read-only route. `SingingView`
 * (rendered on the anonymous-facing `/psalms/[slug]` page) needs to read a
 * tune's melisma approval status to gate the inline Solfège feature. It
 * previously read `/api/dev/melisma-decision`, whose own docstring claims it
 * is "Gated by Cloudflare Access on /dev/* (psalter-dev-tools app)" — wiring
 * a permanent public-facing feature to a route living under the `/api/dev/`
 * dev-tooling namespace was an architecture mismatch that could silently
 * disable inline Solfège site-wide the moment Access rules cover this path.
 *
 * This route intentionally duplicates the read-side query from
 * `/api/dev/melisma-decision`'s GET handler rather than importing it, so this
 * file's public-access contract is self-contained and doesn't inherit
 * whatever gating conventions later get added to the `/api/dev/*` namespace.
 * The write path (POST, admin/precentor melisma-decision authoring) stays
 * under `/api/dev/melisma-decision` untouched.
 */

import { NextResponse } from 'next/server'
import { db } from '@/db'
import { tuneMelismaDecisions } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { MelismaStatus } from '@/app/api/dev/melisma-decision/route'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tuneIdRaw = url.searchParams.get('tuneId')
  const tuneId = tuneIdRaw ? Number(tuneIdRaw) : NaN
  if (!Number.isFinite(tuneId) || tuneId <= 0) {
    return NextResponse.json({ error: 'tuneId (positive number) required' }, { status: 400 })
  }

  const rows = await db
    .select({ status: tuneMelismaDecisions.status })
    .from(tuneMelismaDecisions)
    .where(eq(tuneMelismaDecisions.tuneId, tuneId))
    .orderBy(desc(tuneMelismaDecisions.createdAt), desc(tuneMelismaDecisions.id))

  // currentStatus = latest entry whose status is non-null
  const currentStatus =
    (rows.find((r) => r.status !== null)?.status as MelismaStatus | undefined) ?? null

  return NextResponse.json({ currentStatus })
}
