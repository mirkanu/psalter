/**
 * UAT: precent-detail — PREC-04
 *
 * Verifies /precent/[id] set-detail page renders psalm rows,
 * "Add Psalm" and "Start Precenting" buttons.
 *
 * Run:
 *   NODE_PATH=/usr/lib/node_modules node tests/precent-detail.spec.ts
 */

const { chromium } = require('/usr/lib/node_modules/playwright')

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3005'

// Use set ID 9 (created with 2 items: psalm 23 + psalm 100) or fall back to any set
const TEST_SET_ID = parseInt(process.env.TEST_SET_ID ?? '9')

async function run() {
  console.log('=== PREC-04: Set Detail UAT ===')
  console.log(`Base URL: ${BASE_URL}  Set ID: ${TEST_SET_ID}`)

  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })

  let passed = 0
  let failed = 0

  const page = await browser.newPage()
  try {
    const url = `${BASE_URL}/precent/${TEST_SET_ID}`
    console.log(`\nNavigating to ${url}`)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })

    const title = await page.title()
    if (/Error|404|Not Found/.test(title)) {
      throw new Error(`Page title indicates error: ${title}`)
    }

    // 1. Set header renders
    const heading = page.locator('h1, h2').first()
    const headingText = await heading.textContent()
    if (!headingText) throw new Error('No heading found on set detail page')
    console.log(`  PASS  Heading renders: "${headingText.trim()}"`)
    passed++

    // 2. At least one psalm row is present
    const psalmRows = page.locator('[data-item-row], tr, [role="row"]')
    const rowCount = await psalmRows.count()
    if (rowCount < 1) throw new Error(`Expected ≥1 psalm row, found ${rowCount}`)
    console.log(`  PASS  ${rowCount} row(s) present`)
    passed++

    // 3. "Add Psalm" button exists
    const addPsalmBtn = page.getByRole('button', { name: /add psalm/i })
    const addCount = await addPsalmBtn.count()
    if (addCount < 1) throw new Error('"Add Psalm" button not found')
    console.log(`  PASS  "Add Psalm" button present`)
    passed++

    // 4. "Start Precenting" link/button exists
    const startBtn = page.getByRole('link', { name: /start precenting/i })
    const startBtnAlt = page.getByRole('button', { name: /start precenting/i })
    const startCount = (await startBtn.count()) + (await startBtnAlt.count())
    if (startCount < 1) throw new Error('"Start Precenting" button/link not found')
    console.log(`  PASS  "Start Precenting" button/link present`)
    passed++

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`  FAIL  ${msg}`)
    failed++
  } finally {
    await page.close()
    await browser.close()
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  if (failed > 0) {
    process.exit(1)
  }
  console.log('PASS: PREC-04 set-detail assertions satisfied')
}

run().catch((err) => {
  console.error('UAT runner crashed:', err)
  process.exit(1)
})
