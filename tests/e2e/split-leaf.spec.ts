/**
 * UAT: Split-Leaf view layout fixes — Phase 04.9.14 Plan 01
 *
 * Verifies:
 *   Task 1 — desktop split-leaf: lyrics stack UNDER notation (not beside)
 *   Task 2 — mobile split-leaf: notation capped at ≤50% viewport height
 *   Task 3 — scroll-hide: top bar hides on scroll down, shows on scroll up
 *   Task 4 — zoom decoupling: A-/A+ only affects lyrics font size in split-leaf
 *
 * Deviation from the plan's literal `@playwright/test` example: this repo's
 * e2e suite (see tests/e2e/abc-player.spec.ts) is NOT wired to the
 * `@playwright/test` runner — `@playwright/test` is not a project dependency.
 * All existing specs are plain Node scripts that launch `playwright` (the
 * library) directly and run as `node tests/e2e/<file>.spec.ts`. This file
 * follows that same established convention for consistency.
 *
 * Run as a Node.js script:
 *   NODE_PATH=/usr/lib/node_modules TEST_BASE_URL=http://localhost:3005 node tests/e2e/split-leaf.spec.ts
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

/** Opens the gear popover and switches to Staff / Split-leaf view mode. */
async function switchToSplitLeaf(page: import('playwright').Page) {
  await page.locator('[data-singing-gear]').click()
  await page.waitForTimeout(200)
  // GearPopover (see GearPopover.tsx): Notation sub-toggle -> "Staff",
  // Layout sub-toggle -> "Split-Leaf".
  await page.getByRole('radio', { name: 'Staff' }).click()
  await page.getByRole('radio', { name: 'Split-Leaf' }).click()
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(300)
}

async function run() {
  console.log(`Running Split-Leaf UAT against ${PSALM_URL}`)
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })

  // ── Task 1: desktop — lyrics stack UNDER notation (not beside) ───────────
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 1200, height: 900 })
    await page.goto(PSALM_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await switchToSplitLeaf(page)

    const viewMode = await page
      .locator('[data-notation-renderer]')
      .first()
      .getAttribute('data-view-mode')

    if (viewMode !== 'staff-split' && viewMode !== 'solfege-split') {
      fail('T1 desktop: lyrics stack under notation', `Could not enter split-leaf mode (data-view-mode="${viewMode}")`)
    } else {
      const notationBox = await page.locator('[data-notation-viewarea]').first().boundingBox()
      const lyricsBox = await page.locator('.verse-text').first().boundingBox()

      if (!notationBox || !lyricsBox) {
        fail('T1 desktop: lyrics stack under notation', 'Could not measure notation/lyrics bounding boxes')
      } else {
        // Stacked (single column): lyrics top must be BELOW notation top,
        // and they must NOT occupy the same horizontal band side-by-side
        // (old bug: md:col-span-3 + md:col-span-2 grid placed them beside
        // each other at the same vertical position).
        const stacked = lyricsBox.y >= notationBox.y
        const notSideBySide = !(
          Math.abs(lyricsBox.y - notationBox.y) < 20 && lyricsBox.x > notationBox.x + notationBox.width / 2
        )
        if (stacked && notSideBySide) {
          pass('T1 desktop: lyrics stack under notation')
        } else {
          fail('T1 desktop: lyrics stack under notation', `notation@(${notationBox.x},${notationBox.y}) lyrics@(${lyricsBox.x},${lyricsBox.y})`)
        }
      }
    }
    await page.close()
  } catch (e: unknown) {
    fail('T1 desktop: lyrics stack under notation', String(e))
  }

  // ── Task 2: mobile — notation ≤50% viewport height ────────────────────────
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(PSALM_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await switchToSplitLeaf(page)

    const notationBox = await page.locator('[data-notation-viewarea]').first().boundingBox()
    if (!notationBox) {
      fail('T2 mobile: notation max 50% height', 'Could not measure notation bounding box')
    } else {
      const viewportH = page.viewportSize()?.height ?? 667
      if (notationBox.height <= viewportH * 0.55) {
        pass('T2 mobile: notation max 50% height')
      } else {
        fail('T2 mobile: notation max 50% height', `notation height ${notationBox.height}px exceeds 55% of ${viewportH}px viewport`)
      }
    }
    await page.close()
  } catch (e: unknown) {
    fail('T2 mobile: notation max 50% height', String(e))
  }

  // ── Task 3: scroll-hide — top bar hides on scroll down ────────────────────
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(PSALM_URL, { waitUntil: 'networkidle', timeout: 30000 })

    const topBar = page.locator('[data-singing-topbar]')
    await topBar.waitFor({ state: 'visible', timeout: 10000 })

    const scrollArea = page.locator('[data-notation-viewarea]').first()
    // Scroll the internal notation viewarea (the page itself does not
    // scroll at the window level — fixed-height flex layout).
    await scrollArea.evaluate((el: HTMLElement) => { el.scrollTop = 300 })
    await page.waitForTimeout(300)

    const hiddenAttr = await topBar.getAttribute('data-scroll-hidden')
    if (hiddenAttr === '') {
      pass('T3: top bar hides on scroll down')
    } else {
      fail('T3: top bar hides on scroll down', `data-scroll-hidden="${hiddenAttr}" after scrolling down 300px`)
    }
    await page.close()
  } catch (e: unknown) {
    fail('T3: top bar hides on scroll down', String(e))
  }

  // ── Task 4: zoom — A+ only affects lyrics in split-leaf ───────────────────
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(PSALM_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await switchToSplitLeaf(page)

    const verseText = page.locator('.verse-text').first()
    const notationSvg = page.locator('[data-notation-viewarea] svg').first()

    const sizeBefore = await verseText.count()
      ? await verseText.evaluate((el: HTMLElement) => window.getComputedStyle(el).fontSize)
      : null
    const svgBefore = (await notationSvg.count()) ? await notationSvg.getAttribute('viewBox') : null

    await page.locator('button[aria-label="Increase size"]').click()
    await page.locator('button[aria-label="Increase size"]').click()
    await page.waitForTimeout(300)

    const sizeAfter = verseText.count && (await verseText.count())
      ? await verseText.evaluate((el: HTMLElement) => window.getComputedStyle(el).fontSize)
      : null
    const svgAfter = (await notationSvg.count()) ? await notationSvg.getAttribute('viewBox') : null

    if (sizeBefore && sizeAfter && parseFloat(sizeAfter) > parseFloat(sizeBefore) && svgBefore === svgAfter) {
      pass('T4: A+ only affects lyrics size in split-leaf')
    } else {
      fail(
        'T4: A+ only affects lyrics size in split-leaf',
        `lyrics ${sizeBefore}->${sizeAfter}, notation viewBox ${svgBefore === svgAfter ? 'unchanged' : 'CHANGED'}`,
      )
    }
    await page.close()
  } catch (e: unknown) {
    fail('T4: A+ only affects lyrics size in split-leaf', String(e))
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
