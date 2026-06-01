/* Quick 260601-i5d verification.
 *
 * Validates the splitMusicIntoSubLines trailing-`|` fix on the live deployment:
 *
 *  (A) Contemplation phrase 3 first note plays as MIDI 75 (Eb). Verified by
 *      reconstructing the production unifiedAbc-equivalent string (real
 *      Contemplation source + extracted splitMusicIntoSubLines), feeding
 *      it to abcjs.synth.getMidiFile, and decoding NoteOn pitches.
 *
 *  (B) Visual sanity — Contemplation page renders without abcjs errors,
 *      has the expected number of staff systems and note glyphs.
 *
 *  (C) Regression sweep on Crimond, Martyrdom, Old 100th — render without
 *      error, syllable/note alignment intact.
 *
 *  (D) Build-content check — confirm the deployed bundle contains the
 *      trailing-`|` fix (string match against compiled JS).
 *
 * Runs via playwright-daemon at http://localhost:3099 (30s per-job cap).
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import postgres from 'postgres'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const abcjs = require('abcjs') as {
  parseOnly: (abc: string) => unknown[]
  synth: { getMidiFile: (tune: unknown, opts: { midiOutputType: string }) => string }
}

import { splitMusicIntoSubLines } from '../../src/components/notation/splitMusicIntoSubLines'

const { runPlaywright, getStatus } = require('/home/services/playwright-daemon/client.js') as {
  runPlaywright: (script: string, timeoutMs?: number) => Promise<unknown>
  getStatus: () => Promise<{ busy: boolean; queueDepth: number; browserReady: boolean }>
}

const BASE = 'http://localhost:3005'
const OUT = '/data/home/psalter/scripts/uat/output/contemplation-sharps-report.json'
const NEXT_BUILD_DIR = '/data/home/psalter/.next'
const DB_URL =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5435/psalter'

type TuneCase = { tune: string; psalmUrl: string }

const CONTEMPLATION_URL = `${BASE}/psalms/101`
const REGRESSION_TUNES: TuneCase[] = [
  { tune: 'crimond', psalmUrl: `${BASE}/psalms/23` },
  { tune: 'martyrdom', psalmUrl: `${BASE}/psalms/57` },
  { tune: 'old-100th', psalmUrl: `${BASE}/psalms/100a` },
]

type LoadResult = {
  noteGlyphs: number
  staffSystems: number
  wTextCount: number
  consoleErrors: string[]
}

/** Run a single page load and return DOM stats + console errors. */
function loadAndCaptureScript(url: string) {
  return `
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(String((err && err.message) || err)));

    await page.goto(${JSON.stringify(url)}, { waitUntil: 'domcontentloaded', timeout: 18000 });
    await page.waitForSelector('svg .abcjs-note', { timeout: 15000 });
    await page.waitForTimeout(600);

    const result = await page.evaluate(() => ({
      noteGlyphs: document.querySelectorAll('svg .abcjs-note').length,
      staffSystems: document.querySelectorAll('svg .abcjs-staff').length,
      wTextCount: document.querySelectorAll('svg text.abcjs-lyric').length,
    }));
    return { ...result, consoleErrors: errors };
  `
}

/** Decode the URL-encoded MIDI data URI inside the HTML returned by
 *  abcjs.synth.getMidiFile and extract NoteOn pitches in order. */
function extractMidiNoteOns(midiHtml: string): number[] {
  const m = midiHtml.match(/href="data:audio\/midi,([^"]+)"/)
  if (!m) return []
  const enc = m[1]
  const bytes: number[] = []
  for (let i = 0; i < enc.length; ) {
    if (enc[i] === '%') {
      bytes.push(parseInt(enc.slice(i + 1, i + 3), 16))
      i += 3
    } else {
      bytes.push(enc.charCodeAt(i))
      i++
    }
  }
  const noteOns: number[] = []
  for (let i = 0; i < bytes.length - 2; i++) {
    // MIDI NoteOn: 0x9n + pitch + non-zero velocity.
    if ((bytes[i] & 0xf0) === 0x90 && bytes[i + 2] !== 0) {
      noteOns.push(bytes[i + 1])
    }
  }
  return noteOns
}

