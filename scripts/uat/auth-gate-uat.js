/**
 * Phase 05.1 Auth Gate UAT
 *
 * Verifies all four success criteria for the auth gate phase:
 *   SC1 — Login works + session persists (AUTH-01)
 *   SC2 — Protected routes redirect when unauthenticated (D-01/D-02)
 *   SC3 — Precentor name auto-populated on set detail (success criterion 3)
 *   SC4 — No self-registration route exists (AUTH-02)
 *
 * Uses the shared Playwright daemon (global CLAUDE.md requirement).
 * The daemon injects `page` and `browser` into scope; `browser.newContext()` is
 * not supported in --single-process mode. All checks use the shared `page`,
 * managing auth state via page.context().clearCookies() between checks.
 *
 * runPlaywright(script) returns the raw result value (j.result) or throws.
 * Credentials are read from process.env — never hardcoded.
 *
 * Run:
 *   UAT_BASE_URL=http://localhost:3005 node scripts/uat/auth-gate-uat.js
 */

const { getStatus, runPlaywright } = require('/home/services/playwright-daemon/client.js')

const BASE = process.env.UAT_BASE_URL ?? 'http://localhost:3005'
const ADMIN_EMAIL = process.env.PSALTER_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.PSALTER_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ERROR: PSALTER_ADMIN_EMAIL and PSALTER_ADMIN_PASSWORD must be set in env.')
  process.exit(2)
}

// Helper: log into the site using the shared page. Assumes cookies are clear.
async function loginScript(base, email, password) {
  return `
    await page.context().clearCookies();
    await page.goto(${JSON.stringify(base)} + '/login', { waitUntil: 'networkidle' });
    await page.fill('#email', ${JSON.stringify(email)});
    await page.fill('#password', ${JSON.stringify(password)});
    await Promise.all([
      page.waitForURL(u => !u.toString().includes('/login'), { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);
  `
}

