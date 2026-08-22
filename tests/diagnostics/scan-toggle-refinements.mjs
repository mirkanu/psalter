#!/usr/bin/env node
/**
 * Diagnostic: prove the quick 260822-fgb refinements to the "Original scan"
 * toggle (shipped in quick task 260822-di9):
 *
 *   Part A — GearPopover's "Score: Digital / Original scan" row is now gated
 *            to Split-Leaf layout only (absent in Inline, present in
 *            approved Split-Leaf).
 *   Part B — /tunes/[slug] now has its own Digital / Original scan toggle
 *            group in the control bar, wired to the same setShowOriginal
 *            setter, absent when the scan is already force-shown.
 *
 * Substitutions from the plan's suggested fixtures (recorded here per the
 * plan's own instruction to substitute rather than weaken assertions):
 *   - Part A uses /psalms/43 (tune: Belmont, id 123), NOT /psalms/23.
 *     /psalms/23's primary tune (Crimond) has no melisma-decision row at all
 *     (status is NULL, i.e. not approved), which would make A4 legitimately
 *     assert 0 rather than 1. Belmont is APPROVED and psalm 43's primary
 *     tune, with both abc_notation present and a belmont-staff-0.jpg scan.
 *   - Part B uses /tunes/bangor (abc present + staff scan, one of the
 *     plan's confirmed-good slugs) for the toggle-present case, and
 *     /tunes/rockingham for B6 (Rockingham has NO abc_notation at all but
 *     DOES have rockingham-staff-0.jpg, so its Notation tab force-shows the
 *     scan on load with no live abcjs ever rendering — the toggle must be
 *     absent there).
 *
 * Uses the shared Playwright daemon (http://localhost:3099, see CLAUDE.md) —
 * NEVER spawns raw Chromium. Modelled on tests/diagnostics/original-scan-toggle.mjs
 * (same DAEMON_URL/BASE constants, same getStatus()/runPlaywright() fetch
 * helpers). Each Part below is deliberately packed into ONE daemon job (not
 * several small sequential ones like the di9 diagnostic) because the shared
 * daemon keeps a SINGLE persistent `page` across every HTTP request from
 * EVERY caller on this VPS — during this run a second, unrelated concurrent
 * quick-task executor (260822-fge) was also driving the same daemon/page,
 * and it navigated the shared page away mid-script when steps were split
 * across multiple round trips. Packing each Part's full navigate+act+assert
 * sequence into a single POST closes that race window (the daemon processes
 * one job at a time, uninterrupted, for the duration of that request).
 *
 * Run (from the worktree root, against a dev server started from THIS
 * worktree's code — pm2's `psalter` on :3005 is a production build of
 * master and will NOT contain these changes):
 *   npm run dev -- -p 3105 &
 *   TEST_BASE_URL=http://localhost:3105 node tests/diagnostics/scan-toggle-refinements.mjs
 *   pkill -f "next dev.*3105"
 */

const DAEMON_URL = process.env.PLAYWRIGHT_DAEMON_URL ?? 'http://localhost:3099'
const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3005'

async function getStatus() {
  const res = await fetch(`${DAEMON_URL}/status`)
  return res.json()
}

