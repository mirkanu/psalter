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
// Quick task 260712-szw: Psalm 78 (Azmon/Denfield, CM) — the tune the UAT
// finding was reported against (4 systems, mobile split-leaf overflow).
const PSALM_78_URL = `${BASE}/psalms/78`

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'desktop', width: 1200, height: 900 },
]

// Representative 4-phrase CM body derived from the real Azmon/Denfield
// tunes.abc_notation row (psalter DB, `select abc_notation from tunes where
// name = 'Azmon/Denfield'`), with `% PHRASE_BREAK` markers replaced by real
// newlines (one music line per phrase — mirrors what split-leaf actually
// renders, since unifiedAbcNoLyrics has no `w:` lines) and the stray leading
// empty bar on phrase 3 dropped for cleanliness. No `w:` lines — this is
// exactly the split-leaf (no-lyrics) shape.
const CM_ABC_BODY = `X:1
T:Azmon/Denfield (representative, 260712-szw)
M:C
L:1/8
K:Ab
E2AAB2B2 | cBA2
B2cc | d2c2B4
e2ecc2A2 | AFF2
E2EA | A2G2A4
`

// Mirrors AbcPlayer.tsx's containerWidth math at a 327px mobile notation
// column: `Math.max(0, (staffWidth || 600) - 16)` → 311.
const HARNESS_CONTAINER_WIDTH = 311
// Runtime fact from the orchestrator: mobile notation-slot clientHeight on
// /psalms/78 split-leaf Staff ≈ 260px.
const HARNESS_AVAILABLE_HEIGHT = 260

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

/**
 * Part A (260712-szw): mobile split-leaf notation-SLOT container height vs
 * the rendered SVG height, on the real UAT tune (/psalms/78, Azmon/Denfield).
 * Best-effort / live — reflects whatever build is currently deployed to
 * localhost:3005 (PRE-fix until the batched rebuild). Reuses the
 * `[data-notation-slot]` measurement hook added to NotationRenderer's
 * chromeless renderSplitLeaf branch (measurement-only, no behaviour change).
 */
function buildMobileOverflowJobScript() {
  return `
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(() => { try { window.localStorage.setItem('psalter_tour_v2', 'done') } catch {} });
    await page.goto(${JSON.stringify(PSALM_78_URL)}, { waitUntil: 'load', timeout: 15000 });
    await page.locator('[data-notation-renderer] svg').first().waitFor({ state: 'visible', timeout: 12000 });

    await page.locator('[data-singing-gear]').click();
    await page.waitForTimeout(200);
    await page.getByRole('radio', { name: 'Staff' }).click();
    await page.getByRole('radio', { name: 'Split-Leaf' }).click();
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(600);

    const metrics = await page.evaluate(() => {
      const slot = document.querySelector('[data-notation-slot]');
      if (!slot) return { error: 'no [data-notation-slot] element found' };
      const svg = slot.querySelector('svg');
      if (!svg) return { error: 'no svg found inside [data-notation-slot]' };
      const systems = slot.querySelectorAll('.abcjs-staff-wrapper').length;
      const rect = svg.getBoundingClientRect();
      return {
        slotClientHeight: slot.clientHeight,
        slotScrollHeight: slot.scrollHeight,
        svgWidth: Math.round(rect.width),
        svgHeight: Math.round(rect.height),
        systems,
      };
    });

    return { metrics };
  `
}

/**
 * Part B (260712-szw): dev-server-independent abcjs-direct harness — the
 * DECISIVE measurement. Does not touch localhost:3005 / the Next build.
 * Loads abcjs 6.6.3 straight from the CDN into an `about:blank` page and
 * renders a representative 4-system CM body (no `w:` lines) under baseline /
 * reduced-spacing / height-fit levers, mirroring AbcPlayer's
 * `{ scale: 1, staffwidth, responsive: 'resize' }` render call.
 */
