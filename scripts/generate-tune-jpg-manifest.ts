/**
 * Regenerate src/lib/tune-jpg-manifest.ts from the live R2 bucket listing.
 *
 * Run this after adding or removing tune JPGs in R2:
 *   rclone --config <conf> lsf psalter:psalter-tunes-backup/ > /tmp/r2-keys.txt
 *   npx tsx scripts/generate-tune-jpg-manifest.ts /tmp/r2-keys.txt
 *
 * The manifest exists because deriveTuneJpgPages can no longer probe the
 * filesystem (JPGs live in R2, and Vercel has no local copy). Without a
 * committed page count the builder has to guess, which emits URLs for
 * pages that do not exist.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const KEY_RE = /^(.+)-(staff|solfege)-(\d+)\.jpg$/

const listingPath = process.argv[2]
if (!listingPath) {
  console.error('usage: tsx scripts/generate-tune-jpg-manifest.ts <r2-key-listing.txt>')
  process.exit(1)
}

const counts = new Map<string, { staff: number; solfege: number }>()
let skipped = 0

for (const raw of readFileSync(listingPath, 'utf8').split('\n')) {
  const key = raw.trim()
  if (!key) continue
  const m = KEY_RE.exec(key)
  if (!m) {
    skipped++
    console.warn(`skipped unrecognised key: ${key}`)
    continue
  }
  const [, slug, kind, idxRaw] = m
  const pageCount = Number(idxRaw) + 1
  const entry = counts.get(slug) ?? { staff: 0, solfege: 0 }
  if (kind === 'staff') entry.staff = Math.max(entry.staff, pageCount)
  else entry.solfege = Math.max(entry.solfege, pageCount)
  counts.set(slug, entry)
}

const slugs = [...counts.keys()].sort()
const body = slugs
  .map((s) => {
    const { staff, solfege } = counts.get(s)!
    return `  '${s}': { staff: ${staff}, solfege: ${solfege} },`
  })
  .join('\n')

const out = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with scripts/generate-tune-jpg-manifest.ts
 *
 * Page counts for every tune JPG in the psalter-tunes-backup R2 bucket,
 * keyed by tune slug. Values are the number of pages that actually exist,
 * so deriveTuneJpgPages never emits a URL that 404s.
 */

export type TuneJpgPageCounts = { staff: number; solfege: number }

export const TUNE_JPG_MANIFEST: Record<string, TuneJpgPageCounts> = {
${body}
}
`

const target = join(process.cwd(), 'src/lib/tune-jpg-manifest.ts')
writeFileSync(target, out)

const totalFiles = slugs.reduce((n, s) => {
  const e = counts.get(s)!
  return n + e.staff + e.solfege
}, 0)

console.log(`wrote ${target}`)
console.log(`  tunes:   ${slugs.length}`)
console.log(`  files:   ${totalFiles}`)
console.log(`  skipped: ${skipped}`)
