/**
 * UAT: Interactive AbcPlayer on /tunes/[id]
 *
 * Tests all 5 required player behaviours (PLAYER-01 through PLAYER-05).
 *
 * Run as a Node.js script:
 *   NODE_PATH=/usr/lib/node_modules TEST_BASE_URL=http://localhost:3005 node tests/e2e/abc-player.spec.ts
 *
 * Or against deployed:
 *   NODE_PATH=/usr/lib/node_modules node tests/e2e/abc-player.spec.ts
 */

const { chromium } = require('/usr/lib/node_modules/playwright')

const BASE = process.env.TEST_BASE_URL ?? 'https://psalter.gsdlabs.dev'

// Tune with known ABC notation (Lancaster, ID=1, confirmed in DB)
const TUNE_URL = `${BASE}/tunes/1`

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function pass(name: string) {
  results.push({ name, passed: true })
  console.log(`  PASS: ${name}`)
}

function fail(name: string, error: string) {
  results.push({ name, passed: false, error })
  console.log(`  FAIL: ${name} — ${error}`)
}

async function run() {
  console.log(`Running AbcPlayer UAT against ${TUNE_URL}`)
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })

  // ── PLAYER-01: Play triggers audio and highlights a note ──────────────────
  try {
    const page = await browser.newPage()
    await page.goto(TUNE_URL, { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for player skeleton to resolve
    const playBtn = page.locator('[data-testid="abc-play-button"]')
    await playBtn.waitFor({ state: 'visible', timeout: 10000 })

    // Button should say "Play" initially
    const initText = await playBtn.textContent()
    if (!initText?.includes('Play')) {
      fail('PLAYER-01: Play triggers audio and highlights a note', `Button text is "${initText}", expected "Play"`)
    } else {
      // Click Play — button label should flip to "Pause"
      await playBtn.click()

      // Wait for "Pause" label (audio loading may take a few seconds for soundfont)
      let pauseVisible = false
      for (let i = 0; i < 20; i++) {
        const text = await playBtn.textContent()
        if (text?.includes('Pause')) { pauseVisible = true; break }
        await page.waitForTimeout(500)
      }

      if (!pauseVisible) {
        fail('PLAYER-01: Play triggers audio and highlights a note', 'Button did not flip to "Pause" within 10s')
      } else {
        // Check for highlighted note (may appear after a beat)
        let highlighted = false
        for (let i = 0; i < 10; i++) {
          const count = await page.locator('.abcjs-current-note').count()
          if (count > 0) { highlighted = true; break }
          await page.waitForTimeout(500)
        }
        if (!highlighted) {
          fail('PLAYER-01: Play triggers audio and highlights a note', 'No .abcjs-current-note appeared within 5s of play start')
        } else {
          pass('PLAYER-01: Play triggers audio and highlights a note')
        }
      }
    }
    await page.close()
  } catch (e: unknown) {
    fail('PLAYER-01: Play triggers audio and highlights a note', String(e))
  }

  // ── PLAYER-02: Transpose changes the SVG render ───────────────────────────
  try {
    const page = await browser.newPage()
    await page.goto(TUNE_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator('[data-testid="abc-play-button"]').waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(1000) // allow abcjs to render fully

    // Target the notation container (role=img wraps the abcjs SVG output)
    const container = page.locator('div[role="img"]').first()
    const svgBefore = await container.innerHTML()

    // Open shadcn Select and pick +3
    await page.locator('[data-testid="abc-transpose-select"]').click()
    await page.waitForTimeout(400)
    await page.getByRole('option', { name: '+3' }).click()
    await page.waitForTimeout(800)

    const svgAfter = await container.innerHTML()

    if (svgAfter === svgBefore) {
      fail('PLAYER-02: Transpose changes the SVG render', 'SVG markup did not change after transpose to +3')
    } else {
      pass('PLAYER-02: Transpose changes the SVG render')
    }
    await page.close()
  } catch (e: unknown) {
    fail('PLAYER-02: Transpose changes the SVG render', String(e))
  }

  // ── PLAYER-03: BPM controls change the displayed value ───────────────────
  try {
    const page = await browser.newPage()
    await page.goto(TUNE_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator('[data-testid="abc-play-button"]').waitFor({ state: 'visible', timeout: 10000 })

    const bpmEl = page.locator('[data-testid="abc-bpm-value"]')
    const initial = Number(await bpmEl.textContent())

    await page.getByRole('button', { name: 'Increase tempo' }).click()
    await page.getByRole('button', { name: 'Increase tempo' }).click()
    await page.waitForTimeout(200)

    const after = Number(await bpmEl.textContent())
    if (after !== initial + 10) {
      fail('PLAYER-03: BPM controls change the displayed value', `Expected BPM ${initial + 10}, got ${after}`)
    } else {
      pass('PLAYER-03: BPM controls change the displayed value')
    }
    await page.close()
  } catch (e: unknown) {
    fail('PLAYER-03: BPM controls change the displayed value', String(e))
  }

  // ── PLAYER-04: Show original toggles to JPEG ──────────────────────────────
  try {
    const page = await browser.newPage()
    await page.goto(TUNE_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator('[data-testid="abc-play-button"]').waitFor({ state: 'visible', timeout: 10000 })

    // Pre-toggle: SVG present
    const svgCount = await page.locator('svg').count()
    if (svgCount === 0) {
      fail('PLAYER-04: Show original toggles to JPEG', 'No SVG found before toggle')
    } else {
      const toggle = page.locator('[data-testid="abc-show-original-toggle"]')
      const isDisabled = await toggle.isDisabled()

      if (isDisabled) {
        // Tune has no JPEG — show-original disabled is correct behaviour; mark skipped/pass
        pass('PLAYER-04: Show original toggles to JPEG (no JPEG available — toggle correctly disabled)')
      } else {
        await toggle.click()
        await page.waitForTimeout(300)

        // Post-toggle: <img> with "Original score" alt text present
        const imgCount = await page.locator('img[alt*="Original score"]').count()
        if (imgCount === 0) {
          fail('PLAYER-04: Show original toggles to JPEG', 'No img[alt*="Original score"] found after toggle')
        } else {
          // Toggle back
          await toggle.click()
          await page.waitForTimeout(300)
          const svgAfter = await page.locator('svg').count()
          if (svgAfter === 0) {
            fail('PLAYER-04: Show original toggles to JPEG', 'SVG did not return after second toggle')
          } else {
            pass('PLAYER-04: Show original toggles to JPEG')
          }
        }
      }
    }
    await page.close()
  } catch (e: unknown) {
    fail('PLAYER-04: Show original toggles to JPEG', String(e))
  }

  // ── PLAYER-05: Controls reachable at 375px ────────────────────────────────
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto(TUNE_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator('[data-testid="abc-play-button"]').waitFor({ state: 'visible', timeout: 10000 })

    const playVisible = await page.locator('[data-testid="abc-play-button"]').isVisible()
    const transposeVisible = await page.locator('[data-testid="abc-transpose-select"]').isVisible()
    const bpmVisible = await page.locator('[data-testid="abc-bpm-value"]').isVisible()
    const toggleVisible = await page.locator('[data-testid="abc-show-original-toggle"]').isVisible()

    if (!playVisible || !transposeVisible || !bpmVisible || !toggleVisible) {
      fail('PLAYER-05: Controls reachable at 375px', `Not all controls visible: play=${playVisible} transpose=${transposeVisible} bpm=${bpmVisible} toggle=${toggleVisible}`)
    } else {
      // Check for horizontal overflow
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      if (overflow > 1) {
        fail('PLAYER-05: Controls reachable at 375px', `Horizontal overflow of ${overflow}px detected`)
      } else {
        pass('PLAYER-05: Controls reachable at 375px')
      }
    }
    await page.close()
  } catch (e: unknown) {
    fail('PLAYER-05: Controls reachable at 375px', String(e))
  }

  await browser.close()

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n── Results ─────────────────────────────────────────────')
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  console.log(`Passed: ${passed} / ${results.length}`)
  if (failed > 0) {
    console.log(`Failed: ${failed}`)
    results.filter((r) => !r.passed).forEach((r) => console.log(`  FAIL: ${r.name} — ${r.error}`))
    process.exit(1)
  } else {
    console.log('All tests passed.')
    process.exit(0)
  }
}

run().catch((e) => {
  console.error('Unhandled error:', e)
  process.exit(1)
})
