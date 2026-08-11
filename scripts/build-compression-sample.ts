/**
 * Phase 13 — build the human-review sample page at public/tunes-samples/.
 *
 * Picks 4 deterministic samples from the approved-tunes image set (largest
 * staff, largest solfege, smallest, median) and renders each at the original
 * resolution plus four candidate compression settings (w2000-q82, w2000-q86,
 * w2000-q78, w1600-q82). Emits a static HTML page — no JS, no framework — at
 * public/tunes-samples/index.html that the running next-start serves straight
 * off disk at https://psalter.gsdlabs.dev/tunes-samples/index.html.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { listApprovedTuneImageFiles } from './list-approved-tune-images'

const SAMPLES_DIR = join(process.cwd(), 'public/tunes-samples')
const TUNES_DIR = join(process.cwd(), 'public/tunes')

interface Variant {
  id: string
  width: number
  quality: number
}
const VARIANTS: Variant[] = [
  { id: 'w2000-q82', width: 2000, quality: 82 },
  { id: 'w2000-q86', width: 2000, quality: 86 },
  { id: 'w2000-q78', width: 2000, quality: 78 },
  { id: 'w1600-q82', width: 1600, quality: 82 },
]

interface Sample {
  file: string
  reason: string
  size: number
}

async function pickSamples(): Promise<Sample[]> {
  const approved = await listApprovedTuneImageFiles()
  const jpgs: Array<{ file: string; size: number; path: string }> = []
  for (const t of approved) {
    for (const f of t.files) {
      if (!f.endsWith('.jpg')) continue
      const p = join(TUNES_DIR, f)
      const size = statSync(p).size
      jpgs.push({ file: f, size, path: p })
    }
  }
  if (jpgs.length < 4) {
    throw new Error(`only ${jpgs.length} approved jpgs found — need >=4`)
  }
  // Sort by size ascending for determinism
  const bySize = [...jpgs].sort((a, b) => a.size - b.size)
  const staff = jpgs.filter((j) => j.file.includes('-staff-')).sort((a, b) => b.size - a.size)
  const solfege = jpgs.filter((j) => j.file.includes('-solfege-')).sort((a, b) => b.size - a.size)
  const smallest = bySize[0]
  const median = bySize[Math.floor(bySize.length / 2)]

  const chosen: Sample[] = []
  const used = new Set<string>()
  function push(label: string, c: { file: string; size: number } | undefined): void {
    if (!c) return
    if (used.has(c.file)) return
    used.add(c.file)
    chosen.push({ file: c.file, reason: label, size: c.size })
  }
  push('largest approved -staff-', staff[0])
  push('largest approved -solfege-', solfege[0])
  push('smallest approved jpg', smallest)
  push('median-sized approved jpg', median)

  // Top up with next-largest unused if we still need more
  if (chosen.length < 4) {
    for (const j of bySize) {
      if (chosen.length >= 4) break
      if (used.has(j.file)) continue
      push(`top-up (${j.file})`, j)
    }
  }
  if (chosen.length < 4) {
    throw new Error(`only able to pick ${chosen.length} distinct samples`)
  }
  return chosen
}

async function main(): Promise<void> {
  sharp.cache(false)
  sharp.concurrency(1)

  const samples = await pickSamples()
  console.log('--- Sample files ---')
  for (const s of samples) {
    console.log(`${s.file}  (${(s.size / 1024).toFixed(1)} KiB) — ${s.reason}`)
  }

  // Wipe and recreate
  if (existsSync(SAMPLES_DIR)) {
    rmSync(SAMPLES_DIR, { recursive: true, force: true })
  }
  mkdirSync(SAMPLES_DIR, { recursive: true })
  mkdirSync(join(SAMPLES_DIR, 'original'), { recursive: true })

  // Copy originals
  for (const s of samples) {
    copyFileSync(join(TUNES_DIR, s.file), join(SAMPLES_DIR, 'original', s.file))
  }

  // Per-variant directory + render
  const variantTotals: Record<string, { bytes: number; width: number; height: number }> = {}
  for (const v of VARIANTS) {
    const vDir = join(SAMPLES_DIR, v.id)
    mkdirSync(vDir, { recursive: true })
    let totalBytes = 0
    let totalW = 0
    let totalH = 0
    for (const s of samples) {
      const src = join(TUNES_DIR, s.file)
      const dest = join(vDir, s.file)
      await sharp(src)
        .resize({ width: v.width, withoutEnlargement: true })
        .jpeg({ quality: v.quality, mozjpeg: true, chromaSubsampling: '4:4:4' })
        .toFile(dest)
      const meta = await sharp(dest).metadata()
      totalBytes += statSync(dest).size
      if (meta.width) totalW += meta.width
      if (meta.height) totalH += meta.height
    }
    variantTotals[v.id] = { bytes: totalBytes, width: totalW / samples.length, height: totalH / samples.length }
  }

  const origTotal = samples.reduce((sum, s) => sum + s.size, 0)

  console.log('\n--- Per-variant reduction ---')
  console.log(`Originals total: ${(origTotal / 1024).toFixed(1)} KiB`)
  for (const v of VARIANTS) {
    const t = variantTotals[v.id]
    const pct = (((origTotal - t.bytes) / origTotal) * 100).toFixed(1)
    console.log(
      `${v.id} (w=${v.width}, q=${v.quality}): ${(t.bytes / 1024).toFixed(1)} KiB avg ${Math.round(t.width)}x${Math.round(t.height)}px — -${pct}%`,
    )
  }

  // Build HTML
  const htmlParts: string[] = []
  htmlParts.push('<!doctype html>')
  htmlParts.push('<html lang="en"><head>')
  htmlParts.push('<meta charset="utf-8">')
  htmlParts.push('<title>Phase 13 — compression sample review</title>')
  htmlParts.push('<style>')
  htmlParts.push('body{font-family:system-ui,sans-serif;max-width:1400px;margin:2rem auto;padding:0 1rem;}')
  htmlParts.push('.sample{border:1px solid #ddd;border-radius:8px;padding:1rem;margin:1.5rem 0;}')
  htmlParts.push('.block{margin:.5rem 0;padding:.5rem;background:#fafafa;border-radius:4px;}')
  htmlParts.push('.caption{font-size:.9rem;color:#444;margin-bottom:.5rem;}')
  htmlParts.push('img{max-width:100%;height:auto;border:1px solid #eee;}')
  htmlParts.push('</style></head><body>')
  htmlParts.push('<h1>Phase 13 — compression sample review</h1>')
  htmlParts.push(`<p>Generated: ${new Date().toISOString()}</p>`)
  htmlParts.push(
    '<p>Open each image in a new tab and zoom to 100%. You are checking that solfège underlines, slur marks, ledger lines and lyric text are as readable as the original. Then choose a variant.</p>',
  )

  for (const s of samples) {
    htmlParts.push('<section class="sample">')
    htmlParts.push(`<h2>${s.file}</h2>`)
    htmlParts.push(`<p><em>${s.reason} — ${(s.size / 1024).toFixed(1)} KiB</em></p>`)

    // Original block
    htmlParts.push('<div class="block">')
    htmlParts.push(
      `<div class="caption">original — ${(s.size / 1024 / 1024).toFixed(2)} MB (0.0%)</div>`,
    )
    htmlParts.push(`<img src="/tunes-samples/original/${s.file}" alt="original ${s.file}">`)
    htmlParts.push('</div>')

    for (const v of VARIANTS) {
      const dest = join(SAMPLES_DIR, v.id, s.file)
      const compressedSize = statSync(dest).size
      const pct = (((s.size - compressedSize) / s.size) * 100).toFixed(1)
      htmlParts.push('<div class="block">')
      htmlParts.push(
        `<div class="caption">${v.id} — ${(compressedSize / 1024 / 1024).toFixed(2)} MB (-${pct}%)</div>`,
      )
      htmlParts.push(`<img src="/tunes-samples/${v.id}/${s.file}" alt="${v.id} ${s.file}">`)
      htmlParts.push('</div>')
    }
    htmlParts.push('</section>')
  }

  htmlParts.push('</body></html>')
  writeFileSync(join(SAMPLES_DIR, 'index.html'), htmlParts.join('\n'))

  console.log(`\nReview URL: https://psalter.gsdlabs.dev/tunes-samples/index.html`)
  console.log('SAMPLE_BUILT')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