async function runPlaywright(script) {
  const res = await fetch(`${DAEMON_URL}/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error ?? `Daemon job failed with status ${res.status}`)
  }
  return data.result
}

// Shared selector for the abcjs-rendered notation SVG (see original-scan-toggle.mjs).
const NOTATION_SVG_SEL = '[role="img"][aria-label*="Music notation"] svg'

const steps = []
function record(name, ok, detail) {
  steps.push({ name, ok, detail: detail ?? null })
}

async function main() {
  const { browserReady } = await getStatus()
  if (!browserReady) {
    console.error('FAIL: playwright-daemon browser not ready — retry in a few seconds')
    process.exit(1)
  }

  // ── Part A: GearPopover Split-Leaf gating on /psalms/43 (Belmont, approved) ──
  // One job: navigate, skip tour, confirm SVG, open gear, toggle Inline
  // (assert Score row absent), toggle Split-Leaf (assert Score row present +
  // Digital checked).
  const a = await runPlaywright(`
    await page.addInitScript(() => {
      try { window.localStorage.setItem('psalter_tour_v3', 'done') } catch {}
    })
    await page.goto(${JSON.stringify(BASE + '/psalms/43')}, { waitUntil: 'networkidle' })
    const svgBefore = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).first().count()

    await page.locator('[data-singing-gear]').click()
    await page.waitForSelector('[role="radiogroup"][aria-label="Layout"]', { timeout: 5000 })

    await page.locator('button[aria-label="Inline"]').click()
    await page.waitForTimeout(200)
    const scoreRowCountInline = await page.locator('[data-settings-sub="score-source"]').count()

    let gearState = await page.locator('[data-singing-gear]').getAttribute('data-state')
    if (gearState !== 'open') { await page.locator('[data-singing-gear]').click() }
    await page.waitForSelector('button[aria-label="Split-Leaf"]', { timeout: 5000 })
    await page.locator('button[aria-label="Split-Leaf"]').click()
    await page.waitForSelector('[data-settings-sub="score-source"]', { timeout: 5000 })
    const scoreRowCountSplit = await page.locator('[data-settings-sub="score-source"]').count()
    const digitalChecked = await page.locator('button[aria-label="Digital"]').getAttribute('aria-checked')

    return { svgBefore, scoreRowCountInline, scoreRowCountSplit, digitalChecked }
  `)
  record('A1: initial abcjs SVG present on /psalms/43', a.svgBefore > 0, { svgBefore: a.svgBefore })
  record('A2/A3: Score row ABSENT in Inline layout', a.scoreRowCountInline === 0, { scoreRowCountInline: a.scoreRowCountInline })
  record('A4: Score row PRESENT in approved Split-Leaf layout', a.scoreRowCountSplit === 1, { scoreRowCountSplit: a.scoreRowCountSplit })
  record('A4: Digital radio initially checked', a.digitalChecked === 'true', { digitalChecked: a.digitalChecked })

  // ── Part B: tune-page toggle on /tunes/bangor ──
  // One job: navigate, click Notation tab, confirm SVG, confirm toggle group +
  // buttons, measure gap, click Original scan (assert swap), click Digital
  // (assert swap back).
  const b = await runPlaywright(`
    await page.goto(${JSON.stringify(BASE + '/tunes/bangor')}, { waitUntil: 'networkidle' })
    await page.locator('[role="tab"]', { hasText: 'Notation' }).click()
    await page.waitForSelector(${JSON.stringify(NOTATION_SVG_SEL)}, { timeout: 5000 })
    const svgBefore = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).first().count()
    // The Notation TabsTrigger itself updates the URL with a ?tab=notation
    // query param via a debounced router.replace — settle that FIRST so the
    // "no navigation" assertion below is scoped to the scan toggle's own
    // click, not this pre-existing, unrelated tab-switch side effect.
    await page.waitForFunction(() => location.search.includes('tab=notation'), { timeout: 5000 }).catch(() => {})
    const urlBeforeClick = page.url()

    const toggleCount = await page.locator('[data-tune-scan-toggle]').count()
    const digitalText = await page.locator('[data-tune-scan-toggle] button', { hasText: 'Digital' }).count()
    const scanText = await page.locator('[data-tune-scan-toggle] button', { hasText: 'Original scan' }).count()

    const staffButton = page.locator('button', { hasText: 'Staff' }).first()
    const viewGroupBox = await staffButton.evaluate((el) => {
      const parent = el.closest('div')
      const r = parent.getBoundingClientRect()
      return { left: r.left, right: r.right }
    })
    const toggleBox = await page.locator('[data-tune-scan-toggle]').evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right }
    })
    const gap = toggleBox.left - viewGroupBox.right

    await page.locator('[data-tune-scan-toggle] button', { hasText: 'Original scan' }).click()
    await page.waitForSelector('img[alt^="Original score"]', { timeout: 5000 })
    const imgEl = page.locator('img[alt^="Original score"]').first()
    const imgVisible = await imgEl.isVisible()
    const imgSrc = await imgEl.getAttribute('src')
    const svgAfterSwap = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).count()
    const scanPressed = await page.locator('[data-tune-scan-toggle] button', { hasText: 'Original scan' }).getAttribute('aria-pressed')
    const urlAfterSwap = page.url()

    await page.locator('[data-tune-scan-toggle] button', { hasText: 'Digital' }).click()
    await page.waitForSelector(${JSON.stringify(NOTATION_SVG_SEL)}, { timeout: 5000 })
    const svgAfterBack = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).count()
    const imgAfterBack = await page.locator('img[alt^="Original score"]').count()

    return {
      svgBefore, urlBeforeClick, toggleCount, digitalText, scanText, gap,
      imgVisible, imgSrc, svgAfterSwap, scanPressed, urlAfterSwap,
      svgAfterBack, imgAfterBack,
    }
  `)
  record('B1: abcjs SVG renders on /tunes/bangor Notation tab', b.svgBefore > 0, { svgBefore: b.svgBefore })
  record('B2: data-tune-scan-toggle present', b.toggleCount === 1, { toggleCount: b.toggleCount })
  record('B2: "Digital" button present', b.digitalText === 1, { digitalText: b.digitalText })
  record('B2: "Original scan" button present', b.scanText === 1, { scanText: b.scanText })
  record('B3: horizontal gap between viewGroup and scan toggle >= 8px', b.gap >= 8, { measuredGapPx: b.gap })
  record('B4: Original scan image visible after click', b.imgVisible)
  record('B4: image src matches /tunes/*-staff-N.jpg', /\/tunes\/.*-staff-\d+\.jpg/.test(b.imgSrc ?? ''), { imgSrc: b.imgSrc })
  record('B4: abcjs SVG gone after swap', b.svgAfterSwap === 0, { svgAfterSwap: b.svgAfterSwap })
  record('B4: "Original scan" button aria-pressed=true', b.scanPressed === 'true', { scanPressed: b.scanPressed })
  record('B4: URL unchanged (no navigation)', b.urlAfterSwap === b.urlBeforeClick, { urlBeforeClick: b.urlBeforeClick, urlAfterSwap: b.urlAfterSwap })
  record('B5: abcjs SVG returns after Digital click', b.svgAfterBack > 0, { svgAfterBack: b.svgAfterBack })
  record('B5: scan image gone after Digital click', b.imgAfterBack === 0, { imgAfterBack: b.imgAfterBack })

  // B6: /tunes/rockingham — no abc at all, scan already force-shown on load. Toggle absent.
  // NOTE: this force-shown path goes through NotationRenderer's OWN
  // renderScannedPages() (forceStaffJpgFallback branch), not through
  // AbcPlayer's showOriginal branch used elsewhere in this script — its img
  // alt is "Staff notation for {tuneName}", not AbcPlayer's "Original score
  // for {tuneName}".
  const b6 = await runPlaywright(`
    await page.goto(${JSON.stringify(BASE + '/tunes/rockingham')}, { waitUntil: 'networkidle' })
    await page.locator('[role="tab"]', { hasText: 'Notation' }).click()
    await page.waitForSelector('img[alt^="Staff notation for"]', { timeout: 5000 })
    const svgCount = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).count()
    const toggleCount = await page.locator('[data-tune-scan-toggle]').count()
    return { svgCount, toggleCount }
  `)
  record('B6: no abcjs SVG ever renders for Rockingham (force-shown scan)', b6.svgCount === 0, { svgCount: b6.svgCount })
  record('B6: data-tune-scan-toggle ABSENT when scan already force-shown', b6.toggleCount === 0, { toggleCount: b6.toggleCount })

  let allPassed = true
  for (const step of steps) {
    const status = step.ok ? 'PASS' : 'FAIL'
    if (!step.ok) allPassed = false
    console.log(`${status}: ${step.name}${step.detail ? ' ' + JSON.stringify(step.detail) : ''}`)
  }

  if (!allPassed) {
    console.error('FAIL: one or more steps failed')
    process.exit(1)
  }
  console.log('PASS: all steps passed')
}

main().catch((err) => {
  console.error('FAIL: unexpected error:', err)
  for (const step of steps) {
    const status = step.ok ? 'PASS' : 'FAIL'
    console.log(`${status}: ${step.name}${step.detail ? ' ' + JSON.stringify(step.detail) : ''}`)
  }
  process.exit(1)
})
