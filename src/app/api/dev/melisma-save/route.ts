/**
 * POST /api/dev/melisma-save
 *
 * Persists a manually-annotated ABC body to tunes.abc_notation, plus an
 * optional per-tune phrase-shape override (used by NotationRenderer for
 * cycles 2+ to handle tunes like Abbeyville where the score has more
 * phrases than the lyrics natively define).
 *
 * Gated by Cloudflare Access on the /dev/* path (psalter-dev-tools app).
 *
 * Request body:
 *   {
 *     tuneId: number,
 *     abcNotation: string,
 *     // OPTIONAL. Array of per-phrase syllable counts (e.g. [8,6,8,6,6]).
 *     // If matches the meter default, the server CLEARS the column (NULL).
 *     // If null literal: clear unconditionally.
 *     // If undefined: leave the column untouched.
 *     phraseShape?: number[] | null,
 *   }
 */

import { NextResponse } from 'next/server'
import { db } from '@/db'
import { tunes } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { expectedSyllablesByLine } from '@/lib/meter-syllable-shape'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SaveBody {
  tuneId: number
  abcNotation: string
  phraseShape?: number[] | null
  // Optional edited soprano string from the raw-solfège textarea.
  // - undefined → leave column untouched
  // - null      → clear (revert to OCR original)
  // - string    → persist
  rawSoprano?: string | null
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

  // Decide whether to touch phraseShapeOverride.
  // - body.phraseShape === undefined → leave column alone (no update field)
  // - body.phraseShape === null      → clear it
  // - body.phraseShape: number[]     → store IF it differs from meter default; else clear
  const updateSet: {
    abcNotation: string
    phraseShapeOverride?: number[] | null
    solfegeSopranoEdited?: string | null
  } = {
    abcNotation: body.abcNotation,
  }
  // rawSoprano persistence:
  //   undefined → no change to column
  //   null      → clear (revert to original OCR)
  //   string    → store as override
  if (body.rawSoprano === null) {
    updateSet.solfegeSopranoEdited = null
  } else if (typeof body.rawSoprano === 'string') {
    updateSet.solfegeSopranoEdited = body.rawSoprano
  }
  if (body.phraseShape === null) {
    updateSet.phraseShapeOverride = null
  } else if (Array.isArray(body.phraseShape)) {
    if (!body.phraseShape.every(n => typeof n === 'number' && Number.isFinite(n) && n > 0)) {
      return NextResponse.json(
        { error: 'phraseShape must be an array of positive numbers' },
        { status: 400 },
      )
    }
    // Look up the meter for this tune to decide whether the supplied shape
    // is just the default (in which case we store NULL to keep the column
    // free of redundant data).
    const tuneRow = await db
      .select({ meter: tunes.meter })
      .from(tunes)
      .where(eq(tunes.id, body.tuneId))
    if (tuneRow.length !== 1) {
      return NextResponse.json({ error: 'tune not found' }, { status: 404 })
    }
    const expected = expectedSyllablesByLine(tuneRow[0].meter)
    const matchesDefault =
      expected !== null &&
      expected.length === body.phraseShape.length &&
      expected.every((v, i) => v === body.phraseShape![i])
    updateSet.phraseShapeOverride = matchesDefault ? null : body.phraseShape
  }

  const result = await db
    .update(tunes)
    .set(updateSet)
    .where(eq(tunes.id, body.tuneId))
    .returning({ id: tunes.id, name: tunes.name, phraseShapeOverride: tunes.phraseShapeOverride })

  if (result.length !== 1) {
    return NextResponse.json(
      { error: `expected 1 row update, got ${result.length}` },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    updatedRows: result.length,
    tune: result[0],
    phraseShapeOverride: result[0].phraseShapeOverride,
  })
}
