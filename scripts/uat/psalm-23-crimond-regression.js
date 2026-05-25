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
      localStorage.setItem('psalter_tour_v1', 'done')
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

  // ── Stage 1b: D-09 CM assertion — staff view contains the last metrical line of stanza 0 ("...waters by").
  const staffBody = (await page.locator('body').textContent()) || ''
  if (!/waters by/i.test(staffBody)) {
    console.error('FAIL (RENDER-07 D-09 CM): Psalm 23 staff view does not contain "waters by" — line 3 is being dropped.')
    process.exit(1)
  }
  if (!/In pas(-)?tures green/i.test(staffBody)) {
    console.error('FAIL (RENDER-07 D-09 CM): Psalm 23 staff view does not contain "In pastures green" — line 2 is being dropped.')
    process.exit(1)
  }
  console.log('PASS — Psalm 23 staff view contains all 4 CM metrical lines')

  // ── Stage 1c (Phase 4.9.7 Plan 03 RENDER-07b): per-row alignment.
  // abcjs renders each w: line's i-th syllable as a single <text> node whose
  // textContent CONCATENATES that syllable across ALL stanzas, in order:
  // "[s1-syl][s2-syl][s3-syl]". The class `abcjs-l0` denotes the first
  // sub-staff w: line. The LAST `abcjs-l0` text node in DOM order is the
  // last syllable of the first metrical line — its text begins with
  // stanza-1's contribution.
  //
  // On the broken Plan-01+02 build, the cross-stanza proportional token
  // split caused stanza-1's last-syllable bucket on the first sub-staff to
  // receive content from a NEIGHBOURING line (e.g. "vale,") instead of
  // "want.". After Plan 03 (one metrical line per sub-staff), the
  // last `abcjs-l0` node's leading text MUST start with "want."
  const lineLayout = await page.evaluate(() => {
    const svg = document.querySelector('.abcjs-container svg')
    if (!svg) return { ok: false, reason: 'no svg' }
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
    const result = {}
    for (const [li, arr] of byLine.entries()) result[li] = arr
    return { ok: true, byLine: result, lineCount: byLine.size }
  })
  if (!lineLayout.ok) {
    console.error('FAIL (RENDER-07b): could not locate abcjs-lyric text nodes')
    process.exit(1)
  }
  // Expect 4 sub-staff lyric lines on Psalm 23 (CM × 4 metrical lines).
  if (lineLayout.lineCount < 4) {
    console.error(`FAIL (RENDER-07b): expected >= 4 abcjs-l* sub-staff lyric lines, got ${lineLayout.lineCount}. byLine=${JSON.stringify(lineLayout.byLine)}`)
    process.exit(1)
  }
  // Sub-staff line 0 = metrical line 0 ("...I'll not want."). Last syllable's
  // text-node textContent starts with stanza-1's "want." Same line MUST NOT
  // start with a token from a different metrical line.
  const line0 = lineLayout.byLine[0] || []
  const last0 = line0[line0.length - 1] || ''
  if (!/^want/i.test(last0)) {
    console.error(`FAIL (RENDER-07b): sub-staff line 0 last syllable does not START with "want" — got: "${last0}". Full line 0: ${JSON.stringify(line0)}`)
    process.exit(1)
  }
  if (/^vale/i.test(last0)) {
    console.error(`FAIL (RENDER-07b): sub-staff line 0 last syllable starts with "vale" — cross-stanza spill present. Got: "${last0}"`)
    process.exit(1)
  }
  // Cross-check: sub-staff line 1 (metrical line 1 "He makes me down to lie")
  // joined textContent must contain stanza-1 line-1 tokens ("makes"/"down")
  // — this asserts line 1 lyrics are present (not dropped or merged with line 0).
  const line1 = lineLayout.byLine[1] || []
  const line1Joined = line1.join(' ')
  if (!/makes/i.test(line1Joined) || !/down/i.test(line1Joined)) {
    console.error(`FAIL (RENDER-07b): sub-staff line 1 missing stanza-1 line-1 tokens. Got: ${JSON.stringify(line1)}`)
    process.exit(1)
  }
  console.log(`PASS — Psalm 23 RENDER-07b cross-stanza alignment: line-0 last="${last0}" (starts "want"); line-1 contains "makes" + "down"`)

  // Fresh alignment screenshot for the human checkpoint.
  await page.screenshot({
    path: path.join(__dirname, 'screenshots', 'psalm-23-alignment-1024.png'),
    fullPage: false,
  })

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

  // ── Stage 5: LM coverage — Psalm 100 + Old 100th. D-09 asserts "rejoice" appears in staff view.
  {
    const page100 = await ctx.newPage()
    // Stage 2 wrote `psalter-score-mode=lyrics` to localStorage; ensure staff view here.
    await page100.addInitScript(() => {
      try {
        localStorage.removeItem('psalter-score-mode')
        localStorage.setItem('psalter-onboarding-completed', 'true')
        localStorage.setItem('psalter-onboarding-dismissed', 'true')
        localStorage.setItem('psalter_tour_v1', 'done')
      } catch {}
    })
    await page100.goto('https://psalter.gsdlabs.dev/psalms/100', { waitUntil: 'networkidle' })
    await page100.waitForSelector('.abcjs-container svg', { timeout: 15_000 })
    await page100.screenshot({
      path: path.join(__dirname, 'screenshots', 'psalm-100-old-100th-staff-1024.png'),
      fullPage: false,
    })
    const body100 = (await page100.locator('body').textContent()) || ''
    if (!/rejoice/i.test(body100)) {
      console.error('FAIL (RENDER-07 D-09 LM): Psalm 100 staff view does not contain "rejoice" — LM line 3 is being dropped.')
      process.exit(1)
    }
    console.log('PASS — Psalm 100 (LM) staff view contains "rejoice"')
    await page100.close()
  }

  // ── Stage 6: DCM coverage — chosen psalm from DB query (see Task 1 Step 1).
  // The substring `DCM_LAST_LINE_SUBSTR` is the last metrical line of the
  // second stanza in the doubleLength cycle. Replace both placeholders with
  // the values from Step 1.
  {
    const DCM_PSALTER = process.env.UAT_DCM_PSALTER /* e.g. '24' */
    const DCM_LAST_LINE_SUBSTR = process.env.UAT_DCM_LAST_LINE /* e.g. 'and He shall come in' */
    if (!DCM_PSALTER || !DCM_LAST_LINE_SUBSTR) {
      console.error('FAIL (RENDER-07 D-09 DCM): UAT_DCM_PSALTER / UAT_DCM_LAST_LINE env vars required.')
      process.exit(1)
    }
    const pageDcm = await ctx.newPage()
    await pageDcm.addInitScript(() => {
      try {
        localStorage.removeItem('psalter-score-mode')
        localStorage.setItem('psalter-onboarding-completed', 'true')
        localStorage.setItem('psalter-onboarding-dismissed', 'true')
        localStorage.setItem('psalter_tour_v1', 'done')
      } catch {}
    })
    await pageDcm.goto(`https://psalter.gsdlabs.dev/psalms/${DCM_PSALTER}`, { waitUntil: 'networkidle' })
    await pageDcm.waitForSelector('.abcjs-container svg', { timeout: 15_000 })
    await pageDcm.screenshot({
      path: path.join(__dirname, 'screenshots', 'psalm-dcm-staff-1024.png'),
      fullPage: false,
    })
    const bodyDcm = (await pageDcm.locator('body').textContent()) || ''
    if (!bodyDcm.toLowerCase().includes(DCM_LAST_LINE_SUBSTR.toLowerCase())) {
      console.error(`FAIL (RENDER-07 D-09 DCM): Psalm ${DCM_PSALTER} staff view does not contain "${DCM_LAST_LINE_SUBSTR}".`)
      process.exit(1)
    }
    console.log(`PASS — Psalm ${DCM_PSALTER} (DCM) staff view contains "${DCM_LAST_LINE_SUBSTR}"`)
    await pageDcm.close()
  }

  console.log('PASS — Psalm 23 + Crimond regression UAT (staff + lyrics views)')
  await browser.close()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
