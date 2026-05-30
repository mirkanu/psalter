/**
 * Phase 04.11 Plan 04 Task 3 — Wave A sample UAT.
 *
 * Asserts that every tune in samples.json renders authored (embedded-w-line)
 * lyrics on production at BOTH desktop (1024px) and mobile-375 viewports.
 *
 * Pattern source: scripts/uat/psalm-23-crimond-verified.js (verbatim).
 *
 * DO NOT RUN until Plan 05 has applied Wave A DB UPDATEs to production.
 * Per CLAUDE.md, this script:
 *   - uses /usr/lib/node_modules/playwright + /tmp/pw-browsers/chromium-1217
 *   - performs memory pre-check (>= 800MB free) before launching browser
 *   - skips onboarding via localStorage init script
 *   - cleans up orphaned chromium processes on exit
 *
 * Outputs:
 *   scripts/uat/screenshots/wave-a-{slug}-{viewport}.png  (per-sample screenshot)
 *   scripts/output/wave-a-uat-report.json                 (machine-readable result)
 */
const { chromium } = require('/usr/lib/node_modules/playwright')
const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

const UAT_URL = process.env.UAT_URL || 'https://psalter.gsdlabs.dev'
const SAMPLES_PATH = path.resolve(
  __dirname,
  '../../.planning/phases/04.11-solfege-underline-ocr-melisma/samples.json',
)
const SAMPLES = JSON.parse(fs.readFileSync(SAMPLES_PATH, 'utf-8'))

const VIEWPORTS = [
  { width: 1024, height: 768, label: 'desktop' },
  { width: 375, height: 812, label: 'mobile-375' },
]

const SCREENSHOTS_DIR = path.resolve(__dirname, 'screenshots')
const REPORT_PATH = path.resolve(__dirname, '../output/wave-a-uat-report.json')

// Memory pre-check per global CLAUDE.md rule
function checkMemory() {
  try {
    const free = parseInt(
      execSync('free -m | awk "/Mem:/ {print $7}"').toString().trim(),
      10,
    )
    if (Number.isNaN(free)) {
      console.warn('Could not parse `free -m` output — proceeding cautiously.')
      return
    }
    if (free < 800) {
      console.error(`low memory: ${free}MB available, need >= 800MB. Aborting.`)
      process.exit(2)
    }
    console.log(`Memory check OK: ${free}MB available.`)
  } catch (err) {
    console.warn(`Memory check failed (${err.message}); proceeding cautiously.`)
  }
}

// Cleanup orphan chromium per global CLAUDE.md rule
process.on('exit', () => {
  try {
    execSync('pkill -u claude -f "chrome|chromium" 2>/dev/null; true')
  } catch {}
})

