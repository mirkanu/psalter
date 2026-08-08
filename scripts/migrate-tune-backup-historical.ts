/**
 * TUNE-03: Backfill real Backup and Historical tune data from Airtable into Postgres.
 *
 * Phase 1 (this task): per-tune historical stats from the `Tunes` table.
 *   - tunes.historical_usage_count  <- "CPRC historical tune usage" (integer rollup)
 *   - tunes.weighted_historical_frequency <- "Weighted historical CPRC psalm frequency for
 *     CPRC Standard" (0-1 fraction rollup — NOT a percentage, do not multiply by 100)
 *
 * Phase 2 (Task 2, appended below): per-psalm-version backup flag + historical tune links
 * from the `Scottish Psalter` table. Read from these SOURCE fields only — never from the
 * per-service-event junction table's read-only lookup mirrors of the same two fields
 * (RESEARCH.md Pattern 3 / Pitfall 1).
 */
import 'dotenv/config'
import Airtable from 'airtable'
import { db } from '../src/db'
import { tunes, psalmVersions, psalmVersionTunes, psalmVersionHistoricalTunes } from '../src/db/schema'
import { eq } from 'drizzle-orm'

const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
  process.env.AIRTABLE_BASE_ID ?? 'appY3dB1EHtex0fUJ'
)

async function fetchAll(tableName: string) {
  const records: Airtable.Record<Airtable.FieldSet>[] = []
  await base(tableName).select({ pageSize: 100 }).eachPage((page, next) => {
    records.push(...page)
    next()
  })
  return records
}

async function migrateTuneStats(): Promise<void> {
  console.log('Fetching Tunes from Airtable...')
  const tuneRecords = await fetchAll('Tunes')
  console.log(`  Got ${tuneRecords.length} records`)

  let updated = 0
  let nonZeroHistoricalUsage = 0
  let maxWeightedFrequency = 0
  const top5: { name: string; historicalUsageCount: number }[] = []

  for (const r of tuneRecords) {
    const airtableId = r.id
    const name = (r.get('Tune Name') as string | undefined) ?? '(unnamed)'
    const historicalUsageCount = Number(r.get('CPRC historical tune usage') ?? 0) || 0
    const weightedHistoricalFrequency =
      Number(r.get('Weighted historical CPRC psalm frequency for CPRC Standard') ?? 0) || 0

    if (historicalUsageCount > 0) nonZeroHistoricalUsage++
    if (weightedHistoricalFrequency > maxWeightedFrequency) maxWeightedFrequency = weightedHistoricalFrequency
    top5.push({ name, historicalUsageCount })

    const result = await db
      .update(tunes)
      .set({ historicalUsageCount, weightedHistoricalFrequency })
      .where(eq(tunes.airtableId, airtableId))

    // postgres.js query results expose the affected-row count as `.count`, not `.rowCount`
    // (the plan's template snippet used `.rowCount`, which is always undefined on this driver).
    if ((result as unknown as { count: number }).count > 0) updated++
  }

  // Guard: a wrong Airtable field name silently returns undefined -> 0 for every record.
  if (nonZeroHistoricalUsage === 0 && maxWeightedFrequency === 0) {
    console.error(
      'ERROR: every tune resolved to historicalUsageCount=0 and weightedHistoricalFrequency=0. ' +
      'This is the exact failure mode of a wrong Airtable field name (see migrate-double-length.ts\'s ' +
      '`r.get(\'Name\')` bug). Check the field names "CPRC historical tune usage" and ' +
      '"Weighted historical CPRC psalm frequency for CPRC Standard" still exist on the Tunes table.'
    )
    process.exit(1)
  }

  top5.sort((a, b) => b.historicalUsageCount - a.historicalUsageCount)
  console.log(`Updated ${updated} tunes with historical stats`)
  console.log(`Tunes with historicalUsageCount > 0: ${nonZeroHistoricalUsage}`)
  console.log(`Max weightedHistoricalFrequency: ${maxWeightedFrequency}`)
  console.log('Top 5 tunes by historicalUsageCount:')
  for (const t of top5.slice(0, 5)) console.log(`  • ${t.name}: ${t.historicalUsageCount}`)
}

/**
 * The "Historical CPRC Usage" rollup CSV-quotes any tune name containing a comma or quote,
 * e.g. `"St Agnes, Durham (start high)"` and `"Brian's mystery tune (""Ballymena"")"`.
 * Unwrap to the literal tunes.name value.
 */
