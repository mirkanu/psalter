import { NextResponse } from 'next/server'
import { db } from '@/db'
import { psalmVersions, tunes } from '@/db/schema'
import { ilike, or, eq, asc } from 'drizzle-orm'
import { buildSnippet } from '@/lib/search-utils'
import { tuneNameToSlug } from '@/lib/tune-slug'

export const runtime = 'nodejs'

export interface SearchResult {
  type: 'psalm' | 'tune'
  relevance: number
  id: number
  slug?: string
  firstLine?: string | null
  snippet?: string | null
  isRecommended?: boolean
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

    const psalmMatches: SearchResult[] = []

    // #25: accept verse-range queries ("119-1", "119-1-8") so users can
    // jump straight to a specific section of psalm 119, not just psalm 119.
    const verseMatch = q.match(/^(\d+)-(\d+)(?:-\d+)?$/)
    const numericId = parseInt(q, 10)
    const psalmIdFromVerse = verseMatch ? parseInt(verseMatch[1], 10) : NaN
    const numericPsalmId =
      !verseMatch && Number.isFinite(numericId) && /^\d+$/.test(q) ? numericId : NaN

    if (Number.isFinite(psalmIdFromVerse) || Number.isFinite(numericPsalmId)) {
      const targetId = Number.isFinite(psalmIdFromVerse)
        ? psalmIdFromVerse
        : numericPsalmId

      const rows = await db.query.psalmVersions.findMany({
        where: eq(psalmVersions.psalmId, targetId),
        with: { psalm: true },
        orderBy: [asc(psalmVersions.id)],
      })

      // Psalm 119 has many section versions like "119:1-8", "119:9-16", …
      // For psalmId searches the user wants psalm 119 itself (one row), not a
      // wall of section rows. Suppress them unless the query was a verse range.
      const filtered = rows.filter((v) => {
        const pn = v.psalterNumber ?? ''
        if (verseMatch) {
          const rangeStart = verseMatch[2]
          return pn.includes(`:${rangeStart}-`) || pn.includes(`:${rangeStart} `)
        }
        return !pn.includes(':')
      })

      const rowsToShow = verseMatch ? filtered : filtered.slice(0, 2)

      rowsToShow.forEach((v, i) => {
        const pn = v.psalterNumber ?? ''
        const rangeMatch = pn.match(/(\d+):(\d+-\d+)/)
        const slug = rangeMatch
          ? `${rangeMatch[1]}-${rangeMatch[2]}`
          : (pn === `${targetId}a` || pn === `${targetId}b`)
            ? pn
            : String(targetId)
        const isMulti = verseMatch ? false : rowsToShow.length > 1
        psalmMatches.push({
          type: 'psalm',
          relevance: 1,
          id: targetId,
          slug: isMulti ? (i === 0 ? `${targetId}a` : `${targetId}b`) : slug,
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
          ilike(psalmVersions.lyricsImportedRaw, lq)
        ),
        with: { psalm: true },
        orderBy: [asc(psalmVersions.psalmId), asc(psalmVersions.id)],
        limit: 20,
      })

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
          const snippet = buildSnippet(v.lyricsImportedRaw, q) ?? buildSnippet(v.firstLine, q)
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
        slug: tuneNameToSlug(t.name ?? ''),
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
