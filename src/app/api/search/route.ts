import { NextResponse } from 'next/server'
import { db } from '@/db'
import { psalmVersions, tunes } from '@/db/schema'
import { ilike, or, eq, asc } from 'drizzle-orm'

export const runtime = 'nodejs'

function buildSnippet(text: string | null, query: string, maxLen = 100): string | null {
  if (!text || !query) return null
  const lower = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lower.indexOf(lowerQuery)
  if (idx === -1) return null
  const start = Math.max(0, idx - 30)
  const end = Math.min(text.length, start + maxLen)
  let excerpt = text.slice(start, end)
  if (start > 0) excerpt = '…' + excerpt
  if (end < text.length) excerpt = excerpt + '…'
  return excerpt
}

export interface SearchResult {
  type: 'psalm' | 'tune'
  relevance: number
  // Psalm fields
  id: number
  slug?: string
  firstLine?: string | null
  snippet?: string | null
  isRecommended?: boolean
  // Tune fields
  name?: string | null
  meter?: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 1) {
    return NextResponse.json({ results: [] })
  }

  const isNumeric = /^\d+$/.test(q)
  const qLower = q.toLowerCase()

  // Search psalms
  const psalmMatches: SearchResult[] = []

  if (isNumeric) {
    const targetId = parseInt(q, 10)
    const rows = await db.query.psalmVersions.findMany({
      where: eq(psalmVersions.psalmId, targetId),
      with: { psalm: true },
      orderBy: [asc(psalmVersions.id)],
    })
    const multiVersion = rows.length > 1
    rows.forEach((v, i) => {
      const suffix = multiVersion ? (i === 0 ? 'a' : 'b') : ''
      psalmMatches.push({
        type: 'psalm',
        relevance: 1, // exact number match
        id: targetId,
        slug: multiVersion ? `${targetId}${suffix}` : String(targetId),
        firstLine: v.firstLine ?? null,
        snippet: null,
        isRecommended: i === 0,
      })
    })
  } else {
    const lq = `%${q}%`
    const rows = await db.query.psalmVersions.findMany({
      where: or(
        ilike(psalmVersions.firstLine, lq),
        ilike(psalmVersions.lyrics, lq)
      ),
      with: { psalm: true },
      orderBy: [asc(psalmVersions.psalmId), asc(psalmVersions.id)],
      limit: 20,
    })

    // Group by psalmId, pick first version per psalm
    const seen = new Map<number, boolean>()
    rows.forEach((v) => {
      const psalmId = v.psalmId
      if (!psalmId) return
      const snippet = buildSnippet(v.lyrics, q) ?? buildSnippet(v.firstLine, q)
      const isFirst = !seen.has(psalmId)
      seen.set(psalmId, true)

      // Determine relevance
      const firstLineLower = (v.firstLine ?? '').toLowerCase()
      const relevance = firstLineLower.includes(qLower) ? 2 : 3

      psalmMatches.push({
        type: 'psalm',
        relevance,
        id: psalmId,
        slug: String(psalmId),
        firstLine: v.firstLine ?? null,
        snippet,
        isRecommended: isFirst,
      })
    })
  }

  // Search tunes
  const tuneRows = await db.query.tunes.findMany({
    where: ilike(tunes.name, `%${q}%`),
    columns: { id: true, name: true, meter: true },
    limit: 10,
    orderBy: [asc(tunes.name)],
  })

  const tuneMatches: SearchResult[] = tuneRows.map((t) => {
    const nameLower = (t.name ?? '').toLowerCase()
    const relevance = nameLower.startsWith(qLower) ? 0 : 1
    return {
      type: 'tune',
      relevance,
      id: t.id,
      name: t.name,
      meter: t.meter,
    }
  })

  const results = [...tuneMatches, ...psalmMatches]
    .sort((a, b) => a.relevance - b.relevance)
    .slice(0, 15)

  return NextResponse.json({ results })
}
