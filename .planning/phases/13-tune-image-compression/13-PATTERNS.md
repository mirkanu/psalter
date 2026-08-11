# Phase 13: Tune Image Compression - Pattern Map

**Mapped:** 2026-08-10
**Files analyzed:** 3 (all new) — originally 2, `scripts/verify-backup-archive.sh` added during planning per plan-checker hygiene note
**Analogs found:** 3 / 3 (multiple analogs per file, no gaps)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `scripts/compress-tunes.ts` | utility (ops/build script) | batch (filesystem, file-I/O) | `scripts/backup-tunes.sh` (shell equivalent of the exact "batch-transform `public/tunes/`, guard, report" pattern) + `src/lib/ocr-solfege-v2.ts::prepareImageBuffer` (the only existing sharp resize/jpeg call in the repo) | role-match (bash→ts port) / exact (sharp options) |
| `scripts/verify-tunes-compression.ts` | utility (ops/build verification script) | batch (filesystem, file-I/O) | `scripts/verify-tunes-backup.sh` (per-file guard + decode-sample + summary pattern) + `scripts/verify-migration.ts` (TypeScript `assert()`/failure-counter/exit-code reporting pattern) | role-match (bash→ts port) / exact (assert/report structure) |
| `scripts/verify-backup-archive.sh` (Plan 03 Task 2 — added during planning) | utility (ops/build verification script, archive-only) | single-shot (shell, sha256sum + tar extract + decode-sample) | `scripts/verify-tunes-backup.sh` (Phase 6 — port the relevant blocks: lines 74-95 sharp decode, count check, `tar xzf` extract, `trap` cleanup; drop the live-tree md5 diff step since post-swap `public/tunes/` is *supposed* to differ) | role-match (no `existsSync` against live tree, archive-only) |

**Note on match quality:** No existing script in this repo is *both* TypeScript *and* a `public/tunes/` batch filesystem job — the closest same-language TypeScript scripts (`verify-migration.ts`, `backfill-tune-jpgs.ts`) establish the project's TS script conventions (imports, `main()`, error handling, exit codes), while the closest same-domain scripts (`backup-tunes.sh`, `verify-tunes-backup.sh`, both Phase 6) establish the exact guard/report/abort structure for `public/tunes/` operations. Combine both: port the bash scripts' *structure* into the TypeScript *idiom* used elsewhere in `scripts/`.

## Pattern Assignments

### `scripts/compress-tunes.ts` (utility, batch/file-I/O)

**Primary analog (structure):** `scripts/backup-tunes.sh`
**Secondary analog (sharp call + resize/quality options):** `src/lib/ocr-solfege-v2.ts` (`prepareImageBuffer`, lines 95-101)
**Tertiary analog (TS script conventions — imports, main(), error handling):** `scripts/verify-migration.ts` (lines 1-38), `scripts/backfill-tune-jpgs.ts` (full file, 42 lines)

**TypeScript script skeleton pattern** (`scripts/backfill-tune-jpgs.ts` lines 1-6, 14-16, 42):
```typescript
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { tunes } from '../src/db/schema'
import { eq } from 'drizzle-orm'

const TUNES_DIR = join(process.cwd(), 'public/tunes')

async function main() {
  // ... body ...
}

main().catch(e => { console.error(e); process.exit(1) })
```
This is the standard shape for a one-off `scripts/*.ts` file in this repo: plain Node imports (`node:fs`, `node:path`), a single `async function main()`, and `main().catch(e => { console.error(e); process.exit(1) })` at the bottom. `compress-tunes.ts` should follow this exact skeleton (no framework, no CLI-arg library — `verify-migration.ts` shows argv parsing is done manually via `process.argv.slice(2)` when needed, e.g. for a `--dry-run` flag).

