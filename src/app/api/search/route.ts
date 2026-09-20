import { NextResponse } from 'next/server'
import { db } from '@/db'
import { psalmVersions, tunes } from '@/db/schema'
import { ilike, or, eq, asc } from 'drizzle-orm'
import { buildSnippet } from '@/lib/search-utils'
import { tuneNameToSlug } from '@/lib/tune-slug'
import {
  deriveVersionSlug,
  stanzaForVerse,
  stanzaLetterFromRange,
  stripStar,
} from '@/lib/psalm-slugs'
import { matchPsalmRange, matchPsalmSingleVerse, matchStanzaLetter, matchPsalmNumber } from '@/lib/search-query'

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
  /** Psalm 119 stanza letter (a–v), when the result resolves to a single stanza. */
  stanzaLetter?: string | null
  /** Verse range of the matched psalm 119 stanza, when applicable (e.g. "1-8"). */
  verseRange?: string | null
  // Tune fields
  name?: string | null
  meter?: string | null
}

// Match "119:1-8 (1)" → verseRange "1-8"
function parse119Range(psalterNumber: string | null): string | null {
  if (!psalterNumber) return null
  const m = psalterNumber.match(/(\d+):(\d+-\d+)/)
  return m ? m[2] : null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''

    if (q.length < 1) {
      return NextResponse.json({ results: [] })
    }

    const qLower = q.toLowerCase()
    // Strip whitespace inside the query so "119:1-8" and "119 : 1 - 8" both match.
    const compact = q.replace(/\s+/g, '')
    // Range/single-verse/stanza-letter/bare-number parsers are extracted to
    // src/lib/search-query.ts so they can be unit-tested without booting
    // the DB. See src/lib/search-query.test.ts. Issue #25 relies on this.
    const sectionMatch = matchPsalmRange(compact)
    const singleVerseMatch = matchPsalmSingleVerse(compact)
    const stanzaLetterMatch = matchStanzaLetter(compact)

    // Search psalms
    const psalmMatches: SearchResult[] = []

    if (sectionMatch) {
      const { id: targetId, verseStart, verseEnd } = sectionMatch
      const verseRange = `${verseStart}-${verseEnd}`
      const rows = await db.query.psalmVersions.findMany({
        where: eq(psalmVersions.psalmId, targetId),
        orderBy: [asc(psalmVersions.id)],
        limit: 30,
      })
      // Psalm 119 stanza-aligned ranges live in psalter_number (e.g. "119:1-8 (1)").
      // When a user types a range that crosses stanza boundaries (e.g. "119:1-9"
      // covers the whole of stanza a "1-8" plus verse 1 of stanza b), the exact
      // match is empty. Fall back to every stanza the range overlaps — issue #25.
      const matchedRanges: string[] = []
      const exact = rows.find((v) =>
        v.psalterNumber?.includes(`${targetId}:${verseRange}`)
      )
      if (exact) {
        matchedRanges.push(verseRange)
      } else if (targetId === 119 && Number.isFinite(verseStart) && Number.isFinite(verseEnd)) {
        for (let v = verseStart; v <= verseEnd; v++) {
          const r = stanzaForVerse(v)
          if (r && !matchedRanges.includes(r)) matchedRanges.push(r)
        }
      }
      matchedRanges.forEach((range) => {
        const match = rows.find((v) =>
          v.psalterNumber?.includes(`${targetId}:${range}`)
        )
        if (!match) return
        const letter = stanzaLetterFromRange(range, targetId)
        psalmMatches.push({
          type: 'psalm',
          relevance: 0,
          id: targetId,
          slug: `${targetId}-${range}`,
          firstLine: match.firstLine ?? null,
          snippet: `verses ${range}`,
          verseRange: range,
          stanzaLetter: letter,
          isRecommended: false,
        })
      })
    } else if (singleVerseMatch) {
      const { id: targetId, verse } = singleVerseMatch
      const verseRange = stanzaForVerse(verse)
      if (verseRange) {
        const rows = await db.query.psalmVersions.findMany({
          where: eq(psalmVersions.psalmId, targetId),
          orderBy: [asc(psalmVersions.id)],
          limit: 30,
        })
        const match = rows.find((v) =>
          v.psalterNumber?.includes(`${targetId}:${verseRange}`)
        )
        if (match) {
          const letter = stanzaLetterFromRange(verseRange, targetId)
          psalmMatches.push({
            type: 'psalm',
            relevance: 0,
            id: targetId,
            slug: `${targetId}-${verseRange}`,
            firstLine: match.firstLine ?? null,
            snippet: `verses ${verseRange}`,
            verseRange,
            stanzaLetter: letter,
            isRecommended: false,
          })
        }
      }
    } else if (stanzaLetterMatch) {
      const { id: targetId, letter } = stanzaLetterMatch
      // Psalm 119 stanza letters: map "a" → verseRange "1-8", "b" → "9-16", etc.
      if (targetId === 119) {
        const stanzaIndex = letter.charCodeAt(0) - 'a'.charCodeAt(0)
        if (stanzaIndex >= 0 && stanzaIndex <= 21) {
          const verseRange = `${stanzaIndex * 8 + 1}-${stanzaIndex * 8 + 8}`
          const rows = await db.query.psalmVersions.findMany({
            where: eq(psalmVersions.psalmId, targetId),
            orderBy: [asc(psalmVersions.id)],
            limit: 30,
          })
          const match = rows.find((v) =>
            v.psalterNumber?.includes(`${targetId}:${verseRange}`)
          )
          if (match) {
            psalmMatches.push({
              type: 'psalm',
              relevance: 0,
              id: targetId,
              slug: `${targetId}-${verseRange}`,
              firstLine: match.firstLine ?? null,
              snippet: `verses ${verseRange}`,
              verseRange,
              stanzaLetter: letter,
              isRecommended: false,
            })
          }
        }
      } else {
        // Other multi-version psalms (e.g. "70a"): slug is `${id}${letter}`
        const rows = await db.query.psalmVersions.findMany({
          where: eq(psalmVersions.psalmId, targetId),
          orderBy: [asc(psalmVersions.id)],
          limit: 30,
        })
        const multiVersion = rows.length > 1
        const match = rows.find((v) =>
          deriveVersionSlug(targetId, v.psalterNumber, multiVersion).replace('*', '') === `${targetId}${letter}`
        )
        if (match) {
          psalmMatches.push({
            type: 'psalm',
            relevance: 0,
            id: targetId,
            slug: `${targetId}${letter}`,
            firstLine: match.firstLine ?? null,
            snippet: null,
            stanzaLetter: letter,
            isRecommended: false,
          })
        }
      }
    } else if (matchPsalmNumber(compact) !== null) {
      const targetId = matchPsalmNumber(compact)!
      // No limit: psalm 119 has 22 sections. Cap at 30 to stay safe.
      const rows = await db.query.psalmVersions.findMany({
        where: eq(psalmVersions.psalmId, targetId),
        with: { psalm: true },
        orderBy: [asc(psalmVersions.id)],
        limit: 30,
      })
      const multiVersion = rows.length > 1
      rows.forEach((v, i) => {
        const rawSlug = deriveVersionSlug(
          targetId,
          v.psalterNumber,
          multiVersion
        )
        const slug = stripStar(rawSlug)
        const range = parse119Range(v.psalterNumber)
        const letter = stanzaLetterFromRange(range, targetId)
        psalmMatches.push({
          type: 'psalm',
          relevance: 1, // exact number match
          id: targetId,
          slug,
          firstLine: v.firstLine ?? null,
          snippet: range ? `verses ${range}` : null,
          verseRange: range,
          stanzaLetter: letter,
          isRecommended: i === 0,
        })
      })
      // Issue #25: when the psalm has multiple sections (Psalm 119, 22
      // stanzas; multi-version psalms with a/b), a bare-number query is
      // ambiguous. Add a "whole psalm" entry at the top so users see a
      // single canonical link to the full psalm before scrolling the
      // stanza list. relevance -1 sorts above the section entries (0 / 1).
      if (multiVersion && rows[0]?.psalm) {
        psalmMatches.unshift({
          type: 'psalm',
          relevance: -1,
          id: targetId,
          slug: String(targetId),
          firstLine: rows[0].psalm.bibleTitle ?? rows[0].firstLine ?? null,
          snippet: null,
          verseRange: null,
          stanzaLetter: null,
          isRecommended: false,
        })
      }
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
          const rawSlug = deriveVersionSlug(psalmId, v.psalterNumber, multiVersion)
          const slug = stripStar(rawSlug)
          const snippet = buildSnippet(v.lyricsImportedRaw, q) ?? buildSnippet(v.firstLine, q)
          const firstLineLower = (v.firstLine ?? '').toLowerCase()
          const firstLineStartsWith = firstLineLower.startsWith(qLower)
          const firstLineContains = firstLineLower.includes(qLower)
          const relevance = firstLineStartsWith ? 0 : firstLineContains ? 1 : 2
          psalmMatches.push({
            type: 'psalm',
            relevance,
            id: psalmId,
            slug,
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
        slug: tuneNameToSlug(t.name ?? ''),
        name: t.name,
        meter: t.meter,
      }
    })

    const results = [...psalmMatches, ...tuneMatches]
      .sort((a, b) => a.relevance - b.relevance)
      .slice(0, 15)

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Search API error:', err)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
