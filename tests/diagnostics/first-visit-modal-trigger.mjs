#!/usr/bin/env node
/**
 * Diagnostic (Phase 20-01, items 4 + 5): verify the FirstVisitModal opens
 * ONLY at `/psalms/[id]` (D-17), shows the expected header + 3 radios
 * (D-18, D-19), and does NOT open on `/psalms` index or `/psalms/[id]/study`.
 *
 * Uses the shared Playwright daemons:
 *   - Chromium daemon at http://localhost:3099 (pre-warmed, default)
 *   - WebKit daemon at http://localhost:3100 (on-demand, iOS Safari)
 *
 * Sub-checks:
 *   (a) visit /psalms/1 with fresh context → modal opens, header is
 *       "Choose a view", 3 radio buttons visible, Save button disabled.
 *   (b) visit /psalms (index) → modal does NOT open.
 *   (c) visit /psalms/1/study → modal does NOT open.
 *   (d) Mobile-first screenshots at 390/768/1440 viewports for the modal
 *       open case; assert no horizontal overflow.
 *
 * Run:
 *   node tests/diagnostics/first-visit-modal-trigger.mjs
 *   TEST_BASE_URL=https://psalter.gsdlabs.dev node tests/diagnostics/first-visit-modal-trigger.mjs
 */

import { createRequire } from 'module'
import { writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const { getStatus, runPlaywright } = require('/home/services/playwright-daemon/client.js')

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, 'out', 'first-visit-modal-trigger')

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3005'

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
]

async function job(script) {
  const r = await fetch('http://localhost:3099/job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script }),
  })
  const j = await r.json()
  if (j.error) throw new Error(j.error)
  return j.result
}

async function assert(check, label) {
  if (!check) {
    console.error(`FAIL: ${label}`)
    process.exit(1)
  }
  console.log(`PASS: ${label}`)
}

async function main() {
  const status = await getStatus()
  if (!status.browserReady) {
    console.error('Chromium daemon not ready:', status)
    process.exit(1)
  }
  await mkdir(OUT_DIR, { recursive: true })

  // (a) /psalms/1 with fresh context → modal opens with expected header.
  const a = await job(`
    await page.context().clearCookies()
    await page.goto('${BASE}/psalms/1', { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-first-visit-modal]', { timeout: 5000 })
    const title = await page.locator('[data-first-visit-modal] >> text=Choose a view').first().textContent()
    const radioCount = await page.locator('[role="radio"]').count()
    const saveDisabled = await page.locator('[data-first-visit-save]').isDisabled()
    return { title, radioCount, saveDisabled }
  `)
  await assert(a.title === 'Choose a view', `(a) modal title is "Choose a view" (got: ${a.title})`)
  await assert(a.radioCount === 3, `(a) exactly 3 radio buttons (got: ${a.radioCount})`)
  await assert(a.saveDisabled === true, '(a) Save button is disabled until a radio is selected')

  // (b) /psalms (index) → modal does NOT open.
  const b = await job(`
    await page.context().clearCookies()
    await page.evaluate(() => { try { localStorage.clear() } catch {} })
    await page.goto('${BASE}/psalms', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    return { modalPresent: await page.locator('[data-first-visit-modal]').count() > 0 }
  `)
  await assert(b.modalPresent === false, '(b) modal does NOT open on /psalms index')

  // (c) /psalms/1/study → modal does NOT open.
  const c = await job(`
    await page.context().clearCookies()
    await page.evaluate(() => { try { localStorage.clear() } catch {} })
    await page.goto('${BASE}/psalms/1/study', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    return { modalPresent: await page.locator('[data-first-visit-modal]').count() > 0 }
  `)
  await assert(c.modalPresent === false, '(c) modal does NOT open on /psalms/1/study')

  // (d) Mobile-first screenshots at 390/768/1440 viewports, assert no overflow.
  for (const vp of VIEWPORTS) {
    const d = await job(`
      await page.context().clearCookies()
      await page.evaluate(() => { try { localStorage.clear() } catch {} })
      await page.setViewportSize({ width: ${vp.width}, height: ${vp.height} })
      await page.goto('${BASE}/psalms/1', { waitUntil: 'networkidle' })
      await page.waitForSelector('[data-first-visit-modal]', { timeout: 5000 })
      await page.waitForTimeout(300)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
      await page.screenshot({ path: '${join(OUT_DIR, `${vp.name}.png`)}', fullPage: false })
      return { overflow, viewport: { width: ${vp.width}, height: ${vp.height} } }
    `)
    await assert(d.overflow === false, `(d ${vp.name}) no horizontal overflow at ${vp.width}x${vp.height}`)
  }

  // (e) CR-01 regression: pick "Lyrics Only" radio, Save, then reload — the
  // chosen view must survive. Asserts the modal writes the storage key that
  // SingingView actually reads.
  const e = await job(`
    await page.context().clearCookies()
    await page.evaluate(() => { try { localStorage.clear() } catch {} })
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('${BASE}/psalms/1', { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-first-visit-modal]', { timeout: 5000 })
    await page.click('[data-view-option="lyrics"]')
    await page.click('[data-first-visit-save]')
    // Modal should close; storage should be set.
    await page.waitForSelector('[data-first-visit-modal]', { state: 'detached', timeout: 5000 })
    const storedMode = await page.evaluate(() => localStorage.getItem('psalter-score-mode'))
    const storedAccepted = await page.evaluate(() => localStorage.getItem('psalter.firstVisitModalAccepted'))
    // Reload and confirm NotationRenderer reads the stored viewMode.
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForSelector('[data-notation-renderer]', { timeout: 5000 })
    const viewMode = await page.getAttribute('[data-notation-renderer]', 'data-view-mode')
    const overflowAfter = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    return { storedMode, storedAccepted, viewMode, overflowAfter }
  `)
  await assert(e.storedMode === 'lyrics', `(e) localStorage psalter-score-mode === 'lyrics' after Save (got: ${e.storedMode})`)
  await assert(e.storedAccepted === 'true', `(e) localStorage psalter.firstVisitModalAccepted === 'true' after Save (got: ${e.storedAccepted})`)
  await assert(e.viewMode === 'lyrics', `(e) NotationRenderer data-view-mode === 'lyrics' after reload (got: ${e.viewMode})`)
  await assert(e.overflowAfter === false, '(e) no horizontal overflow after reload')

  console.log('\nAll checks passed. Screenshots in:', OUT_DIR)
}

main().catch((err) => {
  console.error('Diagnostic failed:', err)
  process.exit(1)
})