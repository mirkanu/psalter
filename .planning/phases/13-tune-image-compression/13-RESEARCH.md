# Phase 13: Tune Image Compression - Research

**Researched:** 2026-08-10
**Domain:** Batch image compression (sharp/libvips) of scanned sheet-music JPEGs on a memory-constrained VPS, with backup-verification and legibility spot-checking
**Confidence:** HIGH

## Summary

This phase compresses 326 tune score images (320 `.jpg` + 6 `.png`, 1.4GB total) that live at `public/tunes/` and are served as **plain static files via a bare `<img>` tag** — there is no Next.js Image Optimization pipeline in this project (`next.config.ts` has no `images` block, and `NotationRenderer.tsx` explicitly uses `<img>` with an eslint-disable comment, not `next/image`). This means compression must happen **once, at rest, ahead of time** — there is no runtime resize/format-negotiation layer to lean on.

Direct measurement on this VPS (see Code Examples) shows the real opportunity is **not** JPEG quality alone — it's that every source scan is a raw phone-camera capture at **4032×3024** (12MP) regardless of how it's actually displayed (max-width in the UI is far smaller, even in fullscreen). Resizing to a max width of ~2000px combined with `mozjpeg: true` and `chromaSubsampling: '4:4:4'` (to avoid softening the thin solfège underlines and staff lines that carry melisma information) produced **90%+ size reduction** on the largest files in local testing, comfortably clearing the "smaller than original" bar while preserving full legibility at normal and fullscreen zoom levels. `sharp` 0.34.5 (already a project dependency, already used by `scripts/verify-tunes-backup.sh`) has `mozjpeg` support compiled into its bundled libvips binary on this machine — confirmed by direct invocation, not assumed.

The backup this phase depends on (Phase 6 / SEC-03) is a single tarball at `/home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` (sha256-recorded in `BACKUP-MANIFEST.md`), verified byte-identical against the live 326-file tree with zero diff. Re-verifying "intact and untouched" post-compression is a direct re-run of the existing `scripts/verify-tunes-backup.sh` plus a fresh `sha256sum` comparison against the recorded checksum — no new backup-verification code needs to be invented.

