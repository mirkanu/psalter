import { NextResponse } from 'next/server'
import { db } from '@/db'
import { precentingSets } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { getSessionOr401 } from '@/lib/precent-auth'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['AM Service', 'PM Service', 'Other'] as const

export async function GET(req: Request) {
  const { session, res } = await getSessionOr401()
  if (res) return res
  const url = new URL(req.url)
  const requested = url.searchParams.get('userId')
  const targetUserId = (requested && session.user.role === 'admin') ? requested : session.user.id
  const sets = await db.query.precentingSets.findMany({
    where: eq(precentingSets.userId, targetUserId),
    orderBy: [desc(precentingSets.date)],
  })
  return NextResponse.json(sets)
}

export async function POST(req: Request) {
  const { session, res } = await getSessionOr401()
  if (res) return res

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (typeof body.date !== 'string' || body.date.trim() === '') {
    return NextResponse.json({ error: 'date is required' }, { status: 400 })
  }

  if (body.type !== 'AM Service' && body.type !== 'PM Service' && body.type !== 'Other') {
    return NextResponse.json(
      { error: 'type must be AM Service, PM Service, or Other' },
      { status: 400 },
    )
  }

  if (body.note != null && (typeof body.note !== 'string' || body.note.length > 500)) {
    return NextResponse.json(
      { error: 'note must be a string ≤ 500 chars' },
      { status: 400 },
    )
  }

  // D-15: admin viewing-as can create sets owned by a target precentor
  const ownerId =
    (typeof body.userId === 'string' && session.user.role === 'admin')
      ? body.userId
      : session.user.id

  const [row] = await db
    .insert(precentingSets)
    .values({
      date: body.date as string,
      type: body.type as (typeof VALID_TYPES)[number],
      note: (body.note as string | null | undefined) ?? null,
      userId: ownerId,
    })
    .returning({ id: precentingSets.id })

  return NextResponse.json({ ok: true, id: row.id })
}