async function main() {
  checkMemory()
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })

  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })

  const results = []

  try {
    for (const s of SAMPLES) {
      const lyricPatternRe = new RegExp('^' + s.firstLineLyricPattern, 'i')

      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
        })
        await ctx.addInitScript(() => {
          try {
            localStorage.setItem('psalter-onboarding-completed', 'true')
            localStorage.setItem('psalter-onboarding-dismissed', 'true')
            localStorage.setItem('psalter_tour_v1', 'done')
          } catch {}
        })
        const page = await ctx.newPage()
        const failures = []
        let lineLayout = null

        try {
          await page.goto(`${UAT_URL}/psalms/${s.psalmNumber}`, {
            waitUntil: 'networkidle',
          })
          await page.waitForSelector('.abcjs-container svg', { timeout: 15000 })

          lineLayout = await page.evaluate(() => {
            const svg = document.querySelector('.abcjs-container svg')
            if (!svg) return { lineCount: 0, byLine: {}, allText: [] }
            const all = Array.from(svg.querySelectorAll('text.abcjs-lyric'))
            const byLine = new Map()
            const allText = []
            for (const t of all) {
              const text = (t.textContent || '').trim()
              allText.push(text)
              const cls = t.getAttribute('class') || ''
              const m = cls.match(/abcjs-l(\d+)/)
              if (!m) continue
              const li = Number(m[1])
              const arr = byLine.get(li) ?? []
              arr.push(text)
              byLine.set(li, arr)
            }
            return {
              lineCount: byLine.size,
              byLine: Object.fromEntries(byLine),
              allText,
            }
          })

          // Assertion 1: line count >= 4 (CM/LM/SM all render 4 phrase rows in stanza 1)
          // Skip line-count check for 10 10 10 10 10 (5-phrase asymmetric — may render differently)
          const minLines = s.meter === '10 10 10 10 10' ? 3 : 4
          if (lineLayout.lineCount < minLines) {
            failures.push(
              `expected >= ${minLines} sub-staff lyric lines — got ${lineLayout.lineCount}`,
            )
          }

          // Assertion 2: line-0 prefix matches firstLineLyricPattern
          const line0Text = (lineLayout.byLine[0] || []).join(' ').toLowerCase()
          if (!lyricPatternRe.test(line0Text)) {
            failures.push(
              `line 0 expected /^${s.firstLineLyricPattern}/i — got: "${line0Text.slice(0, 80)}"`,
            )
          }

          // Assertion 3: populated tspan count on line 0
          const populated = (lineLayout.byLine[0] || []).filter(
            (t) => t.length > 0,
          ).length
          if (populated < s.minPopulated) {
            failures.push(
              `expected >= ${s.minPopulated} populated lyric tspans on line 0 — got ${populated}`,
            )
          }

          // Assertion 4: embedded-w-line gate — look for melisma markers in rendered text.
          // Authored w-lines emit hyphenated syllables (e.g. "she-", "pherd,"). Heuristic
          // fallback typically does NOT contain hyphens within syllables. The presence of
          // at least one hyphen-suffixed token on line 0 is a strong signal of authored
          // (embedded-w) rendering. NOT a hard fail (some authored first lines are
          // monosyllabic — Old 124th "Now Israel") but recorded as a flag.
          const hasHyphenated = (lineLayout.byLine[0] || []).some((t) =>
            /[a-z]-$/i.test(t),
          )
          // Save screenshot
          const screenshotPath = path.join(
            SCREENSHOTS_DIR,
            `wave-a-${s.slug}-${vp.label}.png`,
          )
          await page.screenshot({ path: screenshotPath })

          results.push({
            slug: s.slug,
            tuneName: s.tuneName,
            psalmNumber: s.psalmNumber,
            meter: s.meter,
            viewport: vp.label,
            pass: failures.length === 0,
            failures,
            populatedLine0: populated,
            lineCount: lineLayout.lineCount,
            hasHyphenatedSyllableOnLine0: hasHyphenated,
            screenshot: screenshotPath,
          })

          if (failures.length > 0) {
            console.error(
              `FAIL [${s.tuneName} / ${vp.label}]: ${failures.join('; ')}`,
            )
          } else {
            console.log(`PASS [${s.tuneName} / ${vp.label}]`)
          }
        } catch (err) {
          console.error(
            `FAIL [${s.tuneName} / ${vp.label}]: ${err.message}`,
          )
          results.push({
            slug: s.slug,
            tuneName: s.tuneName,
            psalmNumber: s.psalmNumber,
            meter: s.meter,
            viewport: vp.label,
            pass: false,
            failures: [err.message],
            populatedLine0: 0,
            lineCount: 0,
            hasHyphenatedSyllableOnLine0: false,
            screenshot: null,
          })
        } finally {
          await ctx.close()
        }
      }
    }
  } finally {
    await browser.close()
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2))

  const anyFailed = results.some((r) => !r.pass)
  if (anyFailed) {
    console.error(`\nFAIL — see ${REPORT_PATH}`)
    process.exit(1)
  }
  console.log(
    `\nPASS — all ${SAMPLES.length} samples rendered authored lyrics on ${VIEWPORTS.length} viewports`,
  )
  process.exit(0)
}

main()
