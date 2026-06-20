/**
 * Phase 05.2 UAT — Footer, Feedback & Analytics
 *
 * Verifies all six requirements for phase 05.2 against the LIVE deployment:
 *   FOOT-01 — Footer exists on homepage with About, Copyright, Feedback buttons and GSD Labs attribution
 *   FOOT-02 — About modal opens with correct title and body text
 *   FOOT-03 — Copyright modal opens with correct title and body text
 *   FOOT-04 — Feedback modal form submits and shows success state
 *   FOOT-05 — /admin-only/feedback redirects unauthenticated visitors to /login
 *   UMAMI-01 — Umami script tag present on homepage with correct src and data-website-id
 *
 * This script is EXPECTED TO FAIL (RED) before Wave 2 builds the features.
 * Wave 2 turns it GREEN.
 *
 * Uses the shared Playwright daemon (global CLAUDE.md requirement).
 * The daemon injects `page` and `browser` into scope.
 * runPlaywright(script) returns the raw result value or throws.
 *
 * Run:
 *   node scripts/uat/phase-05.2-uat.js
 */

const { getStatus, runPlaywright } = require('/home/services/playwright-daemon/client.js')

const BASE = process.env.UAT_BASE_URL ?? 'https://psalter.gsdlabs.dev'

// ──────────────────────────────────────────────────────────────────────────────
// FOOT-01: Footer exists with correct links
// ──────────────────────────────────────────────────────────────────────────────
async function checkFOOT01Footer() {
  const d = await runPlaywright(`
    await page.context().clearCookies();
    await page.goto(${JSON.stringify(BASE)} + '/', { waitUntil: 'networkidle' });

    const footerExists = await page.$('footer') !== null;

    const aboutBtn = await page.$$eval('footer button', btns =>
      btns.some(b => b.textContent.trim() === 'About')
    );
    const copyrightBtn = await page.$$eval('footer button', btns =>
      btns.some(b => b.textContent.trim() === 'Copyright')
    );
    const feedbackBtn = await page.$$eval('footer button', btns =>
      btns.some(b => b.textContent.trim() === 'Feedback')
    );

    const gsdLink = await page.$eval(
      'footer a[href="https://gsdlabs.dev"]',
      el => ({ text: el.textContent.trim(), href: el.getAttribute('href') })
    ).catch(() => null);

    return {
      footerExists,
      aboutBtn,
      copyrightBtn,
      feedbackBtn,
      gsdLink,
    };
  `)

  const pass = d.footerExists && d.aboutBtn && d.copyrightBtn && d.feedbackBtn &&
    d.gsdLink && d.gsdLink.text === 'Made by GSD Labs' && d.gsdLink.href === 'https://gsdlabs.dev'

  return {
    name: 'FOOT-01: Footer with About/Copyright/Feedback/GSD Labs link',
    pass,
    detail: pass
      ? `Footer found; all 3 buttons present; GSD Labs link href=https://gsdlabs.dev`
      : `FAIL footerExists=${d.footerExists} about=${d.aboutBtn} copyright=${d.copyrightBtn} feedback=${d.feedbackBtn} gsdLink=${JSON.stringify(d.gsdLink)}`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// FOOT-02: About modal opens with correct title and body
// ──────────────────────────────────────────────────────────────────────────────
async function checkFOOT02AboutModal() {
  const d = await runPlaywright(`
    await page.context().clearCookies();
    await page.goto(${JSON.stringify(BASE)} + '/', { waitUntil: 'networkidle' });

    // Click the About button in the footer
    const aboutBtn = await page.$$eval('footer button', btns => {
      const btn = btns.find(b => b.textContent.trim() === 'About');
      if (btn) btn.click();
      return !!btn;
    });

    if (!aboutBtn) return { clicked: false };

    // Wait for dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    const title = await page.$eval('[role="dialog"] h2', el => el.textContent.trim()).catch(() => null);
    const bodyText = await page.$eval('[role="dialog"]', el => el.textContent).catch(() => '');

    return {
      clicked: true,
      title,
      hasDigitalEdition: bodyText.includes('digital edition of the Scottish Metrical Psalter'),
    };
  `)

  const pass = d.clicked && d.title === 'About this Psalter' && d.hasDigitalEdition

  return {
    name: 'FOOT-02: About modal title and body',
    pass,
    detail: pass
      ? `About modal: title="${d.title}" body contains expected text`
      : `FAIL clicked=${d.clicked} title="${d.title}" hasDigitalEdition=${d.hasDigitalEdition}`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// FOOT-03: Copyright modal opens with correct title and body
// ──────────────────────────────────────────────────────────────────────────────
async function checkFOOT03CopyrightModal() {
  const d = await runPlaywright(`
    await page.context().clearCookies();
    await page.goto(${JSON.stringify(BASE)} + '/', { waitUntil: 'networkidle' });

    const copyrightBtn = await page.$$eval('footer button', btns => {
      const btn = btns.find(b => b.textContent.trim() === 'Copyright');
      if (btn) btn.click();
      return !!btn;
    });

    if (!copyrightBtn) return { clicked: false };

    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    const title = await page.$eval('[role="dialog"] h2', el => el.textContent.trim()).catch(() => null);
    const bodyText = await page.$eval('[role="dialog"]', el => el.textContent).catch(() => '');

    return {
      clicked: true,
      title,
      hasPublicDomain: bodyText.includes('1650 Scottish Psalter, which is in the public domain'),
    };
  `)

  const pass = d.clicked && d.title === 'Copyright Notice' && d.hasPublicDomain

  return {
    name: 'FOOT-03: Copyright modal title and body',
    pass,
    detail: pass
      ? `Copyright modal: title="${d.title}" body contains expected text`
      : `FAIL clicked=${d.clicked} title="${d.title}" hasPublicDomain=${d.hasPublicDomain}`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// FOOT-04: Feedback modal form fields present + submit succeeds
// ──────────────────────────────────────────────────────────────────────────────
async function checkFOOT04FeedbackModal() {
  const marker = `UAT-${Date.now()}`

  const d = await runPlaywright(`
    await page.context().clearCookies();
    await page.goto(${JSON.stringify(BASE)} + '/', { waitUntil: 'networkidle' });

    const feedbackBtn = await page.$$eval('footer button', btns => {
      const btn = btns.find(b => b.textContent.trim() === 'Feedback');
      if (btn) btn.click();
      return !!btn;
    });

    if (!feedbackBtn) return { clicked: false };

    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Check form fields exist
    const hasTextarea = await page.$('[role="dialog"] textarea') !== null;
    const hasNameField = await page.$('[role="dialog"] input[type="text"]') !== null;
    const hasEmailField = await page.$('[role="dialog"] input[type="email"]') !== null;
    const hasUrlCheckbox = await page.$('[role="dialog"] [role="checkbox"], [role="dialog"] input[type="checkbox"]') !== null;

    // Check submit button
    const hasSubmitBtn = await page.$$eval('[role="dialog"] button', btns =>
      btns.some(b => /send feedback/i.test(b.textContent))
    );

    // Fill textarea and submit
    await page.fill('[role="dialog"] textarea', ${JSON.stringify(marker)});
    await page.click('[role="dialog"] button[type="submit"]');

    // Wait for success state
    let successText = null;
    try {
      await page.waitForFunction(
        () => document.querySelector('[role="dialog"]')?.textContent?.includes('Thank you for your feedback'),
        { timeout: 8000 }
      );
      successText = await page.$eval('[role="dialog"]', el => el.textContent);
    } catch (e) {
      successText = null;
    }

    return {
      clicked: true,
      hasTextarea,
      hasNameField,
      hasEmailField,
      hasUrlCheckbox,
      hasSubmitBtn,
      successHeading: successText ? successText.includes('Thank you for your feedback') : false,
    };
  `)

  const pass = d.clicked && d.hasTextarea && d.hasNameField && d.hasEmailField &&
    d.hasUrlCheckbox && d.hasSubmitBtn && d.successHeading

  return {
    name: 'FOOT-04: Feedback modal form + submission success',
    pass,
    detail: pass
      ? `Feedback form: all fields present; submission succeeded with "Thank you for your feedback" heading (marker: ${marker})`
      : `FAIL clicked=${d.clicked} textarea=${d.hasTextarea} name=${d.hasNameField} email=${d.hasEmailField} urlCheckbox=${d.hasUrlCheckbox} submitBtn=${d.hasSubmitBtn} successHeading=${d.successHeading}`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// FOOT-05: /admin-only/feedback redirects unauthenticated visitors to /login
// Note: Full admin-list assertion requires an authenticated admin session.
// This check verifies the auth gate only (unauthenticated → /login redirect).
// ──────────────────────────────────────────────────────────────────────────────
async function checkFOOT05AdminRedirect() {
  const d = await runPlaywright(`
    await page.context().clearCookies();
    await page.goto(${JSON.stringify(BASE)} + '/admin-only/feedback', { waitUntil: 'networkidle' });
    return { finalUrl: page.url() };
  `)

  const redirectedToLogin = d.finalUrl.includes('/login')

  return {
    name: 'FOOT-05: /admin-only/feedback redirects unauthenticated to /login',
    pass: redirectedToLogin,
    detail: redirectedToLogin
      ? `Unauthenticated /admin-only/feedback → redirected to ${d.finalUrl}`
      : `FAIL finalUrl=${d.finalUrl} (expected /login redirect)`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// UMAMI-01: Umami script tag present on homepage with correct src + data-website-id
// ──────────────────────────────────────────────────────────────────────────────
async function checkUMAMI01Script() {
  const d = await runPlaywright(`
    await page.context().clearCookies();
    await page.goto(${JSON.stringify(BASE)} + '/', { waitUntil: 'networkidle' });

    const script = await page.$eval(
      'script[src="https://umami.gsdlabs.dev/script.js"]',
      el => ({
        src: el.getAttribute('src'),
        websiteId: el.getAttribute('data-website-id'),
      })
    ).catch(() => null);

    return { script };
  `)

  const scriptExists = !!d.script
  const hasSrc = scriptExists && d.script.src === 'https://umami.gsdlabs.dev/script.js'
  const hasWebsiteId = scriptExists && d.script.websiteId && d.script.websiteId.length > 0
  const pass = hasSrc && hasWebsiteId

  return {
    name: 'UMAMI-01: Umami script tag with src + data-website-id',
    pass,
    detail: pass
      ? `Umami script found: src=${d.script.src} data-website-id=${d.script.websiteId}`
      : `FAIL scriptExists=${scriptExists} hasSrc=${hasSrc} hasWebsiteId=${hasWebsiteId}`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Phase 05.2 UAT -- target: ${BASE}`)
  console.log('NOTE: This script is expected to FAIL (RED) before Wave 2 builds the features.')
  console.log('-'.repeat(70))

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

  const checks = [
    checkFOOT01Footer,
    checkFOOT02AboutModal,
    checkFOOT03CopyrightModal,
    checkFOOT04FeedbackModal,
    checkFOOT05AdminRedirect,
    checkUMAMI01Script,
  ]

  const results = []
  for (const check of checks) {
    try {
      results.push(await check())
    } catch (e) {
      const name = check.name.replace(/^check/, '').replace(/([A-Z])/g, ' $1').trim()
      results.push({ name, pass: false, detail: `Exception: ${e.message}` })
    }
  }

  console.log('\nResults:')
  console.log('-'.repeat(70))
  for (const r of results) {
    const label = r.pass ? 'PASS' : 'FAIL'
    console.log(`${label}  ${r.name}`)
    console.log(`      ${r.detail}`)
  }
  console.log('-'.repeat(70))

  const failures = results.filter(r => !r.pass).length
  const passCount = results.length - failures
  console.log(`\n${failures === 0 ? 'ALL PASS' : 'SOME FAILED'} -- ${passCount}/${results.length} checks passed`)

  process.exit(failures > 0 ? 1 : 0)
}

main().catch(e => {
  console.error('Unhandled error:', e.message)
  process.exit(2)
})
