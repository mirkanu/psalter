/**
 * UAT: PlayMiniBar positioning — Phase 04.9.14 Plan 03
 *
 * Verifies:
 *   Task 2 — PlayMiniBar (variant="inline") sits fixed directly ABOVE
 *            GlassBottomBar, visible without scrolling
 *   Task 3 — auto-hide on scroll down / show on scroll up, independent of
 *            manual collapse
 *   Task 4 — no gap/overlap between PlayMiniBar and GlassBottomBar
 *
 * Deviation from the plan's literal `@playwright/test` example: this repo's
 * e2e suite (see tests/e2e/abc-player.spec.ts, tests/e2e/split-leaf.spec.ts)
 * is NOT wired to the `@playwright/test` runner — that package is not a
 * project dependency. All existing specs are plain Node scripts that launch
 * `playwright` (the library) directly and run as
 * `node tests/e2e/<file>.spec.ts`. This file follows that same established
 * convention for consistency (Plan 01's precedent, restated in this plan's
 * execution context).
 *
 * Run as a Node.js script:
 *   NODE_PATH=/usr/lib/node_modules TEST_BASE_URL=http://localhost:3005 node tests/e2e/play-mini-bar.spec.ts
 */

const { chromium } = require('/usr/lib/node_modules/playwright')

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3005'

// Psalm 23 (Crimond) — confirmed to have ABC notation + lyrics in the DB.
const PSALM_URL = `${BASE}/psalms/23`

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

/** Clicks Play (mounts PlayMiniBar) and waits for it to be visible. */
async function startPlayback(page: import('playwright').Page) {
  await page.locator('[data-singing-play]').click()
  await page.waitForTimeout(400)
  await page.locator('[data-play-mini-bar]').waitFor({ state: 'attached', timeout: 10000 })
  // Let the entry transition settle.
  await page.waitForTimeout(300)
}

