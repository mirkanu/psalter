#!/usr/bin/env npx tsx
/**
 * Phase 13 Plan 02 — full-set compression verifier.
 *
 * Usage: npx tsx scripts/verify-tunes-compression.ts [--compressed=<dir>] [--original=<dir>] [--width=N] [--partial]
 *
 * Default --compressed: public/tunes-compressed (Plan 01's staging dir)
 * Default --original:   public/tunes
 * Default --width:      2000  (the width used at compression time — must match Plan 01's DEFAULT_WIDTH)
 * --partial:            skip the whole-set count equality check (only verifies files present in --compressed)
 *
 * Checks every file — not a sample — for:
 *   - set-level filename-set equality (skipped under --partial)
 *   - JPEGs: strictly smaller than original, valid JPEG decode, width <= bound, aspect ratio preserved
 *   - PNGs and dotfiles: byte-identical (size + sha256)
 *
 * Exit contract: prints `COMPRESSION_VERIFIED` ONLY when failures === 0, exits 1 otherwise.
 *
 * Built from the verify-migration.ts assert/report/exit-code skeleton (lines 29-38, 245-274),
 * generalised from verify-tunes-backup.sh's 10-file sharp decode block to the full 326-file set.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

// Plan 01 Task 3: human-approved setting w2000-q82 on 2026-08-11
const DEFAULT_WIDTH = 2000

const ORIGINAL_DIR = join(process.cwd(), 'public/tunes')
const DEFAULT_COMPRESSED_DIR = join(process.cwd(), 'public/tunes-compressed')

// OOM mitigation: sequential, no cache.
sharp.cache(false)
sharp.concurrency(1)

let failures = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  + ${message}`)
  } else {
    console.error(`  FAIL: ${message}`)
    failures++
  }
}

interface CliArgs {
  compressedDir: string
  originalDir: string
  width: number
  partial: boolean
}

function parseArgs(argv: string[]): CliArgs {
  let compressedDir = DEFAULT_COMPRESSED_DIR
  let originalDir = ORIGINAL_DIR
  let width = DEFAULT_WIDTH
  let partial = false
  for (const arg of argv) {
    if (arg.startsWith('--compressed=')) {
      const raw = arg.slice('--compressed='.length)
      compressedDir = raw.startsWith('/') ? raw : join(process.cwd(), raw)
    } else if (arg.startsWith('--original=')) {
      const raw = arg.slice('--original='.length)
      originalDir = raw.startsWith('/') ? raw : join(process.cwd(), raw)
    } else if (arg.startsWith('--width=')) {
      width = Number(arg.slice('--width='.length))
    } else if (arg === '--partial') {
      partial = true
    } else {
      console.error(`ABORT: unknown argument ${arg}`)
      process.exit(1)
    }
  }
  return { compressedDir, originalDir, width, partial }
}

function sha256OfFile(path: string): string {
  const hash = createHash('sha256')
  hash.update(readFileSync(path))
  return hash.digest('hex')
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  console.log('=== Tune Image Compression Verification ===')
  console.log(`Original dir:  ${args.originalDir}`)
  console.log(`Compressed dir: ${args.compressedDir}`)
  console.log(`Width bound:    ${args.width}`)
  if (args.partial) console.log('[PARTIAL MODE — set-level count equality skipped]')

  if (!existsSync(args.originalDir)) {
    console.error(`ABORT: original dir not found: ${args.originalDir}`)
    process.exit(1)
  }
  if (!existsSync(args.compressedDir)) {
    console.error(`ABORT: compressed dir not found: ${args.compressedDir}`)
    process.exit(1)
  }

  // --partial iterates compressedEntries (smoke runs); full mode iterates originalEntries
  const originalEntries = readdirSync(args.originalDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .sort()

  const compressedEntries = readdirSync(args.compressedDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .sort()

  const fullSet = args.partial ? compressedEntries : originalEntries
  const setLabel = args.partial ? 'compressed' : 'original'

  // A. Set-level checks (skipped under --partial)
  if (!args.partial) {
    console.log('\n-- A. Set-level checks --')
    assert(originalEntries.length === compressedEntries.length,
      `entry count: original=${originalEntries.length}, compressed=${compressedEntries.length}`)

    const origSet = new Set(originalEntries)
    const compSet = new Set(compressedEntries)
    const missingFromCompressed = originalEntries.filter((n) => !compSet.has(n))
    const extraInCompressed = compressedEntries.filter((n) => !origSet.has(n))

    if (missingFromCompressed.length > 0) {
      for (const n of missingFromCompressed) {
        assert(false, `${n}: present in original but missing in compressed`)
      }
    } else {
      console.log(`  + no entries missing from compressed set`)
    }
    if (extraInCompressed.length > 0) {
      for (const n of extraInCompressed) {
        assert(false, `${n}: present in compressed but not in original`)
      }
    } else {
      console.log(`  + no unexpected entries in compressed set`)
    }
  }

  // B. Per-file checks
  console.log('\n-- B. Per-file checks --')

  // Aggregate stats
  let totalOriginalBytes = 0
  let totalCompressedBytes = 0
  let jpegsChecked = 0
  let pngsChecked = 0
  let metaCopied = 0
  const reductions: Array<{ name: string; pct: number }> = []

  const total = fullSet.length

  for (let idx = 0; idx < fullSet.length; idx++) {
    const name = fullSet[idx]
    const src = join(args.originalDir, name)
    const dest = join(args.compressedDir, name)

    if (idx > 0 && idx % 50 === 0) {
      const rss = Math.round(process.memoryUsage().rss / 1048576)
      console.log(`  [progress ${idx}/${total} (from ${setLabel})] rss=${rss}MB`)
    }

    // In full mode every original entry must have a matching compressed output
    if (!args.partial && !existsSync(dest)) {
      assert(false, `${name}: output exists`)
      continue
    }
    // In --partial mode we iterate compressedEntries directly; the existence check is implicit.
    if (args.partial && !existsSync(src)) {
      assert(false, `${name}: source exists in original dir`)
      continue
    }

    const origStat = statSync(src)
    const compStat = statSync(dest)
    totalOriginalBytes += origStat.size
    totalCompressedBytes += compStat.size

    if (/\.(jpg|jpeg)$/i.test(name)) {
      jpegsChecked++
      // Strict inequality — ASSET-01 success criterion #1
      assert(compStat.size < origStat.size,
        `${name}: ${origStat.size} -> ${compStat.size} bytes (smaller)`)

      const meta = await sharp(dest).metadata()
      assert(meta.format === 'jpeg', `${name}: format=jpeg`)
      assert(!!meta.width && !!meta.height && meta.width! > 0 && meta.height! > 0,
        `${name}: decodes (${meta.width}x${meta.height})`)
      assert(meta.width! <= args.width, `${name}: width ${meta.width} <= ${args.width}`)

      const origMeta = await sharp(src).metadata()
      const compRatio = meta.width! / meta.height!
      const origRatio = origMeta.width! / origMeta.height!
      assert(Math.abs(compRatio - origRatio) < 0.01,
        `${name}: aspect ratio preserved (orig ${origMeta.width}x${origMeta.height}, comp ${meta.width}x${meta.height})`)

      const pct = origStat.size > 0 ? ((origStat.size - compStat.size) / origStat.size) * 100 : 0
      reductions.push({ name, pct })
    } else {
      // .png or non-image (dotfiles) — byte-identity
      const isImage = /\.(png)$/i.test(name)
      if (isImage) pngsChecked++
      else metaCopied++

      assert(compStat.size === origStat.size,
        `${name}: copied byte-identical (size ${origStat.size})`)

      const origHash = sha256OfFile(src)
      const compHash = sha256OfFile(dest)
      assert(origHash === compHash,
        `${name}: copied byte-identical (sha256)`)
    }
  }

  // C. Aggregate summary
  console.log('\n-- C. Aggregate summary --')
  const totalReductionPct = totalOriginalBytes > 0
    ? ((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100
    : 0
  const savedBytes = totalOriginalBytes - totalCompressedBytes

  console.log(`  Original bytes total:   ${totalOriginalBytes}`)
  console.log(`  Compressed bytes total: ${totalCompressedBytes}`)
  console.log(`  Saved:                  ${savedBytes} bytes`)
  console.log(`  Reduction:              ${totalReductionPct.toFixed(1)}%`)
  console.log(`  JPEGs checked:          ${jpegsChecked}`)
  console.log(`  PNGs checked:           ${pngsChecked}`)
  console.log(`  Meta/dotfiles checked:  ${metaCopied}`)

  if (reductions.length > 0) {
    const sorted = [...reductions].sort((a, b) => a.pct - b.pct)
    const smallest = sorted[0]
    const largest = sorted[sorted.length - 1]
    console.log(`  Smallest reduction:     ${smallest.name} (${smallest.pct.toFixed(1)}%)`)
    console.log(`  Largest reduction:      ${largest.name} (${largest.pct.toFixed(1)}%)`)
  }

  // D. Exit contract
  console.log('\n==============================')
  if (failures === 0) {
    console.log('All checks passed')
    console.log('COMPRESSION_VERIFIED')
  } else {
    console.error(`${failures} check(s) failed`)
  }
  console.log('==============================')

  process.exit(failures > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