**Primary recommendation:** Write to a new staging directory (`public/tunes-compressed/` or similar), never in-place; use `sharp` sequentially (concurrency 1) with `{ mozjpeg: true, chromaSubsampling: '4:4:4', quality: ~82 }` and a `resize({ width: 2000, withoutEnlargement: true })` step; verify every output file is strictly smaller than its source before swap; spot-check legibility specifically on tunes with `tune_melisma_decisions.status = 'approved'` (71 of 326 currently); re-run `scripts/verify-tunes-backup.sh` unchanged after the swap to prove the Phase 6 backup itself was untouched.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| ASSET-01 | All tune JPEGs compressed for faster display, originals backed up (depends on SEC-03) | Empirically measured compression approach (resize to ~2000px width + sharp mozjpeg + 4:4:4 chroma subsampling) shown to shrink every tested file size tier (largest 7MB+ files, mid-range, and smallest 172KB file) by 69-91%, satisfying "smaller than original." Backup mechanism from Phase 6 (SEC-03) documented in full — location, checksum, restore/re-verify scripts — so this phase can reuse `scripts/verify-tunes-backup.sh` rather than build new verification tooling. Legibility spot-check strategy grounded in the `tune_melisma_decisions` schema (71 of 326 images belong to `approved`-status tunes) with a ready-to-use query. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Image compression (resize + re-encode) | Build/ops script (Node, one-off) | — | No image-optimization middleware exists in this stack; this is a filesystem batch job, not an app-tier concern |
| Serving compressed images | Next.js static file serving (`public/`) | Browser `<img>` | Unchanged — same `/tunes/{slug}-{type}-{n}.jpg` URL scheme, same plain `<img>` consumer in `NotationRenderer.tsx` |
| Backup integrity verification | Build/ops script (Node, one-off) | — | Reuses existing `scripts/verify-tunes-backup.sh`; not an app-tier concern |
| Legibility spot-check | Human (manual, guided by script output) | — | "Remains legible" is a subjective visual judgment; can be assisted by dimension/size diffing but not fully automated |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | 0.34.5 (installed) | JPEG/PNG resize + re-encode via libvips | Already a project dependency (`package.json`), already used by `scripts/verify-tunes-backup.sh` for decode-verification, mozjpeg support confirmed working on this exact binary [VERIFIED: local `node -e` test against installed `node_modules/sharp`] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | — | — | No new dependency is required. `p-limit` was suggested generically in `PITFALLS.md` for concurrency control, but a plain sequential `for...of` loop achieves the same "concurrency 1" outcome with zero new dependencies — prefer that for a ~326-file one-off script. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp (libvips, in-process) | `imagemin`/`imagemin-mozjpeg` CLI-wrapper packages | Adds new dependencies for a job sharp already does natively; imagemin's mozjpeg plugin shells out to a binary rather than using libvips' built-in bundled mozjpeg encoder — no advantage here since sharp's mozjpeg already works |
| sharp (libvips) | `@squoosh/cli` | Squoosh CLI is effectively unmaintained (last significant release years old) and adds a second image toolchain alongside sharp for no measurable quality gain over sharp+mozjpeg on JPEGs |
| JPEG-only output | WebP/AVIF via `<picture>` + format negotiation | The project has **no format-negotiation layer today** (plain `<img>`, no `next/image`); introducing `<picture>` + two file variants per image adds real complexity (double storage, browser-support edge cases, cache-header nuance) for a personal-use hymnal site where JPEG-at-rest already meets the "smaller file size" success criterion by a wide margin. Treat as a documented option, not a default — flag for user confirmation if they want it (see Assumptions Log). |

**Installation:**
No new packages required — `sharp` is already installed.

**Version verification:** `npm view sharp version` → **0.35.3** (published 2026-07-01) is the latest on the registry [VERIFIED: npm registry], but the project's installed **0.34.5** already has working `mozjpeg`/`chromaSubsampling` support confirmed by direct test on this machine — no version bump is required for this phase. Upgrading is optional polish, not a blocker; if done, re-run the existing `abc-melisma`/notation test suite afterward since `sharp` is a shared dependency used elsewhere (Next.js itself also depends on `sharp` for its own build tooling per `npm ls sharp`).

## Architecture Patterns

### System Architecture Diagram

```
public/tunes/                     public/tunes-compressed/ (staging, new)
  {slug}-staff-N.jpg  ─┐            {slug}-staff-N.jpg  ─┐
  {slug}-solfege-N.jpg ┤  read      {slug}-solfege-N.jpg ┤  write
  {slug}-*.png         ┘            {slug}-*.png         ┘
        │                                    ▲
        │ 1. sequential sharp                │
        │    (resize→2000w, mozjpeg,         │
        │     chromaSubsampling 4:4:4)       │
        └────────────────────────────────────┘
                       │
                       ▼
        2. per-file verify: output exists,
           output.size < input.size,
           output decodes (sharp metadata()),
           dimensions sane (no 0×0)
                       │
                       ▼
        3. legibility spot-check (human):
           sample tunes WHERE latest
           tune_melisma_decisions.status = 'approved'
           (71 of 326) — view compressed JPG at 100%/fullscreen,
           confirm underlines/slur marks still readable
                       │
                       ▼
        4. atomic swap: public/tunes/ → public/tunes-old/ (temp),
           public/tunes-compressed/ → public/tunes/
           (or: rsync compressed dir over original, file-by-file,
           only after step 2 & 3 pass for 100% of files)
                       │
                       ▼
        5. re-verify Phase 6 backup untouched:
           bash scripts/verify-tunes-backup.sh
           (re-runs md5 diff of ORIGINAL tarball vs itself —
           proves the backup file's own checksum is unchanged;
           does NOT re-diff against public/tunes/, since
           public/tunes/ is now intentionally different post-compression)
```

