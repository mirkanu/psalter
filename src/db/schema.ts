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
  unique,
  real,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import type { StructuredLyrics } from '@/lib/lyrics-structured'

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
  nkjvTitle: text('nkjv_title'),                  // Airtable Psalms."Chapter Titles (NKJV)" (multipleLookupValues, first element)
  haddingtonIntro: text('haddington_intro'),
  kjvText: text('kjv_text'),
  author: text('author'),
  dateBC: integer('date_bc'),
  occasion: text('occasion'),
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
  lyricsImportedRaw: text('lyrics_imported_raw'),                                // D-02: immutable Airtable snapshot, never written after one-shot parse
  lyricsStructured: jsonb('lyrics_structured').$type<StructuredLyrics | null>(), // D-01: canonical editable form (populated by Plan 03 parser)
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
  abcNotationOcr: text('abc_notation_ocr'),      // permanent snapshot of the OCR-imported ABC (pre-04.11 manual edits) — revert target for /dev/melisma-editor
  phraseShapeOverride: jsonb('phrase_shape_override').$type<number[] | null>(),  // per-tune phrase syllable shape (e.g. [8,6,8,6,6] for Abbeyville). NULL = use meter default. Authored in /dev/melisma-editor, consumed by NotationRenderer for cycles 2+.
  /** Per-phrase melisma note indices. melismaPositions[phraseIdx] = array of 0-based note indices
   *  within that phrase where a `_` hold token applies. NULL = no approved melisma data (use heuristic path). */
  melismaPositions: jsonb('melisma_positions').$type<number[][] | null>(),
  solfegeOcrText: text('solfege_ocr_text'),      // raw Claude Vision transcription JSON
  solfegeSopranoEdited: text('solfege_soprano_edited'),  // user-edited soprano string from /dev/melisma-editor; NULL = use OCR original. Revert clears this column.
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
  meterVariant: text('meter_variant').array().default(sql`'{}'::text[]`).notNull(),  // multi-select: 'double_length' and/or 'repeat_last_line' — see .planning/research/scottish-psalter-structure.md §2
  historicalUsageCount: integer('historical_usage_count').default(0).notNull(),          // Airtable Tunes."CPRC historical tune usage" (count rollup) — TUNE-03
  weightedHistoricalFrequency: real('weighted_historical_frequency').default(0).notNull(), // Airtable Tunes."Weighted historical CPRC psalm frequency for CPRC Standard" (percent rollup, 0-1) — TUNE-03
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
  // Phase 05.3 additions:
  startingVerse: integer('starting_verse'),   // nullable — null means no verse range
  endingVerse: integer('ending_verse'),       // nullable — null means no verse range
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
  messianic: text('messianic'),
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
  isBackup: boolean('is_backup').default(false).notNull(),  // Airtable Scottish Psalter."backup 2024" link field — TUNE-03/04
}, (t) => [
  primaryKey({ columns: [t.psalmVersionId, t.tuneId] }),
  // TUNE-01: at most one primary tune per psalm version. App-level validation already existed
  // implicitly and still produced the Ps 148b duplicate; only a DB constraint survives a
  // re-run of scripts/migrate-airtable.ts (which uses onConflictDoNothing and never revokes
  // a stale is_primary flag) or a direct SQL edit.
  uniqueIndex('uq_psalm_version_tunes_one_primary')
    .on(t.psalmVersionId)
    .where(sql`${t.isPrimary} = true`),
])

/**
 * psalm_version_historical_tunes — tunes historically sung for a given psalm version.
 * Source: Airtable "Scottish Psalter"."Historical CPRC Usage" (rollup of tune-name strings,
 * resolved against tunes.name during scripts/migrate-tune-backup-historical.ts).
 *
 * Deliberately its OWN junction table rather than a third flag on psalm_version_tunes: the
 * rollup resolves to ~393 (psalm_version, tune) pairs, and three existing consumers read EVERY
 * psalm_version_tunes row regardless of flags — fetchAllTunes().recommendedPsalmIds (drives the
 * /tunes "Psalms" column and its default sort), the /tunes/[slug] "other psalms" list, and
 * psalms/[id]'s no-primary fallback (psalmVersionTunes[0].tune). Historical links must not leak
 * into any of those.
 */
export const psalmVersionHistoricalTunes = pgTable('psalm_version_historical_tunes', {
  psalmVersionId: integer('psalm_version_id').notNull().references(() => psalmVersions.id),
  tuneId: integer('tune_id').notNull().references(() => tunes.id),
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
 * naves_topic_entries — Nave's Topic Entries (Airtable: sub-entries per topic)
 * Individual quotation/sub-topic entries within a Nave's topic
 */
export const navesTopicEntries = pgTable('naves_topic_entries', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull(),
  navesTopicId: integer('naves_topic_id').references(() => navesTopics.id),
  subTopic: text('sub_topic'),
  quotation: text('quotation'),
}, (t) => [unique('uq_entry_topic').on(t.airtableId, t.navesTopicId)])

/**
 * verse_naves_topic_entries — many-to-many: verses ↔ naves_topic_entries
 */
export const verseNavesTopicEntries = pgTable('verse_naves_topic_entries', {
  verseId: integer('verse_id').notNull().references(() => verses.id),
  entryId: integer('entry_id').notNull().references(() => navesTopicEntries.id),
}, (t) => [primaryKey({ columns: [t.verseId, t.entryId] })])

/**
 * creedal_references — Creedal References
 * Links verses to Westminster Confession / Shorter Catechism questions
 */
export const creedalReferences = pgTable('creedal_references', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  verseId: integer('verse_id').references(() => verses.id),
  creed: text('creed'),
  questionNumber: integer('question_number'),
  url: text('url'),
})

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