**Sharp resize + mozjpeg call — exact prior art in this repo** (`src/lib/ocr-solfege-v2.ts` lines 93-101):
```typescript
import * as fs from 'node:fs'
import sharp from 'sharp'

export async function prepareImageBuffer(imagePath: string): Promise<Buffer> {
  const rawFile = fs.readFileSync(imagePath)
  return rawFile.length > 3.5 * 1024 * 1024
    ? await sharp(rawFile).resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer() as Buffer
    : Buffer.from(rawFile)
}
```
This is the only place in the codebase that already calls `sharp(...).resize({ width: 2000, withoutEnlargement: true })` — confirms the `2000`/`withoutEnlargement` combination is an established convention here, not a new invention. RESEARCH.md's recommended call adds `mozjpeg: true` and `chromaSubsampling: '4:4:4'` and writes `.toFile()` instead of `.toBuffer()` (per RESEARCH.md Pattern 1):
```typescript
import sharp from 'sharp'
sharp.cache(false)
sharp.concurrency(1)

for (const file of files) {
  await sharp(file.src)
    .resize({ width: 2000, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(file.dest)
}
```

**Guard pattern — free-space precheck before a large write** (`scripts/backup-tunes.sh` lines 29-35, bash — port the *logic*, not the syntax):
```bash
FREE_KB=$(df -Pk "$(dirname "$DEST_DIR")" | tail -1 | awk '{print $4}')
FREE_GB=$((FREE_KB / 1024 / 1024))
if [ "$FREE_GB" -lt 2 ]; then
  echo "ABORT: only ${FREE_GB}GB free on $(dirname "$DEST_DIR") filesystem (need at least 2GB)" >&2
  exit 1
fi
```
Port to TS via `child_process.execSync('df -Pk ...')` or Node's `fs.statfsSync()` (Node 18.15+) — either is fine, `df -Pk` shelling-out matches the existing project convention most closely since `backup-tunes.sh` already does it this way and this project has no existing pure-Node disk-space check to copy instead.

**Guard pattern — source file-count sanity check** (`scripts/backup-tunes.sh` lines 14-19):
```bash
IMG_COUNT=$(find "$SRC" -type f \( -name '*.jpg' -o -name '*.png' \) | wc -l)
if [ "$IMG_COUNT" -lt 300 ]; then
  echo "ABORT: only $IMG_COUNT images found in $SRC (expected ~326)" >&2
  exit 1
fi
```
Apply the same "expected count" sanity check in TS via `fs.readdirSync(TUNES_DIR).filter(f => /\.(jpg|png)$/i.test(f))` before starting the batch loop.

**Staging-dir + destination path conventions** (`src/lib/tune-jpg-urls.ts` lines 16-17, 51, 54 — how the rest of the app resolves `public/tunes/` paths, which `compress-tunes.ts` must not break):
```typescript
import { existsSync } from 'fs'
import { join } from 'path'
// ...
if (existsSync(join(process.cwd(), 'public', staffPath))) { ... }
```
Confirms `process.cwd()`-relative `join(..., 'public', ...)` is the standard way this repo resolves `public/tunes/` — use the same base-path resolution in `compress-tunes.ts` (`join(process.cwd(), 'public/tunes')` / `join(process.cwd(), 'public/tunes-compressed')`) rather than `__dirname`-relative paths, matching `backfill-tune-jpgs.ts` line 8 (`const TUNES_DIR = join(process.cwd(), 'public/tunes')`).

**Per-file "did it actually shrink" guard** — RESEARCH.md Pattern 3, no direct repo analog (new logic), but follows the same "assert + warn, don't silently pass" idiom as `verify-migration.ts`'s `assert()` helper (see below):
```typescript
const compressedSize = fs.statSync(dest).size
const originalSize = fs.statSync(src).size
if (compressedSize >= originalSize) {
  console.warn(`WARN: ${file} did not shrink (${originalSize} -> ${compressedSize}) — investigate before swap`)
}
```

