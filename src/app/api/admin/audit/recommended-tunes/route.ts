/**
 * GET /api/admin/audit/recommended-tunes
 *
 * Issue #6 audit: enumerate every tune that is "recommended" for at least one
 * psalm version (i.e. appears in `psalm_version_tunes`) and report whether
 * its current melisma status is `approved` (= staff-inline rendering is the
 * default) or not (= the staff-view will fall back to the JPG scan).
 *
 * A tune is `approved` iff its latest non-null `tune_melisma_decisions.status`
 * is the literal string `approved`. Anything else (null, `not_approved`,
 * pending) counts as not approved.
 *
 * Output JSON:
 *   {
 *     totals: { recommendedTuneCount, approvedCount, notApprovedCount, psalmVersionRowCount },
 *     notApproved: [{ tuneId, name, abcPresent, psalmVersionCount, latestDecisionAt, latestDecisionStatus }],
 *     approved:    [{ tuneId, name, psalmVersionCount, latestDecisionAt }]
 *   }
 *
 * Admin-only (Better-Auth session, role === 'admin').
 */

import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { getAdminSessionOr401 } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RecommendedRow {
  [key: string]: unknown
  tune_id: number
  name: string
  psalm_version_count: number
  abc_present: boolean
  latest_decision_status: 'approved' | 'not_approved' | null
  latest_decision_at: string | null
}

interface CountRow {
  [key: string]: unknown
  count: number
}

export async function GET() {
  const { res: authRes } = await getAdminSessionOr401()
  if (authRes) return authRes

  // Recommended tunes = distinct tune_id referenced by psalm_version_tunes.
  // For each, capture:
  //   - psalm_version row count (how many psalm versions point to it)
  //   - whether ABC notation is present (abc_notation IS NOT NULL and length > 0)
  //   - latest non-null melisma decision row (status + created_at)
  const recommendedRows = (await db.execute<RecommendedRow>(sql`
    WITH latest_decision AS (
      SELECT DISTINCT ON (tune_id)
        tune_id,
        status,
        created_at
      FROM tune_melisma_decisions
      WHERE status IS NOT NULL
      ORDER BY tune_id, created_at DESC
    )
    SELECT
      t.id                                                AS tune_id,
      t.name                                              AS name,
      COUNT(DISTINCT pvt.psalm_version_id)::int           AS psalm_version_count,
      (t.abc_notation IS NOT NULL AND length(t.abc_notation) > 0) AS abc_present,
      ld.status                                           AS latest_decision_status,
      ld.created_at                                       AS latest_decision_at
    FROM psalm_version_tunes pvt
    JOIN tunes t ON t.id = pvt.tune_id
    LEFT JOIN latest_decision ld ON ld.tune_id = t.id
    GROUP BY t.id, t.name, t.abc_notation, ld.status, ld.created_at
    ORDER BY (ld.status = 'approved') DESC NULLS LAST, t.name ASC
  `)) as unknown as RecommendedRow[]

  const approved: Array<{
    tuneId: number
    name: string
    psalmVersionCount: number
    latestDecisionAt: string | null
  }> = []
  const notApproved: Array<{
    tuneId: number
    name: string
    abcPresent: boolean
    psalmVersionCount: number
    latestDecisionAt: string | null
    latestDecisionStatus: 'approved' | 'not_approved' | null
  }> = []

  for (const r of recommendedRows) {
    if (r.latest_decision_status === 'approved') {
      approved.push({
        tuneId: Number(r.tune_id),
        name: r.name,
        psalmVersionCount: Number(r.psalm_version_count),
        latestDecisionAt: r.latest_decision_at ? new Date(r.latest_decision_at).toISOString() : null,
      })
    } else {
      notApproved.push({
        tuneId: Number(r.tune_id),
        name: r.name,
        abcPresent: !!r.abc_present,
        psalmVersionCount: Number(r.psalm_version_count),
        latestDecisionAt: r.latest_decision_at ? new Date(r.latest_decision_at).toISOString() : null,
        latestDecisionStatus: r.latest_decision_status ?? null,
      })
    }
  }

  // Total psalm_version_tunes row count — context for how many psalm→tune edges exist.
  const totalRows = (await db.execute<CountRow>(sql`
    SELECT COUNT(*)::int AS count FROM psalm_version_tunes
  `)) as unknown as CountRow[]
  const psalmVersionRowCount = Number(totalRows[0]?.count ?? 0)

  revalidateTag('precent')
  return NextResponse.json({
    totals: {
      recommendedTuneCount: recommendedRows.length,
      approvedCount: approved.length,
      notApprovedCount: notApproved.length,
      psalmVersionRowCount,
    },
    approved,
    notApproved,
  })
}
