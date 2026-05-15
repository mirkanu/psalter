const { chromium } = require('/usr/lib/node_modules/playwright');
const path = require('path');

const OUT = '/data/home/psalter/scripts/uat/screenshots';
const BASE = 'http://localhost:3005';

const VIEWPORTS = [
  { w: 375, h: 800, name: 'mobile-375' },
  { w: 768, h: 1024, name: 'tablet-768' },
  { w: 1024, h: 800, name: 'desktop-1024' },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });

  try {
    // ─── psalm/23 at three viewports ─────────────────────────
    for (const v of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: v.w, height: v.h } });
      const page = await context.newPage();
      await page.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const out = path.join(OUT, `psalm-23-${v.name}.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log(`[psalm-23 ${v.name}] saved ${out}`);

      // Sanity: confirm staff has no "T:" title text rendered as svg
      const svgText = await page.evaluate(() => {
        const svgs = document.querySelectorAll('[data-notation-renderer] svg');
        let allText = '';
        svgs.forEach((s) => {
          s.querySelectorAll('text').forEach((t) => (allText += (t.textContent ?? '') + '|'));
        });
        return allText;
      });
      const hasCrimondTitle = /Crimond/i.test(svgText) || /,\s*CM/i.test(svgText);
      console.log(`  staff svg text sample (first 200): ${svgText.slice(0, 200)}`);
      console.log(`  contains 'Crimond' or ', CM' in svg text? ${hasCrimondTitle}`);

      // Sanity: tune header row visible
      const tuneHeader = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('span')).find((e) =>
          /^Tune(\s|\()/.test(e.textContent ?? ''),
        );
        return el ? (el.textContent ?? '') : null;
      });
      console.log(`  tune header text: ${tuneHeader}`);

      await context.close();
    }

    // ─── tune/30 at three viewports ──────────────────────────
    for (const v of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: v.w, height: v.h } });
      const page = await context.newPage();
      await page.goto(`${BASE}/tunes/30`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const out = path.join(OUT, `tune-30-${v.name}.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log(`[tune-30 ${v.name}] saved ${out}`);

      const svgText = await page.evaluate(() => {
        const svgs = document.querySelectorAll('[data-notation-renderer] svg');
        let allText = '';
        svgs.forEach((s) => {
          s.querySelectorAll('text').forEach((t) => (allText += (t.textContent ?? '') + '|'));
        });
        return allText;
      });
      console.log(`  staff svg text sample (first 200): ${svgText.slice(0, 200)}`);
      const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent ?? null);
      console.log(`  h1: ${h1}`);

      await context.close();
    }

    // ─── psalm/23 desktop — click pencil, pick alternate tune ─
    {
      const context = await browser.newContext({ viewport: { width: 1024, height: 800 } });
      const page = await context.newPage();
      await page.goto(`${BASE}/psalms/23`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      // Click the change-tune pencil button (aria-label="Change tune")
      const pencil = page.locator('button[aria-label="Change tune"]:visible').first();
      const pencilCount = await pencil.count();
      console.log(`pencil button count: ${pencilCount}`);
      if (pencilCount > 0) {
        await pencil.click();
        await page.waitForTimeout(500);

        // The dialog should be open; click the first tune that is NOT the current one.
        const tuneButtons = page.locator('div[role="dialog"]:visible button[type="button"]');
        const n = await tuneButtons.count();
        console.log(`dialog tune buttons: ${n}`);
        // Find a tune whose label isn't "Crimond" (the current primary)
        let clicked = false;
        for (let i = 0; i < n; i++) {
          const btn = tuneButtons.nth(i);
          const txt = (await btn.textContent()) ?? '';
          if (!/Crimond/i.test(txt)) {
            console.log(`clicking alt tune: ${txt.trim().slice(0, 60)}`);
            await btn.evaluate((el) => el.click());
            clicked = true;
            break;
          }
        }
        if (clicked) {
          await page.waitForTimeout(2000);
          const out = path.join(OUT, 'psalm-23-changed-tune-desktop-1024.png');
          await page.screenshot({ path: out, fullPage: false });
          console.log(`saved ${out}`);

          // confirm lyrics still contain Psalm 23 distinctive phrase ("The Lord's my shepherd" or similar)
          const body = await page.evaluate(() => document.body.innerText);
          const hasShepherd = /shepherd/i.test(body);
          console.log(`page contains 'shepherd' (Psalm 23 lyric): ${hasShepherd}`);
          const tuneHeader = await page.evaluate(() => {
            const el = Array.from(document.querySelectorAll('span')).find((e) =>
              /^Tune(\s|\()/.test(e.textContent ?? ''),
            );
            return el ? (el.textContent ?? '') : null;
          });
          console.log(`new tune header: ${tuneHeader}`);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
})();
