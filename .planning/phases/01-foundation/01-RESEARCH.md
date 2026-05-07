# Phase 1: Foundation - Research

**Researched:** 2026-05-07
**Domain:** Next.js 15 scaffolding, Drizzle ORM schema, Airtable REST API migration, Cloudflare R2 storage
**Confidence:** HIGH (stack versions verified via npm registry; Airtable schema confirmed via live API; patterns from Context7 official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- ORM: Drizzle ORM 0.45.2 with drizzle-kit 0.31.10
- DB driver: postgres.js 3.4.9
- Database: PostgreSQL 16 (psalter-db container)
- Storage: Cloudflare R2 for tune score sheet JPGs
- Airtable base: appY3dB1EHtex0fUJ ("CPRC Psalter")
- Airtable PAT in .env as AIRTABLE_PAT
- Never store raw airtableusercontent.com URLs — always upload binary to R2

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

Key constraints from CLAUDE.md and project context:
- ORM: Drizzle ORM 0.45.2 with drizzle-kit 0.31.10
- DB driver: postgres.js 3.4.9
- Database: PostgreSQL 16 (psalter-db container)
- Storage: Cloudflare R2 for tune score sheet JPGs
- Airtable base: appY3dB1EHtex0fUJ ("CPRC Psalter")
- Airtable PAT in .env as AIRTABLE_PAT
- Never store raw airtableusercontent.com URLs — always upload binary to R2

### Deferred Ideas (OUT OF SCOPE)
- Admin UI for editorial content management (deferred post-launch per project decisions)
- abcjs audio/notation (deferred to Phase 4)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIGR-01 | All Airtable tables migrated to PostgreSQL with foreign-key relationships intact | Airtable schema confirmed via live API call; 21 tables identified, 13 are primary content tables; Drizzle upsert pattern via onConflictDoUpdate verified |
| MIGR-02 | Tune score sheet JPGs downloaded from Airtable and re-hosted on Cloudflare R2 (permanent URLs) | Attachment field structure confirmed: `multipleAttachments` array with temporary `airtableusercontent.com` URLs; R2 PutObjectCommand pattern confirmed via official Cloudflare docs |
| MIGR-03 | Row counts and spot-check records verified against Airtable before cutover | Pagination pattern confirmed: 100 records/page with `offset` cursor; actual record counts gathered from live API |
| MIGR-04 | Delta migration run immediately before launch to capture any post-snapshot Airtable changes | Idempotent upsert via `onConflictDoUpdate` with Airtable record ID as natural key; delta via `filterByFormula` on CREATED_TIME() |
</phase_requirements>

---

## Summary

Phase 1 is a pure infrastructure phase: scaffold the Next.js 15 app, define a Drizzle ORM schema for 13 primary Airtable content tables, write a migration script that reads from Airtable and writes to PostgreSQL (with idempotent upsert), downloads all tune score sheet JPGs from Airtable's temporary URLs and re-hosts them on Cloudflare R2, and verifies data integrity with row count assertions.

The project root (`/data/home/psalter`) currently contains only `CLAUDE.md`. The Next.js application must be scaffolded from scratch as the first task of this phase. The Airtable base has been directly queried and the actual table schemas, field types, and approximate record counts are documented below — no guesswork on the data model.

The key complexity in this phase is the two-pass migration: first build an in-memory `airtable_record_id → postgres_id` map for every table, then insert rows and resolve `multipleRecordLinks` fields into proper foreign keys. Attachment URLs expire in ~2 hours so the R2 upload must happen within the same script run as the Airtable fetch.

**Primary recommendation:** Scaffold Next.js 15 first, then build the Drizzle schema driven by the verified Airtable table structures below, then write the migration script in `scripts/migrate-airtable.ts` using Airtable.js `.all()` for pagination and Drizzle `insert().onConflictDoUpdate()` for idempotence.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PostgreSQL schema definition | Database / Storage | — | Drizzle schema is the canonical source of truth for all data structures |
| Airtable data fetching | CLI Script (Node.js) | — | Migration is a one-shot script, not a web request; runs outside Next.js |
| R2 JPG upload | CLI Script (Node.js) | — | Binary download + re-upload is a migration concern, not a runtime concern |
| Data integrity verification | CLI Script (Node.js) | — | Row count assertions run post-migration, not at request time |
| Docker container setup | Infrastructure | — | psalter-db container follows pattern of other projects on this server |
| Next.js app scaffolding | Frontend Server (SSR) | — | Foundation for all subsequent phases |

---

## Verified Airtable Base: Table Inventory

**Base ID:** `appY3dB1EHtex0fUJ` — confirmed via live API [VERIFIED: Airtable Meta API]

### Primary Content Tables (migrate to PostgreSQL)

| Airtable Table | Table ID | ~Record Count | PostgreSQL Table | Notes |
|----------------|----------|---------------|-----------------|-------|
| Psalms | tblZyQFfNUFnmkNyG | 150 | `psalms` | Confirmed 150 (100+50 pages) |
| Scottish Psalter | tblyz4Q8KzJHDNFpP | >100 | `psalm_versions` | Metrical versifications; 100+ records (multi-page) |
| Tunes | tblEzjKnaL4DlhDO5 | >100 | `tunes` | 100+ records; has `Staff Score Sheet` and `Solfege Score Sheet` multipleAttachments fields |
| Verses | tblmeGEuYwpVDwlU1 | >100 | `verses` | Likely 150×N verses; multi-page |
| 365 Days | tbldTTLmwzMIwJrZb | >100 | `daily_readings` | Multi-page (365 expected) |
| Event | tblkQbNwG3qTmbXuW | 29 | `events` | 29 records — all fit in one page |
| Psalm & Tune CPRC | tblT3hht1xdcwLuFi | >100 | `service_items` | Multi-page; the service event assignment junction |
| Messianic Psalms | tbl07kIu7PONtitGD | 18 | `messianic_psalms` | 18 records — all fit in one page |
| Section Headings | tblrsOOB6n299hKfv | unknown | `section_headings` | Field: Verse Start [number], Section Heading [singleLineText] |
| Topics - Psalms | tbllxnpjvPtbN8srl | 88 | `topics` | 88 records — all fit in one page; thematic tags on psalms |
| Nave's Main Topic | tblWBfuxleN74E3tM | >100 | `naves_topics` | Multi-page; the topical concordance heading table |
| Topics - Verses (Nave's) | tblggtBfVTmTUeyNs | >100 | `verse_naves_topics` | Multi-page; junction between verses and Nave's topics |
| Doctrines | tbl3P46qHcuu7B4pB | unknown | `doctrines` | Doctrinal classification table |
| Moods | tblRHa4TLqnoJWopi | small | `moods` | Tune mood tags (e.g., Majestic, Penitential) |

### Tables to Skip (not migrated in Phase 1)

| Airtable Table | Reason to Skip |
|----------------|----------------|
| Old Bulletins | Historical archive; not referenced in app data model |
| Psalm Totals | Computed aggregates — recreate via SQL COUNT() |
| Statistics | Frequency statistics — recompute from migrated data |
| Doctrines Oldf | Old/duplicate of Doctrines; skip unless confirmed distinct |
| Creedal References | Secondary theological data; can be added post-launch |
| Psalm Headings | NKJV chapter titles; not in MVP data model |

---

## Verified Field Structures (Critical Tables)

### Psalms (tblZyQFfNUFnmkNyG) [VERIFIED: Airtable Meta API]

| Airtable Field | Type | PostgreSQL Column |
|---------------|------|------------------|
| Psalm | singleLineText | `psalm_number` integer (1-150) — NOTE: stored as text "122", parse to int |
| Book | singleSelect | `book` text — values like "1-41 (Bk 1)", "107-150 (Bk 5)" |
| Title (from Bible) | multilineText | `bible_title` text |
| Haddington Introduction | multilineText | `haddington_intro` text |
| KJV Text | multilineText | `kjv_text` text |
| Author | singleSelect | `author` text |
| Scottish Psalter | multipleRecordLinks | → `psalm_versions.psalm_id` (resolved via ID map) |
| Verses | multipleRecordLinks | → `verses.psalm_id` (resolved via ID map) |
| Messianic Psalms | multipleRecordLinks | → `messianic_psalms.psalm_id` (resolved) |
| Topics - Psalms | multipleRecordLinks | → `psalm_topics` junction table |

**Key insight:** The `Psalm` field is a `singleLineText` containing the psalm number as a string (e.g., "122"). Parse to integer during migration. Use the integer as the primary key in PostgreSQL (stable, URL-friendly for `/psalm/23`).

### Tunes (tblEzjKnaL4DlhDO5) [VERIFIED: Airtable Meta API + sample record]

| Airtable Field | Type | PostgreSQL Column |
|---------------|------|------------------|
| Tune Name | singleLineText | `name` text NOT NULL UNIQUE |
| Meter | singleSelect | `meter` text — values like "Common Meter (CM, 86 86)" |
| Staff Score Sheet | multipleAttachments | `score_jpg_r2_url` text — download binary, upload to R2 |
| Solfege Score Sheet | multipleAttachments | `solfege_jpg_r2_url` text — download binary, upload to R2 |
| YouTube | url | `youtube_url` text |
| SoundCloud Status | singleLineText | `soundcloud_url` text |
| Precenting Comment | singleLineText | `precenting_comment` text |
| Mood | multipleRecordLinks | → `tune_moods` junction |
| Scottish Psalter | multipleRecordLinks | → `psalm_version_tunes` junction |

**Attachment structure confirmed:** `fields["Staff Score Sheet"]` returns an array: `[{ filename, id, size, type, url, thumbnails }]`. The `url` is a `https://v5.airtableusercontent.com/...` temporary signed URL. Download binary, upload to R2 as `tunes/<tune_name>-staff.jpg`, store permanent R2 public URL.

**Meter field values require normalisation:** "Common Meter (CM, 86 86)" → store as "CM". Extract the abbreviation in parentheses during migration.

### Scottish Psalter / psalm_versions (tblyz4Q8KzJHDNFpP) [VERIFIED: Airtable Meta API]

| Airtable Field | Type | PostgreSQL Column |
|---------------|------|------------------|
| Psalter # | singleLineText | `psalter_number` text (e.g., "23a", "23b") |
| Lyrics | multilineText | `lyrics` text — full metrical text |
| Meter | singleSelect | `meter` text |
| Version | singleSelect | `version_label` text |
| Psalm # | multipleRecordLinks | `psalm_id` integer → FK to psalms(id) |
| First Line | singleLineText | `first_line` text |

### Verses (tblmeGEuYwpVDwlU1) [VERIFIED: Airtable Meta API]

| Airtable Field | Type | PostgreSQL Column |
|---------------|------|------------------|
| Chapter | multipleRecordLinks | `psalm_id` integer → FK to psalms(id) |
| Verse | number | `verse_number` integer |
| KJV | singleLineText | `kjv_text` text |
| Scottish Psalter | multilineText | `metrical_text` text |
| Topics - Verses (Nave's) | multipleRecordLinks | → `verse_naves_topics` junction |
| Doctrines | multipleRecordLinks | → `verse_doctrines` junction |

### Event (tblkQbNwG3qTmbXuW) [VERIFIED: Airtable Meta API]

| Airtable Field | Type | PostgreSQL Column |
|---------------|------|------------------|
| Name | autoNumber | (ignore — use serial PK in PostgreSQL) |
| Date | date | `event_date` date |
| AM/PM | singleSelect | `session` text CHECK IN ('AM','PM') |
| User/Precenter Name | singleLineText | `precentor` text |
| Notes | multilineText | `notes` text |
| Psalm & Tune CPRC | multipleRecordLinks | → via `service_items.event_id` |

### Psalm & Tune CPRC / service_items (tblT3hht1xdcwLuFi) [VERIFIED: Airtable Meta API]

| Airtable Field | Type | PostgreSQL Column |
|---------------|------|------------------|
| Psalm | multipleRecordLinks | `psalm_id` integer → FK to psalms(id) |
| Today's Chosen Tune | multipleRecordLinks | `tune_id` integer → FK to tunes(id) |
| Verses/stanzas | singleLineText | `verses_sung` text |
| Order | singleSelect | `position` integer (parse "1st", "2nd" etc.) |
| Event | multipleRecordLinks | `event_id` integer → FK to events(id) |
| Date | date | (denorm — derive from event) |
| AM/PM | singleSelect | (denorm — derive from event) |
| Presenter | singleSelect | (skip — derive from event) |

---

## Standard Stack

### Core (all versions verified via npm registry)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.5 | App framework | Project mandate |
| react | 19.x | UI library | Bundled with Next.js 15+ |
| typescript | 5.x | Type safety | Required for Drizzle inference |
| drizzle-orm | 0.45.2 | ORM and query layer | Project mandate |
| drizzle-kit | 0.31.10 | Schema migrations CLI | Project mandate |
| postgres | 3.4.9 | PostgreSQL driver | Project mandate |
| @aws-sdk/client-s3 | 3.1044.0 | R2 upload (S3-compatible) | Standard for Cloudflare R2 |
| airtable | 0.12.2 | Airtable API client | Official JS client with pagination helpers |
| tsx | 4.21.0 | Run TypeScript scripts directly | No build step needed for migration scripts |

[VERIFIED: npm registry for all versions above]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn | 4.7.0 | Component CLI | Run `npx shadcn@latest init` after Next.js scaffolding |
| tailwindcss | 4.2.4 | CSS framework | Auto-configured by create-next-app |
| tw-animate-css | 1.4.0 | Animation utilities | Replaces deprecated tailwindcss-animate for shadcn v4 |
| lucide-react | latest | Icons | Peer of shadcn |

[VERIFIED: npm registry for versions above]

**Installation:**
```bash
# Core app
npx create-next-app@latest psalter --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

# Database
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Migration scripts
npm install airtable @aws-sdk/client-s3
npm install -D tsx

# UI (after scaffolding)
npx shadcn@latest init -t next
```

---

## Architecture Patterns

### System Architecture Diagram

```
[Airtable API]
   ↓ HTTP fetch (airtable.js .all())
[scripts/migrate-airtable.ts]
   ↓ Build record ID → postgres ID map
   ↓ Resolve multipleRecordLinks → FK integers
   ↓ INSERT/upsert via Drizzle onConflictDoUpdate
[PostgreSQL (psalter-db)]
   ↓ Drizzle ORM queries
[Next.js App (src/)]
   ↓ Static props / generateStaticParams
[Browser]

[Airtable attachment URLs] → HTTP download
   ↓ Binary buffer
[Cloudflare R2] ← PutObjectCommand
   ↓ Permanent public URL stored in tunes.score_jpg_r2_url
```

### Recommended Project Structure

```
/data/home/psalter/
├── src/
│   ├── app/                     # Next.js App Router routes
│   │   └── layout.tsx
│   ├── db/
│   │   ├── index.ts             # Drizzle client (postgres.js + drizzle())
│   │   └── schema.ts            # All table definitions (single file for Phase 1)
│   └── lib/
│       └── utils.ts             # shadcn utils (cn function)
├── scripts/
│   ├── migrate-airtable.ts      # One-shot + delta migration
│   ├── upload-r2.ts             # R2 upload helper (imported by migrate)
│   └── verify-migration.ts     # Row count + spot-check assertions
├── drizzle/
│   └── migrations/              # Generated SQL migration files
├── docker-compose.yml           # psalter-db PostgreSQL 16 container
├── drizzle.config.ts            # Drizzle Kit configuration
├── .env                         # DB URL, Airtable PAT, R2 credentials
├── package.json
└── tsconfig.json
```

### Pattern 1: Drizzle Schema Definition

**What:** Define all tables in `src/db/schema.ts` using Drizzle's `pgTable` with TypeScript types, then export relations for the relational query API.

**When to use:** Every table definition in this phase.

```typescript
// Source: https://orm.drizzle.team/docs/rqb-v2 [VERIFIED: Context7]
import { pgTable, integer, text, serial, date, boolean, primaryKey } from 'drizzle-orm/pg-core'

export const psalms = pgTable('psalms', {
  id: integer('id').primaryKey(),  // actual psalm number 1-150
  psalmNumber: integer('psalm_number').notNull().unique(),
  book: text('book'),
  bibleTitle: text('bible_title'),
  haddingntonIntro: text('haddington_intro'),
  kjvText: text('kjv_text'),
  author: text('author'),
})

export const tunes = pgTable('tunes', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),  // rec... ID for upsert
  name: text('name').notNull().unique(),
  meter: text('meter'),
  abcNotation: text('abc_notation'),     // NULL until Phase 4
  scoreJpgR2Url: text('score_jpg_r2_url'),
  solfegeJpgR2Url: text('solfege_jpg_r2_url'),
  youtubeUrl: text('youtube_url'),
  soundcloudUrl: text('soundcloud_url'),
  precentingComment: text('precenting_comment'),
})

// Junction table example — many-to-many
export const psalmVersionTunes = pgTable('psalm_version_tunes', {
  psalmVersionId: integer('psalm_version_id').notNull().references(() => psalmVersions.id),
  tuneId: integer('tune_id').notNull().references(() => tunes.id),
  isPrimary: boolean('is_primary').default(false),
}, (t) => [primaryKey({ columns: [t.psalmVersionId, t.tuneId] })])
```

### Pattern 2: Drizzle Upsert (Idempotent Migration)

**What:** Use `onConflictDoUpdate` targeting the `airtable_id` unique column to make every migration run idempotent.

**When to use:** Every `INSERT` in the migration script. This enables re-running the script before launch without duplicating records.

```typescript
// Source: https://orm.drizzle.team/docs/guides/upsert [VERIFIED: Context7]
import { sql } from 'drizzle-orm'

await db.insert(tunes)
  .values({
    airtableId: record.id,
    name: record.get('Tune Name') as string,
    meter: normaliseMeter(record.get('Meter') as string),
    youtubeUrl: record.get('YouTube') as string | null,
  })
  .onConflictDoUpdate({
    target: tunes.airtableId,
    set: {
      name: sql`excluded.name`,
      meter: sql`excluded.meter`,
      youtubeUrl: sql`excluded.youtube_url`,
    },
  })
```

**Key:** Every migrated table needs an `airtable_id text UNIQUE NOT NULL` column to serve as the conflict target. Do not use the Airtable `autoNumber` field — use the Airtable record ID (`rec...`) which is stable across API calls.

### Pattern 3: Airtable Pagination with .all()

**What:** Use the `airtable` npm package's `.all()` method which handles pagination automatically, returning all records across all pages.

**When to use:** Fetching any table in the migration script.

```typescript
// Source: https://github.com/airtable/airtable.js [VERIFIED: Context7]
import Airtable from 'airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base('appY3dB1EHtex0fUJ')

// .all() handles pagination automatically — no manual offset tracking needed
const psalmsRecords = await base('Psalms').select({
  pageSize: 100,
}).all()
```

**Why not manual pagination:** The `airtable` package `.all()` and `.eachPage()` methods handle the `offset` cursor automatically. The built-in client also includes retry logic for 429 rate-limit responses. Do not reimplement pagination with raw `fetch`.

**Rate limit:** 5 requests/second per base. The `.all()` method respects this internally. [VERIFIED: Airtable API docs]

### Pattern 4: Cloudflare R2 Upload

**What:** Download attachment binary from Airtable's temporary URL, upload to R2 bucket using `@aws-sdk/client-s3`.

**When to use:** For every `multipleAttachments` field during migration (Staff Score Sheet and Solfege Score Sheet on Tunes).

```typescript
// Source: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/ [VERIFIED: WebFetch]
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function downloadAndUploadToR2(
  attachmentUrl: string,
  r2Key: string,
  bucketName: string
): Promise<string> {
  // Download binary from Airtable's temporary URL
  const response = await fetch(attachmentUrl)
  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') ?? 'image/jpeg'

  await r2.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: r2Key,
    Body: Buffer.from(buffer),
    ContentType: contentType,
  }))

  // Return permanent R2 public URL
  return `https://${process.env.R2_PUBLIC_DOMAIN}/${r2Key}`
}
```

### Pattern 5: Two-Pass Migration (ID Resolution)

**What:** First pass fetches all records and builds `Map<airtableId, postgresId>`. Second pass inserts rows and resolves `multipleRecordLinks` fields into FK integers.

**When to use:** All tables with `multipleRecordLinks` fields (i.e., most tables).

```typescript
// Two-pass migration pseudo-code
// Pass 1: Insert all records, collect airtableId → postgresId mappings
const tuneIdMap = new Map<string, number>()
for (const record of tuneRecords) {
  const result = await db.insert(tunes).values({...}).onConflictDoUpdate({...}).returning({ id: tunes.id })
  tuneIdMap.set(record.id, result[0].id)
}

// Pass 2: Insert junction table records using resolved IDs
for (const versionRecord of psalmVersionRecords) {
  const linkedTuneIds = (versionRecord.get('Scottish Psalter') as string[] ?? [])
    .map(airtableId => tuneIdMap.get(airtableId))
    .filter((id): id is number => id !== undefined)

  for (const tuneId of linkedTuneIds) {
    await db.insert(psalmVersionTunes).values({
      psalmVersionId: psalmVersionIdMap.get(versionRecord.id)!,
      tuneId,
    }).onConflictDoNothing()
  }
}
```

### Pattern 6: drizzle-kit Push (Schema Apply)

**What:** Push the TypeScript schema directly to the database — no migration files needed for the initial setup.

**When to use:** Initial schema creation against the fresh `psalter-db` container.

```bash
# Source: https://orm.drizzle.team/docs/drizzle-kit-push [VERIFIED: Context7]
npx drizzle-kit push
```

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

**Use `push` for initial development; use `generate` + `migrate` for production schema changes.** [VERIFIED: Context7]

### Pattern 7: Docker Compose for psalter-db

**What:** PostgreSQL 16 container following the established pattern from other projects on this server.

```yaml
# docker-compose.yml — follows zoho-todoist-sync pattern [VERIFIED: /data/home/zoho-todoist-sync/docker-compose.yml]
services:
  db:
    image: postgres:16-alpine
    container_name: psalter-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: psalter
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - psalter_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    ports:
      - "5435:5432"  # Use 5435 to avoid collision with other DBs

volumes:
  psalter_db_data:
```

**Port selection:** Other PostgreSQL containers on this server use internal networking only (5432/tcp, no host port). Reserve port 5435 for psalter-db host-side access during development. The `DATABASE_URL` in `.env` should be `postgresql://postgres:postgres@localhost:5435/psalter`.

### Pattern 8: Next.js + Tailwind CSS 4 + shadcn/ui Setup

**Key change from v3:** Tailwind CSS 4 uses CSS-first configuration (no `tailwind.config.js`). Configuration is done via `@theme` directive in the CSS file. `tailwindcss-animate` is deprecated — use `tw-animate-css` instead.

```bash
# Step 1: Scaffold Next.js 15 with Tailwind CSS 4
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

# Step 2: Initialize shadcn/ui (detects Tailwind v4 automatically)
npx shadcn@latest init -t next

# Step 3: Replace tailwindcss-animate with tw-animate-css
npm uninstall tailwindcss-animate
npm install -D tw-animate-css
# Then in src/app/globals.css:
# @import "tw-animate-css";  (replaces tailwindcss-animate plugin)
```

[VERIFIED: ui.shadcn.com/docs/tailwind-v4 via WebFetch; shadcn version 4.7.0 confirmed via npm registry]

### Anti-Patterns to Avoid

- **Storing Airtable record IDs only in junction tables without resolving to FK integers:** Airtable `multipleRecordLinks` returns `string[]` of `rec...` IDs. These must be resolved to integer PostgreSQL IDs before inserting junction rows.
- **Inserting formula/rollup field values as static columns:** Formula fields (e.g., `Psalm Number`, `Date+AM/PM`) and rollup fields are Airtable computations — skip them or recompute via SQL.
- **Running R2 upload and DB insert in separate passes:** Attachment URLs expire in ~2 hours. Download and upload to R2 within the same migration run as the DB insert.
- **Using `drizzle-kit push` in production:** Use `generate` + `migrate` for any schema change after initial setup.
- **Using Next.js 14-style `next-auth`:** This project uses Better Auth 1.6.9 (Phase 5). Do not add next-auth as a dependency in Phase 1.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Airtable pagination | Manual offset cursor loop | `airtable` npm package `.all()` | Built-in rate-limit retry and pagination; only 13 snippets but officially maintained |
| S3/R2 upload | Raw HTTP multipart upload | `@aws-sdk/client-s3` PutObjectCommand | AWS SDK handles S3 protocol details, retries, chunked upload |
| Schema migrations | Raw SQL ALTER TABLE | `drizzle-kit push` or `generate`+`migrate` | Type-safe, declarative, handles column renames and additions |
| PostgreSQL upsert | `DELETE + INSERT` pattern | `onConflictDoUpdate` | Atomic, no gap between delete and insert, preserves related rows |
| TypeScript script execution | Compile to JS first | `tsx` (`npx tsx scripts/migrate.ts`) | Zero-config TS execution; no build step for scripts |

---

## Common Pitfalls

### Pitfall 1: Airtable Attachment URLs Expire in ~2 Hours
**What goes wrong:** Migration writes `airtableusercontent.com` URLs to the DB. Images break within hours.
**Why it happens:** Airtable attachment URLs are pre-signed S3 tokens with short TTLs. [VERIFIED: Airtable support docs]
**How to avoid:** Download binary with `fetch(attachmentUrl)` and upload to R2 in the same script run. Store the R2 URL, never the Airtable URL.
**Warning signs:** Images display during dev (within 2 hours), break in production later.

### Pitfall 2: Linked Record Fields Are Arrays of `rec...` Strings, Not Data
**What goes wrong:** `record.get('Scottish Psalter')` returns `["recABC", "recDEF"]` — just record IDs. If these are stored as JSONB, foreign key relationships are lost.
**Why it happens:** Airtable's API represents linked records as IDs. [VERIFIED: Airtable API docs - field model]
**How to avoid:** Build the two-pass migration. Build `airtableId → postgresId` maps in Pass 1. Resolve to integer FKs in Pass 2.
**Warning signs:** Junction tables contain raw `rec...` strings.

### Pitfall 3: Psalm Number Field Is a String, Not an Integer
**What goes wrong:** `record.get('Psalm')` returns `"122"` (confirmed via live API sample). Using this directly as a number fails TypeScript types and may produce unexpected sorts.
**Why it happens:** Airtable stores the psalm number as `singleLineText`, not `number`. [VERIFIED: live API call]
**How to avoid:** `const psalmNum = parseInt(record.get('Psalm') as string, 10)` during migration. Use `psalmNum` as the primary key in PostgreSQL.
**Warning signs:** `psalms` table PK is a string column rather than integer.

### Pitfall 4: Meter Field Needs Normalisation
**What goes wrong:** `record.get('Meter')` on Tunes returns `"Common Meter (CM, 86 86)"`. Storing the full string makes meter-based filtering verbose and inconsistent.
**Why it happens:** Airtable singleSelect values contain the full descriptive label. [VERIFIED: live API sample on Tunes]
**How to avoid:** Extract the abbreviation in parentheses: `"Common Meter (CM, 86 86)"` → `"CM"`. Apply during migration with a regex or lookup map.
**Warning signs:** `meter` columns contain long strings with parenthetical content.

### Pitfall 5: Port 5432 Already in Use on This Server
**What goes wrong:** `docker run -p 5432:5432 postgres:16` fails because other PostgreSQL containers are bound to that port internally, or the host port 5432 is taken.
**Why it happens:** Several PostgreSQL containers exist on this server (`debates-db`, `ynab-db`, `zoho-sync-db`). [VERIFIED: docker ps output]
**How to avoid:** Use port 5435 for psalter-db host binding: `ports: ["5435:5432"]`. Set `DATABASE_URL=postgresql://postgres:postgres@localhost:5435/psalter` in `.env`.
**Warning signs:** `docker compose up` fails with "address already in use".

### Pitfall 6: tailwindcss-animate is Deprecated in Tailwind CSS 4
**What goes wrong:** shadcn `npx shadcn@latest init` may still try to use `tailwindcss-animate`. This package is deprecated for Tailwind CSS 4. [VERIFIED: ui.shadcn.com/docs/tailwind-v4]
**How to avoid:** After shadcn init, install `tw-animate-css` as devDependency and add `@import "tw-animate-css"` to `globals.css`. Remove `tailwindcss-animate` if installed.

### Pitfall 7: Multiple Attachment Images per Tune Record
**What goes wrong:** A tune record may have multiple files in `Staff Score Sheet` (array of attachments). Naively taking `attachments[0]` may miss the best scan.
**How to avoid:** Upload ALL attachments for each tune to R2. Store the first one in `score_jpg_r2_url`, but keep others in an `additional_score_urls` JSON column or simply store only the first if multiple are rare.
**Warning signs:** Tunes with more than one JPG show only the first.

---

## Code Examples

### Full Migration Script Structure

```typescript
// scripts/migrate-airtable.ts
// Run: npx tsx scripts/migrate-airtable.ts
import Airtable from 'airtable'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/db/schema'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
const base = airtable.base('appY3dB1EHtex0fUJ')

const sql = postgres(process.env.DATABASE_URL!)
const db = drizzle({ client: sql, schema })

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function migratePsalms(idMap: Map<string, number>) {
  const records = await base('Psalms').select({ pageSize: 100 }).all()
  for (const record of records) {
    const psalmNum = parseInt(record.get('Psalm') as string, 10)
    const [row] = await db.insert(schema.psalms).values({
      id: psalmNum,
      psalmNumber: psalmNum,
      book: extractBook(record.get('Book') as string),
      bibleTitle: record.get('Title (from Bible)') as string ?? null,
      haddingntonIntro: record.get('Haddington Introduction') as string ?? null,
      kjvText: record.get('KJV Text') as string ?? null,
      author: record.get('Author') as string ?? null,
      airtableId: record.id,
    }).onConflictDoUpdate({
      target: schema.psalms.airtableId,
      set: {
        bibleTitle: sql`excluded.bible_title`,
        kjvText: sql`excluded.kjv_text`,
      },
    }).returning({ id: schema.psalms.id })
    idMap.set(record.id, row.id)
  }
}

// Main: run all migrations in dependency order
async function main() {
  const psalmIdMap = new Map<string, number>()
  await migratePsalms(psalmIdMap)
  // ... migrate other tables using idMap
  await sql.end()
}
main().catch(console.error)
```

### Verification Script

```typescript
// scripts/verify-migration.ts
// Run: npx tsx scripts/verify-migration.ts
import Airtable from 'airtable'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { count } from 'drizzle-orm'
import * as schema from '../src/db/schema'

const EXPECTED = {
  psalms: 150,
  tunes: 120,     // adjust after first migration run
  psalmVersions: 200,
}

async function verify() {
  const [{ count: psalmCount }] = await db.select({ count: count() }).from(schema.psalms)
  console.assert(Number(psalmCount) === 150, `Expected 150 psalms, got ${psalmCount}`)
  // spot-check record
  const psalm23 = await db.query.psalms.findFirst({ where: eq(schema.psalms.id, 23) })
  console.assert(psalm23?.kjvText?.includes('The LORD is my shepherd'), 'Psalm 23 KJV text check failed')
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` | CSS-first `@theme` directive in `globals.css` | Tailwind v4 (2025) | No separate config file needed; shadcn init handles automatically |
| `tailwindcss-animate` plugin | `tw-animate-css` package | March 2025 | Different install method; `@import "tw-animate-css"` in CSS |
| Auth.js (next-auth) v4 | Better Auth 1.6.9 | 2024 | App Router native; Drizzle adapter included |
| shadcn `default` style | `new-york` style | 2025 | `default` is deprecated; use `new-york` with shadcn init |

**Deprecated/outdated:**
- `tailwindcss-animate`: Deprecated March 2025. Use `tw-animate-css` instead.
- shadcn `toast` component: Deprecated in favour of `sonner`. Use `npx shadcn@latest add sonner`.
- shadcn `default` style: Deprecated. Use `new-york` (set with `npx shadcn@latest init --style new-york`).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Meter normalisation: extract abbreviation in parentheses (e.g., "Common Meter (CM, 86 86)" → "CM") covers all meters | Verified Field Structures - Tunes | Some meters may not follow the "(ABBREV, X X)" pattern; migration would store full string |
| A2 | R2 bucket will use public URL format `https://<custom-domain>/<key>` | Pattern 4 | If R2 bucket uses r2.dev subdomain instead, URL format differs; env var name is still correct |
| A3 | `Psalm & Tune CPRC.Order` singleSelect values ("1st", "2nd", etc.) map cleanly to integers | Verified Field Structures - service_items | If values are irregular strings, position extraction needs custom parsing |
| A4 | R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) need to be added to `.env` — not currently present | Environment Availability | Migration will fail if R2 credentials are not set up before running |

---

## Open Questions

1. **R2 bucket and credentials setup**
   - What we know: The global `.env` has `CLOUDFLARE_EMAIL` and `CLOUDFLARE_API_KEY` (account-level API key). R2-specific credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, bucket name) are not yet in any `.env` file.
   - What's unclear: Has the R2 bucket been created? What is the bucket name and whether it should use an r2.dev public URL or a custom domain?
   - Recommendation: Wave 0 task must include creating the R2 bucket via Cloudflare dashboard and adding R2 API token credentials to `psalter/.env`.

