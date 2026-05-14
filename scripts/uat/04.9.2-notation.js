/**
 * Phase 04.9.2 — Notation UAT
 *
 * Verifies NOTATION-01..06 end-to-end against a running Next.js server.
 *
 *   NODE_PATH=/usr/lib/node_modules node scripts/uat/04.9.2-notation.js
 *
 * Configure target via PSALTER_BASE_URL (default http://localhost:3007).
 *
 * NOTE: PsalmTabs renders BOTH a mobile and a desktop variant of the Sing
 * panel simultaneously (Tailwind hides one with `hidden md:grid` /
 * `md:hidden`). This means /psalms/[id] always has TWO
 * [data-notation-renderer] nodes in the DOM. All assertions must target the
 * visible (non-zero box) instance.
 *
 * Screenshots written to scripts/uat/screenshots/ for the human-verify
 * checkpoint (Task 4) at 375 / 768 / 1024 viewports.
 */

const { chromium } = require('/usr/lib/node_modules/playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = process.env.PSALTER_BASE_URL || 'http://localhost:3007'
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots')
const EXECUTABLE_PATH = '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome'

const PSALM_SLUG = '23'
const TUNE_ID = '30' // Crimond CM per Phase 04 scaffolding

const results = []

async function runTest(name, fn) {
  const t0 = Date.now()
  try {
    await fn()
    const ms = Date.now() - t0
    console.log(`  PASS ${name} (${ms}ms)`)
    results.push({ name, passed: true, ms })
  } catch (err) {
    const ms = Date.now() - t0
    console.log(`  FAIL ${name} (${ms}ms): ${err.message.split('\n')[0]}`)
    results.push({ name, passed: false, ms, error: err.message })
  }
}

/**
 * Resolve the visible [data-notation-renderer] element. Required because
 * the psalm page mounts both mobile- and desktop-Tabs simultaneously, so
 * two renderer nodes exist; only one has a non-zero bounding box.
 */
const FIND_VISIBLE = `(() => {
  const els = document.querySelectorAll('[data-notation-renderer]');
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 50 && r.height > 50) return el;
  }
  return null;
})()`

async function waitForNotation(page, timeout = 20000) {
  await page.waitForFunction(
    () => {
      const els = document.querySelectorAll('[data-notation-renderer]')
      for (const el of els) {
        const r = el.getBoundingClientRect()
        if (r.width > 50 && r.height > 50) {
          // Wait until abcjs paints — SVG or img with non-trivial size, or
          // text content (lyrics-only fallback).
          const svg = el.querySelector('svg')
          if (svg && svg.getBoundingClientRect().width > 100) return true
          const img = el.querySelector('img')
          if (img && img.complete) return true
          if ((el.textContent || '').length > 40) return true
        }
      }
      return false
    },
    null,
    { timeout },
  )
}

async function withPage(browser, viewport, fn) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  try {
    await fn(page)
  } finally {
    await context.close()
  }
}

