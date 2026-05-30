// Wave 0 stub — Plan 04 captures baseline BEFORE DB update; reruns AFTER. Per W-1, hashes only .abcjs-container innerHTML to avoid timestamp drift.
const { chromium } = require('/usr/lib/node_modules/playwright')
const crypto = require('node:crypto')
const fs = require('node:fs')

const UAT_URL = process.env.UAT_URL || 'https://psalter.gsdlabs.dev'

async function main() {
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } })
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('psalter-onboarding-completed', 'true')
      localStorage.setItem('psalter-onboarding-dismissed', 'true')
      localStorage.setItem('psalter_tour_v1', 'done')
    } catch {}
  })
  const page = await ctx.newPage()

  try {
    await page.goto(`${UAT_URL}/psalms/24`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.abcjs-container svg', { timeout: 15000 })

    // W-1: hash only the SVG lyric region, not full body text
    const regionHtml = await page.evaluate(() => {
      const el = document.querySelector('.abcjs-container')
      return el ? el.innerHTML : ''
    })
    if (!regionHtml) {
      console.error('FAIL: .abcjs-container not found on /psalms/24')
      process.exit(1)
    }

    const hash = crypto.createHash('sha256').update(regionHtml).digest('hex')

    fs.mkdirSync('scripts/uat/baselines', { recursive: true })
    const baselinePath = 'scripts/uat/baselines/psalm-24-body.sha256'
    if (!fs.existsSync(baselinePath)) {
      fs.writeFileSync(baselinePath, hash + '\n')
      console.log(`BASELINE WRITTEN: ${hash}`)
      process.exit(0)
    }

    const baseline = fs.readFileSync(baselinePath, 'utf-8').trim()
    if (baseline !== hash) {
      console.error(`FAIL: Psalm 24 .abcjs-container region changed (expected ${baseline} got ${hash})`)
      await page.screenshot({ path: 'scripts/uat/screenshots/psalm-24-after.png' })
      process.exit(1)
    }

    await page.screenshot({ path: 'scripts/uat/screenshots/psalm-24-after.png' })
    console.log(`PASS — Psalm 24 .abcjs-container region matches baseline (${hash})`)
    process.exit(0)
  } finally {
    await browser.close()
  }
}

main()