### Recommended Project Structure
```
scripts/
├── compress-tunes.ts        # New: sequential sharp compression, writes to staging dir
├── verify-tunes-compression.ts  # New: per-file size/decode checks + summary report
├── backup-tunes.sh          # Existing (Phase 6) — do not modify
└── verify-tunes-backup.sh   # Existing (Phase 6) — reuse as-is for post-compression re-verify
```

### Pattern 1: Sequential (not parallel) sharp processing on a memory-constrained VPS
**What:** Process files one at a time in a `for...of` loop with `await`, not `Promise.all`/`map`.
**When to use:** Always, on this VPS — `free -h` shows only ~400MB free at idle with 5.3GB of 8GB swap already in use; `PITFALLS.md` Pitfall 5 documents this exact risk for this exact phase.
**Example:**
```typescript
// Source: sharp official docs (concurrency/cache guidance) + verified via
// PITFALLS.md Pitfall 5, written specifically for this phase
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

### Pattern 2: Compress-to-staging-directory, verify, then swap
**What:** Never write compressed output over `public/tunes/` directly on the first pass.
**When to use:** This phase, given the images are irreplaceable (git-ignored, not in R2 despite CLAUDE.md's stale stack table).
**Example:**
```typescript
// Source: derived from Phase 6's own "backup-before-write" pattern
// (scripts/backup-tunes.sh: "any script that will overwrite public/tunes/
// must verify a fresh, restored, byte-identical backup exists first")
const STAGING = 'public/tunes-compressed'
// ... write all outputs to STAGING ...
// ... verify every output file individually ...
// only then: fs.rmSync('public/tunes-old', ...) [if re-running]
//            fs.renameSync('public/tunes', 'public/tunes-old')
//            fs.renameSync(STAGING, 'public/tunes')
```

### Pattern 3: Guard against any single file failing to shrink
**What:** Success criterion #1 requires **all** compressed JPEGs to be smaller than their originals — this is not automatically true for every input (a already-small/already-optimized file, e.g. the 172KB `alexander-written-by-brian-crossett-staff-0.jpg`, could compress worse if re-encoded carelessly).
**When to use:** Per-file check in the compression script itself, not just spot-checked visually afterward.
**Example:**
```typescript
// Source: derived from measured behavior — verified empirically that even
// the smallest source file (172KB, 1170x930) still compresses smaller after
// resize+mozjpeg because withoutEnlargement caps upscaling and quality 82
// mozjpeg beats the original's likely-default (non-mozjpeg) encoder — but
// verify per-file rather than assume.
const compressedSize = fs.statSync(dest).size
const originalSize = fs.statSync(src).size
if (compressedSize >= originalSize) {
  console.warn(`WARN: ${file} did not shrink (${originalSize} -> ${compressedSize}) — investigate before swap`)
}
```

### Anti-Patterns to Avoid
- **`Promise.all(files.map(...))` over all 326 files at once:** Confirmed risk on this specific VPS — `earlyoom` will kill the greediest process at ~5% free RAM, and this project's own `PITFALLS.md` documents this exact failure mode for this exact phase.
- **Compressing in place on the first run:** No do-over if quality settings are wrong; always stage + verify + swap.
- **Treating "smaller file size" as the only success signal:** A byte-count check alone can't catch over-aggressive quality settings that blur solfège underlines — pair automated size/decode checks with the human legibility spot-check on `approved`-status tunes.
- **Re-verifying the Phase 6 backup by diffing it against the (now different) `public/tunes/`:** The backup verification script's md5-diff step compares the *restored archive* against the *live source tree* — after compression, `public/tunes/` is **supposed** to differ from the archive. "Confirmed intact and untouched" means the **archive file itself** (its sha256, its own internal contents) hasn't changed — verify via `sha256sum` against the value recorded in `BACKUP-MANIFEST.md`, and separately confirm `scripts/verify-tunes-backup.sh`'s internal self-consistency checks (archive extracts to 326 files, sample images decode) still pass. Do not treat a failing md5-diff between the live tree and the archive as a problem post-compression — that's the expected, intended state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Backup existence/integrity verification | A new backup-checking script | `scripts/verify-tunes-backup.sh` (Phase 6) unchanged, plus a direct `sha256sum` check against the value in `BACKUP-MANIFEST.md` | Already built, already tested, already the documented source of truth for this exact question |
| JPEG re-encoding | Custom libvips/libjpeg bindings, or a new CLI tool | `sharp`'s built-in `.jpeg({ mozjpeg: true, chromaSubsampling, quality })` | Already a dependency, already proven to have mozjpeg support compiled into this VPS's installed binary |
| Concurrency limiting | `p-limit` or a semaphore implementation | Plain sequential `for...of` loop with `await` | Simpler, zero new dependencies, achieves the same "concurrency 1" the PITFALLS.md doc calls for |

**Key insight:** Every piece of infrastructure this phase needs (backup, verification tooling, image library) already exists in this repo from Phase 6. This phase is almost entirely a *new script* problem, not a *new dependency* problem.

## Common Pitfalls

### Pitfall 1: OOM / earlyoom kill during batch compression
**What goes wrong:** Concurrent `sharp` operations across 326 files exhaust the ~400MB free RAM this VPS has at idle (5.3GB/8GB swap already in use), triggering `earlyoom` to kill the compression script or, worse, an unrelated service sharing the box.
**Why it happens:** `sharp`/libvips must decode each JPEG fully into memory; doing this concurrently multiplies peak RSS. This is a documented, VPS-specific risk (`PITFALLS.md` Pitfall 5, written for this exact phase).
**How to avoid:** `sharp.cache(false)`, `sharp.concurrency(1)`, and a sequential `for...of` loop (not `Promise.all`). Run `free -h` before/during/after; consider running during low-traffic hours since PM2's `psalter` process keeps serving live traffic throughout.
**Warning signs:** `free -h` available memory trending to zero; `earlyoom` kill events in system logs.

### Pitfall 2: Treating "file exists and is smaller" as legibility-verified
**What goes wrong:** A script reports 100% success on size reduction, but a quality setting too aggressive for hand-marked underlines/slurs silently degrades exactly the detail the melisma-editor workflow depends on humans reading.
**Why it happens:** File-size and decode checks are easy to automate; visual legibility of fine engraved/hand-marked detail is not.
**How to avoid:** After automated checks pass, manually view a sample of compressed JPGs at 100% zoom (and in the app's fullscreen mode) — prioritize tunes where `tune_melisma_decisions.status = 'approved'` (71 of 326 currently — query below). These are the images where a human already certified the underline/slur markings as correct; they are the highest-cost files to silently degrade.
**Warning signs:** Compressed file sizes drop by more than ~85–90% on already-reasonable-quality sources (a sign quality/resize was pushed too far); underlines or thin staff/ledger lines look blurred or "muddy" at 100% zoom compared to the original.

### Pitfall 3: Confusing "backup verification" scope after compression
**What goes wrong:** Re-running `scripts/verify-tunes-backup.sh` after compression fails its md5-diff step (comparing the archive against the now-different `public/tunes/`), and this gets misread as "the backup is corrupted."
**Why it happens:** The existing script's md5-diff step was written when `public/tunes/` and the archive were expected to be identical (Phase 6, pre-compression). Post-compression, `public/tunes/` is *supposed* to differ from the archive — that's the entire point of this phase.
**How to avoid:** For success criterion #2 ("backup confirmed intact and untouched"), verify the **archive file's own checksum** (`sha256sum /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` == the value recorded in `BACKUP-MANIFEST.md`) rather than re-running the full live-tree diff. Optionally, extract the archive to a temp dir and re-run the archive's *internal* self-consistency checks (326-file count, sample sharp decode) — but do **not** diff the archive against the now-compressed `public/tunes/` and treat a mismatch as failure.
**Warning signs:** A "backup verification failed" report that's actually just detecting the expected, intentional difference between pre- and post-compression images.

### Pitfall 4: Disk space during staged compression
**What goes wrong:** Writing a full compressed copy to a staging directory before swap temporarily needs source (1.4GB) + staged output (est. 150–300MB based on measured ~10–30% ratios) + the existing 1.4GB backup tarball, all on a disk currently at **87% used, only 7.5GB free** (`df -h /home/services`) — tighter than the 12GB free Phase 6 measured in July.
**Why it happens:** Disk usage has grown since Phase 6's backup was taken; nothing currently checks free space before a large staged write, unlike `scripts/backup-tunes.sh` which does have this guard.
**How to avoid:** Add the same `df -Pk` free-space precheck pattern `scripts/backup-tunes.sh` already uses (Phase 6 precedent) before writing to the staging directory — require at least ~500MB–1GB free, generously above the estimated staged-output size.
**Warning signs:** `df -h /home/services` free space dropping toward zero during the run.

## Code Examples

Verified patterns from direct measurement on this VPS's installed `sharp` 0.34.5:

### Empirical compression results (measured directly, not estimated)
```
# Source: node -e test against actual files in public/tunes/ on this VPS, 2026-08-10

