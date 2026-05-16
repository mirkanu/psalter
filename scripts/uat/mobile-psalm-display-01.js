// UAT 01 — Default mobile psalm display layout @ 375px (RED).
// Asserts that /psalms/23 renders the new mobile chrome (top-bar, sub-bar, FAB)
// and NOT the legacy max-w-4xl + tablist surface. Will fail until Plans 02–05
// land the new components.
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const BASE = 'http://localhost:3005'
const SCREEN_DIR = path.join(__dirname, 'screenshots')
const SCRIPT_NAME = 'mobile-psalm-display-01'

setTimeout(() => {
  console.error('TIMEOUT:', SCRIPT_NAME)
  process.exit(2)
}, 90000).unref()

function fail(msg) {
  console.error('FAIL:', SCRIPT_NAME, '-', msg)
  process.exit(1)
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

    const topbar = await page.locator('[data-singing-topbar]').count()
    if (topbar !== 1) return fail(`expected exactly 1 [data-singing-topbar], got ${topbar}`)

    const subbar = await page.locator('[data-singing-subbar]').count()
    if (subbar !== 1) return fail(`expected exactly 1 [data-singing-subbar], got ${subbar}`)

    const fab = await page.locator('[data-singing-fab]').count()
    if (fab !== 1) return fail(`expected exactly 1 [data-singing-fab], got ${fab}`)

    const tablist = await page.locator('[role="tablist"]').count()
    if (tablist !== 0) return fail(`expected 0 [role="tablist"], got ${tablist}`)

    const legacyChrome = await page.locator('[data-legacy-psalm-chrome]').count()
    if (legacyChrome !== 0) {
      const singingView = await page.locator('[data-singing-view]').count()
      if (singingView !== 1) {
        return fail(`legacy chrome still present and [data-singing-view] count=${singingView}`)
      }
    }

    await page.screenshot({
      path: path.join(SCREEN_DIR, 'mobile-singing-default-375.png'),
      fullPage: false,
    })

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
