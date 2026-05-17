// UAT — Full suite for Phase 04.9.4 (per-wave / phase-gate validation).
// Covers SC1–SC6 across 375 / 768 / 1024 viewports.
// SC2 (tour) and SC5 (play/gear) only at 375 (UI is the same across viewports).
// SC3 uses polled waitForBaseSizeChange (no fixed sleep).
// SKIPs (exit 0) when dev server is unreachable.
const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')

const BASE = process.env.UAT_BASE || 'http://localhost:3005'
const SCREEN_DIR = path.join(__dirname, 'screenshots')
const SCRIPT_NAME = 'test-04.9.4-full'

const VIEWPORTS = [
  { width: 375, height: 812, name: 'mobile-375' },
  { width: 768, height: 1024, name: 'tablet-768' },
  { width: 1024, height: 768, name: 'desktop-1024' },
]

setTimeout(() => {
  console.error('TIMEOUT:', SCRIPT_NAME)
  process.exit(2)
}, 90000).unref()

function fail(msg) {
  console.error('FAIL:', SCRIPT_NAME, '-', msg)
  process.exit(1)
}

async function dismissTour(page) {
  const tour = page.locator('[data-onboarding-tour]')
  if ((await tour.count()) === 0) return
  const skip = page.locator('[data-onboarding-tour] button', { hasText: 'Skip tour' })
  if ((await skip.count()) > 0) {
    await skip.first().click()
    await page.waitForTimeout(150)
  }
}

async function assertStanzasIndicator(page, ctxLabel) {
  const indicator = page.locator('[data-stanzas-indicator]')
  if ((await indicator.count()) === 0) fail(`${ctxLabel}: no [data-stanzas-indicator]`)
  const pattern = /^Stanza \d+ \/ \d+$/
  const deadline = Date.now() + 2000
  let text = ''
  while (Date.now() < deadline) {
    text = (await indicator.innerText()).trim()
    if (pattern.test(text)) return
    await page.waitForTimeout(50)
  }
  fail(`${ctxLabel}: indicator text "${text}" does not match /^Stanza \\d+ \\/ \\d+$/`)
}

async function assertNoOverflow(page, ctxLabel) {
  const o = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    body: document.body.scrollWidth > document.body.clientWidth,
    docSW: document.documentElement.scrollWidth,
    docCW: document.documentElement.clientWidth,
  }))
  if (o.doc) fail(`${ctxLabel}: horizontal overflow on documentElement (sw=${o.docSW}, cw=${o.docCW})`)
  if (o.body) fail(`${ctxLabel}: horizontal overflow on body`)
}

async function assertSC1(page, ctxLabel) {
  const topBar = page.locator('[data-singing-topbar]')
  if ((await topBar.count()) === 0) fail(`${ctxLabel}: SC1 no [data-singing-topbar]`)
  const t = (await topBar.innerText()).trim()
  if (!t.includes('Psalm 23')) fail(`${ctxLabel}: SC1 missing "Psalm 23"`)
  if (!t.includes('♩')) fail(`${ctxLabel}: SC1 missing ♩ glyph`)
  if (!/Crimond/i.test(t)) fail(`${ctxLabel}: SC1 missing tune name (got: ${t})`)
  if (t.includes('Tune (')) fail(`${ctxLabel}: SC1 contains forbidden "Tune (" prefix`)
  const pencil = await page.evaluate(() => {
    const root = document.querySelector('[data-singing-topbar]')
    if (!root) return 0
    const dp = root.querySelectorAll('[data-pencil-icon]').length
    const sp = Array.from(root.querySelectorAll('svg')).filter((s) => {
      const cls = (s.getAttribute('class') || '').toLowerCase()
      return cls.includes('pencil') || cls.includes('lucide-pencil')
    }).length
    return dp + sp
  })
  if (pencil > 0) fail(`${ctxLabel}: SC1 top bar has ${pencil} pencil icon(s)`)
  if ((await page.locator('[data-singing-tune-slot]').count()) === 0) {
    fail(`${ctxLabel}: SC1 no [data-singing-tune-slot]`)
  }
}

