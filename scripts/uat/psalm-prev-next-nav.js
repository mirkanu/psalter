const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const BASE = 'http://localhost:3005'
const SCREEN_DIR = path.join(__dirname, 'screenshots')

async function run() {
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })
  const results = []

  async function shot(page, name) {
    const fp = path.join(SCREEN_DIR, name)
    await page.screenshot({ path: fp, fullPage: false })
    console.log('  screenshot:', fp)
  }

  async function newPage(width, height) {
    const ctx = await browser.newContext({ viewport: { width, height } })
    return await ctx.newPage()
  }

  // --- Psalm 23 at 3 viewports ---
  for (const [w, h] of [[375, 800], [768, 900], [1024, 800]]) {
    const page = await newPage(w, h)
    await page.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle' })
    await shot(page, `psalm-23-prev-next-${w}.png`)

    // List button visibility check
    const listVisible = await page.locator('[aria-label="All psalms"]').isVisible().catch(() => false)
    if (w < 768) {
      results.push({ test: `list visible @${w}`, pass: listVisible === true, got: listVisible })
    } else {
      // At md (768) and above, md:hidden should hide it
      results.push({ test: `list hidden @${w}`, pass: listVisible === false, got: listVisible })
    }
    await page.context().close()
  }

  // --- Click next on Ps 23 → Ps 24 (desktop) ---
  {
    const page = await newPage(1024, 800)
    await page.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle' })
    await Promise.all([
      page.waitForURL('**/psalms/24', { timeout: 10000 }).catch(() => {}),
      page.locator('a[rel="next"]:visible').first().click(),
    ])
    const url = page.url()
    results.push({ test: 'click next on 23 → 24', pass: url.endsWith('/psalms/24'), got: url })
    await page.context().close()
  }

  // --- Arrow-right key on Ps 23 → Ps 24 ---
  {
    const page = await newPage(1024, 800)
    await page.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle' })
    // Click on body first to ensure focus is in document (not URL bar)
    await page.locator('body').click()
    await Promise.all([
      page.waitForURL('**/psalms/24', { timeout: 10000 }).catch(() => {}),
      page.keyboard.press('ArrowRight'),
    ])
    const url = page.url()
    results.push({ test: 'ArrowRight on 23 → 24', pass: url.endsWith('/psalms/24'), got: url })
    await page.context().close()
  }

  // --- Psalm 1 (prev disabled) ---
  {
    const page = await newPage(1024, 800)
    await page.goto(`${BASE}/psalms/1`, { waitUntil: 'networkidle' })
    await shot(page, `psalm-1-prev-next-1024.png`)
    const prevAria = await page.locator('[aria-label^="Previous psalm"]:visible').first().getAttribute('aria-disabled')
    results.push({ test: 'Ps 1 prev aria-disabled=true', pass: prevAria === 'true', got: prevAria })
    await page.context().close()
  }

  // --- Psalm 150 (next disabled) ---
  {
    const page = await newPage(1024, 800)
    await page.goto(`${BASE}/psalms/150`, { waitUntil: 'networkidle' })
    await shot(page, `psalm-150-prev-next-1024.png`)
    const nextAria = await page.locator('[aria-label^="Next psalm"]:visible').first().getAttribute('aria-disabled')
    results.push({ test: 'Ps 150 next aria-disabled=true', pass: nextAria === 'true', got: nextAria })
    await page.context().close()
  }

  await browser.close()

  console.log('\n=== RESULTS ===')
  let failed = 0
  for (const r of results) {
    const tag = r.pass ? 'PASS' : 'FAIL'
    if (!r.pass) failed++
    console.log(`  [${tag}] ${r.test} (got: ${r.got})`)
  }
  console.log(`\n${results.length - failed}/${results.length} passed`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
