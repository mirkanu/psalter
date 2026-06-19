import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { db } from '@/db'
import { precentingSets } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['AM Service', 'PM Service', 'Other'] as const

export async function GET() {
  const sets = await db.query.precentingSets.findMany({
    orderBy: [desc(precentingSets.date)],
  })
  return NextResponse.json(sets)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const [row] = await db
    .insert(precentingSets)
    .values({
      date: body.date as string,
      type: body.type as (typeof VALID_TYPES)[number],
      note: (body.note as string | null | undefined) ?? null,
      userId: session.user.id,
    })
    .returning({ id: precentingSets.id })

  return NextResponse.json({ ok: true, id: row.id })
}
