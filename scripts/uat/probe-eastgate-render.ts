const DAEMON_URL = process.env.PLAYWRIGHT_DAEMON_URL || 'http://localhost:3099'

async function job(script: string) {
  const r = await fetch(`${DAEMON_URL}/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script }),
  })
  const j = await r.json()
  if (j.error) throw new Error(j.error)
  return j.result
}

async function probe(url: string, label: string) {
  console.log('\n=== ' + label + ': ' + url + ' ===')
  const out = await job(`
    await page.goto('${url}', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(4000)
    return await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll('svg'))
      const abcjsSvgs = svgs.filter(s => s.querySelector('g.abcjs-staff'))
      const svgInfo = abcjsSvgs.map((svg, i) => ({
        i,
        staffCount: svg.querySelectorAll('g.abcjs-staff').length,
        lyricContainers: svg.querySelectorAll('.abcjs-lyric, g.abcjs-lyric').length,
      }))
      const allStaves = Array.from(document.querySelectorAll('g.abcjs-staff'))
      const staveHeights = allStaves.map(s => {
        const r = (s).getBoundingClientRect()
        return { w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y) }
      })
      return {
        svgInfo,
        totalStaves: allStaves.length,
        title: document.title,
        staveHeights,
      }
    })
  `)
  console.log(JSON.stringify(out, null, 2))
}

async function main() {
  await probe('http://localhost:3005/dev/melisma-editor?tune=eastgate-last-line-repeat-for-ps-133', 'Editor Live Preview')
  await probe('http://localhost:3005/tunes/eastgate-last-line-repeat-for-ps-133?tab=notation', 'Tune page')
  await probe('http://localhost:3005/psalms/133', 'Psalm 133')
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