/**
 * tune_melisma_decisions — append-only audit log of per-tune status decisions
 * and comments captured in /dev/melisma-editor. Each entry may set a status,
 * a comment, or both. The "current" status for a tune is the latest row whose
 * status is non-null. Comments may be submitted without a status change.
 */
export const tuneMelismaDecisions = pgTable('tune_melisma_decisions', {
  id: serial('id').primaryKey(),
  tuneId: integer('tune_id').notNull().references(() => tunes.id, { onDelete: 'cascade' }),
  status: text('status'),                       // 'approved' | 'not_approved' | null
  comment: text('comment'),                     // free text; null if status-only
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * precenting_sets — precentor-built service sets (Phase 5)
 * Replaces manual paper preparation; auth (precentor_name from session) added in Phase 05.1
 */
export const precentingSets = pgTable('precenting_sets', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  type: text('type').notNull(),          // 'AM Service' | 'PM Service' | 'Other'
  note: text('note'),                    // nullable
  userId: text('user_id').notNull().references(() => users.id),   // D-17
  // precentorName removed (D-18) — display name derived at query time via JOIN
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const setItems = pgTable('set_items', {
  id: serial('id').primaryKey(),
  setId: integer('set_id').notNull().references(() => precentingSets.id, { onDelete: 'cascade' }),
  psalmId: integer('psalm_id').notNull().references(() => psalms.id),
  tuneId: integer('tune_id').references(() => tunes.id),                            // nullable
  psalmVersionId: integer('psalm_version_id').references(() => psalmVersions.id),  // nullable — explicit version selection (a/b)
  verseRange: text('verse_range'),                                                  // nullable free text
  position: integer('position').notNull(),
})

// ─── Better Auth tables (Phase 05.1) ─────────────────────────────────────────
// Table name MUST be 'user' (singular) — Better Auth Drizzle adapter maps by name.
export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('precentor'),   // D-08/D-10: text enum, extensible
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),   // admin plugin
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verifications = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const precentingSetsRelations = relations(precentingSets, ({ many, one }) => ({
  setItems: many(setItems),
  user: one(users, { fields: [precentingSets.userId], references: [users.id] }),
}))

export const setItemsRelations = relations(setItems, ({ one }) => ({
  set: one(precentingSets, { fields: [setItems.setId], references: [precentingSets.id] }),
  psalm: one(psalms, { fields: [setItems.psalmId], references: [psalms.id] }),
  tune: one(tunes, { fields: [setItems.tuneId], references: [tunes.id] }),
  psalmVersion: one(psalmVersions, { fields: [setItems.psalmVersionId], references: [psalmVersions.id] }),
}))

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

export const navesTopicEntriesRelations = relations(navesTopicEntries, ({ one, many }) => ({
  navesTopic: one(navesTopics, { fields: [navesTopicEntries.navesTopicId], references: [navesTopics.id] }),
  verseLinks: many(verseNavesTopicEntries),
}))

export const verseNavesTopicEntriesRelations = relations(verseNavesTopicEntries, ({ one }) => ({
  verse: one(verses, { fields: [verseNavesTopicEntries.verseId], references: [verses.id] }),
  entry: one(navesTopicEntries, { fields: [verseNavesTopicEntries.entryId], references: [navesTopicEntries.id] }),
}))

export const creedalReferencesRelations = relations(creedalReferences, ({ one }) => ({
  verse: one(verses, { fields: [creedalReferences.verseId], references: [verses.id] }),
}))

// ─── Feedback ────────────────────────────────────────────────────────────────

/**
 * feedback_submissions — user-submitted feedback from the SiteFooter form.
 * Unauthenticated public form; no FK references.
 */
export const feedbackSubmissions = pgTable('feedback_submissions', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  name: text('name'),
  email: text('email'),
  pageUrl: text('page_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Changelog ───────────────────────────────────────────────────────────────

/**
 * changelog_posts — public release notes, authored inline by an admin on /changelog.
 * No draft state: insert == publish. createdAt doubles as publishedAt (Phase 9, CHLG-01/02).
 */
export const changelogPosts = pgTable('changelog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * changelog_subscribers — public opt-in email list for changelog broadcasts (Phase 9, CHLG-04/05).
 *
 * `email` MUST be unique: `POST /api/subscribe` relies on
 * `.onConflictDoNothing({ target: changelogSubscribers.email })`, and Postgres raises
 * "no unique or exclusion constraint matching the ON CONFLICT specification" at runtime
 * without a matching constraint.
 *
 * `unsubscribeToken` is a `crypto.randomUUID()` value and is the ONLY credential proving
 * ownership of an unsubscribe request — it must be unique so a delete-by-token can never
 * match more than one row.
 */
export const changelogSubscribers = pgTable('changelog_subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  unsubscribeToken: text('unsubscribe_token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
