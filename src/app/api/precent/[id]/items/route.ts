import { NextResponse } from 'next/server'
import { db } from '@/db'
import { setItems } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const setId = parseInt(id)
  if (isNaN(setId)) {
    return NextResponse.json({ error: 'invalid set id' }, { status: 400 })
  }

  let body: { psalmId?: unknown; tuneId?: unknown; verseRange?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (typeof body.psalmId !== 'number') {
    return NextResponse.json(
      { error: 'psalmId (number) required' },
      { status: 400 },
    )
  }

  const psalmId = body.psalmId
  const tuneId =
    typeof body.tuneId === 'number' ? body.tuneId : null
  const verseRange =
    typeof body.verseRange === 'string' && body.verseRange.length <= 20
      ? body.verseRange
      : null

  const result = await db.transaction(async (tx) => {
    const rows = await tx
      .select({ position: setItems.position })
      .from(setItems)
      .where(eq(setItems.setId, setId))
    const nextPos = rows.length ? Math.max(...rows.map((r) => r.position)) + 1 : 0
    const [inserted] = await tx
      .insert(setItems)
      .values({ setId, psalmId, tuneId, verseRange, position: nextPos })
      .returning({ id: setItems.id, position: setItems.position })
    return inserted
  })

  return NextResponse.json({ ok: true, item: result })
}
