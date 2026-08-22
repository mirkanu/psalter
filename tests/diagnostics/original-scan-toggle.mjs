#!/usr/bin/env node
/**
 * Diagnostic: prove the new "Score: Digital / Original scan" gear popover row
 * (quick task 260822-di9) swaps the live abcjs staff for the scanned JPG and
 * back, with no page navigation.
 *
 * Uses the shared Playwright daemon (http://localhost:3099, see CLAUDE.md) —
 * NEVER spawns raw Chromium. The daemon's client.js is currently an empty
 * stub in this environment, so this script talks to the daemon's documented
 * HTTP contract (POST /job { script }, GET /status) directly via fetch,
 * rather than depending on the broken require().
 *
 * The daemon enforces a 30s-per-job timeout and keeps a single persistent
 * `page` across HTTP requests (server.js module scope), so this script is
 * split into several smaller sequential jobs — mirroring the existing
 * split-leaf-staff-diff.mjs diagnostic's pattern — rather than one long job.
 *
 * Run:
 *   node tests/diagnostics/original-scan-toggle.mjs
 *   TEST_BASE_URL=https://psalter.gsdlabs.dev node tests/diagnostics/original-scan-toggle.mjs
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

// Shared selector for the abcjs-rendered notation SVG. AbcPlayer.tsx's
// containerRef div carries role="img" aria-label="Music notation..." — this
// is specific enough to exclude the lucide-react icon <svg>s scattered
// throughout the page chrome (gear/settings/nav icons), which a bare `svg`
// or `main svg` selector would incorrectly also match.
const NOTATION_SVG_SEL = '[role="img"][aria-label*="Music notation"] svg'

// GearPopover's Score-row buttons (Digital/Original scan) don't close the
// popover on click — only Study/Restart tour explicitly call onOpenChange(false).
// So the popover can already be open going into a later step (e.g. clicking
// "Original scan" leaves it open). Blindly clicking the trigger again would
// then CLOSE it instead of opening it, hanging any subsequent waitForSelector.
// This snippet checks data-state first and only clicks when actually closed.
const ENSURE_GEAR_OPEN = `
  const gearState = await page.locator('[data-singing-gear]').getAttribute('data-state')
  if (gearState !== 'open') {
    await page.locator('[data-singing-gear]').click()
  }
  await page.waitForSelector('[data-settings-sub="score-source"]', { timeout: 5000 })
`

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

  // Job 1: navigate + confirm live digital staff is initially rendering.
  // Skips the first-run onboarding tour overlay ([data-onboarding-tour], a
  // fixed inset-0 pointer-events-auto layer) — on a fresh browser profile it
  // intercepts every click, including the gear button, hanging subsequent jobs.
  const r1 = await runPlaywright(`
    await page.addInitScript(() => {
      try { window.localStorage.setItem('psalter_tour_v3', 'done') } catch {}
    })
    await page.goto(${JSON.stringify(BASE + '/psalms/23')}, { waitUntil: 'networkidle' })
    const svgBefore = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).first().count()
    return { svgBefore, url: page.url() }
  `)
  record('initial abcjs SVG present', r1.svgBefore > 0, { svgBefore: r1.svgBefore })
  const urlBeforeClick = r1.url

  // Job 2: open the gear popover, confirm the Score row, confirm Digital
  // starts checked, then click "Original scan" and confirm the swap.
  const r2 = await runPlaywright(`
    ${ENSURE_GEAR_OPEN}
    const digitalChecked = await page.locator('button[aria-label="Digital"]').getAttribute('aria-checked')

    await page.locator('button[aria-label="Original scan"]').click()
    await page.waitForSelector('img[alt^="Original score"]', { timeout: 5000 })
    const imgVisible = await page.locator('img[alt^="Original score"]').first().isVisible()
    const backVisible = await page.locator('[data-testid="back-to-notation"]').first().isVisible()
    const svgAfterSwap = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).count()

    return { digitalChecked, imgVisible, backVisible, svgAfterSwap, url: page.url() }
  `)
  record('gear opened, Score row visible', true)
  record('Digital radio initially checked', r2.digitalChecked === 'true', { digitalChecked: r2.digitalChecked })
  record('Original scan image visible after click', r2.imgVisible)
  record('Back-to-notation button visible', r2.backVisible)
  record('abcjs svg gone after swap', r2.svgAfterSwap === 0, { svgAfterSwap: r2.svgAfterSwap })
  record('URL unchanged (no navigation)', r2.url === urlBeforeClick, { urlBeforeClick, urlAfterClick: r2.url })

  // Job 3: click "Back to notation" — svg returns, scan image gone.
  const r3 = await runPlaywright(`
    await page.locator('[data-testid="back-to-notation"]').click()
    await page.waitForSelector(${JSON.stringify(NOTATION_SVG_SEL)}, { timeout: 5000 })
    const svgAfterBack = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).count()
    const imgAfterBack = await page.locator('img[alt^="Original score"]').count()
    return { svgAfterBack, imgAfterBack }
  `)
  record('svg returns after Back-to-notation click', r3.svgAfterBack > 0, { svgAfterBack: r3.svgAfterBack })
  record('scan image gone after Back-to-notation click', r3.imgAfterBack === 0, { imgAfterBack: r3.imgAfterBack })

  // Job 4: reopen gear, click Original scan again — proves the gear route
  // into the scan works a second time (not just a one-shot effect).
  // Split from Job 5 below: chaining two full popover-open+click round trips
  // inside one daemon job proved flaky (Radix Popover open-state tracking
  // when two toggles fire back-to-back with zero real-world delay between
  // them) — separate HTTP round trips give the popover's own state machine
  // time to settle between actions, matching how a real user interacts.
  const r4 = await runPlaywright(`
    ${ENSURE_GEAR_OPEN}
    await page.locator('button[aria-label="Original scan"]').click()
    await page.waitForSelector('img[alt^="Original score"]', { timeout: 5000 })
    const imgVisibleAgain = await page.locator('img[alt^="Original score"]').first().isVisible()
    return { imgVisibleAgain }
  `)
  record('Original scan reachable a second time via gear', r4.imgVisibleAgain)

  // Job 5: reopen gear, click the Digital radio — proves the SECOND return
  // path (distinct from Job 3's Back-to-notation button) also restores the
  // live SVG.
  const r5 = await runPlaywright(`
    ${ENSURE_GEAR_OPEN}
    await page.locator('button[aria-label="Digital"]').click()
    await page.waitForSelector(${JSON.stringify(NOTATION_SVG_SEL)}, { timeout: 5000 })
    const svgAfterDigitalRadio = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).count()
    return { svgAfterDigitalRadio }
  `)
  record('svg returns after gear Digital radio click', r5.svgAfterDigitalRadio > 0, { svgAfterDigitalRadio: r5.svgAfterDigitalRadio })

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