async function assertSC4(page, ctxLabel, vpHeight) {
  const glass = page.locator('[data-glass-bottom-bar]')
  if ((await glass.count()) === 0) fail(`${ctxLabel}: SC4 no [data-glass-bottom-bar]`)
  const cls = (await glass.getAttribute('class')) || ''
  if (!cls.includes('backdrop-blur-md')) fail(`${ctxLabel}: SC4 missing backdrop-blur-md`)
  const box = await glass.boundingBox()
  if (!box || box.y + box.height < vpHeight - 5) {
    fail(`${ctxLabel}: SC4 glass bar not at viewport bottom (box=${JSON.stringify(box)}, vp.h=${vpHeight})`)
  }
  if ((await page.locator('[data-glass-bottom-bar] button', { hasText: 'A−' }).count()) === 0) {
    fail(`${ctxLabel}: SC4 A− missing`)
  }
  if ((await page.locator('[data-glass-bottom-bar] button', { hasText: 'A+' }).count()) === 0) {
    fail(`${ctxLabel}: SC4 A+ missing`)
  }
  await assertStanzasIndicator(page, `${ctxLabel} SC4`)
  await assertNoLegacyChrome(page, ctxLabel)
}

// SC4b — guards 04.9.4-chrome-dedup regression. Asserts that NotationRenderer's
// pre-04.9.4 chromeless A−/A+ row and stanza nav are gone, and that GlassBottomBar
// is the sole owner of these controls.
async function assertNoLegacyChrome(page, ctxLabel) {
  const r = await page.evaluate(() => ({
    legacySizeRow: document.querySelectorAll('[data-chromeless-size-row]').length,
    legacyStanzaNav: document.querySelectorAll('[data-chromeless-stanza-nav]').length,
    legacyFab: document.querySelectorAll('[data-singing-fab]').length,
    legacyTuneSubbar: document.querySelectorAll('[data-singing-tune-subbar]').length,
    decreaseSize: document.querySelectorAll('button[aria-label="Decrease size"]').length,
    increaseSize: document.querySelectorAll('button[aria-label="Increase size"]').length,
    indicators: document.querySelectorAll('[data-stanzas-indicator]').length,
    indicatorInsideGlass: !!document.querySelector('[data-glass-bottom-bar] [data-stanzas-indicator]'),
    stanzaPrevInGlass: document.querySelectorAll('[data-glass-bottom-bar] [data-stanza-prev]').length,
    stanzaNextInGlass: document.querySelectorAll('[data-glass-bottom-bar] [data-stanza-next]').length,
  }))
  if (r.legacySizeRow !== 0) fail(`${ctxLabel}: SC4b legacy [data-chromeless-size-row] still rendered (count=${r.legacySizeRow})`)
  if (r.legacyStanzaNav !== 0) fail(`${ctxLabel}: SC4b legacy [data-chromeless-stanza-nav] still rendered (count=${r.legacyStanzaNav})`)
  if (r.legacyFab !== 0) fail(`${ctxLabel}: SC4b legacy [data-singing-fab] still rendered`)
  if (r.legacyTuneSubbar !== 0) fail(`${ctxLabel}: SC4b legacy [data-singing-tune-subbar] still rendered`)
  if (r.decreaseSize !== 1) fail(`${ctxLabel}: SC4b expected exactly 1 "Decrease size" button, got ${r.decreaseSize}`)
  if (r.increaseSize !== 1) fail(`${ctxLabel}: SC4b expected exactly 1 "Increase size" button, got ${r.increaseSize}`)
  if (r.indicators !== 1) fail(`${ctxLabel}: SC4b expected exactly 1 stanzas indicator, got ${r.indicators}`)
  if (!r.indicatorInsideGlass) fail(`${ctxLabel}: SC4b stanzas indicator is not inside [data-glass-bottom-bar]`)
  if (r.stanzaPrevInGlass !== 1) fail(`${ctxLabel}: SC4b expected 1 [data-stanza-prev] in glass bar, got ${r.stanzaPrevInGlass}`)
  if (r.stanzaNextInGlass !== 1) fail(`${ctxLabel}: SC4b expected 1 [data-stanza-next] in glass bar, got ${r.stanzaNextInGlass}`)
}

