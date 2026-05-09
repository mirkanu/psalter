import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { tunes } from '../src/db/schema'
import { eq } from 'drizzle-orm'

const TUNES_DIR = join(process.cwd(), 'public/tunes')

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!)
  const db = drizzle(client)

  const allTunes = await db.select({ id: tunes.id, name: tunes.name }).from(tunes)
  console.log(`Found ${allTunes.length} tunes`)

  let updated = 0
  for (const tune of allTunes) {
    const slug = slugify(tune.name)
    const scoreFile = `${slug}-staff-0.jpg`
    const solfegeFile = `${slug}-solfege-0.jpg`
    const scoreUrl = existsSync(join(TUNES_DIR, scoreFile)) ? `/tunes/${scoreFile}` : null
    const solfegeUrl = existsSync(join(TUNES_DIR, solfegeFile)) ? `/tunes/${solfegeFile}` : null

    if (scoreUrl || solfegeUrl) {
      await db.update(tunes)
        .set({ scoreJpgUrl: scoreUrl, solfegeJpgUrl: solfegeUrl })
        .where(eq(tunes.id, tune.id))
      console.log(`  ${tune.name}: score=${scoreUrl ?? 'none'} solfege=${solfegeUrl ?? 'none'}`)
      updated++
    }
  }

  console.log(`\nUpdated ${updated} / ${allTunes.length} tunes`)
  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