dundee-solfege-0.jpg           4032x3024   1.48MB (orig, chromaSubsampling 4:2:0)
  → quality 80, mozjpeg, 4:4:4, NO resize:        1.15MB  (22% reduction)
  → resize 2000w + quality 82, mozjpeg, 4:4:4:    0.33MB  (78% reduction)
  → resize 1600w + quality 82, mozjpeg, 4:4:4:    0.22MB  (85% reduction)

wetherby-staff-0.jpg           4032x3024   7.13MB (orig, one of the largest files)
  → resize 2000w + quality 82, mozjpeg, 4:4:4:    0.67MB  (91% reduction)

beatitudo-staff-0.jpg          4032x3024   7.18MB (orig)
  → resize 2000w + quality 82, mozjpeg, 4:4:4:    0.68MB  (91% reduction)

alexander-written-by-brian-crossett-staff-0.jpg  1170x930  0.17MB (orig, smallest file — already low-res)
  → resize 2000w (withoutEnlargement → no-op) + quality 82, mozjpeg, 4:4:4:  0.05MB  (69% reduction)
```
**Takeaway:** Resizing away the 4032×3024 raw phone-camera resolution (far larger than any on-screen display size, including fullscreen mode) is the dominant lever — quality/mozjpeg alone only recovers ~20%, but resize+quality+mozjpeg together recover 78–91% even on the largest files, and the criterion "smaller than original" is met with wide margin across every size tier tested (largest, mid, and smallest source files).

### Query to find melisma-approved tunes for the legibility spot-check
```typescript
// Source: derived from src/db/schema.ts (tuneMelismaDecisions) + verified
// live against this project's actual database, 2026-08-10 — 71 of 326
// images belong to tunes with an 'approved' status as their latest decision.
import { tunes, tuneMelismaDecisions } from '@/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'