function buildAbcjsHarnessScript({ abcBody, containerWidth, availableHeight }) {
  return `
    await page.goto('about:blank', { waitUntil: 'load', timeout: 10000 });
    await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/abcjs@6.6.3/dist/abcjs-basic-min.js' });
    await page.waitForFunction(() => !!window.ABCJS, { timeout: 10000 });

    const result = await page.evaluate((args) => {
      const { abcBody, containerWidth, availableHeight } = args;

      function freshContainer() {
        const old = document.getElementById('harness');
        if (old) old.remove();
        const div = document.createElement('div');
        div.id = 'harness';
        div.style.width = containerWidth + 'px';
        document.body.appendChild(div);
        return div;
      }

      function measure(el) {
        const svg = el.querySelector('svg');
        if (!svg) return null;
        const svgRect = svg.getBoundingClientRect();
        const systemEls = Array.from(el.querySelectorAll('.abcjs-staff-wrapper'));
        const systemRects = systemEls.map((s) => s.getBoundingClientRect());
        const systemsContentHeight = systemRects.reduce((sum, r) => sum + r.height, 0);
        const topMargin = systemRects.length ? Math.max(0, systemRects[0].top - svgRect.top) : 0;
        const bottomMargin = systemRects.length ? Math.max(0, svgRect.bottom - systemRects[systemRects.length - 1].bottom) : 0;
        let interSystemGap = 0;
        for (let i = 1; i < systemRects.length; i++) {
          interSystemGap += Math.max(0, systemRects[i].top - systemRects[i - 1].bottom);
        }
        return {
          svgHeight: Math.round(svgRect.height),
          svgWidth: Math.round(svgRect.width),
          systems: systemEls.length,
          systemsContentHeight: Math.round(systemsContentHeight),
          topMargin: Math.round(topMargin),
          bottomMargin: Math.round(bottomMargin),
          interSystemGap: Math.round(interSystemGap),
        };
      }

      // IMPORTANT DISCOVERY (260712-szw): abcjs's JS-level options.format
      // object is routed through ABCParse.parse's switches.format ->
      // parseDirective.globalFormatting, which only recognizes a small
      // allowlist (font directives, scale, stretchlast, fontboxpadding,
      // stafftopmargin) -- see abcjs src/parse/abc_parse_directive.js
      // globalFormatting. topmargin/botmargin/staffsep/systemsep are NOT in
      // that allowlist and are silently ignored (console warning
      // "Formatting directive unrecognized") when passed via format:.
      // Those keys ARE recognized by oneParameterMeasurement -- but only
      // when written as %%directive value lines INSIDE the ABC text itself
      // (the per-line directive parser, a different code path). So the only
      // way to actually shrink these margins/gaps is to prepend %% directive
      // lines into the abc string, not pass a format object.
      function injectDirectives(abc, directiveLines) {
        if (!directiveLines || directiveLines.length === 0) return abc;
        // Insert right after the K: (key) line -- end of the tune header,
        // before the first music line -- a standard, safe placement. Uses
        // split/slice (no regex capture groups) to avoid escaping pitfalls
        // when this script text travels through the daemon transport.
        const lines = abc.split(String.fromCharCode(10));
        const kIdx = lines.findIndex((l) => l.indexOf('K:') === 0);
        if (kIdx === -1) return directiveLines.concat(lines).join(String.fromCharCode(10));
        const before = lines.slice(0, kIdx + 1);
        const after = lines.slice(kIdx + 1);
        return before.concat(directiveLines, after).join(String.fromCharCode(10));
      }

      function render(directiveLines) {
        const el = freshContainer();
        const abcWithDirectives = injectDirectives(abcBody, directiveLines);
        window.ABCJS.renderAbc(el, abcWithDirectives, {
          add_classes: true,
          scale: 1,
          staffwidth: containerWidth,
          responsive: 'resize',
          format: { stretchlast: 1 },
        });
        return measure(el);
      }

      // (i) baseline — current production options, no vertical-spacing overrides.
      const baseline = render([]);

      // (ii) reduced vertical spacing -- sweep 3 candidate values via %%
      // directive prepend. topmargin/botmargin remove reserved space for
      // absent inline lyrics; staffsep/systemsep tighten inter-system gaps.
      const spacingSweeps = [
        { label: 'spacing-tight', directives: ['%%topmargin 0', '%%botmargin 0', '%%staffsep 20', '%%systemsep 20'] },
        { label: 'spacing-tighter', directives: ['%%topmargin 0', '%%botmargin 0', '%%staffsep 10', '%%systemsep 10'] },
        { label: 'spacing-tightest', directives: ['%%topmargin 0', '%%botmargin 0', '%%staffsep 0', '%%systemsep 0'] },
      ].map((s) => Object.assign({ label: s.label }, render(s.directives)));

      const bestSpacing = spacingSweeps.reduce((a, b) => (b.svgHeight < a.svgHeight ? b : a), spacingSweeps[0]);

      // (iii) height-fit downscale on top of the best spacing candidate — the
      // missing HEIGHT-aware counterpart to AbcPlayer's existing WIDTH-only
      // fit (MOBILE-03). A CSS transform:scale (or an equivalent staffwidth/
      // scale re-render) preserves aspect ratio, so the fitted height is
      // simply svgHeight * fitScaleFactor by construction; what matters is
      // whether this scale-down is NEEDED on top of spacing (i.e. bestSpacing
      // still exceeds availableHeight) or whether spacing alone already fits.
      const fitScaleFactor = availableHeight > 0 && bestSpacing.svgHeight > 0
        ? availableHeight / bestSpacing.svgHeight
        : 1;
      const fittedHeight = Math.round(bestSpacing.svgHeight * fitScaleFactor);

      return { baseline, spacingSweeps, bestSpacing, fitScaleFactor, fittedHeight };
    }, ${JSON.stringify({ abcBody, containerWidth, availableHeight })});

    return result;
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

  // ── Part A (260712-szw): live mobile split-leaf overflow, /psalms/78 ──────
  console.log('\n── Part A: mobile split-leaf overflow (live, best-effort) ──')
  console.log('NOTE: localhost:3005 may currently serve a PRE-fix build — this')
  console.log('measurement is directional only until the batched rebuild.')
  try {
    const result = await runPlaywright(buildMobileOverflowJobScript(), 28000)
    const m = result?.metrics
    if (!m || m.error) {
      console.log(`DIAGNOSTIC-UNAVAILABLE: mobile overflow capture: ${m?.error ?? 'no metrics returned'}`)
    } else {
      const overflow = m.slotScrollHeight > m.slotClientHeight + 2
      console.log(
        `RESULT [mobile split /psalms/78] slotClient=${m.slotClientHeight} slotScroll=${m.slotScrollHeight} overflow=${overflow ? 'yes' : 'no'} svg=${m.svgWidth}x${m.svgHeight} systems=${m.systems}`,
      )
    }
  } catch (e) {
    console.log(`DIAGNOSTIC-UNAVAILABLE: mobile overflow capture failed: ${e.message}`)
  }

  // ── Part B (260712-szw): dev-server-independent abcjs harness — decisive ──
  console.log('\n── Part B: abcjs-direct harness (dev-server-independent, decisive) ──')
  try {
    const harness = await runPlaywright(
      buildAbcjsHarnessScript({
        abcBody: CM_ABC_BODY,
        containerWidth: HARNESS_CONTAINER_WIDTH,
        availableHeight: HARNESS_AVAILABLE_HEIGHT,
      }),
      28000,
    )
    const { baseline, spacingSweeps, bestSpacing, fitScaleFactor, fittedHeight } = harness ?? {}
    if (!baseline) {
      console.log('DIAGNOSTIC-UNAVAILABLE: abcjs harness returned no baseline metrics')
    } else {
      console.log(
        `BASELINE  svgHeight=${baseline.svgHeight} systems=${baseline.systems} systemsContent=${baseline.systemsContentHeight} interSystemGap=${baseline.interSystemGap} topMargin=${baseline.topMargin} bottomMargin=${baseline.bottomMargin}`,
      )
      for (const s of spacingSweeps ?? []) {
        console.log(
          `SWEEP ${s.label.padEnd(16)} svgHeight=${s.svgHeight} systemsContent=${s.systemsContentHeight} interSystemGap=${s.interSystemGap} topMargin=${s.topMargin} bottomMargin=${s.bottomMargin}`,
        )
      }
      console.log(
        `BEST-SPACING ${bestSpacing.label}: svgHeight=${bestSpacing.svgHeight} (available=${HARNESS_AVAILABLE_HEIGHT})`,
      )
      console.log(
        `FIT-SCALE fitScaleFactor=${fitScaleFactor?.toFixed(3)} fittedHeight=${fittedHeight} (target=${HARNESS_AVAILABLE_HEIGHT})`,
      )

      const spacingOnly = bestSpacing.svgHeight <= HARNESS_AVAILABLE_HEIGHT
      const needsFitScale = !spacingOnly

      console.log('\n── VERDICT ──')
      console.log(
        `Does spacing-reduction ALONE bring the 4-system CM under ${HARNESS_AVAILABLE_HEIGHT}px? ${spacingOnly ? 'YES' : 'NO'} (reaches ${bestSpacing.svgHeight}px via ${bestSpacing.label})`,
      )
      console.log(`Is a height-fit scale REQUIRED on top of spacing? ${needsFitScale ? 'YES' : 'NO'}`)
      console.log(
        `Baseline vertical budget: systemsContent=${baseline.systemsContentHeight}px interSystemGap=${baseline.interSystemGap}px topMargin=${baseline.topMargin}px bottomMargin=${baseline.bottomMargin}px (total svgHeight=${baseline.svgHeight}px)`,
      )
      console.log(
        `VERDICT spacing-only=${spacingOnly ? 'yes' : 'no'} needs-fit-scale=${needsFitScale ? 'yes' : 'no'} baselineH=${baseline.svgHeight} spacingH=${bestSpacing.svgHeight} fittedH=${fittedHeight}`,
      )
    }
  } catch (e) {
    console.log(`DIAGNOSTIC-UNAVAILABLE: abcjs harness failed: ${e.message}`)
  }

  process.exit(0)
}

main().catch((e) => {
  console.log(`DIAGNOSTIC-UNAVAILABLE: unexpected error: ${e?.message ?? e}`)
  process.exit(0)
})
