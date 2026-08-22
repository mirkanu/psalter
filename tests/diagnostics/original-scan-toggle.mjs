#!/usr/bin/env node
/**
 * Diagnostic: prove the "Score: Digital / Original scan" gear popover row
 * (quick task 260822-di9) swaps the live abcjs staff for the scanned JPG and
 * back, with no page navigation, and that the legacy in-scan "Back to
 * notation" button + Staff/Solfège sub-toggle (removed by quick task
 * 260822-sou) no longer render above the scan image — the gear's "Digital"
 * radio is now the ONLY return path.
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
//
// Rule 3 fix (260822-sou Task 2): quick task 260822-fgb (already merged,
// discovered live during this diagnostic's rewrite) gated the Score-source
// row to Split-Leaf layout only (GearPopover.tsx showScoreSourceRow requires
// `isSplit`) — it is NOT present in the default Inline layout SingingView
// mounts with (`useState<ViewMode>('staff')`). The `[data-settings-sub]`
// present unconditionally is `"layout"`, not `"score-source"`, so this
// snippet waits on that instead, then switches to Split-Leaf (idempotent —
// a no-op if already active) before any score-source assertion runs.
const ENSURE_GEAR_OPEN = `
  const gearState = await page.locator('[data-singing-gear]').getAttribute('data-state')
  if (gearState !== 'open') {
    await page.locator('[data-singing-gear]').click()
  }
  await page.waitForSelector('[data-settings-sub="layout"]', { timeout: 5000 })
  const splitLeafChecked = await page.locator('button[aria-label="Split-Leaf"]').getAttribute('aria-checked')
  if (splitLeafChecked !== 'true') {
    await page.locator('button[aria-label="Split-Leaf"]').click()
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
    const svgAfterSwap = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).count()

    return { digitalChecked, imgVisible, svgAfterSwap, url: page.url() }
  `)
  record('gear opened, Score row visible', true)
  record('Digital radio initially checked', r2.digitalChecked === 'true', { digitalChecked: r2.digitalChecked })
  record('Original scan image visible after click', r2.imgVisible)
  record('abcjs svg gone after swap', r2.svgAfterSwap === 0, { svgAfterSwap: r2.svgAfterSwap })
  record('URL unchanged (no navigation)', r2.url === urlBeforeClick, { urlBeforeClick, urlAfterClick: r2.url })

  // Job 3: quick task 260822-sou removed AbcPlayer's own in-scan chrome (the
  // "Back to notation" button and the Staff/Solfège sub-toggle) — the gear's
  // Digital radio is now the ONLY return path. Assert zero buttons render
  // above the scan image by walking DOM-order previous siblings of the
  // image; this catches BOTH removed affordances in one assertion and is
  // immune to whether the gear popover happens to be open.
  const r3 = await runPlaywright(`
    const chromeAboveScan = await page.locator('img[alt^="Original score"]').first().evaluate((img) => {
      let count = 0
      let n = img.previousElementSibling
      while (n) {
        if (n.tagName === 'BUTTON') count += 1
        count += n.querySelectorAll('button').length
        n = n.previousElementSibling
      }
      return count
    })
    const backCount = await page.locator('[data-testid="back-to-notation"]').count()
    return { chromeAboveScan, backCount }
  `)
  record('no buttons rendered above the scan image (back-button + Staff/Solfège sub-toggle removed)', r3.chromeAboveScan === 0, { chromeAboveScan: r3.chromeAboveScan })
  record('back-to-notation button not present in scan view', r3.backCount === 0, { backCount: r3.backCount })

  // Job 4: reopen gear, click the Digital radio — proves the gear's Digital
  // radio (now the ONLY return path since 260822-sou) restores the live SVG.
  const r4 = await runPlaywright(`
    ${ENSURE_GEAR_OPEN}
    await page.locator('button[aria-label="Digital"]').click()
    await page.waitForSelector(${JSON.stringify(NOTATION_SVG_SEL)}, { timeout: 5000 })
    const svgAfterDigitalRadio = await page.locator(${JSON.stringify(NOTATION_SVG_SEL)}).count()
    const imgAfterDigitalRadio = await page.locator('img[alt^="Original score"]').count()
    return { svgAfterDigitalRadio, imgAfterDigitalRadio }
  `)
  record('svg returns after gear Digital radio click', r4.svgAfterDigitalRadio > 0, { svgAfterDigitalRadio: r4.svgAfterDigitalRadio })
  record('scan image gone after gear Digital radio click', r4.imgAfterDigitalRadio === 0, { imgAfterDigitalRadio: r4.imgAfterDigitalRadio })

  // Job 5: reopen gear, click Original scan again — proves the round trip
  // works a second time (not just a one-shot effect). Split from Job 4:
  // chaining two full popover-open+click round trips inside one daemon job
  // proved flaky (Radix Popover open-state tracking when two toggles fire
  // back-to-back with zero real-world delay between them) — separate HTTP
  // round trips give the popover's own state machine time to settle between
  // actions, matching how a real user interacts.
  const r5 = await runPlaywright(`
    ${ENSURE_GEAR_OPEN}
    await page.locator('button[aria-label="Original scan"]').click()
    await page.waitForSelector('img[alt^="Original score"]', { timeout: 5000 })
    const imgVisibleAgain = await page.locator('img[alt^="Original score"]').first().isVisible()
    return { imgVisibleAgain }
  `)
  record('Original scan reachable a second time via gear', r5.imgVisibleAgain)

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
