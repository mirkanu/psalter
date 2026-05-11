import { readdir } from 'fs/promises'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

const files = await readdir('/data/home/psalter/public/tunes')

// Group files by tune slug and type (staff/solfege)
const bySlugStaff = {}
const bySlugSolfege = {}

for (const f of files) {
  const staffMatch = f.match(/^(.+)-staff-(\d+)\.jpg$/)
  if (staffMatch) {
    const [, slug, idx] = staffMatch
    if (!bySlugStaff[slug]) bySlugStaff[slug] = []
    bySlugStaff[slug].push({ idx: Number(idx), url: `/tunes/${f}` })
  }
  const solfegeMatch = f.match(/^(.+)-solfege-(\d+)\.jpg$/)
  if (solfegeMatch) {
    const [, slug, idx] = solfegeMatch
    if (!bySlugSolfege[slug]) bySlugSolfege[slug] = []
    bySlugSolfege[slug].push({ idx: Number(idx), url: `/tunes/${f}` })
  }
}

// Find multi-page tunes
const multiPageSlugs = Object.entries(bySlugStaff)
  .filter(([, pages]) => pages.length > 1)
  .map(([slug]) => slug)

console.log('Multi-page tunes:', multiPageSlugs.length)

for (const slug of multiPageSlugs) {
  const pages = bySlugStaff[slug].sort((a, b) => a.idx - b.idx)
  const primaryUrl = pages[0].url  // -staff-0.jpg
  const additionalUrls = pages.slice(1).map(p => p.url)  // -staff-1.jpg, etc.

  // Find matching tune by score_jpg_url
  const rows = await sql`SELECT id, name, score_jpg_url FROM tunes WHERE score_jpg_url = ${primaryUrl}`
  if (rows.length === 0) {
    console.log(`  SKIP ${slug} - no DB row with score_jpg_url=${primaryUrl}`)
    continue
  }
  const tune = rows[0]
  
  await sql`UPDATE tunes SET additional_score_urls = ${JSON.stringify(additionalUrls)}::jsonb WHERE id = ${tune.id}`
  console.log(`  UPDATED id=${tune.id} name="${tune.name}" extra pages: ${additionalUrls.join(', ')}`)
}

await sql.end()
console.log('Done')
