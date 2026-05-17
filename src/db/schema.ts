import {
  pgTable,
  integer,
  text,
  serial,
  date,
  boolean,
  timestamp,
  primaryKey,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Core Content Tables ─────────────────────────────────────────────────────

/**
 * psalms — Psalms (Airtable: tblZyQFfNUFnmkNyG)
 * PK is the actual psalm number (1-150) — used as URL slug (/psalm/23)
 * airtable_id stores the rec... ID for upsert key
 */
export const psalms = pgTable('psalms', {
  id: integer('id').primaryKey(),               // actual psalm number parsed from 'Psalm' singleLineText
  airtableId: text('airtable_id').notNull().unique(),
  book: text('book'),                            // e.g. "1-41 (Bk 1)"
  bibleTitle: text('bible_title'),
  haddingtonIntro: text('haddington_intro'),
  kjvText: text('kjv_text'),
  author: text('author'),
})

/**
 * psalm_versions — Scottish Psalter (Airtable: tblyz4Q8KzJHDNFpP)
 * Metrical versifications of each psalm
 */
export const psalmVersions = pgTable('psalm_versions', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  psalmId: integer('psalm_id').references(() => psalms.id),
  psalterNumber: text('psalter_number'),         // e.g. "23a", "23b"
  lyrics: text('lyrics'),
  meter: text('meter'),                          // normalised abbreviation: CM, LM, SM, etc.
  versionLabel: text('version_label'),
  firstLine: text('first_line'),
})

/**
 * tunes — Tunes (Airtable: tblEzjKnaL4DlhDO5)
 * Staff and solfege score sheets downloaded from Airtable and stored in TUNES_DIR (local volume)
 */
export const tunes = pgTable('tunes', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  name: text('name').notNull().unique(),
  meter: text('meter'),                          // normalised: CM, LM, SM, etc.
  abcNotation: text('abc_notation'),             // NULL until Phase 4 (soprano only)
  abcNotationLegacy: text('abc_notation_legacy'),// backup of pre-260514 abc_notation (old extractTuneV2 pipeline)
  solfegeOcrText: text('solfege_ocr_text'),      // raw Claude Vision transcription JSON
  abcSatb: text('abc_satb'),                     // 4-voice SATB ABC from solFaToAbcMultiVoice
  scoreJpgUrl: text('score_jpg_url'),            // local /tunes/ path (never Airtable URL)
  solfegeJpgUrl: text('solfege_jpg_url'),
  additionalScoreUrls: jsonb('additional_score_urls'),  // extra JPGs if tune has >1 attachment
  youtubeUrl: text('youtube_url'),
  soundcloudUrl: text('soundcloud_url'),
  precentingComment: text('precenting_comment'),
  inPrcaPsalter: boolean('in_prca_psalter').default(false),
  hasFamousHymn: boolean('has_famous_hymn').default(false),
  famousHymn: text('famous_hymn'),
  numberIn1979RpPsalter: integer('number_in_1979_rp_psalter'),
  numInPrcaPsalter: integer('num_in_prca_psalter'),
  doubleLength: boolean('double_length').default(false).notNull(),  // DCM marker — manually curated in Airtable, see .planning/research/scottish-psalter-structure.md §2
})

/**
 * verses — Verses (Airtable: tblmeGEuYwpVDwlU1)
 * Individual KJV and metrical verse text
 */
export const verses = pgTable('verses', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  psalmId: integer('psalm_id').references(() => psalms.id),
  verseNumber: integer('verse_number'),
  kjvText: text('kjv_text'),
  metricalText: text('metrical_text'),
})

/**
 * daily_readings — 365 Days (Airtable: tbldTTLmwzMIwJrZb)
 * Daily reading plan (365 entries)
 */
export const dailyReadings = pgTable('daily_readings', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  dayNumber: integer('day_number').notNull(),    // 1-365
  psalmId: integer('psalm_id').references(() => psalms.id),
  readingDate: date('reading_date'),             // optional fixed calendar date
  notes: text('notes'),
})

/**
 * events — Event (Airtable: tblkQbNwG3qTmbXuW)
 * Worship service events (29 existing historical records)
 */
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  eventDate: date('event_date'),
  session: text('session'),                      // 'AM' or 'PM'
  precentor: text('precentor'),
  notes: text('notes'),
})

/**
 * service_items — Psalm & Tune CPRC (Airtable: tblT3hht1xdcwLuFi)
 * Junction: which psalm+tune pair was sung at a service event
 */
export const serviceItems = pgTable('service_items', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  eventId: integer('event_id').references(() => events.id),
  psalmId: integer('psalm_id').references(() => psalms.id),
  tuneId: integer('tune_id').references(() => tunes.id),
  versesSung: text('verses_sung'),
  position: integer('position'),                // parsed from "1st", "2nd" etc.
})

