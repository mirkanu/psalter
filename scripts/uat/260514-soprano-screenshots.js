/**
 * Quick task 260514 — soprano-from-SATB visual verification.
 *
 *   NODE_PATH=/usr/lib/node_modules node scripts/uat/260514-soprano-screenshots.js
 *
 * Captures /psalms/23, /tunes/126 (Franconia), /tunes/30 (Crimond) at
 * 375 / 768 / 1024 viewports. Overwrites the existing 04.9.2 screenshots
 * in scripts/uat/screenshots/ — those were taken with the old
 * extractTuneV2 abc_notation and need to be refreshed.
 */
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const BASE_URL = process.env.PSALTER_BASE_URL || 'http://localhost:3005'
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots')
const EXECUTABLE_PATH = '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome'

const TARGETS = [
  { slug: 'psalm-23', url: '/psalms/23' },
  { slug: 'tune-126', url: '/tunes/126' }, // Franconia
  { slug: 'tune-30', url: '/tunes/30' },   // Crimond
]
const VIEWPORTS = [
  { name: 'mobile-375',  width: 375,  height: 800 },
  { name: 'tablet-768',  width: 768,  height: 1024 },
  { name: 'desktop-1024', width: 1280, height: 1024 },
]

async function main() {
  const browser = await chromium.launch({
    executablePath: EXECUTABLE_PATH,
    args: ['--no-sandbox'],
  })
  try {
    for (const t of TARGETS) {
      for (const v of VIEWPORTS) {
        const context = await browser.newContext({ viewport: { width: v.width, height: v.height } })
        const page = await context.newPage()
        const fullUrl = `${BASE_URL}${t.url}`
        console.log(`  ${t.slug} @ ${v.name} -> ${fullUrl}`)
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 })
        // Give abcjs a beat to render the SVG (it runs in useEffect post-mount)
        await page.waitForTimeout(800)
        const out = path.join(SCREENSHOT_DIR, `${t.slug}-${v.name === 'desktop-1024' ? 'desktop-1024' : v.name}.png`)
        await page.screenshot({ path: out, fullPage: false })
        console.log(`     -> ${out}`)
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
}
main().catch(e => { console.error(e); process.exit(1) })
