import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { setItems } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSessionOr401, loadSetWithAccess } from '@/lib/precent-auth'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const setId = parseInt(id)
  if (isNaN(setId)) {
    revalidateTag('precent', 'max')
    return NextResponse.json({ error: 'invalid set id' }, { status: 400 })
  }

  const { session, res: authRes } = await getSessionOr401()
  if (authRes) return authRes
  const access = await loadSetWithAccess(setId, session)
  if (access.res) return access.res

  let body: { ids?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const ids = body.ids
  if (!Array.isArray(ids) || !ids.every((n) => typeof n === 'number')) {
    return NextResponse.json({ error: 'ids must be number[]' }, { status: 400 })
  }

  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx
        .update(setItems)
        .set({ position: i })
        .where(and(eq(setItems.id, ids[i] as number), eq(setItems.setId, setId))) // T-05-03: set-scoped
    }
  })

  return NextResponse.json({ ok: true })
}
