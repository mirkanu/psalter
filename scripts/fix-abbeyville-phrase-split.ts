#!/usr/bin/env npx tsx
/**
 * Fix Abbeyville: split the last ABC phrase into two 6-note phrases so that
 * each repetition of "in God no suc-cour lies." occupies its own staff row.
 *
 * Background: Abbeyville has phraseShapeOverride=[8,6,8,6,6] (5 phrase rows)
 * but the original ABC only had 4 PHRASE_BREAKs. The last phrase encoded BOTH
 * repetitions of the last line (12 notes, w: "in God no suc-cour lies. in God
 * no suc-cour lies."). The renderer reused the same 12-note phrase body for
 * both rows 4 and 5, causing the full double text to appear on every row.
 *
 * Fix: split phrase 3 at the note-6/7 boundary (mid bar-2) so phrase 3 has
 * notes 1-6 and phrase 4 has notes 7-12. Now split.phrases.length=5 matches
 * phraseShapeOverride.length=5 and no extra rows are synthesised.
 *
 * Safe to re-run: idempotent (checks for 5 PHRASE_BREAKs before updating).
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')

const DRY_RUN = process.argv.includes('--dry-run')
if (DRY_RUN) console.log('DRY RUN — no DB writes')

const pgClient = postgres(process.env.DATABASE_URL)
const db = drizzle({ client: pgClient, schema })

const NEW_ABC = `X:1
T:Abbeyville
M:C
L:1/8
Q:1/4=76
K:C
g2c'3cde | fga2 b2 c'2
w: O Lord, how are _ my _ foes in- creas'd?
% PHRASE_BREAK
| c'2b2a2g2 ^f2 g6
w: a- gainst me ma- ny rise.
% PHRASE_BREAK
|
g2g2efg2 | c'2 e'2 c'2 g2
w: ma- ny say _ of my soul, For him
% PHRASE_BREAK
| g2a3aa2 | a2a2
w: in God no suc- cour lies.
% PHRASE_BREAK
| c'2b2 | a2g4g4 | g6
w: in God no suc- cour lies.`

async function main() {
  const [tune] = await db.select().from(schema.tunes).where(eq(schema.tunes.name, 'Abbeyville'))
  if (!tune) {
    console.error('Abbeyville not found in DB')
    process.exit(1)
  }

  const currentBreakCount = (tune.abcNotation ?? '').split('% PHRASE_BREAK').length - 1
  if (currentBreakCount >= 4) {
    console.log(`Abbeyville already has ${currentBreakCount} PHRASE_BREAKs — already fixed, skipping.`)
    process.exit(0)
  }

  console.log(`Abbeyville has ${currentBreakCount} PHRASE_BREAKs — applying split...`)
  if (!DRY_RUN) {
    await db.update(schema.tunes)
      .set({ abcNotation: NEW_ABC })
      .where(eq(schema.tunes.name, 'Abbeyville'))
    console.log('Done.')
  } else {
    console.log('Would update abc_notation to 5-phrase version.')
  }

  await pgClient.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
