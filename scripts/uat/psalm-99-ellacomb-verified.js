// Wave 1 UAT for psalm 99 (Ellacomb, id 18) — runs AFTER Task 4 build+restart.
// Uses shared Playwright WebKit daemon (port 3100) with iPhone13 viewport.
// Primary target per project memory `feedback_mobile_priority_zero_overlap`.
// Secondary check: Chromium daemon (port 3099) on Pixel5.
//
// Assertion shape mirrors scripts/uat/psalm-23-crimond-verified.js but
// redirects to the shared daemons instead of spawning raw chromium.launch.
//
// IMPORTANT: This script does NOT trigger a build/restart. If Task 4 has not
// run, the live page will not yet contain the lyric and the script reports
// "page not yet deployed" + exits non-zero.

const fs = require('node:fs')
const path = require('path')

const UAT_URL = process.env.UAT_URL || 'https://psalter.gsdlabs.dev'
const WK = process.env.PLAYWRIGHT_WEBKIT_DAEMON_URL || 'http://localhost:3100'
const CHROMIUM = process.env.PLAYWRIGHT_DAEMON_URL || 'http://localhost:3099'
const SHOTS_DIR = path.join(process.cwd(), 'scripts/uat/screenshots')

const VIEWPORTS = [
  { daemonUrl: WK, device: 'iPhone 13', label: 'iphone13' },
  { daemonUrl: CHROMIUM, device: 'Pixel 5', label: 'pixel5' },
]

async function getStatus(daemonUrl) {
  const r = await fetch(`${daemonUrl}/status`)
  return r.json()
}

async function runPlaywright(script, daemonUrl) {
  const r = await fetch(`${daemonUrl}/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script }),
  })
  const data = await r.json()
  if (data.error) throw new Error(data.error)
  return data.result
}

async function verifyOnDevice(daemonUrl, deviceName, label) {
  const status = await getStatus(daemonUrl)
  if (!status.browserReady) {
    throw new Error(`${label} daemon not ready (${daemonUrl})`)
  }

  const script = `
    const { webkit, chromium, devices } = require('playwright');
    const engine = ${daemonUrl === WK ? "'webkit'" : "'chromium'"};
    const launch = engine === 'webkit' ? webkit.launch : chromium.launch;
    const browser = await launch();
    const ctx = await browser.newContext({ ...devices['${deviceName}'] });
    const page = await ctx.newPage();
    try {
      await page.goto('${UAT_URL}/psalms/99', { waitUntil: 'networkidle', timeout: 30000 });
      // let iOS Safari settle ~1.5s per project memory feedback_ios_viewport_settle_resizeobserver
      await page.waitForTimeout(2000);

      const svgCount = await page.locator('.abcjs-container svg').count();
      if (svgCount === 0) {
        return { ok: false, reason: 'no .abcjs-container svg found — page may not be deployed yet' };
      }

      // Inspect abcjs lyric tspans (the runtime w: lines emitted by NotationRenderer)
      const lineLayout = await page.evaluate(() => {
        const svg = document.querySelector('.abcjs-container svg');
        const all = Array.from(svg.querySelectorAll('text.abcjs-lyric'));
        const byLine = new Map();
        for (const t of all) {
          const cls = t.getAttribute('class') || '';
          const m = cls.match(/abcjs-l(\\d+)/);
          if (!m) continue;
          const li = Number(m[1]);
          const arr = byLine.get(li) ?? [];
          arr.push((t.textContent || '').trim());
          byLine.set(li, arr);
        }
        return { lineCount: byLine.size, byLine: Object.fromEntries(byLine) };
      });

      const line0Text = (lineLayout.byLine[0] || []).join(' ').toLowerCase();
      const populatedCount0 = (lineLayout.byLine[0] || []).filter((t) => t.length > 0).length;

      fs.mkdirSync('${SHOTS_DIR}', { recursive: true });
      await page.screenshot({ path: '${SHOTS_DIR}/psalm-99-ellacomb-verified-${label}.png', fullPage: false });

      return {
        ok: true,
        line0Text,
        populatedCount0,
        lineCount: lineLayout.lineCount,
      };
    } catch (err) {
      return { ok: false, reason: 'exception: ' + err.message };
    } finally {
      await page.close();
      await ctx.close();
      await browser.close();
    }
  `

  return runPlaywright(script, daemonUrl)
}

async function main() {
  // Import client for fs.mkdirSync in the eval context — we need fs available in
  // the daemon job's node scope. The eval'd script can require('node:fs') itself.
  const errors = []
  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.label} (${vp.daemonUrl}) ===`)
    try {
      const result = await verifyOnDevice(vp.daemonUrl, vp.device, vp.label)
      if (!result.ok) {
        console.error(`FAIL [${vp.label}]: ${result.reason}`)
        errors.push(`${vp.label}: ${result.reason}`)
        continue
      }
      // We DO accept "_" continuation tokens in line 0; the rendered tspan text
      // for "_" is empty string (abcjs renders no glyph). So we count populated
      // non-empty tspans and accept >= 6 (8 CM syllables minus the 2 melisma
      // continuations in Ellacomb phrase 1 = 6 + the empty `_` tspans).
      const m = result.line0Text.match(/eternal lord/i) || result.line0Text.match(/e[-\\s]?ter/)
      if (!m) {
        console.error(`FAIL [${vp.label}]: line 0 lyric missing "eternal lord" — got: "${result.line0Text}"`)
        errors.push(`${vp.label}: line 0 lyric mismatch`)
        continue
      }
      if (result.populatedCount0 < 6) {
        console.error(`FAIL [${vp.label}]: expected >= 6 populated lyric tspans on line 0 — got ${result.populatedCount0}`)
        errors.push(`${vp.label}: too few tspans`)
        continue
      }
      if (result.lineCount < 4) {
        console.error(`FAIL [${vp.label}]: expected >= 4 sub-staff lyric lines — got ${result.lineCount}`)
        errors.push(`${vp.label}: too few lyric lines`)
        continue
      }
      console.log(`PASS [${vp.label}]: line0="${result.line0Text}" populated=${result.populatedCount0} lines=${result.lineCount}`)
    } catch (err) {
      console.error(`FAIL [${vp.label}]: ${err.message}`)
      errors.push(`${vp.label}: ${err.message}`)
    }
  }

  if (errors.length) {
    console.log('\n=== SUMMARY ===')
    console.log(`FAIL — ${errors.length} viewport(s) failed`)
    process.exit(1)
  }
  console.log('\nPASS — Psalm 99 verified w-line renders on iPhone13 and Pixel5')
  process.exit(0)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})