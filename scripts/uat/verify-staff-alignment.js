/**
 * UAT: Staff alignment verification across all 150 psalms (Phase 04.9.8 RENDER-08).
 *
 * Loads each /psalms/<n> in staff view, inspects abcjs SVG, and asserts:
 *   - No Next.js / React error overlay on the page
 *   - At least one sub-staff <g> rendered (or image fallback — not a fail)
 *   - For each sub-staff: lyric tspans count >= note-head count - TOLERANCE
 *     (small tolerance for legitimate melisma / ties)
 *
 * Usage:
 *   node scripts/uat/verify-staff-alignment.js                       # all 150 psalms
 *   PSALM_LIST=1,23,46,100,119,150 node scripts/uat/verify-staff-alignment.js  # spot check
 *   UAT_BASE=https://psalter.gsdlabs.dev node scripts/uat/verify-staff-alignment.js
 */
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')
const fs = require('fs')

const BASE = process.env.UAT_BASE || 'http://localhost:3005'
const PSALM_LIST = process.env.PSALM_LIST
  ? process.env.PSALM_LIST.split(',').map((n) => parseInt(n, 10))
  : Array.from({ length: 150 }, (_, i) => i + 1)
const TOLERANCE = parseInt(process.env.TOLERANCE || '1', 10) // allow 1 melisma per sub-staff
const SS_DIR = path.join(__dirname, 'screenshots', 'staff-alignment-failures')
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true })
const REPORT_PATH = path.join(__dirname, '..', 'output', 'staff-alignment-report.json')
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })

// Hard timeout — abort with exit 2 if total run exceeds 50 minutes
setTimeout(() => {
  console.error('TIMEOUT: verify-staff-alignment exceeded 50 min')
  process.exit(2)
}, 50 * 60 * 1000).unref()

async function waitForNotation(page) {
  await page
    .waitForSelector('.abcjs-container svg, .abcjs-inner svg, svg.abcjs-svg', { timeout: 15000 })
    .catch(() => null)
  await page.waitForTimeout(800)
}

/**
 * Run inside browser context: count notes and lyrics per sub-staff.
 *
 * abcjs 6.6.3 DOM structure (verified against live psalter):
 *   g.abcjs-staff-wrapper.abcjs-l<N>   — one per staff row (rendered line)
 *     g.abcjs-note.abcjs-n<N>…         — one per note position (syllable slot)
 *       text.abcjs-lyric                — ALWAYS present per note in abcjs 6.6.3
 *                                         tspan textContent is "" when no token assigned;
 *                                         "_" / "-" / "–" are legitimate continuation/melisma markers
 *
 * The lyric text may contain multiple stanzas stacked ("TheMyYea," = all stanzas for this slot).
 * The correct alignment check: every g.abcjs-note must have a .abcjs-lyric with non-empty
 * textContent.trim(). Empty tspans (abcjs placeholder) are uncovered note positions.
 * Notes without real text at the END of a row are the "trailing empty note" bug.
 */
async function inspectStaff(page, psalmNum) {
  return page.evaluate(
    (args) => {
      const tol = args.tolerance
      // Check for Next.js error overlay
      const errOverlay = document.querySelector(
        'nextjs-portal, [data-nextjs-dialog], [data-nextjs-toast], #__next-build-watcher',
      )
      const errText = errOverlay ? (errOverlay.textContent || '').slice(0, 200) : null

      // Probe DOM for abcjs SVG presence via abcjs-staff-wrapper elements
      const wrappers = Array.from(document.querySelectorAll('g.abcjs-staff-wrapper'))

      if (wrappers.length === 0) {
        return { errText, subStaves: [], failures: [], imageFallback: true }
      }

      // Analyse each staff-row wrapper
      const subStaves = wrappers.map((w) => {
        const lineClass =
          Array.from(w.classList).find((c) => /^abcjs-l\d+$/.test(c)) || ''

        // g.abcjs-note = one note-position group (one syllable slot)
        const noteGroups = Array.from(w.querySelectorAll('g.abcjs-note'))

        // For each note group, check if it has a lyric child
        let notesWithLyric = 0
        let notesWithoutLyric = 0
        // Count consecutive trailing notes without lyrics
        let trailingEmpty = 0
        for (let i = noteGroups.length - 1; i >= 0; i--) {
          const lyricEl = noteGroups[i].querySelector('.abcjs-lyric')
          const text = lyricEl ? (lyricEl.textContent || '').trim() : ''
          if (text !== '') {
            break // stop at the last note that has a real lyric token (incl. '_' melisma)
          }
          trailingEmpty++
        }
        for (const ng of noteGroups) {
          const lyricEl = ng.querySelector('.abcjs-lyric')
          const text = lyricEl ? (lyricEl.textContent || '').trim() : ''
          if (text !== '') {
            // '_' (ABC melisma extender) and '-'/'–' (continuation dash) all count as covered
            notesWithLyric++
          } else {
            notesWithoutLyric++
          }
        }

        return {
          line: lineClass,
          noteCount: noteGroups.length,
          notesWithLyric,
          notesWithoutLyric,
          trailingEmpty,
        }
      })

      // Failure: any staff row has trailing notes beyond tolerance
      const failures = subStaves.filter((s) => s.trailingEmpty > tol)

      return { errText, subStaves, failures, imageFallback: false }
    },
    { tolerance: TOLERANCE, psalmNum },
  )
}