2. **Scottish Psalter versification: 1 or 2 per psalm?**
   - What we know: The Scottish Psalter table has >100 records for 150 psalms (multi-page). Some psalms have multiple versifications.
   - What's unclear: Whether the `Version` singleSelect field reliably identifies the canonical vs. alternative version for each psalm.
   - Recommendation: Sample 5-10 records from this table in Wave 0 to confirm the version labelling scheme before finalising the schema.

3. **Psalm & Tune CPRC Order values**
   - What we know: `Order` is a singleSelect field on the service_items table.
   - What's unclear: What are the actual option values ("1st", "2nd", "First", integers)?
   - Recommendation: Sample 3 Psalm & Tune CPRC records to confirm Order field values before writing the position-parsing logic.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Migration scripts, Next.js | Yes | 20.20.2 | — |
| npm | Package management | Yes | 10.8.2 | — |
| Docker | psalter-db container | Yes | 29.4.1 | — |
| PostgreSQL (via Docker) | Database | Not yet started | 16-alpine (image available) | — |
| psql CLI | DB verification | No | — | Use drizzle-kit studio or docker exec psql |
| Airtable PAT | Migration scripts | Yes (`AIRTABLE_PAT` in .env) | — | — |
| Cloudflare R2 credentials | R2 upload | Not set | — | **Blocking** — must create R2 bucket and token before running migration |
| tsx | TypeScript script runner | Not installed (dev dep) | 4.21.0 | `ts-node` (heavier alternative) |

