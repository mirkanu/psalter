// Wave 2 UAT for Ellacomb (tune id 18, CM, psalm 99) — runs AFTER Task 4 build+restart.
// Uses shared Playwright WebKit daemon (port 3100) with iPhone13 viewport.
// Primary target per project memory `feedback_mobile_priority_zero_overlap`.
//
// Test path: /tunes/ellacomb → click "Notation" tab → abcjs SVG should render.
// (The psalm 99 detail page defaults to Split-Leaf because the scanned JPG is
// not available for Ellacomb, so we verify the digitised ABC on the tune page
// where it is the only rendering option.)

// Daemon wraps script as `new AsyncFunction('page', 'browser', job.script)` —
// no `fs`, `process`, etc. in scope. Screenshots are saved relative to CWD.

const UAT_URL = process.env.UAT_URL || 'https://psalter.gsdlabs.dev'
const WK = process.env.PLAYWRIGHT_WEBKIT_DAEMON_URL || 'http://localhost:3100'
const CHROMIUM = process.env.PLAYWRIGHT_DAEMON_URL || 'http://localhost:3099'

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

  // (page, browser) passed in by daemon — DO NOT redeclare
  const script = `
    const pw = await import('/usr/lib/node_modules/playwright/index.js');
    const devices = pw.default.devices;
    const ctx = await browser.newContext({ ...devices['${deviceName}'] });
    const p = await ctx.newPage();
    try {
      await p.goto('${UAT_URL}/tunes/ellacomb', { waitUntil: 'networkidle', timeout: 30000 });
      await p.waitForTimeout(1500);

      // Click "Notation" tab
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
      // Let abcjs render
      await p.waitForTimeout(3000);

      const info = await p.evaluate(() => {
        const svg = document.querySelector('.abcjs-container svg');
        if (!svg) return { error: 'no .abcjs-container svg after Notation click' };
        const notes = svg.querySelectorAll('.abcjs-note path');
        const staves = svg.querySelectorAll('.abcjs-staff');
        const viewBox = svg.getAttribute('viewBox');
        // abcjs renders title in <text class="abcjs-title"> element
        const titleEl = svg.querySelector('.abcjs-title');
        const titleText = titleEl ? (titleEl.textContent || '').trim() : null;
        return {
          noteCount: notes.length,
          staffCount: staves.length,
          viewBox,
          titleText,
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
        titleText: info.titleText,
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
      // Ellacomb CM has 28 syllables → 28 notes from MusicXML.
      // Allow margin: 20+ notes (abcjs may consolidate or omit rest notes).
      if (result.noteCount < 20) {
        console.error(`FAIL [${vp.label}]: expected >= 20 notes (28 expected) — got ${result.noteCount}`)
        errors.push(`${vp.label}: too few notes`)
        continue
      }
      if (!result.viewBox) {
        console.error(`FAIL [${vp.label}]: no viewBox on abcjs SVG`)
        errors.push(`${vp.label}: missing viewBox`)
        continue
      }
      if (!/ellacomb/i.test(result.titleText || '')) {
        console.error(`FAIL [${vp.label}]: tune title missing "Ellacomb" — got: "${result.titleText}"`)
        errors.push(`${vp.label}: title mismatch`)
        continue
      }
      console.log(`PASS [${vp.label}]: tab="${result.clickedTab}" notes=${result.noteCount} staves=${result.staffCount} vb="${result.viewBox}"`)
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
  console.log('\nPASS — Ellacomb abc_notation renders on iPhone13 and Pixel5')
  process.exit(0)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
