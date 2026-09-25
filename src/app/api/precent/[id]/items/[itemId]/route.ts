import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { setItems } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSessionOr401, loadSetWithAccess } from '@/lib/precent-auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params
  const setId = parseInt(id)
  const itemIdNum = parseInt(itemId)
  if (isNaN(setId) || isNaN(itemIdNum)) {
    revalidateTag('precent', 'max')
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }

  const { session, res: authRes } = await getSessionOr401()
  if (authRes) return authRes
  const access = await loadSetWithAccess(setId, session)
  if (access.res) return access.res

  let body: { tuneId?: unknown; verseRange?: unknown; psalmId?: unknown; psalmVersionId?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const updateSet: { tuneId?: number | null; verseRange?: string | null; psalmId?: number; psalmVersionId?: number | null } = {}
  if ('tuneId' in body) {
    updateSet.tuneId = typeof body.tuneId === 'number' ? body.tuneId : null
  }
  if ('verseRange' in body) {
    updateSet.verseRange =
      typeof body.verseRange === 'string' && body.verseRange.length <= 20
        ? body.verseRange
        : null
  }
  if ('psalmId' in body) {
    if (typeof body.psalmId !== 'number' || !Number.isInteger(body.psalmId) || body.psalmId < 1 || body.psalmId > 150) {
      return NextResponse.json({ error: 'invalid psalmId' }, { status: 400 })
    }
    updateSet.psalmId = body.psalmId
  }
  if ('psalmVersionId' in body) {
    updateSet.psalmVersionId = typeof body.psalmVersionId === 'number' ? body.psalmVersionId : null
  }

  if (Object.keys(updateSet).length === 0) {
    return NextResponse.json({ error: 'no fields to update' }, { status: 400 })
  }

  const result = await db
    .update(setItems)
    .set(updateSet)
    .where(and(eq(setItems.id, itemIdNum), eq(setItems.setId, setId)))
    .returning({ id: setItems.id })

  if (result.length !== 1) {
    return NextResponse.json({ error: 'item not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params
  const setId = parseInt(id)
  const itemIdNum = parseInt(itemId)
  if (isNaN(setId) || isNaN(itemIdNum)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }

  const { session, res: authRes } = await getSessionOr401()
  if (authRes) return authRes
  const access = await loadSetWithAccess(setId, session)
  if (access.res) return access.res

  await db
    .delete(setItems)
    .where(and(eq(setItems.id, itemIdNum), eq(setItems.setId, setId)))

  return NextResponse.json({ ok: true })
}
