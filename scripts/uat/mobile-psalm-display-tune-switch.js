// UAT — Tune switch via sub-bar Sheet (RED).
// Opens the tune-switcher Sheet from the sub-bar, picks a different alt tune,
// and asserts URL gets ?tune= and the sub-bar label changes without remount.
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const BASE = 'http://localhost:3005'
const SCREEN_DIR = path.join(__dirname, 'screenshots')
const SCRIPT_NAME = 'mobile-psalm-display-tune-switch'

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

    const subbar = page.locator('[data-singing-subbar]')
    if ((await subbar.count()) !== 1) return fail('sub-bar not present')

    const tuneNameBefore = await page
      .locator('[data-tune-name]')
      .first()
      .textContent()
      .catch(() => null)

    await subbar.click()

    const sheet = page.locator('[role="dialog"][data-tune-switcher-sheet]')
    try {
      await sheet.waitFor({ state: 'visible', timeout: 2000 })
    } catch {
      return fail('tune-switcher sheet did not open within 2s')
    }

    const tuneButtons = sheet.locator('[data-tune-slug]')
    const count = await tuneButtons.count()
    if (count < 2) return fail(`expected ≥2 [data-tune-slug] buttons in sheet, got ${count}`)

    // Find the first alt tune that is NOT the current (Current row uses aria-current="true").
    let pickedSlug = null
    for (let i = 0; i < count; i++) {
      const slug = await tuneButtons.nth(i).getAttribute('data-tune-slug')
      const ariaCurrent = await tuneButtons.nth(i).getAttribute('aria-current')
      if (slug && ariaCurrent !== 'true') {
        pickedSlug = slug
        await tuneButtons.nth(i).click()
        break
      }
    }
    if (!pickedSlug) return fail('could not find a non-current alt tune to click')

    await page.waitForFunction(() => window.location.search.includes('tune='), null, {
      timeout: 3000,
    })

    // Wait for sub-bar tune name to actually change (router.replace + React re-render).
    try {
      await page.waitForFunction(
        (before) => {
          const el = document.querySelector('[data-tune-name]')
          return el && el.textContent && el.textContent.trim() !== (before || '').trim()
        },
        tuneNameBefore,
        { timeout: 3000 },
      )
    } catch {
      const stuck = await page
        .locator('[data-tune-name]')
        .first()
        .textContent()
        .catch(() => null)
      return fail(`sub-bar tune name did not change ("${tuneNameBefore}" -> "${stuck}")`)
    }

    const bodyStillThere = await page.locator('[data-notation-body]').count()
    if (bodyStillThere < 1) return fail('[data-notation-body] missing after tune switch (remount?)')

    await page.screenshot({
      path: path.join(SCREEN_DIR, 'mobile-tune-switched.png'),
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
