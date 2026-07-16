#!/usr/bin/env node
/**
 * Diagnostic: Wave 0 de-risking script for Phase 04.9.15 items (a) and (d).
 *
 * Item (a): confirm the EXACT abcjs SVG class(es) that wrap the repeated
 * clef + key-signature glyph group on wrapped continuation rows of an inline
 * Staff tune. RESEARCH.md Pitfall 1 proved the UI-SPEC's `.abcjs-top-line`
 * anchor is WRONG (it is a staff ruling line, from `staff.js`). The real
 * candidates per source inspection are `.abcjs-staff-extra.abcjs-clef` /
 * `.abcjs-staff-extra.abcjs-key-signature`, but the exact DOM nesting
 * relative to `.abcjs-staff-wrapper` is unconfirmed (Assumption A1). This
 * diagnostic renders a live multi-row tune and reports the actual class
 * lists so Plan 05 can finalize the CSS selector.
 *
 * Item (d): determine whether non-last staff rows under-fill the notation
 * container width (RESEARCH.md Pitfall 2 / Assumption A2 — the codebase's
 * own `effectiveStaffWidth`/`targetStaffwidth` computation in AbcPlayer.tsx
 * is the more likely root cause than a missing abcjs format option, since
 * abcjs already auto-stretches non-last lines by default). This diagnostic
 * measures each row's rendered width vs. the notation container width and
 * reports the fill ratio, confirming (or ruling out) the reproduction.
 *
 * Uses the shared Playwright daemon (http://localhost:3099, see CLAUDE.md) —
 * NEVER spawns raw Chromium. Mirrors the structure of
 * tests/diagnostics/split-leaf-staff-diff.mjs (daemon client require,
 * waitForBrowserReady, tour-suppression init script, Gear-popover
 * navigation, never-throws/exit-0 contract, OUT_DIR screenshots).
 *
 * Run:
 *   node tests/diagnostics/inline-staff-clef-stretch-diff.mjs
 *   TEST_BASE_URL=https://psalter.gsdlabs.dev node tests/diagnostics/inline-staff-clef-stretch-diff.mjs
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
// Psalm 78 (Azmon/Denfield, CM) — the tune the prior split-leaf UAT finding
// was reported against; wraps to 4+ rows at 375px mobile viewport.
const URLS = [
  { label: 'psalm-23', url: `${BASE}/psalms/23` },
  { label: 'psalm-78', url: `${BASE}/psalms/78` },
]

const VIEWPORT = { width: 375, height: 667 }

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

/** JS evaluated in the daemon page context: navigate, switch to inline
 * Staff, then run Part A (clef/key selector confirmation) and Part B
 * (per-row stretch measurement) inside a single page.evaluate call. */
function buildJobScript(url) {
  return `
    // Suppress the first-run onboarding tour (psalter_tour_v2) — its overlay
    // spotlight intercepts clicks on [data-singing-gear] and hangs the job.
    await page.addInitScript(() => { try { window.localStorage.setItem('psalter_tour_v2', 'done') } catch {} });
    await page.setViewportSize({ width: ${VIEWPORT.width}, height: ${VIEWPORT.height} });
    await page.goto(${JSON.stringify(url)}, { waitUntil: 'load', timeout: 15000 });
    await page.locator('[data-notation-renderer] svg').first().waitFor({ state: 'visible', timeout: 12000 });

    // Ensure inline Staff is active via the Gear popover.
    await page.locator('[data-singing-gear]').click();
    await page.waitForTimeout(200);
    await page.getByRole('radio', { name: 'Staff' }).click();
    await page.getByRole('radio', { name: 'Inline' }).click();
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(600);

    const result = await page.evaluate(() => {
      // Scope to the chromeless root that hosts the abcjs SVG in staff mode.
      const scope = document.querySelector('[data-notation-body][data-view-mode="staff"]')
        || document.querySelector('[data-notation-body]')
        || document.querySelector('[data-notation-renderer]');
      if (!scope) return { error: 'no [data-notation-body]/[data-notation-renderer] root found' };

      const rows = Array.from(scope.querySelectorAll('.abcjs-staff-wrapper'));
      if (rows.length === 0) return { error: 'no .abcjs-staff-wrapper rows found' };

      // ── PART A: clef/key-signature selector confirmation (item a) ──────
      // Do NOT scale/target .abcjs-top-line (RESEARCH Pitfall 1: it's a
      // staff ruling line, not the clef/key group). Inspect the actual
      // candidates instead: .abcjs-clef, .abcjs-key-signature,
      // .abcjs-staff-extra, and the topmost <g>/<text> before the first note.
      const clefRows = rows.map((row, i) => {
        const clefEls = Array.from(row.querySelectorAll('.abcjs-clef'));
        const keySigEls = Array.from(row.querySelectorAll('.abcjs-key-signature'));
        const staffExtraEls = Array.from(row.querySelectorAll('.abcjs-staff-extra'));
        const firstNote = row.querySelector('.abcjs-note');
        // Topmost <g>/<text> elements that appear BEFORE the first note in
        // document order, within this row — candidates for the clef/key group.
        const allChildren = Array.from(row.querySelectorAll('g, text'));
        const preNoteEls = [];
        for (const el of allChildren) {
          if (firstNote && (el === firstNote || el.contains(firstNote) || firstNote.contains(el))) break;
          if (el.className && typeof el.className.baseVal === 'string' && el.className.baseVal.length > 0) {
            preNoteEls.push({ tag: el.tagName, className: el.className.baseVal });
          }
        }
        return {
          rowIndex: i,
          rowClass: row.getAttribute('class') || '',
          hasClefClass: clefEls.length > 0,
          hasKeySigClass: keySigEls.length > 0,
          clefClasses: clefEls.map((el) => el.getAttribute('class') || ''),
          keySigClasses: keySigEls.map((el) => el.getAttribute('class') || ''),
          staffExtraClasses: staffExtraEls.map((el) => el.getAttribute('class') || ''),
          preNoteElements: preNoteEls.slice(0, 8),
        };
      });

      // ── PART B: per-row stretch measurement (item d) ────────────────────
      const container = document.querySelector('[data-notation-viewarea]')
        || document.querySelector('[data-notation-renderer]');
      const containerWidth = container ? container.getBoundingClientRect().width : 0;

      const stretchRows = rows.map((row, i) => {
        const rowWidth = row.getBoundingClientRect().width;
        const fillRatio = containerWidth > 0 ? rowWidth / containerWidth : 0;
        const isLast = i === rows.length - 1;
        const underFilled = !isLast && fillRatio < 0.97;
        return { rowIndex: i, rowWidth: Math.round(rowWidth), containerWidth: Math.round(containerWidth), fillRatio, isLast, underFilled };
      });

      const nonLastRows = stretchRows.filter((r) => !r.isLast);
      const anyUnderFilled = nonLastRows.some((r) => r.underFilled);
      const worstFillRatio = nonLastRows.length > 0
        ? Math.min(...nonLastRows.map((r) => r.fillRatio))
        : 1;

      return {
        rowCount: rows.length,
        containerWidth: Math.round(containerWidth),
        clefRows,
        stretchRows,
        anyUnderFilled,
        worstFillRatio,
      };
    });

    if (result && result.error) {
      return { result };
    }

    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshotBase64 = screenshotBuffer.toString('base64');

    return { result, screenshotBase64 };
  `
}