**Summary reporting pattern** (`scripts/backup-tunes.sh` lines 47-58 — same "print each metric, then a final status line" shape `compress-tunes.ts`'s end-of-run summary should mirror):
```bash
echo "Archive:        $ARCHIVE"
echo "Size:           $(du -h "$ARCHIVE" | cut -f1)"
echo "SHA256:         $(sha256sum "$ARCHIVE" | cut -d' ' -f1)"
echo "Source images:  $IMG_COUNT"
echo "Archived images: $ARCHIVE_IMG_COUNT"
# ...
echo "BACKUP_CREATED"
```
`compress-tunes.ts` should end with an analogous block: total files processed, total size before/after, % reduction, count of WARN-flagged files, and a final single-line machine-greppable status token (e.g. `console.log('COMPRESSION_COMPLETE')`) — mirrors the `BACKUP_CREATED` / `BACKUP_VERIFIED` sentinel-line convention Phase 6 established.

---

### `scripts/verify-tunes-compression.ts` (utility, batch/file-I/O)

**Primary analog (structure — guard, per-file check loop, decode sample, sentinel line):** `scripts/verify-tunes-backup.sh`
**Secondary analog (TypeScript assert/failure-counter/summary/exit-code idiom):** `scripts/verify-migration.ts` (lines 1-38, 245-274)

**`assert()` + failure-counter pattern — exact TS idiom to reuse** (`scripts/verify-migration.ts` lines 29-38):
```typescript
let failures = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  + ${message}`)
  } else {
    console.error(`  FAIL: ${message}`)
    failures++
  }
}
```
`verify-tunes-compression.ts` should use this exact helper for its per-file checks (exists / smaller-than-original / decodes / non-zero dimensions) rather than inventing a new reporting mechanism — it is the established convention for verification scripts in this repo.

**Main/report/exit-code pattern** (`scripts/verify-migration.ts` lines 249-273):
```typescript
async function main() {
  console.log('=== Migration Verification ===')
  // ... run checks, populating `failures` via assert() ...
  console.log('\n==============================')
  if (failures === 0) {
    console.log('All checks passed')
  } else {
    console.error(`${failures} check(s) failed`)
  }
  console.log('==============================')
  await client.end()
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Verification failed:', err)
  client.end()
  process.exit(1)
})
```
Port directly for `verify-tunes-compression.ts` (drop the `client.end()` calls if the script doesn't need a DB connection — it likely doesn't, since size/decode checks are pure filesystem+sharp, though the legibility-sample query from RESEARCH.md's Code Examples section does need `db` if the script is extended to auto-list `approved`-status sample filenames for the human spot-check step).

**Per-file size + decode verification loop** — RESEARCH.md Architecture Patterns step 2, structurally mirrors `verify-tunes-backup.sh`'s decode-sample block (lines 74-95) but the compression-verification version must check **every** file (all 326), not a 10-file sample, since ASSET-01 requires "every compressed output smaller than original":
```typescript
// Source: pattern derived from verify-tunes-backup.sh's sharp decode-check
// (lines 74-95), generalized from a 10-file sample to the full 326-file set
for (const file of files) {
  const src = join(ORIGINAL_DIR, file)
  const dest = join(COMPRESSED_DIR, file)
  assert(fs.existsSync(dest), `${file}: output exists`)
  if (!fs.existsSync(dest)) continue
  const origSize = fs.statSync(src).size
  const compSize = fs.statSync(dest).size
  assert(compSize < origSize, `${file}: ${origSize} -> ${compSize} bytes (smaller)`)
  const meta = await sharp(dest).metadata()
  assert(meta.width! > 0 && meta.height! > 0, `${file}: decodes (${meta.width}x${meta.height})`)
}
```

**Byte-comparison / md5-diff idiom** (`scripts/verify-tunes-backup.sh` lines 40-49) — **do NOT reuse this specific check** for post-compression verification; RESEARCH.md's Pitfall 3 explicitly warns that a passing md5-diff between `public/tunes/` and the archive is the *expected-to-fail* case after compression (files are intentionally different now). Reuse `verify-tunes-backup.sh` unmodified only for its original purpose — confirming the **archive itself** hasn't changed — via a fresh `sha256sum` against `BACKUP-MANIFEST.md`'s recorded value (RESEARCH.md Code Examples, "Backup checksum re-verification"):
```bash
sha256sum /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz
```

**Sentinel/summary output line** (`scripts/verify-tunes-backup.sh` line 97):
```bash
echo "BACKUP_VERIFIED"
```
`verify-tunes-compression.ts` should end with an analogous machine-greppable line, e.g. `console.log('COMPRESSION_VERIFIED')`, printed only when `failures === 0`.

---

## Shared Patterns

### TypeScript one-off script skeleton
**Source:** `scripts/backfill-tune-jpgs.ts` (full file), `scripts/verify-migration.ts` (lines 1-38, 245-273), `scripts/check-tunes-quick.ts` (full file)
**Apply to:** Both new files
```typescript
// imports: node:fs / node:path first, then drizzle/postgres if DB is needed, then local modules
import { join } from 'node:path'
// ...

