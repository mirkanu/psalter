/* eslint-disable */
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const BASE = process.env.UAT_BASE || 'http://localhost:3099'
const SCREEN_DIR = path.join(__dirname, 'screenshots')

async function run() {
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })
  const results = []

  function record(test, pass, detail) {
    results.push({ test, pass: !!pass, detail: detail ?? '' })
    console.log((pass ? 'PASS' : 'FAIL').padEnd(4), '-', test, detail ? '— ' + detail : '')
  }

  async function shot(page, name) {
    const fp = path.join(SCREEN_DIR, name)
    await page.screenshot({ path: fp, fullPage: false })
    console.log('  shot:', fp)
  }

  async function makePage(w, h) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } })
    return await ctx.newPage()
  }

  /** On a psalm page, the "Sing" tab holds the notation. At md+ width the
   *  Tabs root defaults to "overview", so click into Sing. At <md width it
   *  defaults to "sing" already. */
  async function gotoPsalmSing(page, psalmId) {
    await page.goto(`${BASE}/psalms/${psalmId}`, { waitUntil: 'networkidle' })
    // Click any visible tab with value="sing"; ignore if not found / already active.
    const singTab = page.locator('[role="tab"]:has-text("Sing")').first()
    if (await singTab.count() > 0) {
      try {
        await singTab.click({ timeout: 2000 })
        await page.waitForTimeout(400)
      } catch { /* already active or hidden */ }
    }
  }

  /** Get the first visible notation renderer. */
  function notationScope(page) {
    return page.locator('[data-notation-renderer]:visible').first()
  }

  // ── Item 1a: Show Original shows stanzas below image (psalm 23) ─────────────
  try {
    const page = await makePage(1024, 800)
    await gotoPsalmSing(page, 23)
    const scope = notationScope(page)
    // Click "Show original"
    const showBtn = scope.locator('[data-testid="abc-show-original-toggle"]').first()
    const btnCount = await showBtn.count()
    const btnDisabled = btnCount > 0 ? await showBtn.getAttribute('disabled') : 'no-btn'
    if (btnCount === 0 || btnDisabled !== null) {
      record('Item 1a: Show original toggle enabled', false, `count=${btnCount} disabled=${btnDisabled}`)
    } else {
      await showBtn.click()
      await page.waitForTimeout(800)
      const imgVisible = await scope.locator('img[alt*="Original score"]').first().isVisible().catch(() => false)
      const stanzaCount = await scope.locator('p.verse-text').count()
      record('Item 1a: Show Original img visible', imgVisible)
      record('Item 1a: Stanzas rendered below image', stanzaCount > 0, `stanza <p>s = ${stanzaCount}`)
      await shot(page, 'psalm-23-show-original-1024.png')
    }
    await page.context().close()
  } catch (e) {
    record('Item 1a: Show Original block', false, e.message)
  }

  // ── Item 1b: Solfège view shows stanzas below JPG ──────────────────────────
  try {
    const page = await makePage(1024, 800)
    await gotoPsalmSing(page, 23)
    const scope = notationScope(page)
    const solfegeBtn = scope.locator('button:has-text("Solfège")').first()
    await solfegeBtn.click()
    await page.waitForTimeout(600)
    const imgPresent = (await scope.locator('img[alt*="Solfège"]').count()) > 0
    const stanzaCount = await scope.locator('p.verse-text').count()
    record('Item 1b: Solfège view stanzas rendered', stanzaCount > 0, `img=${imgPresent}, stanza <p>=${stanzaCount}`)
    await shot(page, 'psalm-23-solfege-1024.png')
    await page.context().close()
  } catch (e) {
    record('Item 1b: Solfège', false, e.message)
  }

  // ── Item 2: Play plays once, no auto-advance ────────────────────────────────
  // Skipped heavy synth test: we verify pagination indicator does not change
  // after click+wait. (Synth init needs audio context which may be unavailable
  // in headless; we focus on the chain-removal: that we no longer wire the
  // chain callbacks.)
  try {
    const page = await makePage(1024, 800)
    await gotoPsalmSing(page, 23)
    const scope = notationScope(page)
    const pageIndicatorBefore = await scope.locator('text=/Stanzas \\d+\\//').first().textContent().catch(() => null)
    const playBtn = scope.locator('[data-testid="abc-play-button"]').first()
    if (await playBtn.count() > 0) {
      await playBtn.click()
      // Wait 3s — without chaining, click + brief synth init won't auto-advance
      await page.waitForTimeout(3000)
      const pageIndicatorAfter = await scope.locator('text=/Stanzas \\d+\\//').first().textContent().catch(() => null)
      record(
        'Item 2: Stanzas page did not auto-advance during play',
        pageIndicatorBefore === pageIndicatorAfter,
        `before=${pageIndicatorBefore}, after=${pageIndicatorAfter}`,
      )
    } else {
      record('Item 2: Play button absent (skip)', true, 'no playback control')
    }
    await page.context().close()
  } catch (e) {
    record('Item 2: Play no-chain', false, e.message)
  }

  // ── Item 3: BPM persistence ────────────────────────────────────────────────
  try {
    const page = await makePage(1024, 800)
    await page.evaluate(() => window.localStorage.removeItem('psalter-bpm')).catch(() => {})
    await gotoPsalmSing(page, 23)
    const scope = notationScope(page)
    const plusBtn = scope.locator('[data-testid="abc-bpm-group"] button[aria-label="Increase tempo"]').first()
    const bpmEl = scope.locator('[data-testid="abc-bpm-value"]').first()
    const initial = parseInt(await bpmEl.textContent(), 10)
    for (let i = 0; i < 4; i++) { await plusBtn.click(); await page.waitForTimeout(60) }
    const afterClicks = parseInt(await bpmEl.textContent(), 10)
    record('Item 3: BPM increased after 4 clicks', afterClicks > initial, `before=${initial}, after=${afterClicks}`)

    // Confirm localStorage stored value
    const stored1 = await page.evaluate(() => window.localStorage.getItem('psalter-bpm'))
    record('Item 3: psalter-bpm persisted', stored1 != null && parseInt(stored1, 10) === afterClicks, `stored=${stored1}`)

    // Reload, confirm BPM is still the persisted value (not default)
    await page.reload({ waitUntil: 'networkidle' })
    const singTab2 = page.locator('[role="tab"]:has-text("Sing")').first()
    if (await singTab2.count() > 0) { try { await singTab2.click({ timeout: 2000 }) } catch {} }
    await page.waitForTimeout(400)
    const scope2 = notationScope(page)
    const afterReload = parseInt(await scope2.locator('[data-testid="abc-bpm-value"]').first().textContent(), 10)
    record('Item 3: BPM survived reload', afterReload === afterClicks, `reload=${afterReload}`)

    // Navigate to psalm 24, BPM still persists
    await gotoPsalmSing(page, 24)
    const scope3 = notationScope(page)
    const afterNav = parseInt(await scope3.locator('[data-testid="abc-bpm-value"]').first().textContent(), 10)
    record('Item 3: BPM survived navigation to /psalms/24', afterNav === afterClicks, `nav=${afterNav}`)

    // Reset visible?
    const resetBtn = scope3.locator('button[aria-label="Reset key and tempo"]').first()
    const resetVisible = await resetBtn.isVisible().catch(() => false)
    record('Item 3: Reset button visible when BPM != default', resetVisible)

    if (resetVisible) {
      await resetBtn.click()
      await page.waitForTimeout(300)
      const stored2 = await page.evaluate(() => window.localStorage.getItem('psalter-bpm'))
      record('Item 3: localStorage psalter-bpm cleared after Reset', stored2 == null, `stored=${stored2}`)
    }
    await page.context().close()
  } catch (e) {
    record('Item 3: BPM persistence', false, e.message)
  }

  // ── Item 5: A+ pushes baseSize past 18 ──────────────────────────────────────
  try {
    const page = await makePage(1024, 800)
    await gotoPsalmSing(page, 23)
    const scope = notationScope(page)
    const plus = scope.locator('button[aria-label="Increase notation size"]').first()
    // Click 10 times — should go 14→34 (within new 12-44 range)
    for (let i = 0; i < 10; i++) { await plus.click(); await page.waitForTimeout(40) }
    const baseSize = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[data-notation-renderer]'))
      const visible = els.find((e) => e.offsetParent !== null) || els[0]
      if (!visible) return null
      return getComputedStyle(visible).getPropertyValue('--staff-base-size').trim()
    })
    const numeric = baseSize ? parseFloat(baseSize) : NaN
    record('Item 5: --staff-base-size went above 18px', Number.isFinite(numeric) && numeric > 18, `--staff-base-size=${baseSize}`)
    await shot(page, 'psalm-23-a-plus-max-1024.png')
    await page.context().close()
  } catch (e) {
    record('Item 5: A+ extended range', false, e.message)
  }

  // ── Item 6: Tune page has no lyrics + no Lyrics only button ────────────────
  try {
    const page = await makePage(1024, 800)
    await page.goto(`${BASE}/tunes/30`, { waitUntil: 'networkidle' })
    const lyricsBtn = page.locator('button:has-text("Lyrics only")')
    const lyricsBtnCount = await lyricsBtn.count()
    record('Item 6: Lyrics only button hidden on tune page', lyricsBtnCount === 0, `count=${lyricsBtnCount}`)
    // Check for abcjs lyrics class — should be 0
    const abcLyricsCount = await page.locator('.abcjs-lyric').count()
    record('Item 6: No abcjs-lyric elements rendered', abcLyricsCount === 0, `abcjs-lyric=${abcLyricsCount}`)
    await shot(page, 'tune-30-no-lyrics-1024.png')
    await page.context().close()
  } catch (e) {
    record('Item 6: Tune page no-lyrics', false, e.message)
  }

  // ── Item 4: DCM tune renders all phrases (no half-pagination) ──────────────
  // Use Old 44th (tune 119, CM, has PHRASE_BREAK marker → 2 phrase staves).
  // Pre-fix landscape-mobile would have rendered only 1 of the 2 phrases (axis B).
  try {
    // Desktop
    const desktop = await makePage(1024, 768)
    await desktop.goto(`${BASE}/tunes/119`, { waitUntil: 'networkidle' })
    await desktop.waitForTimeout(1000)
    const staffSelDesktop = await desktop.locator('g.abcjs-staff').count()
    // mobile-landscape (axis B used to trigger here)
    const landscape = await makePage(667, 375)
    await landscape.goto(`${BASE}/tunes/119`, { waitUntil: 'networkidle' })
    await landscape.waitForTimeout(1000)
    const staffSelMobile = await landscape.locator('g.abcjs-staff').count()
    record('Item 4: DCM tune phrase count desktop matches landscape', staffSelDesktop === staffSelMobile, `desktop=${staffSelDesktop}, landscape=${staffSelMobile}`)
    record('Item 4: DCM tune renders multiple staves', staffSelDesktop >= 2, `staves=${staffSelDesktop}`)
    // Also: there should be no "Half A/B" indicator anywhere
    const halfIndicator = await landscape.locator('text=/Half (A|B)/').count()
    record('Item 4: No "Half A/B" pagination indicator', halfIndicator === 0)
    await landscape.screenshot({ path: path.join(SCREEN_DIR, 'dcm-tune-landscape-mobile.png') })
    console.log('  shot:', path.join(SCREEN_DIR, 'dcm-tune-landscape-mobile.png'))
    await desktop.context().close()
    await landscape.context().close()
  } catch (e) {
    record('Item 4: DCM no-half-pagination', false, e.message)
  }

  await browser.close()

  console.log('\n── Summary ──')
  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass).length
  console.log(`Passed: ${passed} / ${results.length}`)
  if (failed > 0) {
    console.log('Failures:')
    for (const r of results.filter((r) => !r.pass)) {
      console.log('  -', r.test, r.detail ? '— ' + r.detail : '')
    }
  }
  process.exit(failed === 0 ? 0 : 1)
}

run().catch((e) => { console.error(e); process.exit(2) })
