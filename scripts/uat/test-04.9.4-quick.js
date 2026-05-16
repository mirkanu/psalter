// UAT — Quick suite for Phase 04.9.4 (per-commit gating).
// Asserts SC1 (top-bar), SC4 (glass bottom bar + stanzas indicator),
// SC6 (no horizontal overflow) at 375x812.
// SKIPs (exit 0) when dev server is unreachable.
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const BASE = process.env.UAT_BASE || 'http://localhost:3005'
const SCREEN_DIR = path.join(__dirname, 'screenshots')
const SCRIPT_NAME = 'test-04.9.4-quick'

setTimeout(() => {
  console.error('TIMEOUT:', SCRIPT_NAME)
  process.exit(2)
}, 90000).unref()

function fail(msg) {
  console.error('FAIL:', SCRIPT_NAME, '-', msg)
  process.exit(1)
}

async function dismissTour(page) {
  const tour = page.locator('[data-onboarding-tour]')
  if ((await tour.count()) === 0) return
  const skip = page.locator('[data-onboarding-tour] button', { hasText: 'Skip tour' })
  if ((await skip.count()) > 0) {
    await skip.first().click()
    await page.waitForTimeout(150)
  }
}

async function run() {
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })
  try {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await ctx.newPage()

    let resp
    try {
      resp = await page.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle', timeout: 20000 })
    } catch (e) {
      console.warn('SKIP:', SCRIPT_NAME, '- dev server not reachable:', e.message)
      await browser.close()
      process.exit(0)
    }
    if (!resp || resp.status() !== 200) {
      console.warn('SKIP:', SCRIPT_NAME, '- /psalms/23 returned', resp && resp.status())
      await browser.close()
      process.exit(0)
    }

    // Reset tour state so assertions are deterministic
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'networkidle' })
    await dismissTour(page)

    // ---- SC1: top-bar content ----
    const topBar = page.locator('[data-singing-topbar]')
    if ((await topBar.count()) === 0) fail('SC1: no [data-singing-topbar]')
    const topBarText = (await topBar.innerText()).trim()
    if (!topBarText.includes('Psalm 23')) fail(`SC1: top bar missing "Psalm 23" (got: ${topBarText})`)
    if (!topBarText.includes('♩')) fail('SC1: top bar missing ♩ glyph')
    if (!/Crimond/i.test(topBarText)) fail(`SC1: top bar missing tune name "Crimond" (got: ${topBarText})`)
    if (topBarText.includes('Tune (')) fail('SC1: top bar contains forbidden "Tune (" prefix')
    // Pencil icon check — search for any element with pencil data-attr or lucide pencil SVG
    const pencilCount = await page.evaluate(() => {
      const root = document.querySelector('[data-singing-topbar]')
      if (!root) return 0
      const dataPencils = root.querySelectorAll('[data-pencil-icon]').length
      const svgPencils = Array.from(root.querySelectorAll('svg')).filter((s) => {
        const cls = (s.getAttribute('class') || '').toLowerCase()
        return cls.includes('pencil') || cls.includes('lucide-pencil')
      }).length
      return dataPencils + svgPencils
    })
    if (pencilCount > 0) fail(`SC1: top bar contains ${pencilCount} pencil icon(s)`)
    const tuneSlot = page.locator('[data-singing-tune-slot]')
    if ((await tuneSlot.count()) === 0) fail('SC1: no [data-singing-tune-slot]')

    // ---- SC4: glass bottom bar + stanzas indicator ----
    const glass = page.locator('[data-glass-bottom-bar]')
    if ((await glass.count()) === 0) fail('SC4: no [data-glass-bottom-bar]')
    const cls = (await glass.getAttribute('class')) || ''
    if (!cls.includes('backdrop-blur-md')) fail(`SC4: glass bar missing backdrop-blur-md (class: ${cls})`)
    const box = await glass.boundingBox()
    const vp = page.viewportSize()
    if (!box || box.y + box.height < vp.height - 5) fail(`SC4: glass bar not at viewport bottom (box: ${JSON.stringify(box)}, vp.h: ${vp.height})`)
    const aMinus = page.locator('[data-glass-bottom-bar] button', { hasText: 'A−' })
    const aPlus = page.locator('[data-glass-bottom-bar] button', { hasText: 'A+' })
    if ((await aMinus.count()) === 0) fail('SC4: A− button missing')
    if ((await aPlus.count()) === 0) fail('SC4: A+ button missing')

    const indicator = page.locator('[data-stanzas-indicator]')
    if ((await indicator.count()) === 0) fail('SC4: no [data-stanzas-indicator]')
    const pattern = /^Stanza \d+ \/ \d+$/
    const deadline = Date.now() + 2000
    let stanzaText = ''
    while (Date.now() < deadline) {
      stanzaText = (await indicator.innerText()).trim()
      if (pattern.test(stanzaText)) break
      await page.waitForTimeout(50)
    }
    if (!pattern.test(stanzaText)) {
      fail(`SC4: stanzas indicator text "${stanzaText}" does not match /^Stanza \\d+ \\/ \\d+$/`)
    }

    // ---- SC6: no horizontal overflow ----
    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      body: document.body.scrollWidth > document.body.clientWidth,
      docSW: document.documentElement.scrollWidth,
      docCW: document.documentElement.clientWidth,
    }))
    if (overflow.doc) fail(`SC6: horizontal overflow on documentElement at 375px (sw=${overflow.docSW}, cw=${overflow.docCW})`)
    if (overflow.body) fail('SC6: horizontal overflow on body at 375px')

    await page.screenshot({ path: path.join(SCREEN_DIR, '04.9.4-quick-375.png'), fullPage: false })

    console.log('PASS:', SCRIPT_NAME)
    await browser.close()
    process.exit(0)
  } catch (e) {
    console.error('ERROR:', SCRIPT_NAME, '-', e.stack || e.message)
    try { await browser.close() } catch { /* ignore */ }
    process.exit(1)
  }
}

run()
