import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { eq, and } from 'drizzle-orm'
import { tuneOcrResults } from '@/db/schema'

export async function GET(req: NextRequest) {
  const tuneId = parseInt(req.nextUrl.searchParams.get('tuneId') ?? '')
  const mode = req.nextUrl.searchParams.get('mode') ?? ''
  if (!tuneId || !mode) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const row = await db.select().from(tuneOcrResults)
    .where(and(eq(tuneOcrResults.tuneId, tuneId), eq(tuneOcrResults.mode, mode)))
    .limit(1)

  return NextResponse.json(row[0]?.result ?? null)
}

export async function POST(req: NextRequest) {
  const { tuneId, mode, result } = await req.json()
  if (!tuneId || !mode || !result) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await db.insert(tuneOcrResults).values({ tuneId, mode, result })
    .onConflictDoUpdate({
      target: [tuneOcrResults.tuneId, tuneOcrResults.mode],
      set: { result, updatedAt: new Date() },
    })

  return NextResponse.json({ ok: true })
}
