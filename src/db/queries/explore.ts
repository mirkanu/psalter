import { cache } from "react"
import { db } from "@/db"
import { sql } from "drizzle-orm" // drizzle-orm template tag — NEVER from "@/db"
import { eq, asc, desc, count, isNotNull } from "drizzle-orm"
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

export async function fetchTopicsWithCounts() {
  return db
    .select({ id: topics.id, name: topics.name, count: count(psalmTopics.psalmId) })
    .from(topics)
    .leftJoin(psalmTopics, eq(psalmTopics.topicId, topics.id))
    .where(isNotNull(topics.name))
    .groupBy(topics.id, topics.name)
    .orderBy(desc(count(psalmTopics.psalmId)))
}

export const fetchPsalmsByTopic = cache(async function fetchPsalmsByTopic(topicId: number) {
  return db
    .select({ id: psalms.id, firstLine: psalmVersions.firstLine, meter: psalmVersions.meter })
    .from(psalmTopics)
    .innerJoin(psalms, eq(psalms.id, psalmTopics.psalmId))
    .leftJoin(psalmVersions, eq(psalmVersions.psalmId, psalms.id))
    .where(eq(psalmTopics.topicId, topicId))
    .orderBy(asc(psalms.id))
})

// --- Nave's Topics ---
// IMPORTANT: No direct naves_topics → psalms link in schema.
// Join chain: naves_topics → verse_naves_topics → verses → psalm_id

export async function fetchNavesTopicsWithCounts() {
  const rows = await db.execute(sql`
    SELECT nt.id, nt.name, COUNT(DISTINCT v.psalm_id)::integer AS psalm_count
    FROM naves_topics nt
    JOIN verse_naves_topics vnt ON vnt.naves_topic_id = nt.id
    JOIN verses v ON v.id = vnt.verse_id
    GROUP BY nt.id, nt.name
    ORDER BY psalm_count DESC
  `)
  return rows as unknown as Array<{ id: number; name: string; psalm_count: number }>
}

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
export const fetchPsalmDetailsByNavesTopic = cache(async function fetchPsalmDetailsByNavesTopic(topicId: number) {
  const rows = await db.execute(sql`
    SELECT DISTINCT p.id, pv.first_line AS "firstLine", pv.meter
    FROM verse_naves_topics vnt
    JOIN verses v ON v.id = vnt.verse_id
    JOIN psalms p ON p.id = v.psalm_id
    LEFT JOIN psalm_versions pv ON pv.psalm_id = p.id
    WHERE vnt.naves_topic_id = ${topicId}
    ORDER BY p.id
  `)
  return rows as unknown as Array<{ id: number; firstLine: string | null; meter: string | null }>
})

// --- Messianic Psalms ---

export async function fetchMessianicPsalms() {
  return db
    .select({
      psalmId: messianicPsalms.psalmId,
      classification: messianicPsalms.classification,
      firstLine: psalmVersions.firstLine,
      meter: psalmVersions.meter,
    })
    .from(messianicPsalms)
    .leftJoin(psalmVersions, eq(psalmVersions.psalmId, messianicPsalms.psalmId))
    .orderBy(asc(messianicPsalms.psalmId))
}

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

export const fetchPsalmsByAuthor = cache(async function fetchPsalmsByAuthor(author: string) {
  return db
    .select({ id: psalms.id, firstLine: psalmVersions.firstLine, meter: psalmVersions.meter })
    .from(psalms)
    .leftJoin(psalmVersions, eq(psalmVersions.psalmId, psalms.id))
    .where(eq(psalms.author, author))
    .orderBy(asc(psalms.id))
})