function unquoteRollupName(raw: string): string {
  if (raw.length > 1 && raw.startsWith('"') && raw.endsWith('"')) {
    return raw.slice(1, -1).replace(/""/g, '"')
  }
  return raw
}

async function migratePsalmVersionBackupAndHistorical(): Promise<void> {
  console.log('Fetching Scottish Psalter from Airtable...')
  const pvRecords = await fetchAll('Scottish Psalter')
  console.log(`  Got ${pvRecords.length} records`)

  const pvRows = await db.select({ id: psalmVersions.id, airtableId: psalmVersions.airtableId }).from(psalmVersions)
  const pvByAirtableId = new Map(pvRows.map((r) => [r.airtableId, r.id]))

  const tuneRows = await db.select({ id: tunes.id, name: tunes.name, airtableId: tunes.airtableId }).from(tunes)
  const tuneByAirtableId = new Map(tuneRows.map((r) => [r.airtableId, r.id]))
  const tuneIdByName = new Map(tuneRows.map((r) => [r.name, r.id]))

  // Idempotence: clear prior state so a re-run reflects Airtable exactly (both writes below
  // are keyed on composite PKs / upserts, so re-running never duplicates rows).
  await db.update(psalmVersionTunes).set({ isBackup: false }).where(eq(psalmVersionTunes.isBackup, true))
  await db.delete(psalmVersionHistoricalTunes)

  let recordsProcessed = 0
  let backupPairs = 0
  let historicalPairs = 0
  let nullNameEntries = 0
  const unresolvedBackupIds: string[] = []
  const unmatchedNames = new Set<string>()
  const skippedVersions: string[] = []

  for (const r of pvRecords) {
    const pvId = pvByAirtableId.get(r.id)
    if (pvId == null) { skippedVersions.push(r.id); continue }
    recordsProcessed++

    // Backup half — "backup 2024" is an array of linked Tunes record ids (5 records link 2).
    for (const linkedTuneAirtableId of ((r.get('backup 2024') as string[] | undefined) ?? [])) {
      const tuneId = tuneByAirtableId.get(linkedTuneAirtableId)
      if (tuneId == null) { unresolvedBackupIds.push(linkedTuneAirtableId); continue }
      await db.insert(psalmVersionTunes)
        .values({ psalmVersionId: pvId, tuneId, isPrimary: false, isBackup: true })
        .onConflictDoUpdate({
          target: [psalmVersionTunes.psalmVersionId, psalmVersionTunes.tuneId],
          set: { isBackup: true },
        })
      backupPairs++
    }

    // Historical half — "Historical CPRC Usage" is an array of tune-name strings; skip nulls.
    for (const raw of ((r.get('Historical CPRC Usage') as (string | null)[] | undefined) ?? [])) {
      if (raw == null) { nullNameEntries++; continue }
      const name = unquoteRollupName(String(raw))
      const tuneId = tuneIdByName.get(name)
      if (tuneId == null) { unmatchedNames.add(name); continue }
      await db.insert(psalmVersionHistoricalTunes)
        .values({ psalmVersionId: pvId, tuneId })
        .onConflictDoNothing()
      historicalPairs++
    }
  }

  console.log(`Records processed: ${recordsProcessed}`)
  console.log(`Backup pairs: ${backupPairs}`)
  console.log(`Historical pairs: ${historicalPairs}`)
  console.log(`Null historical name entries skipped: ${nullNameEntries}`)
  if (skippedVersions.length > 0) {
    console.log(`Psalm versions skipped (no matching Postgres row): ${skippedVersions.length}`)
    for (const id of skippedVersions.sort()) console.log(`  • ${id}`)
  }
  if (unresolvedBackupIds.length > 0) {
    console.log(`Unresolved backup tune ids: ${unresolvedBackupIds.length}`)
    for (const id of unresolvedBackupIds.sort()) console.log(`  • ${id}`)
  }
  console.log(`Unmatched historical names: ${unmatchedNames.size}`)
  if (unmatchedNames.size > 0) {
    for (const n of [...unmatchedNames].sort()) console.log(`  • ${n}`)
  }
}

async function main() {
  await migrateTuneStats()
  await migratePsalmVersionBackupAndHistorical()
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