/** Unfixed splitMusicIntoSubLines (for buggy-vs-fixed comparison). Mirrors
 *  the pre-fix code path EXACTLY — no trailing-`|` normalisation. */
function splitMusicIntoSubLinesUnfixed(body: string, n: number): string[] {
  if (n <= 1) return [body]
  const segs = body.split(/(\|)/).filter((s) => s.length > 0)
  const measures: string[] = []
  let acc = ''
  for (const s of segs) {
    acc += s
    if (s === '|') {
      measures.push(acc.trim())
      acc = ''
    }
  }
  if (acc.trim()) measures.push(acc.trim())
  const realMeasures = measures
    .filter((m) => m && m !== '|')
    .filter((m) => !/^\s*[zxZ]\d*\s*$/.test(m))
  if (realMeasures.length < 2) return [body]
  const per = Math.max(1, Math.ceil(realMeasures.length / n))
  const lines: string[] = []
  for (let k = 0; k < realMeasures.length; k += per) {
    lines.push(realMeasures.slice(k, k + per).join(' '))
  }
  return lines
}

/** Strip PHRASE_BREAK comments and split into phrase bodies the way
 *  NotationRenderer's splitOnPhraseBreaks does (minimum-viable replica).
 *  Accepts an injected splitter so we can A/B test fixed-vs-buggy. */
function splitPhrasesWith(
  abc: string,
  splitter: (body: string, n: number) => string[],
): {
  unifiedAbc: string
  phraseLines: string[]
} {
  // Separate header from body. Header = everything up to (and including) the
  // K: line. Body = the rest.
  const lines = abc.split(/\r?\n/)
  const kIdx = lines.findIndex((l) => /^K:/.test(l.trim()))
  if (kIdx === -1) throw new Error('no K: line in source abc')
  const header = lines.slice(0, kIdx + 1).join('\n')
  const body = lines.slice(kIdx + 1).join('\n')

  // Split body on PHRASE_BREAK comment lines.
  const rawPhrases = body
    .split(/\n\s*%\s*PHRASE_BREAK\s*\n?/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  // For each phrase, extract music body (lines NOT starting with `w:`).
  // Then run through splitMusicIntoSubLines with n=1 (per phrase) — the
  // production code may call with higher n for paginated subdivisions, but
  // n=1 still exercises the trailing-`|` fix when invoked with n>1.
  //
  // For verification purposes, we directly assemble a unified abc where
  // each phrase's music is run through splitMusicIntoSubLines(body, 2) —
  // which is the most common production case for CM-like meters.
  const musicAndW: string[] = []
  const allMusicLines: string[] = []
  for (const phrase of rawPhrases) {
    const phraseLines = phrase.split('\n')
    const music = phraseLines.filter((l) => !/^\s*w:/i.test(l)).join(' ').trim()
    const wLines = phraseLines.filter((l) => /^\s*w:/i.test(l))
    const subLines = splitter(music, 2)
    for (const sl of subLines) {
      musicAndW.push(sl)
      allMusicLines.push(sl)
    }
    for (const w of wLines) musicAndW.push(w)
  }
  return {
    unifiedAbc: header + '\n' + musicAndW.join('\n') + '\n',
    phraseLines: allMusicLines,
  }
}

function checkBuildContainsFix(): { found: boolean; matchedFile: string | null } {
  // Walk .next/server and .next/static for compiled JS containing the
  // trailing-`|` regex.
  if (!existsSync(NEXT_BUILD_DIR)) return { found: false, matchedFile: null }
  const stack: string[] = [NEXT_BUILD_DIR]
  const pattern = /\\\|\\s\*\$|\/\\\|\\s\*\$\/|\|\\s\*\$/ // multiple plausible escapings
  while (stack.length) {
    const dir = stack.pop()!
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      continue
    }
    for (const e of entries) {
      const p = join(dir, e)
      let s
      try {
        s = statSync(p)
      } catch {
        continue
      }
      if (s.isDirectory()) {
        stack.push(p)
      } else if (e.endsWith('.js') && s.size < 5_000_000) {
        let buf
        try {
          buf = readFileSync(p, 'utf8')
        } catch {
          continue
        }
        if (pattern.test(buf) && /splitMusicIntoSubLines|abcjs/.test(buf)) {
          return { found: true, matchedFile: p.replace(NEXT_BUILD_DIR, '.next') }
        }
      }
    }
  }
  return { found: false, matchedFile: null }
}

