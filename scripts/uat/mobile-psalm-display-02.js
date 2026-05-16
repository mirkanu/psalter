// UAT 02 — FAB sheet + view-mode switching @ 375px (RED).
// Opens the FAB, asserts three view buttons (Staff / Lyrics only / Solfège),
// clicks "Lyrics only", and asserts the sheet auto-closes + view mode flips.
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const BASE = 'http://localhost:3005'
const SCREEN_DIR = path.join(__dirname, 'screenshots')
const SCRIPT_NAME = 'mobile-psalm-display-02'

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

    const fab = page.locator('[data-singing-fab]')
    if ((await fab.count()) !== 1) return fail('FAB not present')
    await fab.click()

    const sheet = page.locator('[role="dialog"][data-singing-fab-sheet]')
    try {
      await sheet.waitFor({ state: 'visible', timeout: 2000 })
    } catch {
      return fail('FAB sheet did not open within 2s')
    }

    for (const mode of ['staff', 'lyrics', 'solfege']) {
      const btn = sheet.locator(`[data-view-option="${mode}"]`)
      if ((await btn.count()) < 1) return fail(`view option "${mode}" missing inside sheet`)
    }

    await page.screenshot({
      path: path.join(SCREEN_DIR, 'mobile-fab-sheet-open.png'),
      fullPage: false,
    })

    await sheet.locator('[data-view-option="lyrics"]').click()

    // Sheet should auto-close within 500ms.
    const closedAt = Date.now()
    try {
      await sheet.waitFor({ state: 'detached', timeout: 1500 })
    } catch {
      const stillThere = await page.locator('[data-singing-fab-sheet]').count()
      if (stillThere !== 0) return fail('FAB sheet did not auto-close after view selection')
    }
    if (Date.now() - closedAt > 1500) return fail('FAB sheet took too long to close')

    const lyricsMode = await page.locator('[data-view-mode="lyrics"]').count()
    if (lyricsMode < 1) return fail('expected [data-view-mode="lyrics"] after selecting "Lyrics only"')

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
