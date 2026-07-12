#!/usr/bin/env node
/**
 * Diagnostic: measure how Staff (inline) vs Split-leaf Staff notation diverge.
 *
 * Quick task 260712-kov — Phase 04.9.14 UAT: "Split leaf Staff: the staff
 * notation doesn't render correctly (should be identical to inline rendering
 * except no inline lyrics)."
 *
 * Uses the shared Playwright daemon (http://localhost:3099, see CLAUDE.md) —
 * NEVER spawns raw Chromium. The daemon enforces a single Chromium instance
 * and a 30s per-job timeout, so this script splits work into multiple small
 * jobs (goto+inline capture, then switch+split-leaf capture) rather than one
 * long job, and reuses the daemon's persistent `page` across job calls.
 *
 * Run:
 *   node tests/diagnostics/split-leaf-staff-diff.mjs
 *   TEST_BASE_URL=https://psalter.gsdlabs.dev node tests/diagnostics/split-leaf-staff-diff.mjs
 */

import { createRequire } from 'module'
import { writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const { getStatus, runPlaywright } = require('/home/services/playwright-daemon/client.js')

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, 'out')

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3005'
// Psalm 23 (Crimond) — canonical verified tune, lyric-to-note-alignment.md §8.
const PSALM_URL = `${BASE}/psalms/23`

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'desktop', width: 1200, height: 900 },
]

/** Poll /status until browserReady, retrying ~10x 3s apart. */
async function waitForBrowserReady() {
  for (let i = 0; i < 10; i++) {
    try {
      const status = await getStatus()
      if (status.browserReady) return true
    } catch {
      // ignore, retry
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
  return false
}

/** JS evaluated in the daemon page context to load the psalm at a given
 * viewport and switch to a given (notation, layout) combination via the
 * Gear popover, then capture structural metrics + a screenshot. */
function buildJobScript({ width, height, url, notation, layout, freshNavigate }) {
  return `
    await page.setViewportSize({ width: ${width}, height: ${height} });
    ${freshNavigate ? `
    // Suppress the first-run onboarding tour (psalter_tour_v2) — its overlay
    // spotlight intercepts clicks on [data-singing-gear] and hangs the job.
    await page.addInitScript(() => { try { window.localStorage.setItem('psalter_tour_v2', 'done') } catch {} });
    await page.goto(${JSON.stringify(url)}, { waitUntil: 'load', timeout: 15000 });` : ''}
    await page.locator('[data-notation-renderer] svg').first().waitFor({ state: 'visible', timeout: 12000 });

    // Open Gear popover and select Notation + Layout.
    await page.locator('[data-singing-gear]').click();
    await page.waitForTimeout(200);
    await page.getByRole('radio', { name: ${JSON.stringify(notation)} }).click();
    await page.getByRole('radio', { name: ${JSON.stringify(layout)} }).click();
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(600);

    const metrics = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll('[data-notation-renderer] svg'));
      const svg = svgs[0];
      if (!svg) return { error: 'no svg found under [data-notation-renderer]' };
      const scope = document.querySelector('[data-notation-renderer]');
      const systems = scope.querySelectorAll('.abcjs-staff-wrapper').length;
      const notes = scope.querySelectorAll('.abcjs-note').length;
      const lyrics = scope.querySelectorAll('.abcjs-lyric').length;
      const viewBox = svg.getAttribute('viewBox');
      const rect = svg.getBoundingClientRect();
      const viewMode = document.querySelector('[data-notation-renderer]')?.getAttribute('data-view-mode') ?? null;
      return {
        systems, notes, lyrics, viewBox,
        clientWidth: Math.round(rect.width), clientHeight: Math.round(rect.height),
        viewMode,
      };
    });

    const screenshotBuffer = await page.screenshot();
    const screenshotBase64 = screenshotBuffer.toString('base64');

    return { metrics, screenshotBase64 };
  `
}

async function runOneCapture({ viewport, notation, layout, freshNavigate, label }) {
  const script = buildJobScript({
    width: viewport.width,
    height: viewport.height,
    url: PSALM_URL,
    notation,
    layout,
    freshNavigate,
  })
  const result = await runPlaywright(script, 28000)
  if (result?.metrics?.error) {
    throw new Error(`${label}: ${result.metrics.error}`)
  }
  const outPath = join(OUT_DIR, `${viewport.name}-${label}.png`)
  await writeFile(outPath, Buffer.from(result.screenshotBase64, 'base64'))
  return { ...result.metrics, screenshotPath: outPath }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const ready = await waitForBrowserReady()
  if (!ready) {
    console.log('DIAGNOSTIC-UNAVAILABLE: playwright-daemon browser never became ready after ~30s of polling')
    process.exit(0)
  }

  const rows = []
  let anyMismatch = false

  for (const viewport of VIEWPORTS) {
    try {
      console.log(`\n── Viewport: ${viewport.name} (${viewport.width}x${viewport.height}) ──`)

      const inline = await runOneCapture({
        viewport,
        notation: 'Staff',
        layout: 'Inline',
        freshNavigate: true,
        label: 'inline',
      })
      console.log(
        `RESULT [${viewport.name}] inline   systems=${inline.systems} notes=${inline.notes} lyrics=${inline.lyrics} vb="${inline.viewBox}" size=${inline.clientWidth}x${inline.clientHeight}`,
      )

      const split = await runOneCapture({
        viewport,
        notation: 'Staff',
        layout: 'Split-Leaf',
        freshNavigate: false, // reuse the daemon's persistent page — already on the psalm
        label: 'split',
      })
      console.log(
        `RESULT [${viewport.name}] split    systems=${split.systems} notes=${split.notes} lyrics=${split.lyrics} vb="${split.viewBox}" size=${split.clientWidth}x${split.clientHeight}`,
      )

      const systemsMatch = inline.systems === split.systems
      const notesMatch = inline.notes === split.notes
      const lyricsOk = inline.lyrics > 0 && split.lyrics === 0
      if (!systemsMatch || !notesMatch || !lyricsOk) anyMismatch = true

      console.log(
        `MATCH [${viewport.name}]: systems ${systemsMatch ? 'ok' : 'MISMATCH'}, notes ${notesMatch ? 'ok' : 'MISMATCH'}, lyrics-presence ${lyricsOk ? 'ok' : 'MISMATCH'} (inline=${inline.lyrics}, split=${split.lyrics})`,
      )

      rows.push({ viewport: viewport.name, inline, split, systemsMatch, notesMatch, lyricsOk })
    } catch (e) {
      console.log(`DIAGNOSTIC-UNAVAILABLE: ${viewport.name} capture failed: ${e.message}`)
      anyMismatch = true
    }
  }

  console.log('\n── Summary ──')
  for (const r of rows) {
    console.log(
      `${r.viewport}: systems ${r.inline.systems}->${r.split.systems} (${r.systemsMatch ? 'MATCH' : 'MISMATCH'}), notes ${r.inline.notes}->${r.split.notes} (${r.notesMatch ? 'MATCH' : 'MISMATCH'})`,
    )
  }
  console.log(anyMismatch ? 'OVERALL: MISMATCH found' : 'OVERALL: MATCH — inline and split-leaf structurally identical')
  console.log(`Screenshots saved under ${OUT_DIR}`)

  process.exit(0)
}

main().catch((e) => {
  console.log(`DIAGNOSTIC-UNAVAILABLE: unexpected error: ${e?.message ?? e}`)
  process.exit(0)
})
