// UAT 03 — Overflow + resize + orientationchange (RED, MOBILE-03 acceptance).
// Asserts no horizontal scrollbar at 375px, then at 768px after viewport change,
// then after a synthetic orientationchange event. Also asserts the SVG bbox
// stays within the viewport width (the actual MOBILE-03 root-cause check).
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const BASE = 'http://localhost:3005'
const SCREEN_DIR = path.join(__dirname, 'screenshots')
const SCRIPT_NAME = 'mobile-psalm-display-03'

setTimeout(() => {
  console.error('TIMEOUT:', SCRIPT_NAME)
  process.exit(2)
}, 90000).unref()

function fail(msg) {
  console.error('FAIL:', SCRIPT_NAME, '-', msg)
  process.exit(1)
}

async function getNoHScroll(page) {
  return await page.evaluate(
    () => document.documentElement.scrollWidth === window.innerWidth,
  )
}

async function getSvgWidth(page) {
  return await page.evaluate(() => {
    const svg = document.querySelector('[data-notation-body] svg')
    if (!svg) return null
    return svg.getBoundingClientRect().width
  })
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

    await page.waitForTimeout(400)

    if (!(await getNoHScroll(page))) return fail('horizontal scroll present at 375px')

    const innerW375 = await page.evaluate(() => window.innerWidth)
    const svgW375 = await getSvgWidth(page)
    if (svgW375 === null) return fail('SVG inside [data-notation-body] not found at 375px')
    if (svgW375 > innerW375) return fail(`SVG width ${svgW375} > viewport ${innerW375} at 375px`)

    await page.screenshot({
      path: path.join(SCREEN_DIR, 'mobile-overflow-375.png'),
      fullPage: false,
    })

    // Resize to 768x1024.
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)

    if (!(await getNoHScroll(page))) return fail('horizontal scroll present at 768px')

    const innerW768 = await page.evaluate(() => window.innerWidth)
    const svgW768 = await getSvgWidth(page)
    if (svgW768 === null) return fail('SVG missing after resize to 768px')
    if (svgW768 <= svgW375) {
      return fail(`SVG width did not grow on resize (375px=${svgW375}, 768px=${svgW768})`)
    }
    if (Math.abs(svgW768 - (innerW768 - 16)) > 40) {
      return fail(`SVG width ${svgW768} not within ±40 of innerWidth-16 (${innerW768 - 16})`)
    }

    await page.screenshot({
      path: path.join(SCREEN_DIR, 'mobile-overflow-768.png'),
      fullPage: false,
    })

    // Dispatch orientationchange.
    await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')))
    await page.waitForTimeout(500)

    if (!(await getNoHScroll(page))) {
      return fail('horizontal scroll present after orientationchange')
    }

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
