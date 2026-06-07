/**
 * One-off fix: Azmon/Denfield ABC has no PHRASE_BREAK markers, so prod renders
 * all 28 notes as a single staff line. The melisma editor auto-injects breaks,
 * but NotationRenderer does not. This script:
 *   1. Injects PHRASE_BREAKs at cumulative counts [8, 14, 22] (CM = 8+6+8+6)
 *   2. Sets melisma_positions to [[], [], [], []] (4 phrases, 0 melismas each)
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/fix-azmon-phrase-breaks.ts [--apply]
 */

import postgres from 'postgres'

const CM_SYLLABLE_COUNTS = [8, 6, 8, 6]

const INFO_FIELD = /^\s*[A-Za-z]:/
const NOTE_RE = /[=^_]?[A-Ga-g][',]*\d*\/?\d*/g

function injectPhraseBreaks(abc: string, counts: number[]): string {
  const cumulative: number[] = []
  let running = 0
  for (const c of counts) { running += c; cumulative.push(running) }
  cumulative.pop() // no trailing PHRASE_BREAK after last phrase

  const lines = abc.split('\n')
  const kIdx = lines.findIndex((l) => /^K:/.test(l.trim()))
  if (kIdx === -1) throw new Error('No K: line found in ABC')
  const headerLines = lines.slice(0, kIdx + 1)
  const bodyLines = lines.slice(kIdx + 1)

  const outBody: string[] = []
  let noteCount = 0
  let nextThresholdIdx = 0
  let inserted = 0

  for (const line of bodyLines) {
    if (INFO_FIELD.test(line.trim()) || line.trim().startsWith('%') || line.trim() === '') {
      outBody.push(line)
      continue
    }
    const masked = line
      .replace(/\{[^}]*\}/g, (m) => ' '.repeat(m.length))
      .replace(/"[^"]*"/g, (m) => ' '.repeat(m.length))
      .replace(/![^!]*!/g, (m) => ' '.repeat(m.length))
      .replace(/\[[^\]]+\]/g, (m) => ' '.repeat(m.length))

    let cursor = 0
    let rebuilt = ''
    let m: RegExpExecArray | null
    NOTE_RE.lastIndex = 0
    while ((m = NOTE_RE.exec(masked)) !== null) {
      rebuilt += line.slice(cursor, m.index + m[0].length)
      cursor = m.index + m[0].length
      noteCount++
      if (nextThresholdIdx < cumulative.length && noteCount === cumulative[nextThresholdIdx]) {
        outBody.push(rebuilt)
        outBody.push('% PHRASE_BREAK')
        rebuilt = ''
        nextThresholdIdx++
        inserted++
      }
    }
    rebuilt += line.slice(cursor)
    if (rebuilt.length > 0 || line.length === 0) outBody.push(rebuilt)
  }

  console.log(`  Injected ${inserted} PHRASE_BREAK(s), total notes: ${noteCount}`)
  return [...headerLines, ...outBody].join('\n')
}

async function main() {
  const applyMode = process.argv.includes('--apply')
  const pgClient = postgres(process.env.DATABASE_URL ?? 'postgresql://postgres:psalter_secure_2024@localhost:5435/psalter')

  const rows = await pgClient<{ id: number; name: string; abcNotation: string; melismaPositions: unknown }[]>`
    SELECT id, name, abc_notation AS "abcNotation", melisma_positions AS "melismaPositions"
    FROM tunes WHERE name = 'Azmon/Denfield'
  `

  if (rows.length === 0) { console.error('Azmon/Denfield not found'); process.exit(1) }
  const tune = rows[0]

  console.log(`\nTune: ${tune.name}`)
  console.log(`Current melisma_positions: ${JSON.stringify(tune.melismaPositions)}`)
  console.log(`Current ABC:\n${tune.abcNotation}`)

  if (/^\s*%\s*PHRASE_BREAK\s*$/m.test(tune.abcNotation)) {
    console.log('\n[SKIP] ABC already has PHRASE_BREAK markers — nothing to do.')
    await pgClient.end()
    return
  }

  const newAbc = injectPhraseBreaks(tune.abcNotation, CM_SYLLABLE_COUNTS)
  const newPositions = [[], [], [], []] as number[][]

  console.log(`\nNew ABC:\n${newAbc}`)
  console.log(`\nNew melisma_positions: ${JSON.stringify(newPositions)}`)

  if (!applyMode) {
    console.log('\n[DRY-RUN] Pass --apply to write to DB.')
    await pgClient.end()
    return
  }

  await pgClient`
    UPDATE tunes
    SET abc_notation = ${newAbc}, melisma_positions = ${pgClient.json(newPositions)}
    WHERE id = ${tune.id}
  `
  console.log('\n[APPLY] Azmon/Denfield updated in DB.')
  await pgClient.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