const latestDecisions = db
  .selectDistinctOn([tuneMelismaDecisions.tuneId], {
    tuneId: tuneMelismaDecisions.tuneId,
    status: tuneMelismaDecisions.status,
  })
  .from(tuneMelismaDecisions)
  .where(sql`${tuneMelismaDecisions.status} is not null`)
  .orderBy(tuneMelismaDecisions.tuneId, desc(tuneMelismaDecisions.createdAt), desc(tuneMelismaDecisions.id))
  .as('latest')

const approvedTunes = await db
  .select({ id: tunes.id, name: tunes.name })
  .from(tunes)
  .innerJoin(latestDecisions, eq(latestDecisions.tuneId, tunes.id))
  .where(eq(latestDecisions.status, 'approved'))
  .orderBy(tunes.name)
// Sample result (verified 2026-08-10): Abbeyville, Argyle, Arnold, Aurelia,
// Azmon/Denfield, Ballerma (start high), Beatitudo, Belmont, Bishopthorpe,
// Boswell — 71 total. Cross-reference tune name → slug (tune-slug.ts) →
// public/tunes/{slug}-{staff|solfege}-N.jpg to find the actual files to
// spot-check.
```

### Backup checksum re-verification (satisfies success criterion #2)
```bash
# Source: BACKUP-MANIFEST.md — the recorded value to check against
sha256sum /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz
# Expected: 28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9
# (BACKUP-MANIFEST.md's own table has an apparent extra hex digit beyond a
# standard 64-char sha256 — re-derive and compare against whatever this
# exact command outputs at execution time; do not hardcode a possibly-typo'd
# value from the manifest into a script's assertion without a live re-check.)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Serve raw phone-camera-resolution (4032×3024) JPEGs as-is | Resize to a sane max display width before serving | This phase | ~78–91% file-size reduction with no runtime cost, since there's no `next/image` layer to do this automatically |

