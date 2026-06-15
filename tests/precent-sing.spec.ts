/**
 * UAT: precent-sing — PREC-05 + PREC-06
 *
 * Verifies /precent/[id]/sing/[pos] renders the amber PrecentingBar
 * with correct pos/total counter, the SingingView notation body,
 * and the abcjs play control.
 *
 * Run:
 *   NODE_PATH=/usr/lib/node_modules node tests/precent-sing.spec.ts
 */

const { chromium } = require('/usr/lib/node_modules/playwright')

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3005'
const TEST_SET_ID = parseInt(process.env.TEST_SET_ID ?? '9')

async function run() {
  console.log('=== PREC-05 + PREC-06: Precenting Sing UAT ===')
  console.log(`Base URL: ${BASE_URL}  Set ID: ${TEST_SET_ID}`)

  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })

  let passed = 0
  let failed = 0

  // --- PREC-05: SingingView renders at /precent/[id]/sing/1 ---
  const page = await browser.newPage()
  try {
    const url = `${BASE_URL}/precent/${TEST_SET_ID}/sing/1`
    console.log(`\nNavigating to ${url}`)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })

    const title = await page.title()
    if (/Error|404|Not Found/.test(title)) {
      throw new Error(`Page title indicates error: ${title}`)
    }

    // 1. PREC-05: "Precenting Mode" label is visible
    const precentingLabel = page.getByText('Precenting Mode')
    const labelCount = await precentingLabel.count()
    if (labelCount < 1) throw new Error('"Precenting Mode" text not found on page')
    console.log(`  PASS  "Precenting Mode" label present`)
    passed++

    // 2. PREC-05: pos/total counter shows "1 / 2"
    const counter = page.getByText('1 / 2')
    const counterCount = await counter.count()
    if (counterCount < 1) throw new Error('"1 / 2" counter not found (expected for set with 2 items at pos 1)')
    console.log(`  PASS  Position counter "1 / 2" present`)
    passed++

    // 3. PREC-05: Back arrow is invisible at pos=1 (boundary)
    // The PrecentingBar renders ChevronLeft with class "invisible" at pos=1
    const prevLink = page.locator('[aria-label="Previous psalm"]')
    const prevLinkClass = await prevLink.getAttribute('class') ?? ''
    if (!prevLinkClass.includes('invisible')) {
      throw new Error(`Back arrow should be invisible at pos=1, classes: "${prevLinkClass}"`)
    }
    console.log(`  PASS  Back arrow is invisible at pos=1 (boundary preserved)`)
    passed++

    // 4. PREC-05: SingingView is rendered (data-notation-body from NotationRenderer, or psalm title in topbar)
    // Wait for client-side hydration to render the notation body
    await page.waitForTimeout(3000)
    const notationBody = page.locator('[data-notation-body]')
    const topBar = page.locator('[data-singing-topbar], header')
    const notationCount = await notationBody.count()
    const topBarCount = await topBar.count()
    if (notationCount < 1 && topBarCount < 1) {
      throw new Error('SingingView not rendered — no data-notation-body or header found')
    }
    console.log(`  PASS  SingingView rendered (notation-body: ${notationCount}, header: ${topBarCount})`)
    passed++

    // 5. PREC-06: abcjs play button is present (data-singing-play from GlassBottomBar)
    const playBtn = page.locator('[data-singing-play]')
    const playCount = await playBtn.count()
    if (playCount < 1) {
      // Fallback: aria-label="Play"
      const playAria = page.locator('[aria-label="Play"]')
      const playAriaCount = await playAria.count()
      if (playAriaCount < 1) throw new Error('Play button not found (data-singing-play or aria-label="Play")')
      console.log(`  PASS  Play button present via aria-label`)
    } else {
      console.log(`  PASS  Play button present (data-singing-play)`)
    }
    passed++

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`  FAIL  ${msg}`)
    failed++
  } finally {
    await page.close()
  }

  // --- Verify pos=2 has forward arrow invisible ---
  const page2 = await browser.newPage()
  try {
    const url = `${BASE_URL}/precent/${TEST_SET_ID}/sing/2`
    console.log(`\nNavigating to ${url} (last item — forward arrow should be invisible)`)
    await page2.goto(url, { waitUntil: 'networkidle', timeout: 20000 })

    const counter = page2.getByText('2 / 2')
    const counterCount = await counter.count()
    if (counterCount < 1) throw new Error('"2 / 2" counter not found at pos=2')
    console.log(`  PASS  Position counter "2 / 2" present at last position`)
    passed++

    const nextLink = page2.locator('[aria-label="Next psalm"]')
    const nextLinkClass = await nextLink.getAttribute('class') ?? ''
    if (!nextLinkClass.includes('invisible')) {
      throw new Error(`Forward arrow should be invisible at last pos, classes: "${nextLinkClass}"`)
    }
    console.log(`  PASS  Forward arrow is invisible at last position (boundary preserved)`)
    passed++

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`  FAIL  ${msg}`)
    failed++
  } finally {
    await page2.close()
    await browser.close()
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  if (failed > 0) {
    process.exit(1)
  }
  console.log('PASS: PREC-05 + PREC-06 assertions satisfied')
}

run().catch((err) => {
  console.error('UAT runner crashed:', err)
  process.exit(1)
})
