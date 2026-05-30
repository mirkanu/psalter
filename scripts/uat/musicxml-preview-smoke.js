// Wave 0 RED stub — turns GREEN after Plan 03 ships /dev/musicxml-preview
const { chromium } = require('/usr/lib/node_modules/playwright')

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
    await page.goto(`${UAT_URL}/dev/musicxml-preview`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.abcjs-container svg', { timeout: 15000 })

    const lyricCount = await page.evaluate(() => {
      const svg = document.querySelector('.abcjs-container svg')
      if (!svg) return 0
      return svg.querySelectorAll('text.abcjs-lyric').length
    })

    if (lyricCount < 1) {
      console.error(`FAIL: expected >= 1 text.abcjs-lyric element in SVG — got ${lyricCount}`)
      process.exit(1)
    }

    console.log('PASS — /dev/musicxml-preview renders abcjs SVG with lyric tspans')
    process.exit(0)
  } catch (err) {
    console.error(`FAIL: ${err.message}`)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
