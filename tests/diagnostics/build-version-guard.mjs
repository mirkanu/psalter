#!/usr/bin/env node
/**
 * Diagnostic (Phase 20-03, item 6): verify the BuildVersionGuard mechanism
 * against a running build.
 *
 * Covers the three behavioural contracts:
 *   (a) Sub-check 1 — first ever page load (empty localStorage):
 *       - DOES NOT hard-reload
 *       - DOES write `psalter.lastSeenBuildId` to localStorage matching
 *         the live /api/build-version response
 *
 *   (b) Sub-check 2 — stored `psalter.lastSeenBuildId` differs from live:
 *       - DOES hard-reload
 *       - AFTER reload, localStorage holds the new (live) buildId
 *
 *   (c) Sub-check 3 — stored matches live:
 *       - DOES NOT reload
 *
 * Run:
 *   node tests/diagnostics/build-version-guard.mjs
 *   TEST_BASE_URL=https://psalter.gsdlabs.dev node tests/diagnostics/build-version-guard.mjs
 *
 * Uses the Chromium daemon at http://localhost:3099 (pre-warmed, default
 * for any browser job on this VPS).
 */

import { createRequire } from 'module'
import { writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const { getStatus, runPlaywright } = require('/home/services/playwright-daemon/client.js')

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, 'out', 'build-version-guard')

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3005'
const TEST_PATH = '/psalms/1'

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

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const status = await getStatus()
  if (!status.browserReady) {
    console.error('[build-version-guard] Chromium daemon not ready — try again in a few seconds')
    process.exit(1)
  }

  console.log(`[build-version-guard] base=${BASE}`)

  // ────────────────────────────────────────────────────────────────────
  // Sub-check 1: empty localStorage → no reload, write buildId
  // ────────────────────────────────────────────────────────────────────
  console.log('\n[1] empty localStorage — expect NO reload, buildId written')
  let r1 = await job(`
    const url = ${JSON.stringify(BASE + TEST_PATH)}
    let reloadCount = 0
    let buildIdResponse = null
    // Probe the live endpoint first to know what to expect.
    const probe = await page.request.get(BASE + '/api/build-version')
    if (probe.ok()) buildIdResponse = (await probe.json()).buildId

    // Listen for any reload events after mount.
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) reloadCount += 1
    })

    await page.goto(url, { waitUntil: 'load' })
    // Give the mount-time fetch + reload a chance to fire.
    await new Promise((r) => setTimeout(r, 1500))
    const stored = await page.evaluate(() => localStorage.getItem('psalter.lastSeenBuildId'))
    const mounted = await page.evaluate(() => !!document.querySelector('[data-build-version-guard]'))

    await page.screenshot({ path: ${JSON.stringify(join(OUT_DIR, '01-empty-localStorage.png'))}, fullPage: false })

    return {
      buildIdResponse,
      stored,
      reloadCount,
      mounted,
      match: stored === buildIdResponse,
    }
  `)
  console.log('  result:', r1)
  if (!r1.mounted) throw new Error('[1] BuildVersionGuard not mounted (missing [data-build-version-guard])')
  if (r1.stored !== r1.buildIdResponse) throw new Error(`[1] localStorage not seeded: stored=${r1.stored} expected=${r1.buildIdResponse}`)
  if (r1.reloadCount > 1) throw new Error(`[1] unexpected reloads: ${r1.reloadCount} (should be at most 1 — the initial goto)`)

  // ────────────────────────────────────────────────────────────────────
  // Sub-check 2: stale stored buildId → expect reload, then stored = live
  // ────────────────────────────────────────────────────────────────────
  console.log('\n[2] stale localStorage — expect hard reload, then store = live')
  let r2 = await job(`
    const url = ${JSON.stringify(BASE + TEST_PATH)}
    const probe = await page.request.get(BASE + '/api/build-version')
    const live = probe.ok() ? (await probe.json()).buildId : null

    // Pre-seed localStorage with a stale value (different from live).
    await page.goto(BASE + '/psalms', { waitUntil: 'load' })
    await page.evaluate((liveId) => {
      localStorage.setItem('psalter.lastSeenBuildId', 'fake-stale-' + (liveId || 'unknown'))
    }, live)

    // Listen for reloads (framenavigated fires on reloads too).
    let reloadCount = 0
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) reloadCount += 1
    })

    await page.goto(url, { waitUntil: 'load' })
    // Allow mount-time fetch + reload cycle to settle.
    await new Promise((r) => setTimeout(r, 2500))
    const stored = await page.evaluate(() => localStorage.getItem('psalter.lastSeenBuildId'))

    await page.screenshot({ path: ${JSON.stringify(join(OUT_DIR, '02-after-reload.png'))}, fullPage: false })

    return { live, stored, reloadCount, matchesLive: stored === live }
  `)
  console.log('  result:', r2)
  if (!r2.matchesLive) throw new Error(`[2] localStorage not updated to live: stored=${r2.stored} live=${r2.live}`)
  if (r2.reloadCount < 2) throw new Error(`[2] expected at least 1 reload (initial + post-reload); got ${r2.reloadCount}`)

  // ────────────────────────────────────────────────────────────────────
  // Sub-check 3: matching stored → NO reload
  // ────────────────────────────────────────────────────────────────────
  console.log('\n[3] matching localStorage — expect NO reload')
  let r3 = await job(`
    const url = ${JSON.stringify(BASE + TEST_PATH)}
    const probe = await page.request.get(BASE + '/api/build-version')
    const live = probe.ok() ? (await probe.json()).buildId : null

    // Pre-seed with the LIVE value.
    await page.goto(BASE + '/psalms', { waitUntil: 'load' })
    await page.evaluate((liveId) => {
      localStorage.setItem('psalter.lastSeenBuildId', liveId)
    }, live)

    let reloadCount = 0
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) reloadCount += 1
    })

    await page.goto(url, { waitUntil: 'load' })
    await new Promise((r) => setTimeout(r, 2500))
    const stored = await page.evaluate(() => localStorage.getItem('psalter.lastSeenBuildId'))

    await page.screenshot({ path: ${JSON.stringify(join(OUT_DIR, '03-matching-no-reload.png'))}, fullPage: false })

    return { live, stored, reloadCount, matchesLive: stored === live }
  `)
  console.log('  result:', r3)
  if (!r3.matchesLive) throw new Error(`[3] localStorage diverged: stored=${r3.stored} live=${r3.live}`)
  if (r3.reloadCount > 1) throw new Error(`[3] unexpected reload: ${r3.reloadCount} (should be exactly 1 — the initial goto)`)

  console.log('\n[build-version-guard] all 3 sub-checks PASSED')
}

main().catch((e) => {
  console.error('[build-version-guard] FAILED:', e.message)
  process.exit(1)
})