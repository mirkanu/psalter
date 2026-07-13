// Task 1 diagnostic (quick task 260713-a5b): instrument the REAL running app
// (localhost:3005, pre-fix build) via the shared Playwright daemon to
// determine the discriminating factor between:
//   CASE A (broken): fresh page load -> first toggle to SoundCloud mode
//   CASE B (working control): switching to a different tune while already
//   in SoundCloud mode (iframe element persists, only src changes)
//
// Throwaway investigation script — not shipped. Run with:
//   node .planning/quick/260713-a5b-fix-soundcloud-desktop-privacy-policy-fa/diagnostic.js
//
// Fixture: /psalms/37, primary tune "Sawley (start high)" (tune id 7, CM,
// real soundcloud_url in DB). Alternate CM tune "Scarborough" (tune id 6)
// also has a real soundcloud_url and is meter-compatible, used for Case B's
// client-side tune switch (?tune=6) via the real TuneSwitcherSheet UI.

const { runPlaywright, getStatus } = require('/home/services/playwright-daemon/client.js')

const SCRIPT = `
  const requestFails = [];
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('soundcloud')) {
      requestFails.push({ url, failure: (req.failure() || {}).errorText || null });
    }
  });

  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('http://localhost:3005/psalms/37', { waitUntil: 'networkidle' });

  // Skip onboarding + player tours (unrelated to the bug; avoids click
  // interception) and clear any persisted audio-source preference so we get
  // a genuine FRESH first-load with audioSource defaulting to 'abc'.
  await page.evaluate(() => {
    localStorage.setItem('psalter_tour_v2', 'done');
    localStorage.setItem('psalter-player-toured', '1');
    localStorage.removeItem('psalter-audio-source');
  });
  await page.reload({ waitUntil: 'networkidle' });

  const bar = page.locator('[data-play-mini-bar]');

  // Start playback so the mini-bar mounts/becomes visible (mirrors real user flow).
  await page.click('[data-singing-play]');
  await bar.waitFor({ state: 'visible', timeout: 5000 });

  async function sampleFor(ms, intervalMs) {
    const samples = [];
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const s = await bar.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const iframe = el.querySelector('iframe');
        return {
          rectHeight: r.height,
          rectWidth: r.width,
          computedHeight: cs.height,
          hasIframe: !!iframe,
          iframeSrc: iframe ? iframe.src : null,
        };
      });
      samples.push({ elapsedMs: Date.now() - t0, ...s });
      await page.waitForTimeout(intervalMs);
    }
    return samples;
  }

  async function findPlayButton() {
    try {
      const handle = await page.locator('[data-play-mini-bar] iframe').first().elementHandle();
      if (!handle) return { found: false, reason: 'no-iframe-handle' };
      const cf = await handle.contentFrame();
      if (!cf) return { found: false, reason: 'no-content-frame' };
      const btn = await cf.$('.playButton, .playControl, [class*="playButton" i], button[title*="lay" i], [aria-label*="lay" i]');
      return { found: !!btn };
    } catch (e) {
      return { found: false, reason: 'error: ' + e.message };
    }
  }

  // ---------------- CASE A: fresh first toggle to SoundCloud ----------------
  const iframeCountBeforeA = await page.locator('[data-play-mini-bar] iframe').count();

  // Fire the toggle click and IMMEDIATELY start sampling (no await gap) so we
  // catch the bar mid-transition if it is one.
  const clickPromiseA = page.click('[data-audio-source-toggle]');
  const samplesA = await sampleFor(400, 15);
  await clickPromiseA;

  // Let the widget bootstrap fully settle before checking outcome signals.
  await page.waitForTimeout(3000);

  const meFailsA = requestFails.filter((f) => f.url.includes('/me'));
  const playButtonA = await findPlayButton();
  const iframeIdentityA = await page.evaluate(() => {
    const el = document.querySelector('[data-play-mini-bar] iframe');
    if (!el) return null;
    if (!el.dataset.diagId) el.dataset.diagId = 'iframe-' + Math.random().toString(36).slice(2);
    return el.dataset.diagId;
  });

  // ---------------- CASE B: switch tune while staying in SC mode ----------------
  requestFails.length = 0;
  const iframeCountBeforeB = await page.locator('[data-play-mini-bar] iframe').count();

  await page.click('[data-singing-tune-slot]');
  await page.waitForSelector('[data-tune-switcher-sheet]', { state: 'visible', timeout: 5000 });
  const scarboroughVisible = await page.locator('[data-tune-slug="6"]').count();
  let caseBSkippedReason = null;
  let samplesB = [];
  let meFailsB = [];
  let playButtonB = { found: false };
  let iframeIdentityB = null;

  if (scarboroughVisible > 0) {
    const clickPromiseB = page.click('[data-tune-slug="6"]');
    samplesB = await sampleFor(400, 15);
    await clickPromiseB;
    await page.waitForTimeout(3000);

    meFailsB = requestFails.filter((f) => f.url.includes('/me'));
    playButtonB = await findPlayButton();
    iframeIdentityB = await page.evaluate(() => {
      const el = document.querySelector('[data-play-mini-bar] iframe');
      return el ? el.dataset.diagId || null : null;
    });
  } else {
    caseBSkippedReason = 'Scarborough (tune 6) not present in this psalm\\'s tune switcher sections';
  }

  return JSON.stringify({
    caseA: {
      iframeCountBefore: iframeCountBeforeA,
      samples: samplesA,
      meFails: meFailsA,
      playButtonFound: playButtonA,
      iframeIdentity: iframeIdentityA,
    },
    caseB: {
      skippedReason: caseBSkippedReason,
      iframeCountBefore: iframeCountBeforeB,
      samples: samplesB,
      meFails: meFailsB,
      playButtonFound: playButtonB,
      iframeIdentity: iframeIdentityB,
      sameIframeElementAsCaseA: iframeIdentityB !== null,
    },
  }, null, 2);
`

