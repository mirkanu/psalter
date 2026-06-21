#!/usr/bin/env node
'use strict'
const { runPlaywright, getStatus } = require('/home/services/playwright-daemon/client.js')
require('dotenv').config({ path: '/home/services/.env.production' })

const CF_ID = process.env.CF_ACCESS_CLIENT_ID
const CF_SECRET = process.env.CF_ACCESS_CLIENT_SECRET

async function main() {
  const { browserReady } = await getStatus()
  if (!browserReady) throw new Error('playwright-daemon not ready')

  const tunesToCheck = [
    { id: 38, name: 'Old 124th', expectedPhrases: 5 },
    { id: 136, name: 'Clarkeville', expectedPhrases: 6 },
    { id: 21, name: 'Naomi', expectedPhrases: 4 },
    { id: 99, name: 'Carlisle', expectedPhrases: 4 },
    { id: 3, name: 'Woodworth', expectedPhrases: 4 },
  ]

  const results = await runPlaywright(`
    await page.setExtraHTTPHeaders({
      'CF-Access-Client-Id': '${CF_ID}',
      'CF-Access-Client-Secret': '${CF_SECRET}',
    })

    const tunes = ${JSON.stringify(tunesToCheck)}
    const out = []

    for (const tune of tunes) {
      await page.goto('https://psalter.gsdlabs.dev/dev/melisma-editor', { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(1500)

      // Select the tune by ID using the filter
      const filterInput = await page.$('input[placeholder*="filter" i], input[placeholder*="search" i], input[type="text"]')
      if (filterInput) {
        await filterInput.fill(tune.name.split(' ')[0])
        await page.waitForTimeout(500)
      }

      // Find and click the tune option in select
      const selected = await page.evaluate((tuneId) => {
        const selects = document.querySelectorAll('select')
        for (const sel of selects) {
          for (const opt of sel.options) {
            if (opt.value == tuneId || opt.text.includes('(' + tuneId + ')')) {
              sel.value = opt.value
              sel.dispatchEvent(new Event('change', { bubbles: true }))
              return opt.text
            }
          }
        }
        return null
      }, tune.id)

      await page.waitForTimeout(2000)

      // Count phrase sections in the rendered editor
      const info = await page.evaluate(() => {
        const text = document.body.innerText
        // Look for phrase headers like "Phrase 1 (8 notes)"
        const phraseMatches = text.match(/Phrase \d+/g) || []
        // Also look for PHRASE_BREAK markers in any pre/code elements
        const preText = Array.from(document.querySelectorAll('pre, code, textarea')).map(el => el.textContent).join('\n')
        const breakCount = (preText.match(/PHRASE_BREAK/g) || []).length
        return {
          phraseHeaders: phraseMatches.length,
          phraseBreaksInCode: breakCount,
          bodySnippet: text.substring(0, 300).replace(/\n+/g, ' '),
        }
      })

      out.push({ id: tune.id, name: tune.name, selected, expected: tune.expectedPhrases, ...info })
    }

    return out
  `)

  for (const r of results) {
    const ok = r.phraseHeaders >= r.expected || r.phraseBreaksInCode >= (r.expected - 1)
    console.log(`${ok ? '✅' : '❌'} ${r.name} (${r.id}): selected="${r.selected}", phraseHeaders=${r.phraseHeaders}, breaks=${r.phraseBreaksInCode}, expected=${r.expected} phrases`)
    if (!ok) console.log(`   Body: ${r.bodySnippet}`)
  }
}

main().catch(e => { console.error(e.message); process.exit(1) })