async function runOneUrl({ label, url }) {
  const script = buildJobScript(url)
  const response = await runPlaywright(script, 28000)
  const { result, screenshotBase64 } = response ?? {}

  if (!result || result.error) {
    console.log(`DIAGNOSTIC-UNAVAILABLE: ${label} capture failed: ${result?.error ?? 'no result returned'}`)
    return null
  }

  if (screenshotBase64) {
    const outPath = join(OUT_DIR, `${label}-inline-staff.png`)
    await writeFile(outPath, Buffer.from(screenshotBase64, 'base64'))
    console.log(`Screenshot saved: ${outPath}`)
  }

  console.log(`\n── ${label} (${url}) — rows=${result.rowCount} containerWidth=${result.containerWidth} ──`)

  // Part A output
  for (const row of result.clefRows) {
    console.log(
      `CLEF-ROW ${row.rowIndex}: hasClefClass=${row.hasClefClass} hasKeySigClass=${row.hasKeySigClass} rowClass="${row.rowClass}"`,
    )
    if (row.clefClasses.length > 0) console.log(`  clef classes: ${JSON.stringify(row.clefClasses)}`)
    if (row.keySigClasses.length > 0) console.log(`  key-signature classes: ${JSON.stringify(row.keySigClasses)}`)
    if (row.staffExtraClasses.length > 0) console.log(`  staff-extra classes: ${JSON.stringify(row.staffExtraClasses)}`)
    if (row.preNoteElements.length > 0) {
      console.log(`  pre-note elements: ${JSON.stringify(row.preNoteElements)}`)
    }
  }

  // Part B output
  for (const row of result.stretchRows) {
    console.log(
      `STRETCH-ROW ${row.rowIndex}: rowWidth=${row.rowWidth} container=${row.containerWidth} fill=${row.fillRatio.toFixed(3)} underFilled=${row.underFilled}`,
    )
  }
  console.log(
    `VERDICT [${label}]: non-last rows under-fill = ${result.anyUnderFilled ? 'YES' : 'NO'}, worst-case fill ratio = ${result.worstFillRatio.toFixed(3)}`,
  )

  return result
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const ready = await waitForBrowserReady()
  if (!ready) {
    console.log('DIAGNOSTIC-UNAVAILABLE: playwright-daemon browser never became ready after ~30s of polling')
    process.exit(0)
  }

  const results = []
  for (const entry of URLS) {
    try {
      const result = await runOneUrl(entry)
      if (result) results.push({ ...entry, ...result })
    } catch (e) {
      console.log(`DIAGNOSTIC-UNAVAILABLE: ${entry.label} capture failed: ${e?.message ?? e}`)
    }
  }

  console.log('\n── Overall Summary ──')
  if (results.length === 0) {
    console.log('DIAGNOSTIC-UNAVAILABLE: no URLs produced usable results (dev server or daemon likely unavailable)')
  } else {
    for (const r of results) {
      console.log(
        `${r.label}: rows=${r.rowCount} anyUnderFilled=${r.anyUnderFilled} worstFillRatio=${r.worstFillRatio.toFixed(3)}`,
      )
    }
    const overallUnderFilled = results.some((r) => r.anyUnderFilled)
    const overallWorst = Math.min(...results.map((r) => r.worstFillRatio))
    console.log(
      `VERDICT overall: non-last rows under-fill = ${overallUnderFilled ? 'YES' : 'NO'}, worst-case fill ratio = ${overallWorst.toFixed(3)}`,
    )
  }
  console.log(`Screenshots saved under ${OUT_DIR}`)

  process.exit(0)
}

main().catch((e) => {
  console.log(`DIAGNOSTIC-UNAVAILABLE: unexpected error: ${e?.message ?? e}`)
  process.exit(0)
})