**Deprecated/outdated:** None specific to this domain — `sharp`+`mozjpeg` is still the current, actively-maintained standard approach for server-side JPEG optimization in a Node.js stack as of this research date.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A max resize width of ~2000px is an acceptable legibility floor, including for the app's fullscreen/zoomed viewing mode | Summary, Code Examples | If wrong, some tunes may look soft when a precentor zooms in during a live service — mitigated by the human spot-check step, but the *default width* chosen for the batch script is a judgment call not yet confirmed by the user. Recommend confirming with the user during discuss-phase, or treating the spot-check step as the gate that catches this before the swap. |
| A2 | JPEG quality 82 with `mozjpeg: true` and `chromaSubsampling: '4:4:4'` is the right default balance of size vs. legibility for this specific content type (line art + fine text + photographed paper texture/shadow) | Architecture Patterns, Code Examples | If quality is set too low, underlines/ledger lines could blur; if too high, less size reduction is achieved. Empirically tested at one setting only — the planner should budget a small tuning pass (try 2–3 quality values) rather than assuming 82 is precisely optimal. |
| A3 | PNG files (6 of 326, already small — 12KB to 194KB) are in scope for this phase alongside the JPEGs | Don't Hand-Roll, Pitfalls | ASSET-01's title says "tune JPEGs" specifically; if PNGs are out of scope, the compression script should skip them rather than attempt (and possibly fail) to shrink already-optimized small PNGs. Flag for user/planner confirmation. |
| A4 | The apparent 65-character hex string in `BACKUP-MANIFEST.md`'s sha256 field (`28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9` — 66 hex chars, not the standard 64) is a documentation transcription artifact, and the correct verification approach is to re-run `sha256sum` live rather than trust the written value verbatim | Code Examples | Low risk — the fix (re-derive live rather than hardcode) is already the recommended approach regardless of whether the manifest's string has a typo. |

## Open Questions (RESOLVED)

1. **Should compressed output replace `public/tunes/` in place, or should the app be pointed at a new directory?**
   - What we know: `src/lib/tune-jpg-urls.ts` derives URLs as `/tunes/{slug}-{type}-{n}.jpg` from `public/tunes/` via `existsSync` probes, cached per-process. Swapping the directory contents (same filenames, same paths) requires no code changes and is the lowest-risk approach given the existing derivation logic.
   - What's unclear: Whether the planner wants to preserve pre-compression bytes anywhere on the live filesystem after the swap (beyond the off-repo Phase 6 backup), e.g. keeping `public/tunes-old/` briefly as a fast local rollback path before deleting it.
   - Recommendation: Same-path in-place swap (rename staging dir over original after full verification), relying on the off-repo tarball as the actual safety net — matches Phase 6's own reasoning that git/in-repo storage is not a safe backup location for these files.

