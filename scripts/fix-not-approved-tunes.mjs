/**
 * Fix not-approved tunes by re-running solFaToAbc and injecting PHRASE_BREAKs.
 * Run with: node scripts/fix-not-approved-tunes.mjs
 */
import { createRequire } from 'module'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// We need to compile TS or use tsx
// Use tsx to run this
process.chdir(path.join(__dirname, '..'))

// Import via tsx transpiled src
const { solFaToAbc } = await import('../src/lib/solfege-parser.ts')
const { injectPhraseBreaksAtCounts } = await import('../src/lib/inject-phrase-breaks-at-counts.ts')
const { expectedSyllablesByLine } = await import('../src/lib/meter-syllable-shape.ts')

function runSolFa(soprano, doh, time, name, meter) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`TUNE: ${name}  doh=${doh} time=${time} meter=${meter}`)
  console.log(`Soprano: ${soprano.substring(0, 100)}...`)

  try {
    const result = solFaToAbc(soprano, doh, time, name)
    if (result.warnings.length) {
      console.log(`Warnings: ${result.warnings.join('; ')}`)
    }

    // Count notes in output
    const noteCount = (result.abc.match(/[a-gA-G][',_=^]*/g) ?? []).length
    console.log(`Generated ABC (${noteCount} notes):`)
    console.log(result.abc)

    // Inject phrase breaks
    const shape = expectedSyllablesByLine(meter)
    if (shape) {
      console.log(`\nExpected shape for "${meter}": [${shape.join(',')}] = ${shape.reduce((a,b)=>a+b,0)} syllables`)
      const injected = injectPhraseBreaksAtCounts(result.abc, shape)
      if (injected.inserted > 0) {
        console.log(`\nWith ${injected.inserted} PHRASE_BREAKs injected:`)
        console.log(injected.abc)
        return injected.abc
      } else {
        console.log(`(no phrase breaks injected — inserted=${injected.inserted})`)
      }
    } else {
      console.log(`No shape for meter "${meter}"`)
    }
    return result.abc
  } catch (e) {
    console.log(`ERROR: ${e.message}`)
    return null
  }
}

// ─── NAOMI (21) ───────────────────────────────────────────────────────────────
// Full soprano: both stanzas. doh=Eb, CM
runSolFa(
  'm :m.m | s :f.m | r.m:f | m :m | l :-.l | s :fe | s :— || m :m.m | s :f.m | r.m:f | m :m | l :-.l | s.m :r | d :—||',
  'Eb', 'C', 'Naomi', 'CM'
)

// ─── CARLISLE (99) ────────────────────────────────────────────────────────────
// SM = short meter 66 86. doh=Eb
runSolFa(
  ':d |s :d |m.r:d.t_1|d :— |— :d |f :s.l |s :d.f|m :r |—|| :r |m :r.d|f :m.r|s :f.m|l :t |d\' :d.f|m :r |d :— |—||',
  'Eb', 'C', 'Carlisle', 'SM'
)

// ─── WOODWORTH (3) ────────────────────────────────────────────────────────────
// LM = 88 88. doh=Eb, time=C
runSolFa(
  ':d.r|m:-:m|s:-.f:m|r:-.m:f|m:-:s|s:r:m|f:-:l|l:-:s|m:-||:d.r|m:-:m|s:-.f:m|l:-:l|d\':-t:l|s:-:s|s:-.f:m|r:-:-|s:-:-|m:-:-|:-||',
  'Eb', 'C', 'Woodworth', 'LM (long meter, 88 88)'
)

// ─── BAYS OF HARRIS (12) ─────────────────────────────────────────────────────
// CM. doh=G, time=C — OCR soprano actually looks complete!
runSolFa(
  'd :m |f :s |l :t |d\' :— |d\' :m |f :s |m :r |d :—||',
  'G', 'C', 'Bays of Harris', 'CM'
)

// ─── FARRANT (96) ─────────────────────────────────────────────────────────────
// CM. doh=G, time=C
runSolFa(
  ':d |d :-.r |m :r |d :f |r :r |m.fe:s |s :fe |s :—|—||d |d||',
  'G', 'C', 'Farrant', 'CM'
)

// ─── KINGSFOLD (41) ───────────────────────────────────────────────────────────
// DCM (double CM). doh=G, time=C, double_length=true
runSolFa(
  ':s |d\' :s |m :l |s :s.f |m :r |d :—|— :d |m :r |d :t |l :s |m :— |—||',
  'G', 'C', 'Kingsfold', 'CM'
)

// ─── OLD 124th (38) ───────────────────────────────────────────────────────────
// OCR soprano — note the meter in DB is "10 10 10 10 10"
runSolFa(
  'd :r.m | f :m | r.d :d.t_1 | d :— || m :f.s | l :s | f.m :r.d | t_1 :— || s_1 :d.d | t_1 :d | r.f :m.r | m :— || s :s.f | m :r | m.s :s.fe | s :— || m :r.d | t_1.d :r.m | f :m.r | d :— ||',
  'G', 'C', 'Old 124th', '10 10 10 10 10'
)

// ─── CLARKEVILLE (136) ────────────────────────────────────────────────────────
// 66 66 88. doh=D. Already has no phrase breaks in DB, auto-inject should handle.
// But try solFaToAbc to compare quality
const clarkOcr = ':s |s :-.f |m :f |s :- |l :- |s :f.m |r :m.f |m :- |- :s |s :-.f |m :f |s :- |l :- |s :f.m |r :m.f |m :- |- :s |l :-.t |d\' :t.l |s :f.m |r :s |s :- |- :l |s :m |r :f |m :- |'
runSolFa(clarkOcr, 'D', 'C', 'Clarkeville', '66 66 88')

// ─── WALLACE (71) ─────────────────────────────────────────────────────────────
// CM but 3/4 time patterns in OCR (— :— :—)
console.log('\n' + '='.repeat(60))
console.log('WALLACE (71): OCR soprano has 3/4 time patterns')
console.log('Raw: |m :— :f |d :— :r |s :— :f |d :— :d ||f :— :— |d :— :— |l :— :— |f_1 :— :— |— :— ||')
console.log('Conclusion: This is a 3/4 waltz-type tune, not CM. Data gap — mark not_approved.')

console.log('\n\nDONE')