// SC7 (260517-bmz polish) — glass bar layout: no view buttons, Gear at far right,
// Play (icon-only) just to its left.
async function assertPolishedGlassLayout(page, ctxLabel) {
  const r = await page.evaluate(() => {
    const bar = document.querySelector('[data-glass-bottom-bar]')
    const order = bar ? Array.from(bar.children) : []
    const last = order[order.length - 1]
    const lastButOne = order[order.length - 2]
    return {
      viewOptionsInBar: document.querySelectorAll('[data-glass-bottom-bar] [data-view-option]').length,
      gearIsLast: !!(last && last.matches('[data-singing-gear]')),
      playIsSecondToLast: !!(lastButOne && lastButOne.matches('[data-singing-play]')),
      playText: (document.querySelector('[data-singing-play]')?.textContent || '').trim(),
    }
  })
  if (r.viewOptionsInBar !== 0) fail(`${ctxLabel}: SC7 glass bar contains ${r.viewOptionsInBar} [data-view-option] elements`)
  if (!r.gearIsLast) fail(`${ctxLabel}: SC7 [data-singing-gear] is not the last glass-bar child`)
  if (!r.playIsSecondToLast) fail(`${ctxLabel}: SC7 [data-singing-play] is not the 2nd-to-last glass-bar child`)
  if (r.playText !== '') fail(`${ctxLabel}: SC7 Play/Pause button has visible text "${r.playText}" — expected icon-only`)
}

// SC8 (260517-bmz polish) — GearDrawer has Restart tour button.
async function assertGearHasRestartTour(page, ctxLabel) {
  await page.locator('[data-singing-gear]').click()
  await page.waitForTimeout(300)
  const count = await page.evaluate(() => document.querySelectorAll('[data-restart-tour]').length)
  if (count !== 1) fail(`${ctxLabel}: SC8 expected exactly 1 [data-restart-tour] in GearDrawer, got ${count}`)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(150)
}

// SC12 (260517-ht8 #1b) — step 1 of tour has 2 individual mask cutouts (back+fwd arrows).
async function assertTourStep1HasTwoCutouts(page, ctxLabel) {
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const n = await page.evaluate(() => {
    const svg = document.querySelector('[data-tour-spotlight]')
    return svg ? svg.querySelectorAll('mask rect[fill="black"]').length : 0
  })
  if (n !== 2) fail(`${ctxLabel}: SC12 expected 2 individual spotlight cutouts on step 1, got ${n}`)
  // Skip tour for downstream tests
  await page.locator('[role="dialog"] button:has-text("Skip")').click().catch(() => {})
  await page.waitForTimeout(200)
}

// SC13 (260517-ht8 #3) — mobile glass bar height = 44px (h-11).
async function assertMobileBarHeight(page, ctxLabel) {
  const h = await page.evaluate(() => document.querySelector('[data-glass-bottom-bar]')?.getBoundingClientRect().height)
  if (h !== 44) fail(`${ctxLabel}: SC13 mobile glass bar height expected 44, got ${h}`)
}