2. **Is a quality-82/2000px default acceptable, or does the user want to review a before/after sample first?**
   - What we know: The measured reduction (78–91%) is large; a human has not yet visually confirmed legibility at this exact setting on a real device/screen.
   - What's unclear: Whether the user wants an interactive "review N samples, then approve the setting for the full batch" step, or is comfortable with the agent doing the spot-check autonomously against `approved`-status tunes as described.
   - Recommendation: Plan should include an explicit spot-check gate (view a handful of compressed `approved`-status tunes, including at least one `-solfege-` and one `-staff-` file, before running the full batch) rather than compressing all 326 and reviewing after the fact.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| sharp (Node, with mozjpeg support) | Compression + verification scripts | ✓ | 0.34.5 (installed), 0.35.3 latest on registry | — |
| Disk free space for staging directory | Compress-to-staging-then-swap pattern | ✓ (marginal) | 7.5GB free of 59GB (87% used) | If free space drops further before execution, compress-and-swap per-tune-slug in small batches rather than staging the entire 326-file set at once |
| `/home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` | Success criterion #2 (backup verification) | ✓ | 1.4GB, sha256-recorded | None needed — already exists and previously verified |
| `scripts/verify-tunes-backup.sh` | Reusable backup re-verification logic | ✓ | Phase 6 artifact | None needed |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** Disk space is tighter than when Phase 6 ran (7.5GB free vs. 12GB in July) — flagged with a fallback strategy above, not blocking.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^2.1.9 |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run <path-to-file>.test.ts` |
| Full suite command | `npm test` (runs `vitest`; add `-- run` for non-watch CI-style single pass) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ASSET-01 (size reduction) | Every compressed output file is smaller than its corresponding original | unit/script-assertion | A dedicated verification script (e.g. `scripts/verify-tunes-compression.ts`) comparing `fs.statSync` sizes across all 326 pairs, run as a script not a vitest test (filesystem-heavy, not suited to the unit test suite) | ❌ Wave 0 — new script, not a vitest test file |
| ASSET-01 (backup intact) | `BACKUP-MANIFEST.md`'s recorded sha256 matches a live `sha256sum` of the archive | shell/script-assertion | `sha256sum /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` compared against the manifest value | ❌ Wave 0 — one-line check, can live in the compression script's post-run step or a tiny standalone check |
| ASSET-01 (legibility) | Melisma-approved tune samples remain legible after compression | manual-only | N/A — human visual review, guided by the query in Code Examples | N/A — manual by nature, no automation possible for subjective legibility |

This phase is fundamentally a filesystem batch-processing task, not application-code-under-test. The existing 46 vitest test files in this repo (`src/**/*.test.ts`, `scripts/**/*.test.ts`) cover code paths like solfège parsing, melisma detection, and phrase-break annotation — none of them touch `public/tunes/` file contents, and this phase shouldn't need to add vitest coverage for a one-off compression script (mirroring how `scripts/backup-tunes.sh` and `scripts/verify-tunes-backup.sh` from Phase 6 are plain bash/shell scripts, not vitest-tested code).

### Sampling Rate
- **Per task commit:** Run the compression/verification script directly (`npx tsx scripts/compress-tunes.ts` or similar) — not a vitest quick-run, since this is a filesystem operation.
- **Per wave merge:** Re-run `bash scripts/verify-tunes-backup.sh`-equivalent checks (backup checksum) plus the full-suite `npm test` to confirm no unrelated regressions (e.g. `tune-jpg-urls.test.ts`, which mocks `existsSync` against `public/tunes/` paths and should be re-run since the directory contents are changing).
- **Phase gate:** All 326 files verified smaller + decodable, backup checksum confirmed unchanged, legibility spot-check on `approved`-status tunes passed, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/compress-tunes.ts` — the compression script itself (does not exist yet)
- [ ] `scripts/verify-tunes-compression.ts` (or equivalent inline checks) — per-file size/decode verification (does not exist yet)
- [ ] No vitest framework gap — vitest is already configured and does not need new test files for this phase; existing `src/lib/tune-jpg-urls.test.ts` should be re-run post-compression as a regression check since it touches `public/tunes/` path derivation logic (though it mocks `existsSync` rather than reading real files, so it is unlikely to be affected — verify this assumption when reading that test file during planning).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | This phase touches no auth surface |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A — compression script is a local ops task, not a web-exposed endpoint |
| V5 Input Validation | Marginal | The compression script reads filenames from `public/tunes/` (a controlled, pre-existing local directory, not user input) — no untrusted input path |
| V6 Cryptography | Marginal | sha256 checksum comparison for backup integrity — use Node's built-in `crypto` module or shell `sha256sum`, never hand-roll a hash function |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Irrecoverable data loss from a buggy in-place overwrite | Tampering / Denial of Service | Stage-then-swap pattern (never compress in place on first pass); off-repo backup already exists and is re-verified post-run |
| Resource exhaustion (OOM) affecting other VPS-hosted projects | Denial of Service | Sequential processing (`sharp.concurrency(1)`), monitor `free -h`, avoid `Promise.all` — per `PITFALLS.md` Pitfall 5, written specifically for this phase |

