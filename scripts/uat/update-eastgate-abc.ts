import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../../src/db/schema'

async function main() {
  const sql2 = postgres(process.env.DATABASE_URL!, { max: 1 })
  const db = drizzle(sql2, { schema })

  // Best-guess split: insert a 4th PHRASE_BREAK between bar 3 (after `aa4 |`)
  // and bar 4 of the existing 4th phrase. Phrase 4 keeps the faster
  // opening (`c'c'd'2e'2 | f'2d'c'bagf | g2baa4 |`); phrase 5 takes the
  // slower closing cadence (`d'2d'd'd'2c'2 | d'4`). User will fine-tune in
  // the Note grid if the split is wrong.
  const newAbc = `X:1
T:Eastgate (last line repeat for Ps 133)
M:C
L:1/8
Q:1/4=76
K:D
a2d'2c'bba | a2b2
% PHRASE_BREAK
c'2d'2 | f2f2ga
% PHRASE_BREAK
a2 | gff2e2a2 |
bb
% PHRASE_BREAK
c'c'd'2e'2 | f'2d'c'bagf | g2baa4
% PHRASE_BREAK
d'2d'd'd'2c'2 | d'4
`

  const before = await db.select().from(schema.tunes).where(eq(schema.tunes.id, 83))
  console.log('BEFORE — id=83 abc:')
  console.log('---')
  console.log(before[0]?.abcNotation)
  console.log('---')

  // Capture rollback
  const fs = await import('node:fs')
  const path = await import('node:path')
  const rollbackDir = path.join(process.cwd(), 'scripts', 'uat', 'baselines')
  if (!fs.existsSync(rollbackDir)) fs.mkdirSync(rollbackDir, { recursive: true })
  const rollbackPath = path.join(rollbackDir, 'eastgate-abc-rollback.txt')
  fs.writeFileSync(rollbackPath, before[0]?.abcNotation ?? '')
  console.log('Rollback written to', rollbackPath)
  console.log()

  await db.update(schema.tunes)
    .set({ abcNotation: newAbc })
    .where(eq(schema.tunes.id, 83))

  const after = await db.select().from(schema.tunes).where(eq(schema.tunes.id, 83))
  console.log('AFTER — id=83 abc:')
  console.log('---')
  console.log(after[0]?.abcNotation)
  console.log('---')
  const breaks = (after[0]?.abcNotation?.match(/^\s*%\s*PHRASE_BREAK\s*$/gm) ?? []).length
  console.log('PHRASE_BREAK count:', breaks, '=> phrases:', breaks + 1)

  await sql2.end({ timeout: 1 })
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