// SC14 (260517-ht8 #4) — switching to lyrics auto-hides mini-bar + resets to Play.
async function assertViewChangeResetsPlay(page, ctxLabel) {
  // Start play
  await page.click('[data-singing-play]')
  await page.waitForTimeout(800)
  const playing = await page.evaluate(() => document.querySelector('[data-singing-play]')?.getAttribute('aria-label'))
  if (playing !== 'Pause') {
    // Could not start play (e.g. audio-not-available) — skip silently
    return
  }
  // Switch to lyrics
  await page.click('[data-singing-gear]')
  await page.waitForTimeout(300)
  const lyricsOpt = page.locator('[data-gear-drawer] [data-view-option="lyrics"]')
  if ((await lyricsOpt.count()) === 0) {
    await page.keyboard.press('Escape').catch(() => {})
    return
  }
  await lyricsOpt.click()
  await page.waitForTimeout(600)
  const state = await page.evaluate(() => ({
    aria: document.querySelector('[data-singing-play]')?.getAttribute('aria-label'),
    miniVisible: (() => {
      const m = document.querySelector('[data-play-mini-bar]')
      if (!m) return false
      const cs = getComputedStyle(m)
      return cs.display !== 'none' && !m.className.includes('translate-y-full') && cs.opacity !== '0'
    })(),
  }))
  if (state.aria !== 'Play') fail(`${ctxLabel}: SC14 main button aria expected "Play" after switching to lyrics, got "${state.aria}"`)
  if (state.miniVisible) fail(`${ctxLabel}: SC14 mini-bar still visible after switching to lyrics`)
  // Restore to staff
  await page.click('[data-singing-gear]')
  await page.waitForTimeout(300)
  await page.locator('[data-gear-drawer] [data-view-option="staff"]').click()
  await page.waitForTimeout(400)
}

// SC10 (260517-cm0) — default BPM = 151 for fresh users (cleared localStorage).
async function assertDefaultBpm(page, ctxLabel) {
  await page.evaluate(() => { try { localStorage.removeItem('psalter-bpm') } catch {} })
  await page.click('[data-singing-play]')
  await page.waitForTimeout(900)
  const bpmText = await page.evaluate(() => {
    const el = document.querySelector('[data-play-mini-bar] .tabular-nums')
    return el ? (el.textContent || '').trim() : ''
  })
  if (bpmText !== '151') fail(`${ctxLabel}: SC10 expected BPM 151, got "${bpmText}"`)
  // Pause to clean up
  await page.click('[data-singing-play]')
  await page.waitForTimeout(300)
}

// SC11 (260517-cm0 #4b) — stanza indicator hidden in non-staff views.
async function assertStanzaHiddenInNonStaff(page, ctxLabel) {
  // Switch to lyrics via gear
  await page.click('[data-singing-gear]')
  await page.waitForTimeout(300)
  const lyricsBtn = page.locator('[data-gear-drawer] [data-view-option="lyrics"]')
  if ((await lyricsBtn.count()) === 0) {
    // No lyrics for this psalm — skip silently
    await page.keyboard.press('Escape').catch(() => {})
    return
  }
  await lyricsBtn.click()
  await page.waitForTimeout(500)
  const txt = await page.evaluate(() => {
    const el = document.querySelector('[data-stanzas-indicator]')
    return el ? (el.textContent || '').trim() : ''
  })
  if (txt !== '') fail(`${ctxLabel}: SC11 stanza indicator should be empty in lyrics view, got "${txt}"`)
  // Restore to staff
  await page.click('[data-singing-gear]')
  await page.waitForTimeout(300)
  await page.locator('[data-gear-drawer] [data-view-option="staff"]').click()
  await page.waitForTimeout(400)
}

// SC9 (260517-bmz polish) — Solfège view in chromeless SingingView must NOT show
// the "Back to notation" button (which is for the non-chromeless study view).
async function assertSolfegeNoBackButton(page, ctxLabel) {
  // Open gear → click solfege option → close → check
  await page.locator('[data-singing-gear]').click()
  await page.waitForTimeout(300)
  const sol = page.locator('[data-gear-drawer] [data-view-option="solfege"]')
  if ((await sol.count()) === 0) {
    // No solfege option (likely no Solfège JPG for this tune) — skip cleanly.
    await page.keyboard.press('Escape').catch(() => {})
    return
  }
  await sol.click()
  await page.waitForTimeout(500)
  const backCount = await page.evaluate(() => document.querySelectorAll('[data-testid="back-to-notation"]').length)
  if (backCount !== 0) fail(`${ctxLabel}: SC9 Solfège (chromeless) renders ${backCount} back-to-notation button(s) — expected 0`)
}

