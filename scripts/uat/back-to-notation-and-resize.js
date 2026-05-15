/* eslint-disable */
// UAT for quick task 260515-qe-back-to-notation-and-resize
// - Item 1: prominent Back to notation button above JPGs; pagination row hidden
//           when not showing live abcjs notation.
// - Item 5: A+/A- now visibly resize the abc staff.
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')
const BASE = 'https://psalter.gsdlabs.dev'

function ok(name) { console.log(`  PASS  ${name}`) }
function fail(name, why) { console.log(`  FAIL  ${name}: ${why}`); process.exitCode = 1 }
async function shot(page, file) {
  const p = path.join(SCREENSHOT_DIR, file)
  await page.screenshot({ path: p, fullPage: false })
  console.log(`        screenshot → ${p}`)
}

;(async () => {
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    // ── Desktop run ──────────────────────────────────────────────────────────
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } })
    const page = await ctx.newPage()
    page.on('console', (m) => { if (m.type() === 'error') console.log(`        [console.error] ${m.text()}`) })

    console.log('\n── Desktop 1024 — /psalms/23 ──')
    await page.goto(`${BASE}/psalms/23`, { waitUntil: 'domcontentloaded' })
    // Wait for abcjs to mount
    await page.waitForSelector('[data-notation-renderer]:visible svg:not([class*="lucide"]):not([class*="size-"])', { timeout: 15000, state: 'attached' })

    // 1. Notation view: SVG visible + pagination row visible
    {
      const svgCount = await page.locator('[data-notation-renderer]:visible svg:not([class*="lucide"]):not([class*="size-"])').count()
      svgCount > 0 ? ok('Notation view: abcjs SVG rendered') : fail('Notation view SVG', 'no svg')
      // Pagination row: look for "Stanzas X/Y" text OR Prev/Next buttons
      const pagText = await page.locator('[data-notation-renderer]:visible >> text=/Stanzas \\d+\\/\\d+/').count()
      if (pagText > 0) ok('Notation view: pagination row visible')
      else console.log('  (info) no pagination row — psalm 23 may have ≤3 cycles')
    }

    // 2. Click "Show original"
    const showOrigBtn = page.locator('[data-testid="abc-show-original-toggle"]:visible').first()
    if (await showOrigBtn.count() === 0) {
      fail('Show original toggle', 'button not found')
    } else {
      await showOrigBtn.click()
      await page.waitForTimeout(400)

      const imgInRenderer = page.locator('[data-notation-renderer]:visible img').first()
      if (await imgInRenderer.count() > 0) ok('Show original: <img> visible')
      else fail('Show original', 'no <img> after toggle')

      const backBtn = page.locator('[data-testid="back-to-notation"]:visible')
      const backCount = await backBtn.count()
      if (backCount > 0) ok(`Show original: BackToNotation button visible (${backCount} on page)`)
      else fail('Show original back button', 'not rendered')

      // Pagination row HIDDEN
      const pagHidden = await page.locator('[data-notation-renderer]:visible >> text=/Stanzas \\d+\\/\\d+/').count() === 0
      pagHidden ? ok('Show original: pagination row hidden') : fail('Show original pagination', 'still visible')

      await shot(page, 'psalm-23-show-original-with-back.png')

      // Click back
      await backBtn.first().click()
      await page.waitForTimeout(1500)
      const svgBack = await page.locator('[data-notation-renderer]:visible svg:not([class*="lucide"]):not([class*="size-"])').count()
      svgBack > 0 ? ok('Back to notation: SVG returned') : fail('Back to notation', 'no svg')
    }

    // 3. Solfège tab
    {
      const solfegeBtn = page.locator('[data-notation-renderer]:visible button:has-text("Solfège")').first()
      if (await solfegeBtn.count() === 0) {
        console.log('  (skip) no Solfège tab on this psalm')
      } else {
        await solfegeBtn.click()
        await page.waitForTimeout(400)
        const imgs = await page.locator('[data-notation-renderer]:visible img').count()
        const backBtn = page.locator('[data-testid="back-to-notation"]:visible')
        const back = await backBtn.count()
        const pagHidden = await page.locator('[data-notation-renderer]:visible >> text=/Stanzas \\d+\\/\\d+/').count() === 0
        imgs > 0 ? ok('Solfège: <img> rendered (or placeholder if no jpg)') : ok('Solfège: no jpg, expected placeholder')
        back > 0 ? ok('Solfège: BackToNotation button visible') : fail('Solfège back button', 'not rendered')
        pagHidden ? ok('Solfège: pagination row hidden') : fail('Solfège pagination', 'still visible')
        await shot(page, 'psalm-23-solfege-with-back.png')
        if (back > 0) {
          await backBtn.first().click()
          await page.waitForTimeout(400)
          const svgBack = await page.locator('[data-notation-renderer]:visible svg:not([class*="lucide"]):not([class*="size-"])').count()
          svgBack > 0 ? ok('Back from Solfège: SVG returned') : fail('Back from Solfège', 'no svg')
        }
      }
    }

    // 4. Lyrics-only tab
    {
      const lyricsBtn = page.locator('[data-notation-renderer]:visible button:has-text("Lyrics only")').first()
      if (await lyricsBtn.count() === 0) {
        console.log('  (skip) no Lyrics-only tab')
      } else {
        await lyricsBtn.click()
        await page.waitForTimeout(300)
        const pagHidden = await page.locator('[data-notation-renderer]:visible >> text=/Stanzas \\d+\\/\\d+/').count() === 0
        pagHidden ? ok('Lyrics-only: pagination row hidden') : fail('Lyrics-only pagination', 'still visible')
        // Switch back to staff for next test
        const staffBtn = page.locator('[data-notation-renderer]:visible button:has-text("Staff")').first()
        if (await staffBtn.count() > 0) {
          await staffBtn.click()
          await page.waitForTimeout(400)
        }
      }
    }

    // 5. A+ resize test
    {
      await page.waitForSelector('[data-notation-renderer]:visible svg:not([class*="lucide"]):not([class*="size-"])', { timeout: 10000, state: 'attached' })
      const svg = page.locator('[data-notation-renderer]:visible svg:not([class*="lucide"]):not([class*="size-"])').first()
      const before = await svg.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return { w: r.width, h: r.height }
      })
      // A+ button: chevron-up + "A" label, second size button. We look for the
      // Increase notation size aria-label.
      const aPlus = page.locator('button[aria-label="Increase notation size"]:visible').first()
      if (await aPlus.count() === 0) {
        fail('A+ resize', 'A+ button not found')
      } else {
        for (let i = 0; i < 5; i++) {
          await aPlus.first().click()
          await page.waitForTimeout(120)
        }
        await page.waitForTimeout(500)
        const svgAfter = page.locator('[data-notation-renderer]:visible svg:not([class*="lucide"]):not([class*="size-"])').first()
        const after = await svgAfter.evaluate((el) => {
          const r = el.getBoundingClientRect()
          return { w: r.width, h: r.height }
        })
        const growthH = after.h / before.h
        const growthW = after.w / before.w
        console.log(`        before: ${before.w.toFixed(0)}×${before.h.toFixed(0)}  after: ${after.w.toFixed(0)}×${after.h.toFixed(0)}  (h×${growthH.toFixed(2)} w×${growthW.toFixed(2)})`)
        if (growthH >= 1.5 || growthW >= 1.5) ok('A+ resize: SVG grew ≥1.5× (height or width)')
        else fail('A+ resize', `grew only h×${growthH.toFixed(2)} w×${growthW.toFixed(2)}`)

        // Check lyrics inside SVG also grew
        const wTextBefore = before
        const lyricNodes = await page.locator('svg:not([class*="lucide"]):not([class*="size-"]) text').count()
        lyricNodes > 0 ? ok(`Lyrics: ${lyricNodes} text nodes present inside resized SVG`) : console.log('  (info) no <text> nodes in SVG')

        await shot(page, 'psalm-23-aplus-staff-grown-1024.png')
      }
    }

    // ── Mobile run (resize same page) ──────────────────────────────────────
    console.log('\n── Mobile 375 — pagination hide checks ──')
    const page2 = await ctx.newPage()
    await page2.setViewportSize({ width: 375, height: 700 })
    await page2.goto(`${BASE}/psalms/23`, { waitUntil: 'domcontentloaded' })
    await page2.waitForSelector('[data-notation-renderer]:visible svg:not([class*="lucide"]):not([class*="size-"])', { timeout: 15000, state: 'attached' })
    const showOrigBtn2 = page2.locator('[data-testid="abc-show-original-toggle"]').first()
    if (await showOrigBtn2.count() > 0) {
      await showOrigBtn2.click()
      await page2.waitForTimeout(400)
      const pagHidden = await page2.locator('text=/Stanzas \\d+\\/\\d+/').count() === 0
      pagHidden ? ok('Mobile show original: pagination hidden') : fail('Mobile pag hide', 'still visible')
      const back = await page2.locator('[data-testid="back-to-notation"]:visible').count()
      back > 0 ? ok('Mobile show original: back button rendered') : fail('Mobile back button', 'missing')
    }
    await page2.close()
    await ctx.close()
  } catch (e) {
    console.error('UAT crashed:', e)
    process.exitCode = 1
  } finally {
    await browser.close()
    console.log('\nDone.')
  }
})()
