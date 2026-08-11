/**
 * Phase 13 — sequential, guarded batch compressor for public/tunes/.
 *
 * See .planning/phases/13-tune-image-compression/13-RESEARCH.md (Pattern 1 — the OOM
 * mitigation on a 3.7GB VPS) and 13-PATTERNS.md for why every guard below exists.
 *
 * Hard rules (see plan <interfaces> / <threat_model>):
 *   - Never writes into public/tunes/. Guard 1 aborts before any filesystem read.
 *   - Refuses to run unless the Phase 6 backup archive is present and matches its
 *     recorded sha256 — otherwise a single in-place overwrite is unrecoverable.
 *   - Sequential: sharp.concurrency(1), never parallel, RSS logged every 25 files.
 *   - PNGs and .gitignore/.gitkeep are copied byte-for-byte (not re-encoded) so the
 *     swap step does not lose them.
 */
import { createReadStream, createWriteStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { execSync } from 'node:child_process'
import sharp from 'sharp'

// Phase 13 Plan 01 Task 3: human-approved setting w2000-q82, reviewed against 4 melisma-approved scores on 2026-08-11
const DEFAULT_QUALITY = 82
const DEFAULT_WIDTH = 2000
const TUNES_DIR = join(process.cwd(), 'public/tunes')
const DEFAULT_OUT_DIR = join(process.cwd(), 'public/tunes-compressed')
const BACKUP_ARCHIVE = '/home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz'
const BACKUP_SHA256 = '28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9'
const MIN_IMAGE_COUNT = 300
const MIN_FREE_GB = 2

interface CliArgs {
  quality: number
  width: number
  outDir: string
  limit: number | null
  only: string | null
  force: boolean
  skipBackupCheck: boolean
}

function parseArgs(argv: string[]): CliArgs {
  let quality = DEFAULT_QUALITY
  let width = DEFAULT_WIDTH
  let outDir = DEFAULT_OUT_DIR
  let limit: number | null = null
  let only: string | null = null
  let force = false
  let skipBackupCheck = false

  for (const arg of argv) {
    if (arg.startsWith('--quality=')) {
      quality = Number(arg.slice('--quality='.length))
    } else if (arg.startsWith('--width=')) {
      width = Number(arg.slice('--width='.length))
    } else if (arg.startsWith('--out=')) {
      const raw = arg.slice('--out='.length)
      outDir = raw.startsWith('/') ? raw : join(process.cwd(), raw)
    } else if (arg.startsWith('--limit=')) {
      limit = Number(arg.slice('--limit='.length))
    } else if (arg.startsWith('--only=')) {
      only = arg.slice('--only='.length)
    } else if (arg === '--force') {
      force = true
    } else if (arg === '--skip-backup-check') {
      skipBackupCheck = true
    } else {
      console.error(`ABORT: unknown argument ${arg}`)
      process.exit(1)
    }
  }

  return { quality, width, outDir, limit, only, force, skipBackupCheck }
}

function abort(reason: string): never {
  console.error(`ABORT: ${reason}`)
  process.exit(1)
}

async function verifyBackupSha256(): Promise<void> {
  if (!existsSync(BACKUP_ARCHIVE)) {
    abort('backup archive missing or checksum mismatch — refusing to compress')
  }
  const hash = createHash('sha256')
  await new Promise<void>((res, rej) => {
    const s = createReadStream(BACKUP_ARCHIVE)
    s.on('data', (chunk) => hash.update(chunk))
    s.on('end', () => res())
    s.on('error', (e) => rej(e))
  })
  const digest = hash.digest('hex')
  if (digest !== BACKUP_SHA256) {
    abort(`backup archive sha256 mismatch (got ${digest}, expected ${BACKUP_SHA256})`)
  }
  console.log(`Backup pre-flight OK: ${digest}`)
}

function freeGb(dir: string): number {
  const out = execSync(`df -Pk ${dir}`, { encoding: 'utf8' })
  const lines = out.trim().split('\n')
  const last = lines[lines.length - 1]
  const kbFree = Number(last.split(/\s+/)[3])
  return kbFree / 1024 / 1024
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  // Guard 1 — never write into the live tunes directory. FIRST check, before any FS read.
  if (resolve(args.outDir) === resolve(TUNES_DIR)) {
    abort('refusing to write into the live tunes directory')
  }

  // Guard 2 — source sanity (count must be >= MIN_IMAGE_COUNT)
  if (!existsSync(TUNES_DIR)) {
    abort(`source directory not found: ${TUNES_DIR}`)
  }
  const allEntries = readdirSync(TUNES_DIR, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .sort()
  const imageNames = allEntries.filter((n) => /\.(jpg|jpeg|png)$/i.test(n))
  if (imageNames.length < MIN_IMAGE_COUNT) {
    abort(`only ${imageNames.length} images found in ${TUNES_DIR} (expected ~326)`)
  }

  // Guard 3 — backup pre-flight (unless explicitly skipped)
  if (args.skipBackupCheck) {
    console.error('WARNING: backup pre-flight skipped')
  } else {
    await verifyBackupSha256()
  }

  // Guard 4 — free space on the staging filesystem
  const parent = dirname(args.outDir)
  const gb = freeGb(parent)
  if (gb < MIN_FREE_GB) {
    abort(`only ${gb.toFixed(2)}GB free on ${parent} (need at least ${MIN_FREE_GB}GB)`)
  }

  // Guard 5 — clean staging dir
  if (existsSync(args.outDir)) {
    const existing = readdirSync(args.outDir)
    if (existing.length > 0 && !args.force) {
      abort(`${args.outDir} already exists and is not empty (pass --force to overwrite)`)
    }
    if (existing.length > 0) {
      rmSync(args.outDir, { recursive: true, force: true })
    }
  }
  mkdirSync(args.outDir, { recursive: true })

  // Apply filters
  let workList = imageNames
  if (args.only) workList = workList.filter((n) => n.includes(args.only!))
  if (args.limit !== null) workList = workList.slice(0, args.limit)
  const nonImageNames = allEntries.filter((n) => !/\.(jpg|jpeg|png)$/i.test(n))

  // Sharp setup — OOM mitigation
  sharp.cache(false)
  sharp.concurrency(1)

  let totalBefore = 0
  let totalAfter = 0
  let jpegsReencoded = 0
  let filesCopied = 0
  let notSmaller = 0
  const fileRecords: Array<{ name: string; originalBytes: number; compressedBytes: number }> = []

  const total = workList.length + nonImageNames.length
  let i = 0

  for (const name of workList) {
    const src = join(TUNES_DIR, name)
    const dest = join(args.outDir, name)
    const srcStat = statSync(src)
    totalBefore += srcStat.size

    if (/\.(jpg|jpeg)$/i.test(name)) {
      await sharp(src)
        .resize({ width: args.width, withoutEnlargement: true })
        .jpeg({ quality: args.quality, mozjpeg: true, chromaSubsampling: '4:4:4' })
        .toFile(dest)
      const destStat = statSync(dest)
      totalAfter += destStat.size
      jpegsReencoded++
      if (destStat.size >= srcStat.size) {
        console.warn(`WARN: ${name} did not shrink (${srcStat.size} -> ${destStat.size})`)
        notSmaller++
      }
      fileRecords.push({ name, originalBytes: srcStat.size, compressedBytes: destStat.size })
    } else {
      // .png — copy byte-for-byte
      copyFileSync(src, dest)
      const destStat = statSync(dest)
      totalAfter += destStat.size
      filesCopied++
      fileRecords.push({ name, originalBytes: srcStat.size, compressedBytes: destStat.size })
    }

    i++
    if (i % 25 === 0) {
      const rss = Math.round(process.memoryUsage().rss / 1048576)
      console.log(`[${i}/${total}] rss=${rss}MB`)
    }
  }

  for (const name of nonImageNames) {
    const src = join(TUNES_DIR, name)
    const dest = join(args.outDir, name)
    const srcStat = statSync(src)
    copyFileSync(src, dest)
    const destStat = statSync(dest)
    totalBefore += srcStat.size
    totalAfter += destStat.size
    filesCopied++
    i++
    if (i % 25 === 0) {
      const rss = Math.round(process.memoryUsage().rss / 1048576)
      console.log(`[${i}/${total}] rss=${rss}MB`)
    }
  }

  const reductionPct = totalBefore > 0 ? ((totalBefore - totalAfter) / totalBefore) * 100 : 0

  // Summary
  console.log('Source dir:        ' + TUNES_DIR)
  console.log('Out dir:           ' + args.outDir)
  console.log('Quality:           ' + args.quality)
  console.log('Width:             ' + args.width)
  console.log('Files processed:   ' + (jpegsReencoded + filesCopied))
  console.log('JPEGs re-encoded:  ' + jpegsReencoded)
  console.log('Files copied:      ' + filesCopied)
  console.log('Total bytes before:' + totalBefore)
  console.log('Total bytes after: ' + totalAfter)
  console.log('Reduction:         ' + reductionPct.toFixed(1) + '%')
  console.log('Did not shrink:    ' + notSmaller)

  // JSON report
  mkdirSync(join(process.cwd(), 'scripts/output'), { recursive: true })
  writeFileSync(
    join(process.cwd(), 'scripts/output/compress-tunes-report.json'),
    JSON.stringify(
      {
        sourceDir: TUNES_DIR,
        outDir: args.outDir,
        quality: args.quality,
        width: args.width,
        filesProcessed: jpegsReencoded + filesCopied,
        jpegsReencoded,
        filesCopied,
        totalBytesBefore: totalBefore,
        totalBytesAfter: totalAfter,
        reductionPct: Number(reductionPct.toFixed(1)),
        notSmaller,
        files: fileRecords,
      },
      null,
      2,
    ),
  )

  console.log('COMPRESSION_COMPLETE')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