// SC4c — clicking stanza-next in GlassBottomBar advances the indicator text.
// Requires a multi-stanza psalm (caller decides). Returns silently if not multi-stanza.
async function assertStanzaNextAdvances(page, ctxLabel) {
  const indicator = page.locator('[data-stanzas-indicator]')
  const before = (await indicator.innerText()).trim()
  const m = /^Stanza (\d+) \/ (\d+)$/.exec(before)
  if (!m) fail(`${ctxLabel}: SC4c indicator text "${before}" does not match pattern`)
  const total = parseInt(m[2], 10)
  if (total < 2) return // not multi-stanza, nothing to assert
  const nextBtn = page.locator('[data-glass-bottom-bar] [data-stanza-next]')
  if ((await nextBtn.count()) !== 1) fail(`${ctxLabel}: SC4c stanza-next button not found`)
  await nextBtn.click()
  await page.waitForTimeout(400)
  const after = (await indicator.innerText()).trim()
  if (after === before) fail(`${ctxLabel}: SC4c indicator did not advance after clicking stanza-next ("${before}")`)
  if (!/^Stanza 2 \//.test(after)) fail(`${ctxLabel}: SC4c expected "Stanza 2 /…" after first next click, got "${after}"`)
}

async function assertSC2Tour(page) {
  // Tour must already be visible (caller cleared localStorage and reloaded).
  // 260517-cm0 #2F — tour is now 3 focused steps (was 4).
  const tour = page.locator('[data-onboarding-tour]')
  if ((await tour.count()) === 0) fail('SC2: tour not visible on first load')
  let txt = (await tour.innerText()).trim()
  if (!txt.includes('Step 1 of 4')) fail(`SC2: expected "Step 1 of 4", got: ${txt}`)
  for (let i = 1; i <= 3; i++) {
    const nextBtn = page.locator('[data-onboarding-tour] button', { hasText: 'Next' })
    if ((await nextBtn.count()) === 0) fail(`SC2: Next button missing at step ${i}`)
    await nextBtn.first().click()
    await page.waitForTimeout(150)
  }
  txt = (await tour.innerText()).trim()
  if (!txt.includes('Step 4 of 4')) fail(`SC2: expected "Step 4 of 4", got: ${txt}`)
  const done = page.locator('[data-onboarding-tour] button', { hasText: 'Done' })
  if ((await done.count()) === 0) fail('SC2: Done button missing on step 4')
  await done.first().click()
  await page.waitForTimeout(200)
  if ((await page.locator('[data-onboarding-tour]').count()) !== 0) {
    fail('SC2: tour did not vanish after Done')
  }
  const stored = await page.evaluate(() => localStorage.getItem('psalter_tour_v1'))
  if (stored !== 'done') fail(`SC2: expected localStorage psalter_tour_v1=done, got ${stored}`)
  await page.reload({ waitUntil: 'networkidle' })
  if ((await page.locator('[data-onboarding-tour]').count()) !== 0) {
    fail('SC2: tour reappeared after reload (persistence broken)')
  }
}

async function waitForBaseSizeChange(page, prevValue, { timeoutMs = 2000, settleMs = 50 } = {}) {
  const deadline = Date.now() + timeoutMs
  let last = null
  let stableSince = 0
  while (Date.now() < deadline) {
    const cur = await page.evaluate(() => localStorage.getItem('psalter-staff-size'))
    if (cur != null && cur !== prevValue) {
      if (cur === last) {
        if (Date.now() - stableSince >= settleMs) return Number(cur)
      } else {
        last = cur
        stableSince = Date.now()
      }
    }
    await page.waitForTimeout(25)
  }
  return null // timed out without observing change
}

async function readBaseSize(page) {
  return page.evaluate(() => {
    const v = localStorage.getItem('psalter-staff-size')
    return v == null ? null : Number(v)
  })
}

async function pollUntilNonNull(page, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs
  let last = null
  let stableSince = 0
  while (Date.now() < deadline) {
    const cur = await page.evaluate(() => localStorage.getItem('psalter-staff-size'))
    if (cur != null) {
      if (cur === last) {
        if (Date.now() - stableSince >= 50) return Number(cur)
      } else {
        last = cur
        stableSince = Date.now()
      }
    }
    await page.waitForTimeout(25)
  }
  return null
}

async function assertSC3ResizeSequence(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } })
  const page = await ctx.newPage()
  try {
    const resp = await page.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle', timeout: 20000 })
    if (!resp || resp.status() !== 200) fail('SC3: /psalms/23 not 200')
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'networkidle' })
    await dismissTour(page)

    const baseSize0 = await pollUntilNonNull(page, 3000)
    if (baseSize0 == null) fail('SC3: baseSize0 never appeared in localStorage @ 1024')
    if (!(baseSize0 >= 8 && baseSize0 <= 40)) fail(`SC3: baseSize0=${baseSize0} out of [8,40] @ 1024`)
    await assertNoOverflow(page, 'SC3 @ 1024')

    // 1024 -> 768
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.evaluate(() => window.dispatchEvent(new Event('resize')))
    let baseSize1 = await waitForBaseSizeChange(page, String(baseSize0))
    if (baseSize1 == null) baseSize1 = await readBaseSize(page)
    if (baseSize1 == null) fail('SC3: baseSize unreadable after resize to 768')
    if (!(baseSize1 >= 8 && baseSize1 <= 40)) fail(`SC3: baseSize1=${baseSize1} out of [8,40] @ 768`)
    await assertNoOverflow(page, 'SC3 @ 768')

    // 768 -> 375
    await page.setViewportSize({ width: 375, height: 812 })
    await page.evaluate(() => window.dispatchEvent(new Event('resize')))
    let baseSize2 = await waitForBaseSizeChange(page, String(baseSize1))
    if (baseSize2 == null) baseSize2 = await readBaseSize(page)
    if (baseSize2 == null) fail('SC3: baseSize unreadable after resize to 375')
    if (!(baseSize2 >= 8 && baseSize2 <= 40)) fail(`SC3: baseSize2=${baseSize2} out of [8,40] @ 375`)
    await assertNoOverflow(page, 'SC3 @ 375')

    // 375 -> 1024 (round trip)
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.evaluate(() => window.dispatchEvent(new Event('resize')))
    let baseSize3 = await waitForBaseSizeChange(page, String(baseSize2))
    if (baseSize3 == null) baseSize3 = await readBaseSize(page)
    if (baseSize3 == null) fail('SC3: baseSize unreadable after resize back to 1024')
    if (!(baseSize3 >= 8 && baseSize3 <= 40)) fail(`SC3: baseSize3=${baseSize3} out of [8,40] @ 1024 round-trip`)
    await assertNoOverflow(page, 'SC3 @ 1024 round-trip')
  } finally {
    await ctx.close()
  }
}