This is a low-security-surface phase — no new auth, no new user-facing input, no new externally-reachable endpoint. The dominant "threat" here is operational (data loss / OOM), covered under Common Pitfalls above rather than classic STRIDE web threats.

## Sources

### Primary (HIGH confidence)
- Direct filesystem inspection of `public/tunes/` on this VPS (`find`, `du`, `ls`) — 2026-08-10
- Direct `node -e` execution against the installed `sharp` 0.34.5 binary — compression ratios, mozjpeg support, dimension data all measured live, not estimated
- `.planning/phases/06-security-data-safety-prerequisites/06-03-PLAN.md`, `06-03-SUMMARY.md`, `BACKUP-MANIFEST.md` — exact backup mechanism, location, checksum, and verification script this phase depends on
- `.planning/research/PITFALLS.md` Pitfall 5 — written specifically for this phase during v2.0 milestone research (2026-07-29), OOM and irreversibility risks
- `src/db/schema.ts`, live query against the project's PostgreSQL database — `tune_melisma_decisions` schema and live `approved` count (71 of 326)
- `src/lib/tune-jpg-urls.ts`, `src/components/notation/NotationRenderer.tsx`, `next.config.ts` — confirmed no `next/image` optimization layer exists; plain `<img>` serving from `public/tunes/`
- `npm view sharp version` — registry confirms 0.35.3 latest vs. 0.34.5 installed

### Secondary (MEDIUM confidence)
- General knowledge of `sharp`/libvips mozjpeg and chroma-subsampling behavior, cross-checked against this project's own installed `node_modules/sharp/lib/output.js` JSDoc comments for parameter names/defaults

### Tertiary (LOW confidence)
- None — all claims above are either directly verified against this codebase/VPS or explicitly flagged in the Assumptions Log

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — sharp is already installed and directly tested on this machine, no new dependency decisions needed
- Architecture: HIGH — grounded in direct code inspection (`tune-jpg-urls.ts`, `NotationRenderer.tsx`, `next.config.ts`) confirming the plain-`<img>`, no-optimization-layer serving model
- Pitfalls: HIGH — this exact phase already has a dedicated, detailed pitfall writeup (`PITFALLS.md` Pitfall 5) from prior milestone research, cross-verified against live VPS memory/disk state today

**Research date:** 2026-08-10
**Valid until:** 30 days (stable domain — sharp/libvips behavior and this VPS's static-file serving model are not fast-moving; re-check disk-space figures if execution is delayed more than a few weeks, since usage is trending upward)
