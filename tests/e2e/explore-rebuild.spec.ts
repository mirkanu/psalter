/**
 * UAT: Rebuilt /explore page — all 6 sections
 *
 * Asserts: section anchor IDs, by-theme sub-groups, NT collapsibles,
 * messianic grid, authors table filter, catechism external links,
 * anchor nav, and Nave's sub-topic detail page.
 *
 * Run:
 *   NODE_PATH=/usr/lib/node_modules node tests/e2e/explore-rebuild.spec.ts
 */

const { chromium } = require('/usr/lib/node_modules/playwright')

const BASE = process.env.TEST_BASE_URL ?? 'https://psalter.gsdlabs.dev'
const EXPLORE = `${BASE}/explore`

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function pass(name: string) {
  results.push({ name, passed: true })
  console.log(`  PASS: ${name}`)
}

function fail(name: string, error: string) {
  results.push({ name, passed: false, error })
  console.error(`  FAIL: ${name} — ${error}`)
}

async function run() {
  const browser = await chromium.launch({
    executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 900 })

  try {
    // ----------------------------------------------------------------
    // Test 1: All 6 anchor section IDs present
    // ----------------------------------------------------------------
    await page.goto(EXPLORE, { waitUntil: 'networkidle', timeout: 30000 })

    const SECTION_IDS = ['when-you', 'by-theme', 'in-the-nt', 'other-topics', 'authors', 'catechism']
    for (const id of SECTION_IDS) {
      const el = await page.$(`section[id="${id}"]`)
      if (el) {
        pass(`Section #${id} is present`)
      } else {
        fail(`Section #${id} is present`, `section[id="${id}"] not found`)
      }
    }

    // ----------------------------------------------------------------
    // Test 2: Sticky anchor nav with 6 links
    // ----------------------------------------------------------------
    const navLinks = await page.$$('nav a[href^="#"]')
    if (navLinks.length >= 6) {
      pass(`Anchor nav has ${navLinks.length} links (>=6)`)
    } else {
      fail('Anchor nav has 6 links', `Found only ${navLinks.length} links`)
    }

    // ----------------------------------------------------------------
    // Test 3: By-Theme section has 3 h3 sub-groups
    // ----------------------------------------------------------------
    const byThemeSection = await page.$('section[id="by-theme"]')
    if (!byThemeSection) {
      fail('by-theme section exists for h3 check', 'section not found')
    } else {
      const h3s = await byThemeSection.$$('h3')
      const h3Texts = await Promise.all(h3s.map((h) => h.innerText()))
      const hasMainTopic = h3Texts.some((t) => t.toLowerCase().includes('main topic'))
      const hasMood = h3Texts.some((t) => t.toLowerCase().includes('mood'))
      const hasSongType = h3Texts.some((t) => t.toLowerCase().includes('song type'))
      hasMainTopic ? pass('by-theme has "Main Topic" h3') : fail('by-theme has "Main Topic" h3', `h3s: ${h3Texts.join(', ')}`)
      hasMood ? pass('by-theme has "Mood" h3') : fail('by-theme has "Mood" h3', `h3s: ${h3Texts.join(', ')}`)
      hasSongType ? pass('by-theme has "Song Type" h3') : fail('by-theme has "Song Type" h3', `h3s: ${h3Texts.join(', ')}`)
    }

    // ----------------------------------------------------------------
    // Test 4: In-the-NT section has "Messianic by Topic" text
    // ----------------------------------------------------------------
    const inTheNtSection = await page.$('section[id="in-the-nt"]')
    if (!inTheNtSection) {
      fail('in-the-nt section exists for messianic check', 'section not found')
    } else {
      const text = await inTheNtSection.innerText()
      if (text.includes('Messianic by Topic')) {
        pass('in-the-nt contains "Messianic by Topic"')
      } else {
        fail('in-the-nt contains "Messianic by Topic"', 'text not found')
      }
    }

    // ----------------------------------------------------------------
    // Test 5: QuotedInNT — expand a collapsible and find a psalm link
    // ----------------------------------------------------------------
    const ntSection = await page.$('section[id="in-the-nt"]')
    if (ntSection) {
      const firstTrigger = await ntSection.$('button[data-state], [data-radix-collection-item], button')
      if (firstTrigger) {
        await firstTrigger.click()
        await page.waitForTimeout(300)
        // After clicking a collapsible, look for psalm links inside in-the-nt
        const psalmLinks = await ntSection.$$('a[href^="/psalms/"]')
        if (psalmLinks.length > 0) {
          pass(`QuotedInNT collapsible expands to reveal ${psalmLinks.length} psalm link(s)`)
        } else {
          fail('QuotedInNT collapsible expands to reveal psalm links', 'no /psalms/ links found after click')
        }
      } else {
        fail('QuotedInNT collapsible trigger exists', 'no button found in in-the-nt section')
      }
    }

    // ----------------------------------------------------------------
    // Test 6: Authors table — row count >= 150 with no filter
    // ----------------------------------------------------------------
    const authorsSection = await page.$('section[id="authors"]')
    if (!authorsSection) {
      fail('authors section exists for table check', 'section not found')
    } else {
      const rows = await authorsSection.$$('table tbody tr')
      const rowCount = rows.length
      console.log(`    [info] Authors table rows (unfiltered): ${rowCount}`)
      if (rowCount >= 150) {
        pass(`Authors table has ${rowCount} rows (>=150) unfiltered`)
      } else {
        fail('Authors table has >=150 rows unfiltered', `Found ${rowCount} rows`)
      }

      // Test 7: "David" filter pill reduces row count
      const davidBtn = await authorsSection.$('button:has-text("David")')
      if (davidBtn) {
        await davidBtn.click()
        await page.waitForTimeout(300)
        const filteredRows = await authorsSection.$$('table tbody tr')
        const filteredCount = filteredRows.length
        console.log(`    [info] Authors table rows (David filter): ${filteredCount}`)
        if (filteredCount < rowCount && filteredCount > 0) {
          pass(`David filter reduces row count from ${rowCount} to ${filteredCount}`)
        } else {
          fail('David filter reduces row count', `unfiltered=${rowCount}, filtered=${filteredCount}`)
        }
        // Reset filter
        await davidBtn.click()
        await page.waitForTimeout(200)
      } else {
        fail('David filter pill exists in authors section', 'button not found')
      }
    }

    // ----------------------------------------------------------------
    // Test 8: Catechism section — collapsible expands with https:// external link
    // ----------------------------------------------------------------
    const catechismSection = await page.$('section[id="catechism"]')
    if (!catechismSection) {
      fail('catechism section exists', 'section not found')
    } else {
      const firstTrigger = await catechismSection.$('button')
      if (firstTrigger) {
        await firstTrigger.click()
        await page.waitForTimeout(300)
        const extLinks = await catechismSection.$$('a[href^="https://"]')
        if (extLinks.length > 0) {
          const href = await extLinks[0].getAttribute('href')
          console.log(`    [info] Catechism external link href: ${href}`)
          if (href && href.startsWith('https://relight.app')) {
            pass(`Catechism external link starts with https://relight.app (href: ${href.slice(0, 60)})`)
          } else {
            fail('Catechism external link starts with https://relight.app', `href: ${href}`)
          }
        } else {
          fail('Catechism collapsible reveals external https:// link', 'no https:// links found')
        }
      } else {
        fail('Catechism collapsible trigger exists', 'no button found')
      }
    }

    // ----------------------------------------------------------------
    // Test 9: Nave's topic detail page renders sub-topic groups with psalm links
    // ----------------------------------------------------------------
    // Pick the first Nave's topic link from the other-topics section
    const otherTopicsSection = await page.$('section[id="other-topics"]')
    let navesDetailOk = false
    if (otherTopicsSection) {
      const firstNavesLink = await otherTopicsSection.$('a[href^="/explore/naves/"]')
      if (firstNavesLink) {
        const href = await firstNavesLink.getAttribute('href')
        console.log(`    [info] Navigating to Nave's detail: ${href}`)
        await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 30000 })
        const psalmLinks = await page.$$('a[href^="/psalms/"]')
        if (psalmLinks.length > 0) {
          pass(`Nave's detail page (${href}) renders ${psalmLinks.length} psalm link(s)`)
          navesDetailOk = true
        } else {
          fail(`Nave's detail page renders psalm links`, `no /psalms/ links on ${href}`)
        }
      } else {
        fail("Nave's topic link found in other-topics section", 'no /explore/naves/ link found')
      }
    } else {
      fail("other-topics section exists for Nave's link check", 'section not found')
    }

    // ----------------------------------------------------------------
    // Test 10: Mobile viewport — Authors table visible with horizontal scroll
    // ----------------------------------------------------------------
    await page.goto(EXPLORE, { waitUntil: 'networkidle', timeout: 30000 })
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(200)

    // All columns remain visible at 375px — table scrolls horizontally (overflow-x-auto)
    const dateColHeader = await page.$('th:has-text("Date B.C.")')
    if (dateColHeader) {
      const isVisible = await dateColHeader.isVisible()
      if (isVisible) {
        pass('Date B.C. column visible at 375px mobile viewport (horizontal scroll)')
      } else {
        fail('Date B.C. column visible at 375px mobile viewport', 'column is hidden — should be visible with horizontal scroll')
      }
    } else {
      fail('Date B.C. column visible at 375px mobile viewport', 'column not found in DOM')
    }

  } catch (err) {
    fail('Unexpected error during UAT', String(err))
  } finally {
    await browser.close()
  }

  // ----------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed)
  console.log(`\n${'='.repeat(60)}`)
  console.log(`EXPLORE REBUILD UAT: ${passed}/${results.length} passed`)
  if (failed.length > 0) {
    console.log('\nFailed:')
    for (const f of failed) {
      console.log(`  - ${f.name}: ${f.error}`)
    }
  }
  console.log('='.repeat(60))

  if (failed.length > 0) {
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