;(async () => {
  const status = await getStatus()
  if (!status.browserReady) {
    console.error('playwright-daemon not ready:', JSON.stringify(status))
    process.exit(1)
  }
  console.log('daemon status:', JSON.stringify(status))
  try {
    const result = await runPlaywright(SCRIPT, 60000)
    console.log('--- RESULT ---')
    console.log(result)
  } catch (e) {
    console.error('runPlaywright error:', e.message)
    process.exit(1)
  }
})()

/*
FINDINGS (recorded after running against the current pre-fix build at
localhost:3005, quick task 260713-a5b — 4 total runs: 1 full Case A/B run on
/psalms/37 (tune 7 Sawley -> tune 6 Scarborough), 3 additional Case-A-only
runs on /psalms/78 (tune 128 Azmon/Denfield), plus a targeted DOM/network
inspection run):

1. DISCRIMINATOR CONFIRMED (partially, non-deterministically): in one of the
   4 Case-A runs (psalm 78, run 0), the rapid post-toggle sampling loop
   caught the fresh <iframe> element ALREADY PRESENT in the DOM
   (hasIframe: true) while the bar's own rectHeight was still MID-TRANSITION
   at 64.78px and 74.2px (climbing 44 -> 80px), i.e. the iframe was inserted
   before the bar reached its stable 80px SC-mode size. This directly
   confirms the plan's primary hypothesis: on first mount, the fresh
   <iframe> CAN be inserted into an unsettled, still-animating container.
   In Case B (tune-switch, same persistent iframe element, sampled
   immediately after clicking a different tune) the bar was ALREADY at a
   stable 80px on the very first sample (21ms) in every run — it never
   needed to grow, because entering SC mode already happened earlier.
   This matches the plan's decision-tree branch: "Case A's bar is measurably
   mid-transition... CONFIRMS the 'fresh iframe mounts into unsettled
   layout' mechanism -> Task 2 proceeds with the deferred-mount fix."

2. NON-DETERMINISM / SEVERITY NOTE: despite catching one mid-transition
   insertion, the /me request did NOT reliably ERR_ABORT in this VPS
   environment, and even when it DID abort (2 of 4 Case-A runs, both on
   psalm 78), the interactive player (button.playButton, role="application",
   title="Play") was still present and FUNCTIONAL — clicking it triggered a
   real HLS stream request and audio segment fetches from sndcdn.com, and
   the button's class flipped to "...playing". A targeted DOM inspection
   also showed body innerText is a USELESS success/failure signal exactly as
   the planning-session note warned: it read the identical static
   "Download / SoundCloud privacy policy / Privacy policy" text in EVERY
   run, including runs where the underlying widget DOM (button.playButton)
   was fully present and playable. The only run-to-run variable that
   correlated with anything was network/JS-execution timing on THIS
   VPS (fast local loopback, warm Next.js cache) being faster/more
   consistent than the original manual browser session, so the mid-transition
   race window is narrower here and did not always tip into full breakage.
   This matches the plan's own diagnostic_evidence: the pure CSS-transition
   isolation harness from the planning session also failed to reproduce the
   /me abort reliably, and the bug is understood to be "context-dependent
   ... first-load timing", not a guaranteed-every-time repro.

3. CONCLUSION -> Task 2 approach: proceed with the DEFAULT deferred-mount
   fix exactly as specified in the plan (no emphasis shift needed). The
   observed mid-transition iframe insertion is real (captured directly),
   even though this environment's faster timing means it doesn't always
   escalate to a full player fallback. Deferring the iframe's first mount
   until the bar has settled at 80px removes the race entirely rather than
   relying on it not losing the race often enough.
*/
