import { db } from "@/db"
import { sql } from "drizzle-orm" // drizzle-orm template tag — NEVER from "@/db"

// Allow only the <b> tags that ts_headline produces; escape everything else
function sanitiseSnippet(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;b&gt;/g, '<b>')
    .replace(/&lt;\/b&gt;/g, '</b>')
}

export interface SearchResult {
  id: number
  firstLine: string | null
  meter: string | null
  rank: number
  snippet: string
}

export async function fetchSearchResults(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const rows = await db.execute(sql`
    SELECT id, "firstLine", meter, rank, snippet
    FROM (
      SELECT DISTINCT ON (p.id)
        p.id,
        pv.first_line AS "firstLine",
        pv.meter,
        ts_rank(
          to_tsvector('english', COALESCE(p.kjv_text, '') || ' ' || COALESCE(pv.lyrics, '')),
          plainto_tsquery('english', ${query})
        ) AS rank,
        ts_headline(
          'english',
          COALESCE(p.kjv_text, '') || ' ' || COALESCE(pv.lyrics, ''),
          plainto_tsquery('english', ${query}),
          'StartSel=<b>, StopSel=</b>, MaxWords=15, MinWords=5, MaxFragments=1'
        ) AS snippet
      FROM psalms p
      LEFT JOIN psalm_versions pv ON pv.psalm_id = p.id
      WHERE to_tsvector('english', COALESCE(p.kjv_text, '') || ' ' || COALESCE(pv.lyrics, ''))
        @@ plainto_tsquery('english', ${query})
      ORDER BY p.id, ts_rank(
        to_tsvector('english', COALESCE(p.kjv_text, '') || ' ' || COALESCE(pv.lyrics, '')),
        plainto_tsquery('english', ${query})
      ) DESC
    ) sub
    ORDER BY rank DESC
    LIMIT 50
  `)

  return (rows as unknown as SearchResult[]).map((r) => ({
    ...r,
    snippet: sanitiseSnippet(r.snippet ?? ''),
  }))
}
