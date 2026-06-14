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
  navesTopicEntries,
  verseNavesTopicEntries,
  creedalReferences,
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

// --- Explore Page 04.12: New Query Functions ---

// Section 3a: NT Quotations — 68 sub-entries under "Quotations and Allusions" topic
export const fetchQuotedInNT = cache(async function fetchQuotedInNT() {
  const rows = await db.execute(sql`
    SELECT
      nte.id,
      nte.sub_topic,
      nte.quotation,
      json_agg(json_build_object('verseId', vnte.verse_id, 'psalmId', v.psalm_id, 'verseNumber', v.verse_number)
        ORDER BY v.psalm_id, v.verse_number) AS verses
    FROM naves_topic_entries nte
    JOIN naves_topics nt ON nt.id = nte.naves_topic_id
    JOIN verse_naves_topic_entries vnte ON vnte.entry_id = nte.id
    JOIN verses v ON v.id = vnte.verse_id
    WHERE nt.name = 'Quotations and Allusions'
    GROUP BY nte.id, nte.sub_topic, nte.quotation
    ORDER BY nte.sub_topic
  `)
  return rows as unknown as Array<{
    id: number
    sub_topic: string | null
    quotation: string | null
    verses: Array<{ verseId: number; psalmId: number; verseNumber: number | null }>
  }>
})

// Section 3b: Messianic By Topic — 12 naves_topics with messianic IS NOT NULL
export const fetchMessianicByTopic = cache(async function fetchMessianicByTopic() {
  return db
    .select({ id: navesTopics.id, name: navesTopics.name, messianic: navesTopics.messianic })
    .from(navesTopics)
    .where(isNotNull(navesTopics.messianic))
    .orderBy(asc(navesTopics.name))
})

// Section 5: Authors Table — all 150 psalms with author, dateBC, occasion
export const fetchPsalmsWithAuthorData = cache(async function fetchPsalmsWithAuthorData() {
  return db
    .select({
      id: psalms.id,
      author: psalms.author,
      dateBC: psalms.dateBC,
      occasion: psalms.occasion,
    })
    .from(psalms)
    .orderBy(asc(psalms.dateBC))  // nulls last handled in client sort
})

// Section 6: Heidelberg Catechism — 35 distinct question numbers with verse links
export const fetchHeidelbergCatechism = cache(async function fetchHeidelbergCatechism() {
  const rows = await db.execute(sql`
    SELECT
      cr.question_number,
      cr.url,
      json_agg(json_build_object(
        'psalmId', v.psalm_id,
        'verseNumber', v.verse_number
      ) ORDER BY v.psalm_id, v.verse_number) AS verses
    FROM creedal_references cr
    JOIN verses v ON v.id = cr.verse_id
    WHERE cr.creed = 'Heidelberg'
    GROUP BY cr.question_number, cr.url
    ORDER BY cr.question_number
  `)
  return rows as unknown as Array<{
    question_number: number
    url: string
    verses: Array<{ psalmId: number; verseNumber: number | null }>
  }>
})

// Section 4: Naves sub-topic drill-down for /explore/naves/[slug] detail page
// T-04.12-03: topicId is typed number — parameterised via drizzle sql tag, never raw string concat
export const fetchNavesSubTopics = cache(async function fetchNavesSubTopics(topicId: number) {
  const rows = await db.execute(sql`
    SELECT
      nte.id,
      nte.sub_topic,
      nte.quotation,
      json_agg(json_build_object('psalmId', v.psalm_id, 'verseNumber', v.verse_number)
        ORDER BY v.psalm_id, v.verse_number) AS verses
    FROM naves_topic_entries nte
    JOIN verse_naves_topic_entries vnte ON vnte.entry_id = nte.id
    JOIN verses v ON v.id = vnte.verse_id
    WHERE nte.naves_topic_id = ${topicId}
    GROUP BY nte.id, nte.sub_topic, nte.quotation
    ORDER BY nte.sub_topic
  `)
  return rows as unknown as Array<{
    id: number
    sub_topic: string | null
    quotation: string | null
    verses: Array<{ psalmId: number; verseNumber: number | null }>
  }>
})

// Section 2: By Theme — topics split by type (Main Topic / Mood / Song Type)
export const fetchTopicsByType = cache(async function fetchTopicsByType(type: string) {
  return db
    .select({ id: topics.id, name: topics.name, count: count(psalmTopics.psalmId) })
    .from(topics)
    .leftJoin(psalmTopics, eq(psalmTopics.topicId, topics.id))
    .where(eq(topics.topicType, type))
    .groupBy(topics.id, topics.name)
    .orderBy(desc(count(psalmTopics.psalmId)))
})
