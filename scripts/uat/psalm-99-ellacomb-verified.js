// Wave 2 UAT for Ellacomb (tune id 18, CM, psalm 99) — runs AFTER Task 4 build+restart.
// Uses shared Playwright WebKit daemon (port 3100) with iPhone13 viewport.
// Primary target per project memory `feedback_mobile_priority_zero_overlap`.
//
// Test path: /tunes/ellacomb → click "Notation" tab → abcjs SVG should render.
// (The psalm 99 detail page defaults to Split-Leaf because the scanned JPG is
// not available for Ellacomb, so we verify the digitised ABC on the tune page
// where it is the only rendering option.)
//
// Daemon wraps script as `new AsyncFunction('page', 'browser', job.script)` —
// no `fs`, `process`, etc. in scope. Screenshots are saved relative to CWD.

const UAT_URL = process.env.UAT_URL || 'https://psalter.gsdlabs.dev'
const WK = process.env.PLAYWRIGHT_WEBKIT_DAEMON_URL || 'http://localhost:3100'
const CHROMIUM = process.env.PLAYWRIGHT_DAEMON_URL || 'http://localhost:3099'

// WebKit (iPhone 13) is the primary target. Chromium is best-effort because
// the chromium daemon currently relaunches its browser in a loop.
const VIEWPORTS = [
  { daemonUrl: WK, device: 'iPhone 13', label: 'iphone13', primary: true },
  { daemonUrl: CHROMIUM, device: 'Pixel 5', label: 'pixel5', primary: false },
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

  // (page, browser) passed in by daemon — DO NOT redeclare
  const script = `
    const pw = await import('/usr/lib/node_modules/playwright/index.js');
    const devices = pw.default.devices;
    const ctx = await browser.newContext({ ...devices['${deviceName}'] });
    const p = await ctx.newPage();
    try {
      await p.goto('${UAT_URL}/tunes/ellacomb', { waitUntil: 'networkidle', timeout: 30000 });
      await p.waitForTimeout(1500);

      const clicked = await p.evaluate(() => {
        const all = Array.from(document.querySelectorAll('button, a, [role="tab"]'));
        const btn = all.find(el => /notation/i.test(el.textContent || ''));
        if (!btn) return null;
        btn.click();
        return btn.textContent.trim();
      });
      if (!clicked) {
        return { ok: false, reason: 'no Notation tab found on /tunes/ellacomb' };
      }
      await p.waitForTimeout(3000);

      const info = await p.evaluate(() => {
        const svg = document.querySelector('.abcjs-container svg');
        if (!svg) return { error: 'no .abcjs-container svg after Notation click' };
        const noteGroups = svg.querySelectorAll('.abcjs-note').length;
        const staves = svg.querySelectorAll('.abcjs-staff').length;
        const viewBox = svg.getAttribute('viewBox');
        // Tune page renders the tune name in <h1> outside the SVG; the abcjs
        // SVG itself only has the generic <title>Sheet Music</title> element.
        const pageH1 = document.querySelector('h1')?.textContent?.trim() || '';
        return {
          noteCount: noteGroups,
          staffCount: staves,
          viewBox,
          pageH1,
        };
      });
      if (info.error) return { ok: false, reason: info.error };

      await p.screenshot({ path: 'scripts/uat/screenshots/psalm-99-ellacomb-verified-${label}.png', fullPage: false });

      return {
        ok: true,
        clickedTab: clicked,
        noteCount: info.noteCount,
        staffCount: info.staffCount,
        viewBox: info.viewBox,
        pageH1: info.pageH1,
      };
    } catch (err) {
      return { ok: false, reason: 'exception: ' + err.message };
    } finally {
      await p.close();
      await ctx.close();
    }
  `

  return runPlaywright(script, daemonUrl)
}

async function main() {
  const primaryErrors = []
  const secondaryErrors = []
  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.label} (${vp.daemonUrl}) ===`)
    try {
      const result = await verifyOnDevice(vp.daemonUrl, vp.device, vp.label)
      if (!result.ok) {
        console.error(`FAIL [${vp.label}]: ${result.reason}`)
        if (vp.primary) primaryErrors.push(`${vp.label}: ${result.reason}`)
        else secondaryErrors.push(`${vp.label}: ${result.reason}`)
        continue
      }
      // Ellacomb CM has 28 syllables → 28 notes from MusicXML. abcjs counts
      // note groups (heads + stems), allow 24-36 range.
      if (result.noteCount < 24 || result.noteCount > 36) {
        const msg = `expected 24-36 note groups (28 expected) — got ${result.noteCount}`
        console.error(`FAIL [${vp.label}]: ${msg}`)
        if (vp.primary) primaryErrors.push(`${vp.label}: ${msg}`)
        else secondaryErrors.push(`${vp.label}: ${msg}`)
        continue
      }
      // Ellacomb CM has 4 phrases → 4 staff systems.
      if (result.staffCount !== 4) {
        const msg = `expected 4 staff systems (4 phrases) — got ${result.staffCount}`
        console.error(`FAIL [${vp.label}]: ${msg}`)
        if (vp.primary) primaryErrors.push(`${vp.label}: ${msg}`)
        else secondaryErrors.push(`${vp.label}: ${msg}`)
        continue
      }
      if (!result.viewBox) {
        const msg = 'no viewBox on abcjs SVG'
        console.error(`FAIL [${vp.label}]: ${msg}`)
        if (vp.primary) primaryErrors.push(`${vp.label}: ${msg}`)
        else secondaryErrors.push(`${vp.label}: ${msg}`)
        continue
      }
      if (!/ellacomb/i.test(result.pageH1 || '')) {
        const msg = `tune page h1 missing "Ellacomb" — got: "${result.pageH1}"`
        console.error(`FAIL [${vp.label}]: ${msg}`)
        if (vp.primary) primaryErrors.push(`${vp.label}: ${msg}`)
        else secondaryErrors.push(`${vp.label}: ${msg}`)
        continue
      }
      console.log(`PASS [${vp.label}]: tab="${result.clickedTab}" notes=${result.noteCount} staves=${result.staffCount} h1="${result.pageH1}" vb="${result.viewBox}"`)
    } catch (err) {
      console.error(`FAIL [${vp.label}]: ${err.message}`)
      if (vp.primary) primaryErrors.push(`${vp.label}: ${err.message}`)
      else secondaryErrors.push(`${vp.label}: ${err.message}`)
    }
  }

  console.log('\n=== SUMMARY ===')
  if (primaryErrors.length) {
    console.log(`FAIL — ${primaryErrors.length} PRIMARY viewport(s) failed (iPhone 13 WebKit)`)
    console.log(`       ${secondaryErrors.length} secondary (Pixel 5 Chromium) failed (best-effort)`)
    process.exit(1)
  }
  if (secondaryErrors.length) {
    console.log(`PASS on iPhone 13 — ${secondaryErrors.length} secondary Chromium check(s) failed (best-effort, daemon flakiness, not blocking)`)
  } else {
    console.log(`PASS — Ellacomb abc_notation renders on iPhone13 and Pixel5`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
