import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { precentingSets } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSessionOr401, loadSetWithAccess } from '@/lib/precent-auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const setId = parseInt(id)
  if (isNaN(setId)) {
    revalidateTag('precent', 'max')
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }

  const { session, res: authRes } = await getSessionOr401()
  if (authRes) return authRes
  const access = await loadSetWithAccess(setId, session)
  if (access.res) return access.res

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const updateSet: {
    date?: string
    type?: string
    note?: string | null
    updatedAt: Date
  } = { updatedAt: new Date() }

  if (body.date !== undefined) {
    if (typeof body.date !== 'string' || body.date.trim() === '') {
      return NextResponse.json({ error: 'date must be a non-empty string' }, { status: 400 })
    }
    updateSet.date = body.date as string
  }

  if (body.type !== undefined) {
    if (body.type !== 'AM Service' && body.type !== 'PM Service' && body.type !== 'Other') {
      return NextResponse.json(
        { error: 'type must be AM Service, PM Service, or Other' },
        { status: 400 },
      )
    }
    updateSet.type = body.type as string
  }

  if (body.note !== undefined) {
    if (body.note != null && (typeof body.note !== 'string' || body.note.length > 500)) {
      return NextResponse.json(
        { error: 'note must be a string ≤ 500 chars' },
        { status: 400 },
      )
    }
    updateSet.note = (body.note as string | null) ?? null
  }

  const result = await db
    .update(precentingSets)
    .set(updateSet)
    .where(eq(precentingSets.id, setId))
    .returning({ id: precentingSets.id })

  if (result.length !== 1) {
    return NextResponse.json({ error: 'set not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const setId = parseInt(id)
  if (isNaN(setId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }

  const { session, res: authRes } = await getSessionOr401()
  if (authRes) return authRes
  const access = await loadSetWithAccess(setId, session)
  if (access.res) return access.res

  await db.delete(precentingSets).where(eq(precentingSets.id, setId))

  return NextResponse.json({ ok: true })
}