/**
 * messianic_psalms — Messianic Psalms (Airtable: tbl07kIu7PONtitGD)
 * Messianic classification data (18 records)
 */
export const messianicPsalms = pgTable('messianic_psalms', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  psalmId: integer('psalm_id').references(() => psalms.id),
  classification: text('classification'),
  ntVerification: text('nt_verification'),
  messianicVerses: text('messianic_verses'),
})

/**
 * section_headings — Section Headings (Airtable: tblrsOOB6n299hKfv)
 * Thematic section headings within psalms
 */
export const sectionHeadings = pgTable('section_headings', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  psalmId: integer('psalm_id').references(() => psalms.id),
  verseStart: integer('verse_start'),
  heading: text('heading'),
})

/**
 * topics — Topics - Psalms (Airtable: tbllxnpjvPtbN8srl)
 * Thematic tags assigned to psalms (88 records)
 */
export const topics = pgTable('topics', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  name: text('name'),
  topicType: text('topic_type'),
  description: text('description'),
})

/**
 * naves_topics — Nave's Main Topic (Airtable: tblWBfuxleN74E3tM)
 * Nave's Topical Bible headings (used to organise verses)
 */
export const navesTopics = pgTable('naves_topics', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  name: text('name'),
  description: text('description'),
})

/**
 * moods — Moods (Airtable: tblRHa4TLqnoJWopi)
 * Tune mood tags (e.g. Majestic, Penitential)
 */
export const moods = pgTable('moods', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  name: text('name'),
})

/**
 * doctrines — Doctrines (Airtable: tbl3P46qHcuu7B4pB)
 * Doctrinal classification tags referenced by verses
 */
export const doctrines = pgTable('doctrines', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  name: text('name'),
})

// ─── Junction Tables ──────────────────────────────────────────────────────────

/**
 * psalm_topics — many-to-many: psalms ↔ topics
 */
export const psalmTopics = pgTable('psalm_topics', {
  psalmId: integer('psalm_id').notNull().references(() => psalms.id),
  topicId: integer('topic_id').notNull().references(() => topics.id),
}, (t) => [primaryKey({ columns: [t.psalmId, t.topicId] })])

/**
 * psalm_version_tunes — many-to-many: psalm_versions ↔ tunes
 * Associates Scottish Psalter versifications with the tunes they are typically sung to
 */
export const psalmVersionTunes = pgTable('psalm_version_tunes', {
  psalmVersionId: integer('psalm_version_id').notNull().references(() => psalmVersions.id),
  tuneId: integer('tune_id').notNull().references(() => tunes.id),
  isPrimary: boolean('is_primary').default(false),
}, (t) => [primaryKey({ columns: [t.psalmVersionId, t.tuneId] })])

/**
 * tune_moods — many-to-many: tunes ↔ moods
 */
export const tuneMoods = pgTable('tune_moods', {
  tuneId: integer('tune_id').notNull().references(() => tunes.id),
  moodId: integer('mood_id').notNull().references(() => moods.id),
}, (t) => [primaryKey({ columns: [t.tuneId, t.moodId] })])

/**
 * verse_naves_topics — many-to-many: verses ↔ naves_topics
 * (Airtable: tblggtBfVTmTUeyNs — explicitly a primary content table per RESEARCH.md)
 */
export const verseNavesTopics = pgTable('verse_naves_topics', {
  verseId: integer('verse_id').notNull().references(() => verses.id),
  navesTopicId: integer('naves_topic_id').notNull().references(() => navesTopics.id),
}, (t) => [primaryKey({ columns: [t.verseId, t.navesTopicId] })])

/**
 * verse_doctrines — many-to-many: verses ↔ doctrines
 */
export const verseDoctrines = pgTable('verse_doctrines', {
  verseId: integer('verse_id').notNull().references(() => verses.id),
  doctrineId: integer('doctrine_id').notNull().references(() => doctrines.id),
}, (t) => [primaryKey({ columns: [t.verseId, t.doctrineId] })])

/**
 * tune_ocr_results — persisted OCR/vision results per tune+mode
 * Composite PK: (tune_id, mode) — upsert on re-run
 */
export const tuneOcrResults = pgTable('tune_ocr_results', {
  tuneId: integer('tune_id').notNull().references(() => tunes.id, { onDelete: 'cascade' }),
  mode: text('mode').notNull(),
  result: jsonb('result').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.tuneId, t.mode] })])

/**
 * tune_notation_feedback — precentor feedback: which ABC version is best + comment
 * PK: tune_id — one feedback record per tune, upserted on save
 */