async function run() {
  console.log(`Running PlayMiniBar Positioning UAT against ${PSALM_URL}`)
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })

  // ── Task 2: renders above GlassBottomBar, no scroll needed (mobile) ───────
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(PSALM_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await startPlayback(page)

    const playBar = page.locator('[data-play-mini-bar]')
    const bottomBar = page.locator('[data-glass-bottom-bar]')

    await playBar.waitFor({ state: 'visible', timeout: 5000 })
    await bottomBar.waitFor({ state: 'visible', timeout: 5000 })

    const playBarBox = await playBar.boundingBox()
    const bottomBarBox = await bottomBar.boundingBox()

    if (!playBarBox || !bottomBarBox) {
      fail('T2 mobile: renders above GlassBottomBar, no scroll needed', 'Could not measure bounding boxes')
    } else {
      // PlayMiniBar's bottom edge should sit at/above the bottom bar's top
      // edge (small tolerance for border/backdrop overlap).
      const noOverlapOrGap = playBarBox.y + playBarBox.height <= bottomBarBox.y + 5
      const insideViewport = playBarBox.y >= 0 && playBarBox.y < 667
      if (noOverlapOrGap && insideViewport) {
        pass('T2 mobile: renders above GlassBottomBar, no scroll needed')
      } else {
        fail(
          'T2 mobile: renders above GlassBottomBar, no scroll needed',
          `playBar bottom=${playBarBox.y + playBarBox.height}, bottomBar top=${bottomBarBox.y}`,
        )
      }
    }
    await page.close()
  } catch (e: unknown) {
    fail('T2 mobile: renders above GlassBottomBar, no scroll needed', String(e))
  }

  // ── Task 2: desktop — floating card, fixed, right-aligned ─────────────────
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto(PSALM_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await startPlayback(page)

    const playBar = page.locator('[data-play-mini-bar]')
    await playBar.waitFor({ state: 'visible', timeout: 5000 })

    const position = await playBar.evaluate((el: HTMLElement) => window.getComputedStyle(el).position)
    const box = await playBar.boundingBox()

    if (position === 'fixed' && box && box.x + box.width > 1200 - 32 - 5) {
      // Right-aligned within ~md:right-4 (16px) tolerance
      pass('T2 desktop: floating card, fixed + right-aligned above bottom bar')
    } else {
      fail(
        'T2 desktop: floating card, fixed + right-aligned above bottom bar',
        `position=${position}, box=${JSON.stringify(box)}`,
      )
    }
    await page.close()
  } catch (e: unknown) {
    fail('T2 desktop: floating card, fixed + right-aligned above bottom bar', String(e))
  }

  // ── Task 3: auto-hides on scroll down, shows on scroll up ─────────────────
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(PSALM_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await startPlayback(page)

    const playBar = page.locator('[data-play-mini-bar]')
    await playBar.waitFor({ state: 'visible', timeout: 5000 })

    const scrollArea = page.locator('[data-notation-viewarea]').first()
    await scrollArea.evaluate((el: HTMLElement) => { el.scrollTop = 300 })
    await page.waitForTimeout(400)

    const hiddenAfterScrollDown = await playBar.getAttribute('aria-hidden')

    await scrollArea.evaluate((el: HTMLElement) => { el.scrollTop = 0 })
    await page.waitForTimeout(400)

    const hiddenAfterScrollUp = await playBar.getAttribute('aria-hidden')

    if (hiddenAfterScrollDown === 'true' && hiddenAfterScrollUp === 'false') {
      pass('T3: auto-hides on scroll down, shows on scroll up')
    } else {
      fail(
        'T3: auto-hides on scroll down, shows on scroll up',
        `aria-hidden after scroll down="${hiddenAfterScrollDown}", after scroll up="${hiddenAfterScrollUp}"`,
      )
    }
    await page.close()
  } catch (e: unknown) {
    fail('T3: auto-hides on scroll down, shows on scroll up', String(e))
  }

  // ── Task 3: manual collapse independent of auto-hide ──────────────────────
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(PSALM_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await startPlayback(page)

    const playBar = page.locator('[data-play-mini-bar]')
    const collapseBtn = playBar.locator('button[aria-label="Collapse player"]')

    await collapseBtn.click()
    await page.waitForTimeout(400)
    const hiddenAfterCollapse = await playBar.getAttribute('aria-hidden')

    // Scrolling up (the auto-hide "show" trigger) must NOT restore a
    // manually collapsed bar.
    const scrollArea = page.locator('[data-notation-viewarea]').first()
    await scrollArea.evaluate((el: HTMLElement) => { el.scrollTop = 300 })
    await page.waitForTimeout(200)
    await scrollArea.evaluate((el: HTMLElement) => { el.scrollTop = 0 })
    await page.waitForTimeout(400)
    const hiddenAfterScrollUp = await playBar.getAttribute('aria-hidden')

    if (hiddenAfterCollapse === 'true' && hiddenAfterScrollUp === 'true') {
      pass('T3: collapse button works independently of auto-hide')
    } else {
      fail(
        'T3: collapse button works independently of auto-hide',
        `aria-hidden after collapse="${hiddenAfterCollapse}", after scroll-up="${hiddenAfterScrollUp}"`,
      )
    }
    await page.close()
  } catch (e: unknown) {
    fail('T3: collapse button works independently of auto-hide', String(e))
  }

  // ── Task 4: no gap/overlap; SoundCloud mode height handled ────────────────
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(PSALM_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await startPlayback(page)

    const playBar = page.locator('[data-play-mini-bar]')
    await playBar.waitFor({ state: 'visible', timeout: 5000 })

    // Toggle to SoundCloud mode if the toggle exists (some tunes lack a
    // soundcloudUrl — skip gracefully rather than failing the whole suite).
    const scToggle = page.locator('[data-audio-source-toggle]')
    if (await scToggle.count()) {
      await scToggle.click()
      await page.waitForTimeout(400)
    }

    const bottomBar = page.locator('[data-glass-bottom-bar]')
    const playBarBox = await playBar.boundingBox()
    const bottomBarBox = await bottomBar.boundingBox()

    if (!playBarBox || !bottomBarBox) {
      fail('T4: no gap/overlap between PlayMiniBar and GlassBottomBar', 'Could not measure bounding boxes')
    } else {
      const noOverlapOrGap = Math.abs(playBarBox.y + playBarBox.height - bottomBarBox.y) <= 5
      if (noOverlapOrGap) {
        pass('T4: no gap/overlap between PlayMiniBar and GlassBottomBar')
      } else {
        fail(
          'T4: no gap/overlap between PlayMiniBar and GlassBottomBar',
          `playBar bottom=${playBarBox.y + playBarBox.height}, bottomBar top=${bottomBarBox.y}`,
        )
      }
    }
    await page.close()
  } catch (e: unknown) {
    fail('T4: no gap/overlap between PlayMiniBar and GlassBottomBar', String(e))
  }

  await browser.close()

  console.log('\n── Summary ──')
  const passed = results.filter((r) => r.passed).length
  console.log(`${passed}/${results.length} passed`)
  for (const r of results) {
    if (!r.passed) console.log(`  FAILED: ${r.name} — ${r.error}`)
  }
  process.exit(results.every((r) => r.passed) ? 0 : 1)
}

run()