/** Click first button matching `re` regex inside the visible renderer. */
async function clickInVisibleRenderer(page, re) {
  const clicked = await page.evaluate((rs) => {
    const re = new RegExp(rs.pattern, rs.flags)
    const els = document.querySelectorAll('[data-notation-renderer]')
    let visible = null
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (r.width > 50 && r.height > 50) { visible = el; break }
    }
    if (!visible) return false
    const buttons = visible.querySelectorAll('button')
    for (const b of buttons) {
      const text = (b.textContent || '').trim()
      const aria = b.getAttribute('aria-label') || ''
      if (re.test(text) || re.test(aria)) {
        b.click()
        return true
      }
    }
    return false
  }, { pattern: re.source, flags: re.flags })
  if (!clicked) throw new Error(`no button matching ${re} in visible renderer`)
}

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

  console.log(`UAT target: ${BASE_URL}`)
  console.log(`Screenshots → ${SCREENSHOT_DIR}\n`)

  const browser = await chromium.launch({
    executablePath: EXECUTABLE_PATH,
    args: ['--no-sandbox'],
  })

  try {
    // ── N01-syllable: lyric (w:) lines render under staff ──────────────────
    await runTest('N01-syllable: abcjs-l* lyric line under staff @ 768px', async () => {
      await withPage(browser, { width: 768, height: 1024 }, async (page) => {
        await page.goto(`${BASE_URL}/psalms/${PSALM_SLUG}`, { waitUntil: 'networkidle' })
        await waitForNotation(page)
        const lyricCount = await page.evaluate(`((root) => {
          if (!root) return -1
          return root.querySelectorAll('[class*="abcjs-l"]').length
        })(${FIND_VISIBLE})`)
        if (lyricCount < 1) throw new Error(`expected >=1 abcjs-l* element, got ${lyricCount}`)
      })
    })

    // ── N02-solfege: view-mode toggle switches to <img> / fallback ─────────
    await runTest('N02-solfege: Solfège toggle renders <img> or fallback', async () => {
      await withPage(browser, { width: 1024, height: 768 }, async (page) => {
        await page.goto(`${BASE_URL}/psalms/${PSALM_SLUG}`, { waitUntil: 'networkidle' })
        await waitForNotation(page)
        await clickInVisibleRenderer(page, /Solf[èe]ge/i)
        await page.waitForTimeout(600)
        const ok = await page.evaluate(`((root) => {
          if (!root) return false
          if (root.querySelectorAll('img').length > 0) return true
          if (/solf|not.*available/i.test(root.textContent || '')) return true
          return false
        })(${FIND_VISIBLE})`)
        if (!ok) throw new Error('Solfège mode produced neither <img> nor fallback text')
        // Toggle back
        await clickInVisibleRenderer(page, /^Staff$/i)
        await page.waitForTimeout(600)
        const svgBack = await page.evaluate(`((root) => !!(root && root.querySelector('svg')))(${FIND_VISIBLE})`)
        if (!svgBack) throw new Error('SVG did not return after toggling back to Staff')
      })
    })

    // ── N03-responsive: SVG fits 375px viewport ─────────────────────────────
    await runTest('N03-responsive: SVG width 200..375 at 375px viewport', async () => {
      await withPage(browser, { width: 375, height: 800 }, async (page) => {
        await page.goto(`${BASE_URL}/psalms/${PSALM_SLUG}`, { waitUntil: 'networkidle' })
        await waitForNotation(page)
        const w = await page.evaluate(`((root) => {
          if (!root) return 0
          // Find the abcjs staff SVG (not lucide button icons). Pick the
          // widest SVG inside the renderer.
          const svgs = root.querySelectorAll('svg')
          let maxW = 0
          for (const s of svgs) {
            const w = s.getBoundingClientRect().width
            if (w > maxW) maxW = w
          }
          return maxW
        })(${FIND_VISIBLE})`)
        if (!(w > 200 && w <= 380)) {
          throw new Error(`expected 200 < svg width <= 380, got ${w}`)
        }
      })
    })

    // ── N04-asize: A+/A− adjust --staff-base-size + persist ─────────────────
    await runTest('N04-asize: A+ 14→16 and persists across reload', async () => {
      await withPage(browser, { width: 1024, height: 768 }, async (page) => {
        await page.goto(`${BASE_URL}/psalms/${PSALM_SLUG}`, { waitUntil: 'networkidle' })
        await waitForNotation(page)
        await page.evaluate(() => localStorage.removeItem('psalter-staff-size'))
        await page.reload({ waitUntil: 'networkidle' })
        await waitForNotation(page)
        const before = await page.evaluate(`((root) => {
          if (!root) return null
          return getComputedStyle(root).getPropertyValue('--staff-base-size').trim()
        })(${FIND_VISIBLE})`)
        if (before !== '14px') throw new Error(`expected baseline 14px, got ${before}`)
        await clickInVisibleRenderer(page, /Increase|A\+/i)
        await page.waitForTimeout(400)
        const after = await page.evaluate(`((root) => {
          if (!root) return null
          return getComputedStyle(root).getPropertyValue('--staff-base-size').trim()
        })(${FIND_VISIBLE})`)
        if (after !== '16px') throw new Error(`expected 16px after A+, got ${after}`)
        await page.reload({ waitUntil: 'networkidle' })
        await waitForNotation(page)
        const persisted = await page.evaluate(`((root) => {
          if (!root) return null
          return getComputedStyle(root).getPropertyValue('--staff-base-size').trim()
        })(${FIND_VISIBLE})`)
        if (persisted !== '16px') throw new Error(`expected 16px after reload, got ${persisted}`)
      })
    })

    // ── N04-persistent-modes: A+/A− visible in Lyrics-only mode ─────────────
    await runTest('N04-persistent-modes: A+/A− visible in Lyrics-only', async () => {
      await withPage(browser, { width: 1024, height: 768 }, async (page) => {
        await page.goto(`${BASE_URL}/psalms/${PSALM_SLUG}`, { waitUntil: 'networkidle' })
        await waitForNotation(page)
        await clickInVisibleRenderer(page, /Lyrics.*[Oo]nly|^Lyrics$/i)
        await page.waitForTimeout(400)
        const sizeButtonsVisible = await page.evaluate(`((root) => {
          if (!root) return 0
          const buttons = root.querySelectorAll('button')
          let count = 0
          buttons.forEach((b) => {
            const aria = (b.getAttribute('aria-label') || '').toLowerCase()
            if (/(increase|decrease).*size|^a[+\\-−]$/i.test(aria) || /^a[+\\-−]$/.test((b.textContent || '').trim())) {
              const r = b.getBoundingClientRect()
              if (r.width > 0 && r.height > 0) count++
            }
          })
          return count
        })(${FIND_VISIBLE})`)
        if (sizeButtonsVisible < 2) {
          throw new Error(`expected >=2 size buttons visible in Lyrics-only, got ${sizeButtonsVisible}`)
        }
      })
    })

    // ── N05-fullscreen: Expand → overlay; Escape → closes ──────────────────
    await runTest('N05-fullscreen: Expand mounts overlay; Escape closes', async () => {
      await withPage(browser, { width: 1024, height: 768 }, async (page) => {
        await page.goto(`${BASE_URL}/psalms/${PSALM_SLUG}`, { waitUntil: 'networkidle' })
        await waitForNotation(page)
        await clickInVisibleRenderer(page, /[Ff]ullscreen|[Ee]xpand|[Ff]ull.[Ss]creen|^Full$/)
        await page.waitForTimeout(500)
        const mounted = await page.evaluate(() => {
          return document.querySelectorAll('.fixed.inset-0.z-50').length > 0
        })
        if (!mounted) throw new Error('expected .fixed.inset-0.z-50 overlay element after Expand')
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        const gone = await page.evaluate(() => {
          return document.querySelectorAll('.fixed.inset-0.z-50').length === 0
        })
        if (!gone) throw new Error('overlay did not close on Escape')
      })
    })

    // ── N06-control-groups: control bar has visual group dividers ──────────
    await runTest('N06-control-groups: control bar has >=1 visual divider', async () => {
      await withPage(browser, { width: 1024, height: 768 }, async (page) => {
        await page.goto(`${BASE_URL}/psalms/${PSALM_SLUG}`, { waitUntil: 'networkidle' })
        await waitForNotation(page)
        const dividerCount = await page.evaluate(`((root) => {
          if (!root) return 0
          // Dividers are 1px-wide vertical bars rendered as <span aria-hidden> or
          // utility classes like border-l / w-px / divide-x descendants.
          const els = root.querySelectorAll('[aria-hidden="true"], .border-l, [class*="w-px"], [class*="border-l"]')
          return els.length
        })(${FIND_VISIBLE})`)
        if (dividerCount < 1) throw new Error(`expected >=1 divider, got ${dividerCount}`)
      })
    })

    // ── Tune page parity (D-18) ─────────────────────────────────────────────
    await runTest(`Tune page parity: /tunes/${TUNE_ID} mounts NotationRenderer`, async () => {
      await withPage(browser, { width: 1024, height: 768 }, async (page) => {
        await page.goto(`${BASE_URL}/tunes/${TUNE_ID}`, { waitUntil: 'networkidle' })
        await waitForNotation(page)
        const hasSvg = await page.evaluate(`((root) => !!(root && root.querySelector('svg')))(${FIND_VISIBLE})`)
        if (!hasSvg) throw new Error('expected SVG inside visible [data-notation-renderer] on tune page')
      })
    })

    // ── Screenshots for the human-verify checkpoint ─────────────────────────
    console.log('\nGenerating checkpoint screenshots...')
    const viewports = [
      { name: 'mobile-375', width: 375, height: 800 },
      { name: 'tablet-768', width: 768, height: 1024 },
      { name: 'desktop-1024', width: 1024, height: 768 },
    ]
    for (const vp of viewports) {
      await withPage(browser, { width: vp.width, height: vp.height }, async (page) => {
        await page.goto(`${BASE_URL}/psalms/${PSALM_SLUG}`, { waitUntil: 'networkidle' })
        try {
          await waitForNotation(page, 20000)
        } catch (e) {
          console.log(`  (psalm ${vp.name} render slow: ${e.message.split('\n')[0]})`)
        }
        await page.waitForTimeout(800)
        const outPath = path.join(SCREENSHOT_DIR, `psalm-${PSALM_SLUG}-${vp.name}.png`)
        await page.screenshot({ path: outPath, fullPage: true })
        console.log(`  → ${outPath}`)
      })
      await withPage(browser, { width: vp.width, height: vp.height }, async (page) => {
        await page.goto(`${BASE_URL}/tunes/${TUNE_ID}`, { waitUntil: 'networkidle' })
        try {
          await waitForNotation(page, 20000)
        } catch (e) {
          console.log(`  (tune ${vp.name} render slow: ${e.message.split('\n')[0]})`)
        }
        await page.waitForTimeout(800)
        const outPath = path.join(SCREENSHOT_DIR, `tune-${TUNE_ID}-${vp.name}.png`)
        await page.screenshot({ path: outPath, fullPage: true })
        console.log(`  → ${outPath}`)
      })
    }
  } finally {
    await browser.close()
  }

  const pass = results.filter((r) => r.passed).length
  const fail = results.length - pass
  console.log(`\nPASS: ${pass} / ${results.length}, FAIL: ${fail} / ${results.length}`)
  if (fail > 0) {
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  ✗ ${r.name}: ${r.error.split('\n')[0]}`)
    }
    process.exit(1)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('UAT runner crashed:', err)
  process.exit(2)
})