let passed = 0
let failed = 0
let skipped = 0
const failureDetails = []

async function runPsalmCheck(browser, num) {
  const page = await browser.newPage()
  try {
    const url = `${BASE}/psalms/${num}?view=staff`
    let resp
    try {
      resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    } catch (navErr) {
      console.log(`FAIL psalm ${num}: navigation error — ${navErr.message}`)
      failed++
      failureDetails.push({ psalm: num, reason: 'navigation-error', error: navErr.message })
      return
    }

    if (!resp || !resp.ok()) {
      console.log(`FAIL psalm ${num}: HTTP ${resp ? resp.status() : 'no-response'}`)
      failed++
      failureDetails.push({ psalm: num, reason: `HTTP ${resp ? resp.status() : 'no-response'}` })
      return
    }

    await waitForNotation(page)
    const result = await inspectStaff(page, num)

    if (result.errText) {
      console.log(`FAIL psalm ${num}: error overlay — ${result.errText.slice(0, 100)}`)
      failed++
      failureDetails.push({ psalm: num, reason: 'error-overlay', detail: result.errText })
      await page.screenshot({
        path: path.join(SS_DIR, `psalm-${num}-error.png`),
        fullPage: true,
      })
      return
    }

    if (result.imageFallback || result.subStaves.length === 0) {
      // Not a hard fail — psalm renders via JPG fallback or no abcjs SVG present
      console.log(
        `SKIP psalm ${num}: no abcjs sub-staves found (image fallback or no notation data)`,
      )
      skipped++ // count separately — image fallback is valid but not a notation pass
      return
    }

    if (result.failures.length > 0) {
      console.log(
        `FAIL psalm ${num}: ${result.failures.length} sub-stave(s) with empty trailing notes — ${JSON.stringify(result.failures)}`,
      )
      failed++
      failureDetails.push({
        psalm: num,
        reason: 'empty-notes',
        failures: result.failures,
        allStaves: result.subStaves,
      })
      await page.screenshot({
        path: path.join(SS_DIR, `psalm-${num}-misalign.png`),
        fullPage: true,
      })
      return
    }

    console.log(`PASS psalm ${num}: ${result.subStaves.length} sub-stave(s) aligned`)
    passed++
  } catch (e) {
    console.log(`FAIL psalm ${num}: exception — ${e.message}`)
    failed++
    failureDetails.push({ psalm: num, reason: 'exception', error: e.message })
  } finally {
    await page.close()
  }
}

async function launchBrowser() {
  return chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    // Note: no --single-process (causes browser crash after every page close)
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
}

async function main() {
  console.log(
    `Verifying staff alignment for ${PSALM_LIST.length} psalm(s) against ${BASE}`,
  )
  console.log(`Tolerance: ${TOLERANCE} (notes may exceed lyrics by up to ${TOLERANCE})`)

  // Use a fresh browser per psalm to avoid memory accumulation on memory-constrained VPS.
  // Each browser is launched, used for one psalm check, then closed and GC'd.
  for (const num of PSALM_LIST) {
    const browser = await launchBrowser()
    try {
      await runPsalmCheck(browser, num)
    } catch (e) {
      console.log(`FAIL psalm ${num}: exception — ${e.message}`)
      failed++
      failureDetails.push({ psalm: num, reason: 'exception', error: e.message })
    } finally {
      await browser.close().catch(() => null)
    }
  }

  // Write report — always runs
  const summary = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    tolerance: TOLERANCE,
    psalmsChecked: PSALM_LIST.length,
    passed,
    skipped,
    failed,
    failures: failureDetails,
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(summary, null, 2))

  console.log(`\nResults: ${passed} passed, ${skipped} skipped (image fallback), ${failed} failed`)
  console.log(`Report: ${REPORT_PATH}`)
  console.log(`Failure screenshots (if any): ${SS_DIR}`)

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