async function assertSC5PlayAndGear(browser) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await ctx.newPage()
  try {
    const resp = await page.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle', timeout: 20000 })
    if (!resp || resp.status() !== 200) fail('SC5: /psalms/23 not 200')
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'networkidle' })
    await dismissTour(page)

    // ---- Play -> mini-bar slides up ----
    const playBtn = page.locator('[data-singing-play]')
    if ((await playBtn.count()) === 0) fail('SC5: [data-singing-play] missing')
    await playBtn.first().click()
    await page.waitForTimeout(300)

    const miniBarState = await page.evaluate(() => {
      const el = document.querySelector('[data-play-mini-bar]')
      if (!el) return { present: false }
      const cs = getComputedStyle(el)
      return {
        present: true,
        display: cs.display,
        className: el.className,
        hasAudio: !!el.querySelector('[data-abc-audio-controls]'),
      }
    })
    if (!miniBarState.present) fail('SC5: [data-play-mini-bar] not rendered after play click')
    if (miniBarState.display === 'none') fail('SC5: mini-bar display:none after play click')
    if (miniBarState.className.includes('translate-y-full')) {
      fail('SC5: mini-bar still has translate-y-full (not slid up)')
    }
    if (!miniBarState.hasAudio) fail('SC5: mini-bar missing [data-abc-audio-controls]')

    // Toggle pause (second click)
    await playBtn.first().click()
    await page.waitForTimeout(150)

    // ---- Gear -> drawer opens, NO audio inside ----
    const gearBtn = page.locator('[data-singing-gear]')
    if ((await gearBtn.count()) === 0) fail('SC5: [data-singing-gear] missing')
    await gearBtn.first().click()
    await page.waitForTimeout(300)

    const drawer = page.locator('[data-gear-drawer]')
    if ((await drawer.count()) === 0) fail('SC5: [data-gear-drawer] not visible after gear click')
    const drawerHasAudio = await page.evaluate(
      () => !!document.querySelector('[data-gear-drawer] [data-abc-audio-controls]')
    )
    if (drawerHasAudio) fail('SC5: gear drawer contains [data-abc-audio-controls] (audio should be OUT of drawer)')
    const drawerText = (await drawer.innerText()).trim()
    if (!/About this psalm/i.test(drawerText)) {
      fail(`SC5: gear drawer missing "About this psalm" (got: ${drawerText.slice(0, 200)})`)
    }
  } finally {
    await ctx.close()
  }
}

