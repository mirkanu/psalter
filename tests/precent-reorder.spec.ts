/**
 * UAT: precent-reorder — PREC-03
 *
 * Verifies /precent/[id] renders sortable rows with drag handles.
 * Full drag-persistence is manual-only; this automated spec asserts
 * that the handles and rows are present in the DOM.
 *
 * Run:
 *   NODE_PATH=/usr/lib/node_modules node tests/precent-reorder.spec.ts
 */

const { chromium } = require('/usr/lib/node_modules/playwright')

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3005'
const TEST_SET_ID = parseInt(process.env.TEST_SET_ID ?? '9')

async function run() {
  console.log('=== PREC-03: Reorder / Drag Handles UAT ===')
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

    // 1. At least 2 sortable rows exist
    // dnd-kit sets data-dnd-kit-sortable on sortable items, or rows with data-item-row
    const rows = page.locator('[data-item-row]')
    await page.waitForSelector('[data-item-row]', { timeout: 5000 }).catch(() => null)
    const rowCount = await rows.count()
    if (rowCount < 2) {
      // Fall back to counting tr elements in a table
      const trCount = await page.locator('tbody tr').count()
      if (trCount < 2) throw new Error(`Expected ≥2 sortable rows, found ${rowCount} data-item-row and ${trCount} tbody tr`)
      console.log(`  PASS  ${trCount} tbody rows present (via tr fallback)`)
    } else {
      console.log(`  PASS  ${rowCount} data-item-row elements present`)
    }
    passed++

    // 2. Drag handles with aria-label="Drag to reorder" exist
    const handles = page.locator('[aria-label="Drag to reorder"]')
    const handleCount = await handles.count()
    if (handleCount < 1) throw new Error('"Drag to reorder" handle not found')
    console.log(`  PASS  ${handleCount} drag handle(s) with aria-label="Drag to reorder" present`)
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
  console.log('PASS: PREC-03 drag-handle assertions satisfied')
}

run().catch((err) => {
  console.error('UAT runner crashed:', err)
  process.exit(1)
})
