/**
 * POST /api/dev/melisma-save
 *
 * Persists a manually-annotated ABC body (with embedded w: lines) to
 * tunes.abc_notation. Gated by Cloudflare Access on the /dev/* path —
 * see Cloudflare zero-trust app "psalter-dev-tools".
 *
 * Request body: { tuneId: number, abcNotation: string }
 * Response:     { ok: true, updatedRows: number }
 */

import { NextResponse } from 'next/server'
import { db } from '@/db'
import { tunes } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SaveBody {
  tuneId: number
  abcNotation: string
}

export async function POST(req: Request) {
  let body: SaveBody
  try {
    body = (await req.json()) as SaveBody
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (
    typeof body.tuneId !== 'number' ||
    typeof body.abcNotation !== 'string' ||
    body.abcNotation.trim().length === 0
  ) {
    return NextResponse.json(
      { error: 'tuneId (number) and abcNotation (non-empty string) required' },
      { status: 400 },
    )
  }

  if (!body.abcNotation.includes('K:')) {
    return NextResponse.json(
      { error: 'abcNotation missing K: header — refusing to write' },
      { status: 400 },
    )
  }

  const result = await db
    .update(tunes)
    .set({ abcNotation: body.abcNotation })
    .where(eq(tunes.id, body.tuneId))
    .returning({ id: tunes.id, name: tunes.name })

  if (result.length !== 1) {
    return NextResponse.json(
      { error: `expected 1 row update, got ${result.length}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, updatedRows: result.length, tune: result[0] })
}