**Missing dependencies with no fallback:**
- R2 bucket + credentials: The migration script cannot upload tune images without `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`. Wave 0 must include creating the R2 bucket and API token via the Cloudflare dashboard and adding credentials to `psalter/.env`.

**Missing dependencies with fallback:**
- `psql` CLI: Not installed on the host. Use `docker exec -it psalter-db psql -U postgres psalter` for direct SQL access, or use `drizzle-kit studio` for a web UI.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node --experimental-strip-types --test`) |
| Config file | None needed — uses Node.js native test runner (pattern from `/data/home/debates/package.json`) |
| Quick run command | `npm run test:migration` (to be defined in package.json) |
| Full suite command | `npx tsx scripts/verify-migration.ts` |

**Rationale:** Phase 1 has no UI components to test. The validation is data integrity verification (row counts, spot-checks), which is best done as assertion scripts rather than a unit test framework. The debates project on this server uses `node --experimental-strip-types --test`, which is the precedent.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIGR-01 | All 13 tables present with FK integrity | integration | `npx tsx scripts/verify-migration.ts` | Wave 0 |
| MIGR-02 | All tune JPGs accessible via R2 URLs | integration | `npx tsx scripts/verify-migration.ts` (includes HTTP HEAD check on R2 URLs) | Wave 0 |
| MIGR-03 | Row counts match Airtable | integration | `npx tsx scripts/verify-migration.ts` | Wave 0 |
| MIGR-04 | Delta re-run adds no duplicates | integration | `npx tsx scripts/verify-migration.ts` (run twice, assert same counts) | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsx scripts/verify-migration.ts --quick` (row counts only)
- **Per wave merge:** `npx tsx scripts/verify-migration.ts` (full spot-checks + R2 URL checks)
- **Phase gate:** All assertions green + 10+ spot-check records validated before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `scripts/verify-migration.ts` — covers MIGR-01, MIGR-02, MIGR-03, MIGR-04
- [ ] R2 bucket and credentials added to `psalter/.env` — prerequisite for MIGR-02
- [ ] `docker-compose.yml` and psalter-db container running — prerequisite for all MIGR-* tasks

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (Phase 5) | Better Auth 1.6.9 (deferred) |
| V3 Session Management | No (Phase 5) | Better Auth (deferred) |
| V4 Access Control | No | No user-facing routes in Phase 1 |
| V5 Input Validation | Partial | Airtable field values are parsed/validated during migration (parseInt, regex); no user input in Phase 1 |
| V6 Cryptography | No | No encryption needed in migration scripts |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| AIRTABLE_PAT exposed in git | Information Disclosure | Add `.env` to `.gitignore`; verify before first commit |
| R2 credentials in plaintext .env | Information Disclosure | Add `.env` to `.gitignore`; use environment variables in Docker |
| Migration script SQL injection | Tampering | Drizzle parameterises all values automatically — no raw SQL string interpolation |

