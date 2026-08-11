/**
 * Phase 13 — list tunes whose latest melisma decision is 'approved', and the
 * actual image files on disk for each.
 *
 * Exports listApprovedTuneImageFiles() so scripts/build-compression-sample.ts
 * can re-use the same query without re-implementing it.
 */
import 'dotenv/config'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { desc, eq, sql } from 'drizzle-orm'
import { tunes, tuneMelismaDecisions } from '../src/db/schema'
import { tuneNameToSlug } from '../src/lib/tune-slug'

const TUNES_DIR = join(process.cwd(), 'public/tunes')

export type ApprovedTuneImages = {
  tuneId: number
  tuneName: string
  slug: string
  files: string[]
}

export async function listApprovedTuneImageFiles(): Promise<ApprovedTuneImages[]> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  const client = postgres(process.env.DATABASE_URL)
  const db = drizzle({ client })

  // Latest non-null decision per tune (verified live 2026-08-10)
  const latestDecisions = db
    .selectDistinctOn([tuneMelismaDecisions.tuneId], {
      tuneId: tuneMelismaDecisions.tuneId,
      status: tuneMelismaDecisions.status,
    })
    .from(tuneMelismaDecisions)
    .where(sql`${tuneMelismaDecisions.status} is not null`)
    .orderBy(
      tuneMelismaDecisions.tuneId,
      desc(tuneMelismaDecisions.createdAt),
      desc(tuneMelismaDecisions.id),
    )
    .as('latest')

  const approvedTunes = await db
    .select({ id: tunes.id, name: tunes.name })
    .from(tunes)
    .innerJoin(latestDecisions, eq(latestDecisions.tuneId, tunes.id))
    .where(eq(latestDecisions.status, 'approved'))
    .orderBy(tunes.name)

  // Read tunes dir ONCE — no re-reads per tune
  const allFiles = readdirSync(TUNES_DIR)

  const result: ApprovedTuneImages[] = []
  for (const tune of approvedTunes) {
    const slug = tuneNameToSlug(tune.name)
    const re = new RegExp(`^${slug}-(staff|solfege)-\\d+\\.(jpg|png)$`)
    const files = allFiles.filter((f) => re.test(f)).sort()
    result.push({ tuneId: tune.id, tuneName: tune.name, slug, files })
  }

  await client.end()
  return result
}

async function main(): Promise<void> {
  const approved = await listApprovedTuneImageFiles()
  let totalFiles = 0
  for (const t of approved) {
    console.log(`${t.tuneName}  ${t.slug}  ${t.files.length} files`)
    for (const f of t.files) console.log(`  ${f}`)
    totalFiles += t.files.length
  }
  console.log(`Approved tunes: ${approved.length}  Approved image files: ${totalFiles}`)
  if (approved.length === 0) {
    console.error('ABORT: zero approved tunes found — check DATABASE_URL')
    process.exit(1)
  }
  console.log('APPROVED_IMAGES_LISTED')
}

if (process.argv[1]?.endsWith('list-approved-tune-images.ts')) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