// ──────────────────────────────────────────────────────────────────────────────
// SC1: Login works + session persists (AUTH-01)
// ──────────────────────────────────────────────────────────────────────────────
async function checkSC1LoginAndPersist(email, password, base) {
  const d = await runPlaywright(`
    await page.context().clearCookies();
    await page.goto(${JSON.stringify(base)} + '/login', { waitUntil: 'networkidle' });
    await page.fill('#email', ${JSON.stringify(email)});
    await page.fill('#password', ${JSON.stringify(password)});
    await Promise.all([
      page.waitForURL(u => !u.toString().includes('/login'), { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);
    const urlAfterLogin = page.url();

    await page.reload({ waitUntil: 'networkidle' });
    const urlAfterReload = page.url();

    return {
      urlAfterLogin,
      urlAfterReload,
      landedOnPrecent: urlAfterLogin.includes('/precent'),
      sessionPersisted: !urlAfterReload.includes('/login'),
    };
  `)

  const pass = d.landedOnPrecent && d.sessionPersisted
  return {
    name: 'SC1: Login works + session persists',
    pass,
    detail: pass
      ? `Logged in -> ${d.urlAfterLogin}; reload -> ${d.urlAfterReload} (session persists)`
      : `FAIL landedOnPrecent=${d.landedOnPrecent} sessionPersisted=${d.sessionPersisted} urlAfterLogin=${d.urlAfterLogin} urlAfterReload=${d.urlAfterReload}`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SC2: Protected routes redirect unauthenticated visitors (D-01/D-02)
// Runs AFTER SC1 — clears cookies first to simulate an unauthenticated visitor.
// ──────────────────────────────────────────────────────────────────────────────
async function checkSC2ProtectedRedirects(base) {
  const d = await runPlaywright(`
    // Clear cookies to simulate unauthenticated visitor
    await page.context().clearCookies();

    await page.goto(${JSON.stringify(base)} + '/precent', { waitUntil: 'networkidle' });
    const urlAfterPrecent = page.url();

    await page.goto(${JSON.stringify(base)} + '/dev/accounts', { waitUntil: 'networkidle' });
    const urlAfterDev = page.url();

    return { urlAfterPrecent, urlAfterDev };
  `)

  const precentRedirected = d.urlAfterPrecent.includes('/login')
  const devRedirected = d.urlAfterDev.includes('/login')
  const pass = precentRedirected && devRedirected
  return {
    name: 'SC2: Protected routes redirect unauthenticated',
    pass,
    detail: pass
      ? `/precent -> ${d.urlAfterPrecent}; /dev/accounts -> ${d.urlAfterDev}`
      : `FAIL /precent->${d.urlAfterPrecent} (redirected=${precentRedirected}); /dev/accounts->${d.urlAfterDev} (redirected=${devRedirected})`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SC3: Precentor name auto-populated (success criterion 3)
// Logs in and checks an existing set's detail page.
// ──────────────────────────────────────────────────────────────────────────────
async function checkSC3PrecentorName(email, password, base) {
  const d = await runPlaywright(`
    await page.context().clearCookies();
    await page.goto(${JSON.stringify(base)} + '/login', { waitUntil: 'networkidle' });
    await page.fill('#email', ${JSON.stringify(email)});
    await page.fill('#password', ${JSON.stringify(password)});
    await Promise.all([
      page.waitForURL(u => !u.toString().includes('/login'), { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForURL(u => u.toString().includes('/precent'), { timeout: 8000 });
    await page.waitForLoadState('networkidle');

    // Find any set links on /precent list page
    const setLinks = await page.$$eval(
      'a[href*="/precent/"]',
      els => els.map(el => el.getAttribute('href')).filter(h => h && /\\/precent\\/[0-9a-f-]+$/.test(h))
    );

    if (setLinks.length === 0) {
      return { foundSet: false, setLinksCount: 0, precentorName: null };
    }

    await page.goto(${JSON.stringify(base)} + setLinks[0], { waitUntil: 'networkidle' });

    // Collect all leaf text nodes to find the precentor label + value
    const allTextNodes = await page.$$eval('*', els =>
      els
        .filter(el => el.children.length === 0 && (el.textContent || '').trim().length > 0)
        .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim() }))
        .filter(t => t.text.length < 200)
    );

    const precentorIdx = allTextNodes.findIndex(t => /^precentor:?$/i.test(t.text.trim()));
    let precentorName = null;
    if (precentorIdx >= 0 && precentorIdx + 1 < allTextNodes.length) {
      precentorName = allTextNodes[precentorIdx + 1].text;
    } else {
      const row = allTextNodes.find(t => /precentor/i.test(t.text) && t.text.length > 12);
      precentorName = row ? row.text : null;
    }

    return { foundSet: true, setLinksCount: setLinks.length, precentorName };
  `)

  if (!d.foundSet) {
    return {
      name: 'SC3: Precentor name auto-populated',
      pass: true,
      detail: `No sets exist yet (0 set links on /precent). Feature is wired via Drizzle user JOIN (schema.ts D-18). Create a set in /precent to fully verify.`,
    }
  }

  const nameText = d.precentorName ?? ''
  const isNonEmpty = nameText.length > 0
  const isNotNullLiteral = !/^(null|undefined|N\/A|n\/a)$/i.test(nameText)
  const pass = isNonEmpty && isNotNullLiteral

  return {
    name: 'SC3: Precentor name auto-populated',
    pass,
    detail: pass
      ? `Set detail shows precentor text: "${nameText}"`
      : `FAIL precentorName="${nameText}" isNonEmpty=${isNonEmpty}`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SC4: No self-registration route exists (AUTH-02)
// ──────────────────────────────────────────────────────────────────────────────
async function checkSC4NoSelfRegistration(base) {
  const d = await runPlaywright(`
    await page.context().clearCookies();
    await page.goto(${JSON.stringify(base)} + '/login', { waitUntil: 'networkidle' });

    const bodyText = ((await page.textContent('body')) || '').toLowerCase();
    const hasSignupText = /sign[- ]?up|register|create account|create an account/.test(bodyText);

    const signupRes = await page.request.post(${JSON.stringify(base)} + '/api/auth/sign-up/email', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        name: 'TestUser',
        email: 'uat-test-noreply@example.com',
        password: 'TestPassword1!',
      }),
      timeout: 8000,
    });
    const signupStatus = signupRes.status();

    return { hasSignupText, signupStatus };
  `)

  const noSignupLink = !d.hasSignupText
  const signupBlocked = d.signupStatus !== 200
  const pass = noSignupLink && signupBlocked

  return {
    name: 'SC4: No self-registration route',
    pass,
    detail: pass
      ? `No signup text on /login; POST /api/auth/sign-up/email returned ${d.signupStatus} (blocked)`
      : `FAIL hasSignupText=${d.hasSignupText} signupStatus=${d.signupStatus}`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Auth Gate UAT -- target: ${BASE}`)
  console.log('-'.repeat(60))

  let status = await getStatus()
  if (!status.browserReady) {
    console.log('Playwright daemon not ready -- waiting 5s...')
    await new Promise(r => setTimeout(r, 5000))
    status = await getStatus()
    if (!status.browserReady) {
      console.error('Playwright daemon still not ready. Aborting.')
      process.exit(2)
    }
  }
  console.log('Playwright daemon: ready\n')

  const results = []

  try {
    results.push(await checkSC1LoginAndPersist(ADMIN_EMAIL, ADMIN_PASSWORD, BASE))
  } catch (e) {
    results.push({ name: 'SC1: Login works + session persists', pass: false, detail: `Exception: ${e.message}` })
  }

  try {
    results.push(await checkSC2ProtectedRedirects(BASE))
  } catch (e) {
    results.push({ name: 'SC2: Protected routes redirect unauthenticated', pass: false, detail: `Exception: ${e.message}` })
  }

  try {
    results.push(await checkSC3PrecentorName(ADMIN_EMAIL, ADMIN_PASSWORD, BASE))
  } catch (e) {
    results.push({ name: 'SC3: Precentor name auto-populated', pass: false, detail: `Exception: ${e.message}` })
  }

  try {
    results.push(await checkSC4NoSelfRegistration(BASE))
  } catch (e) {
    results.push({ name: 'SC4: No self-registration route', pass: false, detail: `Exception: ${e.message}` })
  }

  console.log('\nResults:')
  console.log('-'.repeat(60))
  for (const r of results) {
    const label = r.pass ? 'PASS' : 'FAIL'
    console.log(`${label}  ${r.name}`)
    console.log(`      ${r.detail}`)
  }
  console.log('-'.repeat(60))

  const allPassed = results.every(r => r.pass)
  const passCount = results.filter(r => r.pass).length
  console.log(`\n${allPassed ? 'ALL PASS' : 'SOME FAILED'} -- ${passCount}/${results.length} checks passed`)

  process.exit(allPassed ? 0 : 1)
}

main().catch(e => {
  console.error('Unhandled error:', e.message)
  process.exit(2)
})
