import { cache } from "react"
import { db } from "@/db"
import { sql } from "drizzle-orm" // drizzle-orm template tag — NEVER from "@/db"
import { eq, asc, desc, count, isNotNull, ne, and } from "drizzle-orm"
import {
  topics,
  psalmTopics,
  navesTopics,
  verseNavesTopics,
  verses,
  messianicPsalms,
  psalms,
  psalmVersions,
} from "@/db/schema"

// --- Topics (Themes) ---

export const fetchTopicsWithCounts = cache(async function fetchTopicsWithCounts() {
  return db
    .select({ id: topics.id, name: topics.name, count: count(psalmTopics.psalmId) })
    .from(topics)
    .leftJoin(psalmTopics, eq(psalmTopics.topicId, topics.id))
    .where(and(isNotNull(topics.name), ne(topics.topicType, 'When you...')))
    .groupBy(topics.id, topics.name)
    .orderBy(desc(count(psalmTopics.psalmId)))
})

export const fetchWhenYouTopics = cache(async function fetchWhenYouTopics() {
  return db
    .select({ id: topics.id, name: topics.name, count: count(psalmTopics.psalmId) })
    .from(topics)
    .leftJoin(psalmTopics, eq(psalmTopics.topicId, topics.id))
    .where(eq(topics.topicType, 'When you...'))
    .groupBy(topics.id, topics.name)
    .orderBy(desc(count(psalmTopics.psalmId)))
})

// WR-04: use DISTINCT ON (p.id) to avoid duplicate rows when a psalm has multiple versions
export const fetchPsalmsByTopic = cache(async function fetchPsalmsByTopic(topicId: number) {
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (p.id)
      p.id,
      pv.first_line AS "firstLine",
      pv.meter
    FROM psalm_topics pt
    JOIN psalms p ON p.id = pt.psalm_id
    LEFT JOIN psalm_versions pv ON pv.psalm_id = p.id
    WHERE pt.topic_id = ${topicId}
    ORDER BY p.id, pv.id
  `)
  return rows as unknown as Array<{ id: number; firstLine: string | null; meter: string | null }>
})

// --- Nave's Topics ---
// IMPORTANT: No direct naves_topics → psalms link in schema.
// Join chain: naves_topics → verse_naves_topics → verses → psalm_id

// WR-03: wrapped in cache() to deduplicate calls across generateStaticParams / generateMetadata / page
export const fetchNavesTopicsWithCounts = cache(async function fetchNavesTopicsWithCounts() {
  const rows = await db.execute(sql`
    SELECT nt.id, nt.name, COUNT(DISTINCT v.psalm_id)::integer AS psalm_count
    FROM naves_topics nt
    JOIN verse_naves_topics vnt ON vnt.naves_topic_id = nt.id
    JOIN verses v ON v.id = vnt.verse_id
    GROUP BY nt.id, nt.name
    ORDER BY psalm_count DESC
  `)
  return rows as unknown as Array<{ id: number; name: string; psalm_count: number }>
})

export const fetchPsalmsByNavesTopic = cache(async function fetchPsalmsByNavesTopic(topicId: number) {
  const rows = await db.execute(sql`
    SELECT DISTINCT v.psalm_id
    FROM verse_naves_topics vnt
    JOIN verses v ON v.id = vnt.verse_id
    WHERE vnt.naves_topic_id = ${topicId}
    ORDER BY v.psalm_id
  `)
  return rows as unknown as Array<{ psalm_id: number }>
})

// For the /explore/naves/[slug] detail page — returns psalm rows for display
// WR-07: use DISTINCT ON (p.id) to guarantee one row per psalm (not one per version)
export const fetchPsalmDetailsByNavesTopic = cache(async function fetchPsalmDetailsByNavesTopic(topicId: number) {
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (p.id)
      p.id,
      pv.first_line AS "firstLine",
      pv.meter
    FROM verse_naves_topics vnt
    JOIN verses v ON v.id = vnt.verse_id
    JOIN psalms p ON p.id = v.psalm_id
    LEFT JOIN psalm_versions pv ON pv.psalm_id = p.id
    WHERE vnt.naves_topic_id = ${topicId}
    ORDER BY p.id, pv.id
  `)
  return rows as unknown as Array<{ id: number; firstLine: string | null; meter: string | null }>
})

// --- Messianic Psalms ---

// WR-04: use DISTINCT ON (p.id) to avoid duplicate rows when a psalm has multiple versions
export const fetchMessianicPsalms = cache(async function fetchMessianicPsalms() {
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (mp.psalm_id)
      mp.psalm_id AS "psalmId",
      mp.classification,
      pv.first_line AS "firstLine",
      pv.meter
    FROM messianic_psalms mp
    LEFT JOIN psalm_versions pv ON pv.psalm_id = mp.psalm_id
    ORDER BY mp.psalm_id, pv.id
  `)
  return rows as unknown as Array<{
    psalmId: number
    classification: string | null
    firstLine: string | null
    meter: string | null
  }>
})

// --- Authors ---
// Note: psalmVersions has no 'author' column — author is on psalms table.
// fetchDistinctAuthors and fetchPsalmsByAuthor use psalms.author instead.

export async function fetchDistinctAuthors() {
  const rows = await db
    .selectDistinct({ author: psalms.author })
    .from(psalms)
    .where(isNotNull(psalms.author))
    .orderBy(asc(psalms.author))
  return rows.map((r) => r.author).filter((a): a is string => a !== null)
}

// WR-04: use DISTINCT ON (p.id) to avoid duplicate rows when a psalm has multiple versions
export const fetchPsalmsByAuthor = cache(async function fetchPsalmsByAuthor(author: string) {
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (p.id)
      p.id,
      pv.first_line AS "firstLine",
      pv.meter
    FROM psalms p
    LEFT JOIN psalm_versions pv ON pv.psalm_id = p.id
    WHERE p.author = ${author}
    ORDER BY p.id, pv.id
  `)
  return rows as unknown as Array<{ id: number; firstLine: string | null; meter: string | null }>
})