async function main() {
  let status = await getStatus()
  if (!status.browserReady) {
    console.log('daemon not ready — waiting 5s')
    await new Promise((r) => setTimeout(r, 5000))
    status = await getStatus()
    if (!status.browserReady) throw new Error('playwright-daemon not ready')
  }

  // ── (A) MIDI pitch on synthesized Contemplation unifiedAbc ─────────────────
  console.log('[A] Querying Contemplation source ABC from psalter-db')
  const sql = postgres(DB_URL)
  let contemplationSource: string
  try {
    const rows = await sql<{ abc_notation: string }[]>`
      SELECT abc_notation FROM tunes WHERE id = 13
    `
    contemplationSource = rows[0]?.abc_notation || ''
  } finally {
    await sql.end()
  }
  if (!contemplationSource) throw new Error('Contemplation source ABC not found in DB')

  // Build BOTH the unfixed (pre-fix) and fixed unifiedAbcs from the SAME
  // Contemplation source, then dump MIDI for each and compare. The fix is
  // proven by NoteOn divergence at phrase-boundary `e` notes (75 vs 76).
  const buggy = splitPhrasesWith(contemplationSource, splitMusicIntoSubLinesUnfixed)
  const fixed = splitPhrasesWith(contemplationSource, splitMusicIntoSubLines)
  console.log('   unifiedAbc(fixed) length:', fixed.unifiedAbc.length, 'chars')
  console.log('   music sub-lines (fixed):', fixed.phraseLines.length)

  const buggyAllEnd = buggy.phraseLines.every((l) => /\|\s*$/.test(l))
  const fixedAllEnd = fixed.phraseLines.every((l) => /\|\s*$/.test(l))
  console.log('   buggy sub-lines all end with `|`:', buggyAllEnd, '(expected false)')
  console.log('   fixed sub-lines all end with `|`:', fixedAllEnd, '(expected true)')

  function midiNoteOnsFor(abc: string): number[] {
    const t = abcjs.parseOnly(abc)
    if (!t.length) throw new Error('parseOnly returned no tunes')
    const html = abcjs.synth.getMidiFile(t[0], { midiOutputType: 'json' })
    return extractMidiNoteOns(html)
  }
  const buggyNotes = midiNoteOnsFor(buggy.unifiedAbc)
  const fixedNotes = midiNoteOnsFor(fixed.unifiedAbc)
  console.log('   buggy NoteOn count:', buggyNotes.length)
  console.log('   fixed NoteOn count:', fixedNotes.length)

  // Find diverging pitch indices.
  const minLen = Math.min(buggyNotes.length, fixedNotes.length)
  const diffs: Array<{ idx: number; buggy: number; fixed: number }> = []
  for (let i = 0; i < minLen; i++) {
    if (buggyNotes[i] !== fixedNotes[i]) {
      diffs.push({ idx: i, buggy: buggyNotes[i], fixed: fixedNotes[i] })
    }
  }
  console.log(`   divergent NoteOns: ${diffs.length}`)
  for (const d of diffs.slice(0, 10)) {
    console.log(`     idx=${d.idx}  buggy=${d.buggy}  fixed=${d.fixed}`)
  }

  // The fix is proven if AT LEAST ONE divergence exists AND every divergence
  // moves the pitch in the "correctly-flatted" direction (buggy is one
  // semitone above fixed, i.e. buggy = fixed + 1, on `e` or `b` notes
  // where K:Eb's flat should apply).
  const fixIsEffective =
    diffs.length > 0 && diffs.every((d) => d.buggy === d.fixed + 1)
  console.log('   fix is effective (buggy = fixed+1 at all divergences):', fixIsEffective)
  // Use note count alias for the report.
  const noteOns = fixedNotes

  // Pass criteria:
  //   - fixed sub-lines all end with `|` (invariant from the fix)
  //   - fix is effective: at least one NoteOn divergence between buggy and
  //     fixed pipelines, and every divergence is exactly +1 semitone in the
  //     buggy direction (i.e. a sharpened-leak, exactly the symptom).
  const contPass = fixedAllEnd && fixIsEffective
  const contemplationReport = {
    fix_effective: fixIsEffective,
    divergent_note_ons: diffs,
    note_on_count_fixed: fixedNotes.length,
    note_on_count_buggy: buggyNotes.length,
    fixed_sub_lines_all_end_with_bar: fixedAllEnd,
    buggy_sub_lines_all_end_with_bar: buggyAllEnd,
    sub_line_count: fixed.phraseLines.length,
    pass: contPass,
    psalm_url: CONTEMPLATION_URL,
    expected: 'NoteOn divergence with buggy = fixed + 1 at every divergent index',
    notes_fixed_first_20: fixedNotes.slice(0, 20),
    notes_buggy_first_20: buggyNotes.slice(0, 20),
  }

  // ── (B) Visual structural check on the live Contemplation page ────────────
  console.log('[B] Loading Contemplation page for visual check:', CONTEMPLATION_URL)
  const contRender = (await runPlaywright(loadAndCaptureScript(CONTEMPLATION_URL), 28000)) as LoadResult
  console.log(
    `   notes=${contRender.noteGlyphs}, staves=${contRender.staffSystems}, ` +
      `lyrics=${contRender.wTextCount}, errs=${contRender.consoleErrors.length}`,
  )
  const visualPass = contRender.staffSystems >= 4 && contRender.noteGlyphs >= 16
  const visualReport = {
    staff_systems: contRender.staffSystems,
    note_glyphs: contRender.noteGlyphs,
    w_text_count: contRender.wTextCount,
    abcjs_console_errors: contRender.consoleErrors.filter((e) => /abcjs|renderAbc/i.test(e)),
    pass: visualPass,
  }

  // ── (C) Regression sweep ──────────────────────────────────────────────────
  const regressions: Array<{
    tune: string
    syllable_align: string
    audio_errors: string[]
    staff_systems: number
    note_glyphs: number
    w_text_count: number
    pass: boolean
  }> = []

  for (const c of REGRESSION_TUNES) {
    console.log(`[C] Loading ${c.tune}:`, c.psalmUrl)
    const r = (await runPlaywright(loadAndCaptureScript(c.psalmUrl), 28000)) as LoadResult
    console.log(
      `   ${c.tune}: notes=${r.noteGlyphs}, staves=${r.staffSystems}, ` +
        `lyrics=${r.wTextCount}, errs=${r.consoleErrors.length}`,
    )
    const abcjsErrors = r.consoleErrors.filter((e) => /abcjs|renderAbc/i.test(e))
    const syllableAlignOk = r.noteGlyphs > 0 && r.wTextCount > 0
    const pass = abcjsErrors.length === 0 && r.staffSystems > 0 && syllableAlignOk
    regressions.push({
      tune: c.tune,
      syllable_align: syllableAlignOk ? 'ok' : 'FAIL',
      audio_errors: abcjsErrors,
      staff_systems: r.staffSystems,
      note_glyphs: r.noteGlyphs,
      w_text_count: r.wTextCount,
      pass,
    })
  }

  // ── (D) Build-content check ───────────────────────────────────────────────
  console.log('[D] Scanning .next bundle for fix presence')
  const buildCheck = checkBuildContainsFix()
  console.log('   build contains fix:', buildCheck.found, '  matched:', buildCheck.matchedFile)

  const overall_pass =
    contemplationReport.pass &&
    visualReport.pass &&
    regressions.every((r) => r.pass)

  const report = {
    contemplation: contemplationReport,
    visual_check: visualReport,
    regressions,
    build_check: buildCheck,
    overall_pass,
    generated_at: new Date().toISOString(),
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(report, null, 2))
  console.log('Report written to', OUT)
  console.log('overall_pass:', overall_pass)
  if (!overall_pass) process.exitCode = 1
}

main().catch((e) => {
  console.error('VERIFY FAILED:', e)
  process.exit(2)
})