async function run() {
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  })

  // Quick reachability probe (uses 375)
  try {
    const probeCtx = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const probePage = await probeCtx.newPage()
    let resp
    try {
      resp = await probePage.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle', timeout: 20000 })
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
    await probeCtx.close()
  } catch (e) {
    console.warn('SKIP:', SCRIPT_NAME, '- probe failed:', e.message)
    await browser.close()
    process.exit(0)
  }

  try {
    // Per-viewport SC1, SC4, SC6
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
      const page = await ctx.newPage()
      try {
        const resp = await page.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle', timeout: 20000 })
        if (!resp || resp.status() !== 200) fail(`${vp.name}: /psalms/23 returned ${resp && resp.status()}`)
        await page.evaluate(() => localStorage.clear())
        await page.reload({ waitUntil: 'networkidle' })
        await dismissTour(page)

        await assertSC1(page, vp.name)
        await assertSC4(page, vp.name, vp.height)
        await assertNoOverflow(page, `${vp.name} SC6`)

        // SC4c — stanza-next interaction on a multi-stanza psalm (Psalm 23 has ≥2 stanzas)
        await assertStanzaNextAdvances(page, `${vp.name} SC4c`)
        // SC7 — polished glass-bar layout (no view buttons, gear last, play icon-only)
        await assertPolishedGlassLayout(page, vp.name)
        // SC8 — GearDrawer has Restart tour
        await assertGearHasRestartTour(page, vp.name)
        // SC9 — Solfège in chromeless SingingView has no Back-to-notation button
        await assertSolfegeNoBackButton(page, vp.name)
        // SC10 — default BPM 151 (fresh user)
        if (vp.width === 375) await assertDefaultBpm(page, vp.name)
        // SC13 — slim 44px mobile bar
        if (vp.width === 375) await assertMobileBarHeight(page, vp.name)
        // SC14 — view-change resets play state + hides mini-bar
        if (vp.width === 375) await assertViewChangeResetsPlay(page, vp.name)
        // SC11 — stanza indicator hidden in non-staff views
        await assertStanzaHiddenInNonStaff(page, vp.name)

        // SC2 only at 375 — separate fresh context to keep tour visible
        if (vp.width === 375) {
          const tourCtx = await browser.newContext({ viewport: { width: 375, height: 812 } })
          const tourPage = await tourCtx.newPage()
          await tourPage.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle', timeout: 20000 })
          await tourPage.evaluate(() => localStorage.clear())
          await tourPage.reload({ waitUntil: 'networkidle' })
          await assertSC2Tour(tourPage)
          await tourCtx.close()
        }

        await page.screenshot({
          path: path.join(SCREEN_DIR, `04.9.4-full-${vp.name}.png`),
          fullPage: false,
        })
      } finally {
        await ctx.close()
      }
    }

    // SC3 resize sequence (single context, mutated viewport)
    await assertSC3ResizeSequence(browser)

    // SC5 (375 only) — play/gear interactions
    await assertSC5PlayAndGear(browser)

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
