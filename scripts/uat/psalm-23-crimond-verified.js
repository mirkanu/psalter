// Wave 0 RED stub — turns GREEN after Plan 04 applies DB UPDATE. Tests at 1024px AND 375px per Pitfall 4.
const { chromium } = require('/usr/lib/node_modules/playwright')
const fs = require('node:fs')

const UAT_URL = process.env.UAT_URL || 'https://psalter.gsdlabs.dev'

const VIEWPORTS = [
  { width: 1024, height: 768, label: 'desktop' },
  { width: 375, height: 812, label: 'mobile-375' },
]

async function main() {
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })

  let anyFailed = false

  try {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
      await ctx.addInitScript(() => {
        try {
          localStorage.setItem('psalter-onboarding-completed', 'true')
          localStorage.setItem('psalter-onboarding-dismissed', 'true')
          localStorage.setItem('psalter_tour_v1', 'done')
        } catch {}
      })
      const page = await ctx.newPage()

      try {
        await page.goto(`${UAT_URL}/psalms/23`, { waitUntil: 'networkidle' })
        await page.waitForSelector('.abcjs-container svg', { timeout: 15000 })

        const lineLayout = await page.evaluate(() => {
          const svg = document.querySelector('.abcjs-container svg')
          const all = Array.from(svg.querySelectorAll('text.abcjs-lyric'))
          const byLine = new Map()
          for (const t of all) {
            const cls = t.getAttribute('class') || ''
            const m = cls.match(/abcjs-l(\d+)/)
            if (!m) continue
            const li = Number(m[1])
            const arr = byLine.get(li) ?? []
            arr.push((t.textContent || '').trim())
            byLine.set(li, arr)
          }
          return { lineCount: byLine.size, byLine: Object.fromEntries(byLine) }
        })

        const line0Text = (lineLayout.byLine[0] || []).join(' ').toLowerCase()
        const populatedCount0 = (lineLayout.byLine[0] || []).filter((t) => t.length > 0).length

        if (!/^the\s+lord'?s\s+my\s+shep/i.test(line0Text)) {
          console.error(`FAIL [${vp.label}]: line 0 expected /^the\\s+lord's\\s+my\\s+shep/ — got: "${line0Text}"`)
          anyFailed = true
        }
        if (populatedCount0 < 8) {
          console.error(`FAIL [${vp.label}]: expected >= 8 populated lyric tspans on line 0 — got ${populatedCount0}`)
          anyFailed = true
        }
        if (lineLayout.lineCount < 4) {
          console.error(`FAIL [${vp.label}]: expected >= 4 sub-staff lyric lines — got ${lineLayout.lineCount}`)
          anyFailed = true
        }

        await page.screenshot({ path: `scripts/uat/screenshots/psalm-23-crimond-verified-${vp.label}.png` })
      } catch (err) {
        console.error(`FAIL [${vp.label}]: ${err.message}`)
        anyFailed = true
      } finally {
        await ctx.close()
      }
    }

    if (anyFailed) {
      process.exit(1)
    }

    // Save legacy path (desktop screenshot) on success
    try {
      fs.copyFileSync(
        'scripts/uat/screenshots/psalm-23-crimond-verified-desktop.png',
        'scripts/uat/screenshots/psalm-23-crimond-verified.png',
      )
    } catch {}

    console.log('PASS — Psalm 23 verified w-line renders at both desktop and mobile-375')
    process.exit(0)
  } finally {
    await browser.close()
  }
}

main()