export const tuneNotationFeedback = pgTable('tune_notation_feedback', {
  tuneId: integer('tune_id').primaryKey().references(() => tunes.id, { onDelete: 'cascade' }),
  selectedVersion: text('selected_version').notNull().default('none'),
  comment: text('comment').notNull().default(''),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Relations (Drizzle Relational API) ──────────────────────────────────────

export const psalmsRelations = relations(psalms, ({ many }) => ({
  psalmVersions: many(psalmVersions),
  verses: many(verses),
  messianicPsalms: many(messianicPsalms),
  sectionHeadings: many(sectionHeadings),
  serviceItems: many(serviceItems),
  psalmTopics: many(psalmTopics),
  dailyReadings: many(dailyReadings),
}))

export const psalmVersionsRelations = relations(psalmVersions, ({ one, many }) => ({
  psalm: one(psalms, { fields: [psalmVersions.psalmId], references: [psalms.id] }),
  psalmVersionTunes: many(psalmVersionTunes),
}))

export const tunesRelations = relations(tunes, ({ many }) => ({
  psalmVersionTunes: many(psalmVersionTunes),
  tuneMoods: many(tuneMoods),
  serviceItems: many(serviceItems),
}))

export const versesRelations = relations(verses, ({ one, many }) => ({
  psalm: one(psalms, { fields: [verses.psalmId], references: [psalms.id] }),
  verseNavesTopics: many(verseNavesTopics),
  verseDoctrines: many(verseDoctrines),
}))

export const sectionHeadingsRelations = relations(sectionHeadings, ({ one }) => ({
  psalm: one(psalms, { fields: [sectionHeadings.psalmId], references: [psalms.id] }),
}))

export const messianicPsalmsRelations = relations(messianicPsalms, ({ one }) => ({
  psalm: one(psalms, { fields: [messianicPsalms.psalmId], references: [psalms.id] }),
}))

export const dailyReadingsRelations = relations(dailyReadings, ({ one }) => ({
  psalm: one(psalms, { fields: [dailyReadings.psalmId], references: [psalms.id] }),
}))

export const eventsRelations = relations(events, ({ many }) => ({
  serviceItems: many(serviceItems),
}))

export const serviceItemsRelations = relations(serviceItems, ({ one }) => ({
  event: one(events, { fields: [serviceItems.eventId], references: [events.id] }),
  psalm: one(psalms, { fields: [serviceItems.psalmId], references: [psalms.id] }),
  tune: one(tunes, { fields: [serviceItems.tuneId], references: [tunes.id] }),
}))

export const topicsRelations = relations(topics, ({ many }) => ({
  psalmTopics: many(psalmTopics),
}))

export const navesTopicsRelations = relations(navesTopics, ({ many }) => ({
  verseNavesTopics: many(verseNavesTopics),
}))

export const moodsRelations = relations(moods, ({ many }) => ({
  tuneMoods: many(tuneMoods),
}))

export const doctrinesRelations = relations(doctrines, ({ many }) => ({
  verseDoctrines: many(verseDoctrines),
}))

export const psalmTopicsRelations = relations(psalmTopics, ({ one }) => ({
  psalm: one(psalms, { fields: [psalmTopics.psalmId], references: [psalms.id] }),
  topic: one(topics, { fields: [psalmTopics.topicId], references: [topics.id] }),
}))

export const psalmVersionTunesRelations = relations(psalmVersionTunes, ({ one }) => ({
  psalmVersion: one(psalmVersions, { fields: [psalmVersionTunes.psalmVersionId], references: [psalmVersions.id] }),
  tune: one(tunes, { fields: [psalmVersionTunes.tuneId], references: [tunes.id] }),
}))

export const tuneMoodsRelations = relations(tuneMoods, ({ one }) => ({
  tune: one(tunes, { fields: [tuneMoods.tuneId], references: [tunes.id] }),
  mood: one(moods, { fields: [tuneMoods.moodId], references: [moods.id] }),
}))

export const verseNavesTopicsRelations = relations(verseNavesTopics, ({ one }) => ({
  verse: one(verses, { fields: [verseNavesTopics.verseId], references: [verses.id] }),
  navesTopic: one(navesTopics, { fields: [verseNavesTopics.navesTopicId], references: [navesTopics.id] }),
}))

export const verseDoctrinesRelations = relations(verseDoctrines, ({ one }) => ({
  verse: one(verses, { fields: [verseDoctrines.verseId], references: [verses.id] }),
  doctrine: one(doctrines, { fields: [verseDoctrines.doctrineId], references: [doctrines.id] }),
}))
