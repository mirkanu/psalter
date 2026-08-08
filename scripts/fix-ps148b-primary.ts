/**
 * One-off, idempotent, deterministic fix for the Ps 148b duplicate-primary bug (TUNE-01).
 *
 * psalm_version_tunes had TWO rows flagged is_primary=true for psalm_version_id=85
 * (148 Second Version, Recommended) — tune 57 "Darwall" and tune 136 "Clarkeville".
 * Root cause: scripts/migrate-airtable.ts uses onConflictDoNothing(), which never
 * revokes a stale is_primary flag on re-run. This script resolves the winner
 * deterministically from Airtable's "CPRC Standard" link field order (element [0]
 * is the authoritative primary tune) and demotes any other primary rows for that
 * psalm version. See .planning/phases/10-tune-data-fixes/10-RESEARCH.md § Pitfall 4.
 */
import 'dotenv/config'
import Airtable from 'airtable'
import { db } from '../src/db'
import { psalmVersionTunes, psalmVersions, tunes } from '../src/db/schema'
import { and, eq, ne, sql } from 'drizzle-orm'

const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
  process.env.AIRTABLE_BASE_ID ?? 'appY3dB1EHtex0fUJ'
)

const PSALM_VERSION_AIRTABLE_ID = 'recVRb3GpPgq6FEKc'  // "148 (Second Version, Recommended)"

async function main() {
  // 1. Pre-scan guard — this phase deliberately does NOT do a bulk cleanup (RESEARCH Pitfall 4).
  const dupes = await db
    .select({ psalmVersionId: psalmVersionTunes.psalmVersionId, n: sql<number>`count(*)::int` })
    .from(psalmVersionTunes)
    .where(eq(psalmVersionTunes.isPrimary, true))
    .groupBy(psalmVersionTunes.psalmVersionId)
    .having(sql`count(*) > 1`)
  console.log('Duplicate-primary scan:', dupes)

  if (dupes.length === 0) {
    console.log('already resolved — nothing to do')
    process.exit(0)
  }

  // 2. Resolve the target psalm_versions.id from Airtable id (never hardcode 85).
  const [pv] = await db.select({ id: psalmVersions.id }).from(psalmVersions)
    .where(eq(psalmVersions.airtableId, PSALM_VERSION_AIRTABLE_ID))
  if (!pv) {
    console.error(`No psalm_versions row found for airtable_id=${PSALM_VERSION_AIRTABLE_ID}`)
    process.exit(1)
  }

  // If any dupe row is for a psalm_version_id OTHER than the known target, abort without writing.
  const unexpected = dupes.filter((d) => d.psalmVersionId !== pv.id)
  if (unexpected.length > 0) {
    console.error('Unexpected duplicate-primary rows outside the known target — aborting without writes:')
    console.error(unexpected)
    process.exit(1)
  }

  // 3. Fetch the Airtable record and read CPRC Standard link order.
  const rec = await base('Scottish Psalter').find(PSALM_VERSION_AIRTABLE_ID)
  const linked = (rec.get('CPRC Standard') as string[] | undefined) ?? []
  if (linked.length === 0) {
    console.error('CPRC Standard is empty — cannot resolve deterministically')
    process.exit(1)
  }

  const winnerAirtableId = linked[0]
  const [winner] = await db.select({ id: tunes.id, name: tunes.name }).from(tunes)
    .where(eq(tunes.airtableId, winnerAirtableId))
  if (!winner) {
    console.error(`No tunes row found for airtable_id=${winnerAirtableId}`)
    process.exit(1)
  }
  console.log(`CPRC Standard[0] resolved to tune id=${winner.id} name="${winner.name}"`)

  // 4. Log before state.
  const before = await db
    .select({ tuneId: psalmVersionTunes.tuneId, name: tunes.name, isPrimary: psalmVersionTunes.isPrimary })
    .from(psalmVersionTunes)
    .innerJoin(tunes, eq(tunes.id, psalmVersionTunes.tuneId))
    .where(eq(psalmVersionTunes.psalmVersionId, pv.id))
  console.log('Before:', before)

  // 5. Apply the fix — parameterized Drizzle calls only, never string-interpolate Airtable values into SQL.
  await db.update(psalmVersionTunes).set({ isPrimary: false })
    .where(and(eq(psalmVersionTunes.psalmVersionId, pv.id), ne(psalmVersionTunes.tuneId, winner.id)))
  await db.update(psalmVersionTunes).set({ isPrimary: true })
    .where(and(eq(psalmVersionTunes.psalmVersionId, pv.id), eq(psalmVersionTunes.tuneId, winner.id)))

  // 6. Log after state.
  const after = await db
    .select({ tuneId: psalmVersionTunes.tuneId, name: tunes.name, isPrimary: psalmVersionTunes.isPrimary })
    .from(psalmVersionTunes)
    .innerJoin(tunes, eq(tunes.id, psalmVersionTunes.tuneId))
    .where(eq(psalmVersionTunes.psalmVersionId, pv.id))
  console.log('After:', after)

  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
