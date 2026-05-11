import { NextResponse } from 'next/server'
import { db } from '@/db'
import { psalmVersions, tunes } from '@/db/schema'
import { ilike, or, eq, asc } from 'drizzle-orm'
import { buildSnippet } from '@/lib/search-utils'

export const runtime = 'nodejs'

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
  try {
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

      // Group by psalmId to detect multi-version psalms
      const byPsalm = new Map<number, typeof rows>()
      rows.forEach((v) => {
        const pid = v.psalmId
        if (!pid) return
        if (!byPsalm.has(pid)) byPsalm.set(pid, [])
        byPsalm.get(pid)!.push(v)
      })

      byPsalm.forEach((versions, psalmId) => {
        const multiVersion = versions.length > 1
        versions.forEach((v, i) => {
          const suffix = multiVersion ? (i === 0 ? 'a' : 'b') : ''
          const snippet = buildSnippet(v.lyrics, q) ?? buildSnippet(v.firstLine, q)
          const firstLineLower = (v.firstLine ?? '').toLowerCase()
          const relevance = firstLineLower.includes(qLower) ? 2 : 3
          psalmMatches.push({
            type: 'psalm',
            relevance,
            id: psalmId,
            slug: `${psalmId}${suffix}`,
            firstLine: v.firstLine ?? null,
            snippet,
            isRecommended: i === 0,
          })
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
  } catch (err) {
    console.error('Search API error:', err)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
