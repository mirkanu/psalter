/**
 * GET  /api/dev/melisma-decision?tuneId=N
 *   → { currentStatus: 'approved'|'not_approved'|null, history: DecisionEntry[] }
 *
 * POST /api/dev/melisma-decision
 *   body: { tuneId: number, status?, comment?, melismaPositions? }
 *   At least one of status/comment must be present. Appends a new history row.
 *   `status: null` means "no status change" — used when only logging a comment.
 *   `melismaPositions` is persisted to tunes.melisma_positions whenever provided
 *   (including [] for zero-melisma approvals), so the positions branch in
 *   NotationRenderer runs on prod for confirmed tunes.
 *
 * Gated by Cloudflare Access on /dev/* (psalter-dev-tools app).
 */

import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { tuneMelismaDecisions, tunes } from '@/db/schema'
import { eq, desc, and, isNotNull } from 'drizzle-orm'
import { getAdminSessionOr401 } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export type MelismaStatus = 'approved' | 'not_approved'

export interface DecisionEntry {
  id: number
  status: MelismaStatus | null
  comment: string | null
  createdAt: string  // ISO
}

const ALLOWED_STATUSES: ReadonlyArray<MelismaStatus> = ['approved', 'not_approved']

export async function GET(req: Request) {
  const { res: authRes } = await getAdminSessionOr401()
  if (authRes) return authRes

  const url = new URL(req.url)
  const tuneIdRaw = url.searchParams.get('tuneId')
  const tuneId = tuneIdRaw ? Number(tuneIdRaw) : NaN
  if (!Number.isFinite(tuneId) || tuneId <= 0) {
    revalidateTag('precent')
    return NextResponse.json({ error: 'tuneId (positive number) required' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(tuneMelismaDecisions)
    .where(eq(tuneMelismaDecisions.tuneId, tuneId))
    .orderBy(desc(tuneMelismaDecisions.createdAt), desc(tuneMelismaDecisions.id))

  const history: DecisionEntry[] = rows.map(r => ({
    id: r.id,
    status: (r.status as MelismaStatus | null) ?? null,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  }))

  // currentStatus = latest entry whose status is non-null
  const currentStatus =
    (history.find(h => h.status !== null)?.status as MelismaStatus | undefined) ?? null

  return NextResponse.json({ currentStatus, history })
}

interface PostBody {
  tuneId: number
  status?: MelismaStatus | null
  comment?: string
  melismaPositions?: number[][] | null
}

export async function POST(req: Request) {
  const { res: authRes } = await getAdminSessionOr401()
  if (authRes) return authRes

  let body: PostBody
  try {
    body = (await req.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (typeof body.tuneId !== 'number' || !Number.isFinite(body.tuneId) || body.tuneId <= 0) {
    return NextResponse.json({ error: 'tuneId (positive number) required' }, { status: 400 })
  }

  const hasStatus = body.status !== undefined && body.status !== null
  const hasComment = typeof body.comment === 'string' && body.comment.trim().length > 0

  if (!hasStatus && !hasComment) {
    return NextResponse.json(
      { error: 'at least one of status or comment must be provided' },
      { status: 400 },
    )
  }

  if (hasStatus && !ALLOWED_STATUSES.includes(body.status as MelismaStatus)) {
    return NextResponse.json(
      { error: `status must be one of ${ALLOWED_STATUSES.join(', ')} or null` },
      { status: 400 },
    )
  }

  const inserted = await db
    .insert(tuneMelismaDecisions)
    .values({
      tuneId: body.tuneId,
      status: hasStatus ? (body.status as MelismaStatus) : null,
      comment: hasComment ? body.comment!.trim() : null,
    })
    .returning()

  if (body.melismaPositions !== undefined) {
    await db
      .update(tunes)
      .set({ melismaPositions: body.melismaPositions })
      .where(eq(tunes.id, body.tuneId))
  }

  // Recompute current status (latest non-null) — cheap, single tune
  const latestStatusRow = await db
    .select({ status: tuneMelismaDecisions.status })
    .from(tuneMelismaDecisions)
    .where(and(eq(tuneMelismaDecisions.tuneId, body.tuneId), isNotNull(tuneMelismaDecisions.status)))
    .orderBy(desc(tuneMelismaDecisions.createdAt), desc(tuneMelismaDecisions.id))
    .limit(1)

  const currentStatus = (latestStatusRow[0]?.status as MelismaStatus | undefined) ?? null

  return NextResponse.json({
    ok: true,
    entry: {
      id: inserted[0].id,
      status: (inserted[0].status as MelismaStatus | null) ?? null,
      comment: inserted[0].comment,
      createdAt: inserted[0].createdAt.toISOString(),
    } satisfies DecisionEntry,
    currentStatus,
  })
}