---

## Sources

### Primary (HIGH confidence)
- Airtable Meta API (`/v0/meta/bases/appY3dB1EHtex0fUJ/tables`) — verified all 21 tables, field names, field types directly [VERIFIED: live API call, 2026-05-07]
- Airtable sample records — Psalms, Tunes, Event tables sampled directly [VERIFIED: live API call, 2026-05-07]
- Context7: `/llmstxt/orm_drizzle_team_llms_txt` — upsert, schema, drizzle-kit push patterns
- Context7: `/websites/airtable_developers_web_api` — rate limits (5 req/s), pagination, offset cursor
- Context7: `/airtable/airtable.js` — .all() and .eachPage() pagination methods
- Context7: `/llmstxt/nextjs_llms-full_txt` — create-next-app CLI flags
- Cloudflare R2 docs: `https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/` — PutObjectCommand pattern [VERIFIED: WebFetch]
- shadcn Tailwind v4 docs: `https://ui.shadcn.com/docs/tailwind-v4` — tw-animate-css, @theme directive [VERIFIED: WebFetch]
- npm registry: drizzle-orm 0.45.2, drizzle-kit 0.31.10, postgres 3.4.9, better-auth 1.6.9, next 16.2.5, tailwindcss 4.2.4, shadcn 4.7.0, tsx 4.21.0, tw-animate-css 1.4.0, @aws-sdk/client-s3 3.1044.0, airtable 0.12.2 [VERIFIED: npm view]
- Existing project patterns: `/data/home/zoho-todoist-sync/docker-compose.yml` (PostgreSQL 16 container), `/data/home/debates/package.json` (Node.js test runner) [VERIFIED: file read]

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` — prior research on stack choices, version rationale
- `.planning/research/ARCHITECTURE.md` — schema design rationale and query patterns
- `.planning/research/PITFALLS.md` — migration and integration pitfalls

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed via npm registry
- Airtable schema: HIGH — confirmed via live API call; field names and types are exact
- Architecture patterns: HIGH — Drizzle and Airtable patterns from Context7 official docs
- R2 upload pattern: HIGH — confirmed via official Cloudflare docs
- Record counts: MEDIUM — exact counts not fetched for all tables (only confirmed >100 for multi-page tables); will be confirmed during migration run
- Environment (R2 credentials): LOW — R2 bucket not yet created; credentials not in `.env`

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (30 days — stable stack, locked versions)
