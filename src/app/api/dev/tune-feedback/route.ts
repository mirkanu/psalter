import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { tuneNotationFeedback } from '@/db/schema'
import { getAdminSessionOr401 } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const { res: authRes } = await getAdminSessionOr401()
  if (authRes) return authRes

  const tuneId = parseInt(req.nextUrl.searchParams.get('tuneId') ?? '')
  if (!tuneId) return NextResponse.json(null)

  const row = await db.select().from(tuneNotationFeedback)
    .where(eq(tuneNotationFeedback.tuneId, tuneId))
    .limit(1)

  return NextResponse.json(row[0] ?? null)
}

export async function POST(req: NextRequest) {
  const { res: authRes } = await getAdminSessionOr401()
  if (authRes) return authRes

  const { tuneId, selectedVersion, comment } = await req.json()
  if (!tuneId) return NextResponse.json({ error: 'Missing tuneId' }, { status: 400 })

  await db.insert(tuneNotationFeedback)
    .values({ tuneId, selectedVersion: selectedVersion ?? 'none', comment: comment ?? '' })
    .onConflictDoUpdate({
      target: tuneNotationFeedback.tuneId,
      set: { selectedVersion: selectedVersion ?? 'none', comment: comment ?? '', updatedAt: new Date() },
    })

  return NextResponse.json({ ok: true })
}
