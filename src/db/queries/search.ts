import { db } from "@/db"
import { sql } from "drizzle-orm" // drizzle-orm template tag — NEVER from "@/db"

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
    SELECT
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
    ORDER BY rank DESC
    LIMIT 50
  `)

  return rows as unknown as SearchResult[]
}
