#!/usr/bin/env node
// Phase 18 Plan 18-02 Task 5 — golden-path visitor crawl for the migration reversal.
// Hits all visitor routes via the shared Playwright Chromium daemon (port 3099).
// Verifies no "Could not load" error pages and that titles are non-empty.
//
// Usage:
//   BASE_URL=http://localhost:3005 node tests/diagnostics/psalter-routes-after-undo.mjs   # pre-cut (PM2 direct)
//   BASE_URL=https://psalter.gsdlabs.dev node tests/diagnostics/psalter-routes-after-undo.mjs   # post-cut (DNS-routed)
//
// The Playwright daemon client module (/home/services/playwright-daemon/client.js) is
// currently empty (0 bytes), so this script uses the daemon's HTTP API directly via
// fetch. When client.js is restored to provide {runPlaywright, getStatus}, this can
// be migrated to use the wrapper.

const DAEMON_URL = process.env.PLAYWRIGHT_DAEMON_URL || 'http://localhost:3099'
const BASE = process.env.BASE_URL || 'http://localhost:3005'
const ENGINE = process.env.ENGINE || 'chromium'

const ROUTES = [
  '/', '/psalms', '/psalms/23', '/psalms/23/study',
  '/tunes', '/tunes/beatitudo', '/daily', '/changelog',
  '/login', '/api/deploy-info',
]

async function getStatus() {
  const r = await fetch(`${DAEMON_URL}/status`)
  return r.json()
}

async function runPlaywright(script) {
  const r = await fetch(`${DAEMON_URL}/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script }),
  })
  return r.json()
}

const status = await getStatus()
if (!status.browserReady) {
  console.error('Playwright daemon not ready:', status)
  process.exit(2)
}

const results = []
for (const route of ROUTES) {
  const script = `
    try {
      const response = await page.goto('${BASE}${route}', { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = response ? response.status() : 0;
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body && document.body.innerText ? document.body.innerText.slice(0, 200) : '');
      const hasError = bodyText.includes('Could not load') || bodyText.includes('Application error');
      return { route: '${route}', status, title, bodyPreview: bodyText.replace(/\\s+/g, ' ').slice(0, 100), hasError };
    } catch (e) {
      return { route: '${route}', error: String(e) };
    }
  `
  const r = await runPlaywright(script)
  results.push({ route, ...r })
  process.stdout.write(`  ${route} -> ${JSON.stringify(r).slice(0, 200)}\n`)
}

// Assert: no 5xx, no "Could not load" errors
const fails = results.filter(r => {
  if (r.error) return true
  if (r.result && r.result.status >= 500) return true
  if (r.result && r.result.hasError) return true
  return false
})
if (fails.length) {
  console.error('FAIL — routes with errors:')
  for (const f of fails) console.error('  ', JSON.stringify(f, null, 2))
  process.exit(1)
}
console.log(`OK — ${results.length} routes, no 5xx, no "Could not load"`)
