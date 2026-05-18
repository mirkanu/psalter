/**
 * Snapshot every non-null `psalm_versions.lyrics_imported_raw` row to a
 * frozen JSON fixture under `tests/fixtures/lyrics-corpus-snapshot.json`.
 *
 * Phase 04.9.6 Plan 03 Task 2 — feeds the round-trip corpus test in
 * `scripts/parse-lyrics-structured.test.ts` (D-05). The snapshot is
 * captured ONCE and committed; downstream tests depend on it being
 * byte-stable.
 *
 * Usage:
 *   npx tsx scripts/snapshot-lyrics-corpus.ts
 */
import 'dotenv/config'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { isNotNull } from 'drizzle-orm'
import { db } from '../src/db'
import { psalmVersions } from '../src/db/schema'

async function main() {
  const rows = await db
    .select({
      id: psalmVersions.id,
      psalterNumber: psalmVersions.psalterNumber,
      versionLabel: psalmVersions.versionLabel,
      meter: psalmVersions.meter,
      lyrics: psalmVersions.lyricsImportedRaw,
    })
    .from(psalmVersions)
    .where(isNotNull(psalmVersions.lyricsImportedRaw))
    .orderBy(psalmVersions.id)

  const out = 'tests/fixtures/lyrics-corpus-snapshot.json'
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(rows, null, 2) + '\n')
  console.log(`Wrote ${rows.length} rows to ${out}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
