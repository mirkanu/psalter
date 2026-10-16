#!/usr/bin/env node
/**
 * Diagnostic (Phase 21): verifies the four critical user flows for the
 * onboarding-v2 + audio-restore direction reversal:
 *   (a) Fresh visitor lands on /psalms/1 in Legacy view, no FirstVisitModal
 *       popup (D-01 + D-02). Pre-Phase-21 the FirstVisitModal intercepted
 *       first-time visitors; Phase 21 deletes it entirely.
 *   (b) Returning visitor with stored psalter-score-mode='staff-split' still
 *       sees staff-split (D-01 doesn't clobber existing preferences). The
 *       hydrate read happens before the persist write, so the stored value
 *       wins over the new default.
 *   (c) Audio player restores across psalm navigation: a visitor whose
 *       psalter.audioPlayerOpen === 'true' on psalm-A who navigates to
 *       psalm-B still sees the PlayMiniBar rendered with the player UI,
 *       not just the bottom-right icon's inverted colour state (D-03
 *       hydration fix — PlayMiniBar.tsx:220 was returning null on the
 *       hydrated 'true' state because miniBarMounted was never seeded).
 *   (d) Audio restore edge case (CONTEXT.md "specifics"): a visitor whose
 *       psalter.audioPlayerOpen === 'true' BUT who has never selected an
 *       audio source lands with the play button showing its inverted
 *       'open' colour but no player UI rendered — they can click to pick
 *       a source. We assert the bottom-right play button has
 *       data-play-toggle='open' while no [data-play-mini-bar] exists yet.
 *   (e) Mobile-first screenshots at 390/768/1440 viewports for case (a),
 *       asserting no horizontal overflow (AGENTS.md mobile-first binding
 *       rule).
 *
 * Replaces Phase 20's `first-visit-modal-trigger.mjs` (which asserted the
 * now-deleted modal opens). Reuses the Chromium Playwright daemon at
 * http://localhost:3099 (pre-warmed, default for any browser job on this VPS).
 *
 * Run:
 *   node tests/diagnostics/onboarding-v2-trigger.mjs
 *   TEST_BASE_URL=https://psalter.gsdlabs.dev node tests/diagnostics/onboarding-v2-trigger.mjs
 */

