const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const URL = process.env.UAT_URL || 'https://psalter.gsdlabs.dev/psalms/23'
const OUT_STAFF = path.join(__dirname, 'screenshots', 'psalm-23-crimond-regression-staff-1024.png')
const OUT_LYRICS = path.join(__dirname, 'screenshots', 'psalm-23-crimond-regression-lyrics-1024.png')

async function main() {
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } })
  const page = await ctx.newPage()

  // Seed onboarding-tour dismissal flags via addInitScript (re-applied on reload).
  // Crucially we do NOT seed `psalter-score-mode` here — addInitScript re-runs on
  // page.reload() and would clobber the lyrics-mode write we make between stages.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('psalter-onboarding-completed', 'true')
      localStorage.setItem('psalter-onboarding-dismissed', 'true')
    } catch {}
  })

  // ── Stage 1: staff view (default) — baseline screenshot
  await page.goto(URL, { waitUntil: 'networkidle' })

  // The SingingView page uses chromeless NotationRenderer; the abcjs SVG is rendered
  // inside `.abcjs-container` (no `svg.abcjs` class).
  await page.waitForSelector('.abcjs-container svg', { timeout: 15_000 })
  await page.screenshot({ path: OUT_STAFF, fullPage: false })

  const svgCount = await page.locator('.abcjs-container svg').count()
  if (svgCount < 1) {
    console.error('FAIL: no abcjs SVG in .abcjs-container')
    process.exit(1)
  }

  // No synthesised Amen anywhere on the page (D-13)
  const bodyText = await page.locator('body').textContent()
  if (/\bAmen\b/i.test(bodyText || '')) {
    console.error('FAIL: detected "Amen" token in rendered page (D-13 violation)')
    process.exit(1)
  }

  // ── Stage 2: navigate to lyrics-only view (B6 — make the sup assertion unambiguous)
  // The view-mode controls live in GearDrawer (mobile-first chromeless layout).
  // Path: localStorage write + reload — predictable across mobile/desktop without
  // depending on the gear button's visibility/position.
  await page.evaluate(() => {
    try { localStorage.setItem('psalter-score-mode', 'lyrics') } catch {}
  })
  await page.reload({ waitUntil: 'networkidle' })

  // Wait for view-mode flip — `data-view-mode="lyrics"` is set on the renderer root.
  // Use `state: 'attached'` (not the default 'visible') because the wrapper div may
  // be 0-size when no notation SVG occupies space in lyrics mode.
  await page.waitForSelector('[data-view-mode="lyrics"]', { timeout: 10_000, state: 'attached' })

  // Allow StanzaList to mount
  await page.waitForSelector('p.verse-text', { timeout: 5_000 })

  await page.screenshot({ path: OUT_LYRICS, fullPage: false })

  // ── Stage 3: assertion — ≥ 2 sup.verse-number on the lyrics view
  // (Psalm 23 stanza 1 has verses 1 + 2)
  const supCount = await page.locator('sup.verse-number').count()
  console.log(`[lyrics view] Found ${supCount} <sup.verse-number> elements`)
  if (supCount < 2) {
    console.error(
      `FAIL: expected >= 2 verse-number superscripts on lyrics view (Psalm 23 mid-stanza split), got ${supCount}`,
    )
    process.exit(1)
  }

  // ── Stage 4: sanity — first sup should be "1"
  const firstSup = page.locator('sup.verse-number').first()
  const firstSupText = await firstSup.textContent()
  if ((firstSupText || '').trim() !== '1') {
    console.error(`FAIL: first sup.verse-number should be "1", got "${firstSupText}"`)
    process.exit(1)
  }

  // Also re-check lyrics-view body for "Amen" (D-13 across both view modes).
  const lyricsBodyText = await page.locator('body').textContent()
  if (/\bAmen\b/i.test(lyricsBodyText || '')) {
    console.error('FAIL: detected "Amen" token in lyrics view (D-13 violation)')
    process.exit(1)
  }

  console.log('PASS — Psalm 23 + Crimond regression UAT (staff + lyrics views)')
  await browser.close()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
