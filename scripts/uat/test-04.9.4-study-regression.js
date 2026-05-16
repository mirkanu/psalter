// UAT — Study route regression for Phase 04.9.4.
// Confirms /psalms/23/study still renders after SingingView changes.
// SKIPs (exit 0) when dev server is unreachable.
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const BASE = process.env.UAT_BASE || 'http://localhost:3005'
const SCREEN_DIR = path.join(__dirname, 'screenshots')
const SCRIPT_NAME = 'test-04.9.4-study-regression'

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
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } })
    const page = await ctx.newPage()

    let resp
    try {
      resp = await page.goto(`${BASE}/psalms/23/study`, { waitUntil: 'networkidle', timeout: 20000 })
    } catch (e) {
      console.warn('SKIP:', SCRIPT_NAME, '- dev server not reachable:', e.message)
      await browser.close()
      process.exit(0)
    }
    if (!resp) {
      console.warn('SKIP:', SCRIPT_NAME, '- no response from /psalms/23/study')
      await browser.close()
      process.exit(0)
    }
    if (resp.status() !== 200) {
      fail(`/psalms/23/study returned ${resp.status()}`)
    }

    const bodyText = (await page.locator('body').innerText()).trim()
    if (!bodyText.includes('Psalm 23')) {
      fail(`study page missing "Psalm 23" in body text (got first 200 chars: ${bodyText.slice(0, 200)})`)
    }

    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      docSW: document.documentElement.scrollWidth,
      docCW: document.documentElement.clientWidth,
    }))
    if (overflow.doc) fail(`study page horizontal overflow (sw=${overflow.docSW}, cw=${overflow.docCW})`)

    await page.screenshot({
      path: path.join(SCREEN_DIR, '04.9.4-study-regression-1024.png'),
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