async function main() {
  // body
}

main().catch(e => { console.error(e); process.exit(1) })
```
No CLI-argument-parsing library exists or is used anywhere in `scripts/` — `verify-migration.ts` parses flags manually via `process.argv.slice(2)` / `args.includes('--quick')`. If `compress-tunes.ts` needs a `--dry-run` or `--limit=N` flag, follow that same manual-argv convention rather than adding a new dependency (consistent with RESEARCH.md's "Don't Hand-Roll" table — no new deps needed for this phase).

### `public/tunes/` path resolution
**Source:** `src/lib/tune-jpg-urls.ts` lines 16-17, 44-56; `scripts/backfill-tune-jpgs.ts` line 8
**Apply to:** Both new files
```typescript
import { join } from 'node:path'
const TUNES_DIR = join(process.cwd(), 'public/tunes')
```
Always resolve relative to `process.cwd()`, never `__dirname` — matches every existing script that touches `public/tunes/`.

### Sequential (not parallel) sharp processing
**Source:** RESEARCH.md Pattern 1 (`.planning/phases/13-tune-image-compression/13-RESEARCH.md` lines 110-127) — no repo analog needed since the VPS memory constraint is documented directly in `CLAUDE.md`'s "Hetzner VPS memory constraints" section
**Apply to:** `scripts/compress-tunes.ts` only
```typescript
sharp.cache(false)
sharp.concurrency(1)
for (const file of files) {
  await sharp(file.src)...toFile(file.dest) // one at a time, never Promise.all
}
```

### Stage-then-verify-then-swap, never compress in place
**Source:** `scripts/backup-tunes.sh` header comment (lines 1-8) establishes the "no do-over" reasoning; RESEARCH.md Pattern 2 (lines 129-143) applies it directly to this phase
**Apply to:** `scripts/compress-tunes.ts` (write to `public/tunes-compressed/`, never overwrite `public/tunes/` directly) — the swap step itself should be a small, separately-reviewed final step (rename `public/tunes` → `public/tunes-old`, rename `public/tunes-compressed` → `public/tunes`) gated on `scripts/verify-tunes-compression.ts` reporting zero failures.

### Guard-then-abort with `>&2` + exit 1 on invalid state
**Source:** `scripts/backup-tunes.sh` lines 14-19, 21-27, 29-35 (three separate guards, same shape each time)
**Apply to:** Both new files — port the shape (check condition → print `ABORT: <reason>` to stderr → non-zero exit) into TS as `if (!condition) { console.error('ABORT: ...'); process.exit(1) }`, used for: source dir missing/too-few-files, staging dir already exists and non-empty (should be created fresh per run), and destination filesystem free-space check.

## No Analog Found

None — every sub-pattern needed for both new files has at least one direct repo analog (see table above). The only genuinely new logic (per-file "did it get smaller" assertion, RESEARCH.md Pattern 3) is trivial and follows the same `assert()`-style idiom already established by `verify-migration.ts`, so it is not flagged as a gap requiring RESEARCH.md-only guidance.

## Metadata

**Analog search scope:** `scripts/` (58 files), `src/lib/` (sharp usage), `src/db/` (schema for `tuneMelismaDecisions`/`tunes`), `src/db/index.ts` (db client pattern)
**Files scanned:** `scripts/backup-tunes.sh`, `scripts/verify-tunes-backup.sh`, `scripts/backfill-tune-jpgs.ts`, `scripts/download-tunes.ts`, `scripts/check-tunes-quick.ts`, `scripts/verify-migration.ts`, `src/lib/ocr-solfege-v2.ts`, `src/lib/tune-jpg-urls.ts`, `src/db/index.ts`, `src/db/schema.ts`, `package.json`
**Pattern extraction date:** 2026-08-10