import { createRequire } from 'module'
import { mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const { getStatus, runPlaywright } = require('/home/services/playwright-daemon/client.js')

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, 'out', 'onboarding-v2-trigger')

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

  console.log(`[onboarding-v2-trigger] base=${BASE}`)

  // ────────────────────────────────────────────────────────────────────
  // (a) Fresh visitor lands on Legacy view, no FirstVisitModal popup
  // ────────────────────────────────────────────────────────────────────
  console.log('\n[a] fresh visitor — expect Legacy view, no FirstVisitModal')
  const a = await job(`
    await page.context().clearCookies()
    await page.evaluate(() => { try { localStorage.clear() } catch {} })
    await page.goto('${BASE}/psalms/1', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    const viewMode = await page.getAttribute('[data-notation-renderer]', 'data-view-mode')
    const modalPresent = await page.locator('[data-first-visit-modal]').count()
    return { viewMode, modalPresent }
  `)
  console.log('  result:', a)
  await assert(a.viewMode === 'legacy', `(a) NotationRenderer data-view-mode === 'legacy' for fresh visitor (got: ${a.viewMode})`)
  await assert(a.modalPresent === 0, '(a) FirstVisitModal is NOT mounted (D-02)')

  // ────────────────────────────────────────────────────────────────────
  // (b) Returning visitor with stored viewMode preserved
  // ────────────────────────────────────────────────────────────────────
  console.log('\n[b] stored staff-split — expect staff-split view preserved')
  const b = await job(`
    await page.context().clearCookies()
    await page.evaluate(() => { try { localStorage.clear() } catch {} })
    await page.goto('${BASE}/psalms', { waitUntil: 'load' })
    await page.evaluate(() => {
        try { localStorage.setItem('psalter-score-mode', 'staff-split') } catch {}
      })
    await page.goto('${BASE}/psalms/1', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    const viewMode = await page.getAttribute('[data-notation-renderer]', 'data-view-mode')
    return { viewMode }
  `)
  console.log('  result:', b)
  await assert(b.viewMode === 'staff-split', `(b) stored staff-split preserved (got: ${b.viewMode}) — D-01 doesn't clobber existing preferences`)

  // ────────────────────────────────────────────────────────────────────
  // (c) Audio player restores across psalm navigation (D-03)
  // ────────────────────────────────────────────────────────────────────
  console.log('\n[c] audio player restore — expect PlayMiniBar mounted + visible')
  const c = await job(`
    await page.context().clearCookies()
    await page.evaluate(() => { try { localStorage.clear() } catch {} })
    await page.goto('${BASE}/psalms/1', { waitUntil: 'load' })
    await page.evaluate(() => {
        try {
          localStorage.setItem('psalter-score-mode', 'staff-split')
          localStorage.setItem('psalter.audioPlayerOpen', 'true')
          localStorage.setItem('psalter.audioLastSelected', 'midi')
        } catch {}
      })
    // Navigate to a DIFFERENT psalm (proves the restore survives navigation,
    // not just the first mount on the same page).
    await page.goto('${BASE}/psalms/23', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const barMounted = await page.locator('[data-play-mini-bar]').count() > 0
    const barVisible = barMounted
      ? await page.getAttribute('[data-play-mini-bar]', 'data-visible')
      : null
    return { barMounted, barVisible }
  `)
  console.log('  result:', c)
  await assert(c.barMounted === true, '(c) PlayMiniBar is mounted after audioPlayerOpen hydrate (D-03 fix)')
  await assert(c.barVisible === 'true', `(c) PlayMiniBar visible=true (got: ${c.barVisible})`)

  // ────────────────────────────────────────────────────────────────────
  // (d) Audio restore edge case — icon inverted, no player UI
  // ────────────────────────────────────────────────────────────────────
  console.log('\n[d] audioPlayerOpen=true but no lastSelected — expect icon only')
  const d = await job(`
    await page.context().clearCookies()
    await page.evaluate(() => { try { localStorage.clear() } catch {} })
    await page.goto('${BASE}/psalms/1', { waitUntil: 'load' })
    await page.evaluate(() => {
        try {
          localStorage.setItem('psalter-score-mode', 'staff-split')
          localStorage.setItem('psalter.audioPlayerOpen', 'true')
          // deliberately do NOT set psalter.audioLastSelected
        } catch {}
      })
    await page.goto('${BASE}/psalms/23', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const playToggle = await page.getAttribute('[data-play-toggle]', 'data-play-toggle')
    const barCount = await page.locator('[data-play-mini-bar]').count()
    return { playToggle, barCount }
  `)
  console.log('  result:', d)
  await assert(d.playToggle === 'open', `(d) bottom-right play button is inverted ('open' state) (got: ${d.playToggle})`)
  await assert(d.barCount === 0, '(d) PlayMiniBar UI is NOT rendered — no lastSelected source yet')

  // ────────────────────────────────────────────────────────────────────
  // (e) Mobile-first screenshots at 390/768/1440 viewports for case (a),
  //     asserting no horizontal overflow (AGENTS.md mobile-first rule)
  // ────────────────────────────────────────────────────────────────────
  for (const vp of VIEWPORTS) {
    console.log(`\n[e ${vp.name}] fresh visitor — assert no horizontal overflow`)
    const e = await job(`
      await page.context().clearCookies()
      await page.evaluate(() => { try { localStorage.clear() } catch {} })
      await page.setViewportSize({ width: ${vp.width}, height: ${vp.height} })
      await page.goto('${BASE}/psalms/1', { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
      const viewMode = await page.getAttribute('[data-notation-renderer]', 'data-view-mode')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
      await page.screenshot({ path: '${join(OUT_DIR, `${vp.name}.png`)}', fullPage: false })
      return { viewMode, overflow, viewport: { width: ${vp.width}, height: ${vp.height} } }
    `)
    await assert(e.viewMode === 'legacy', `(e ${vp.name}) Legacy view at ${vp.width}x${vp.height} (got: ${e.viewMode})`)
    await assert(e.overflow === false, `(e ${vp.name}) no horizontal overflow at ${vp.width}x${vp.height}`)
  }

  console.log('\nAll checks passed. Screenshots in:', OUT_DIR)
}

main().catch((err) => {
  console.error('Diagnostic failed:', err)
  process.exit(1)
})