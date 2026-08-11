---
phase: 13-tune-image-compression
plan: 02
subsystem: tooling
tags: [scripts, sharp, mozjpeg, verification, backup-evidence, full-batch]
dependency_graph:
  requires: [tune-image-compression-tooling, sample-comparison-page]
  provides: [staged-compressed-tree, full-set-compression-verifier, backup-preflight-evidence]
  affects: [scripts/, scripts/output/, .planning/phases/13-tune-image-compression/, public/tunes-compressed/]
tech_stack:
  added: []
  patterns: [sequential-sharp-batch, byte-identity-for-non-image, full-set-verification, sentinel-on-success]
key_files:
  created:
    - scripts/verify-tunes-compression.ts
    - scripts/output/compress-tunes-run.log
    - scripts/output/verify-tunes-compression.log
    - scripts/output/vitest-run.log
    - .planning/phases/13-tune-image-compression/BACKUP-PREFLIGHT-EVIDENCE.md
  modified: []
decisions:
  - id: verifier-iterates-compressed-set-under-partial
    summary: "--partial mode iterates compressedEntries (smoke runs), full mode iterates originalEntries — so a 12-file staged dir verifies without reporting 314 phantom 'output exists' failures for the missing entries."
metrics:
  duration: "~18 minutes"
  completed: 2026-08-11
  tasks: 3
  files: 5
---

# Phase 13 Plan 02: Last-Chance Backup Proof + Full Compression Batch Summary

Recorded the final live-tree-vs-archive byte-identity proof while it was still meaningful, wrote a full-set compression verifier, and ran the full 328-file batch — producing a fully verified staging tree while the live site continues to serve the untouched originals.

## What shipped

- `scripts/verify-tunes-compression.ts` — full-set verifier (every file, not a sample). Reuses `verify-migration.ts`'s `assert()` + failure-counter + exit-code skeleton. Sequential only (`sharp.cache(false)`, `sharp.concurrency(1)`, no `Promise.all`). Per file: strict `compSize < origSize` on all JPEGs, valid decode, width bound, aspect preservation; byte-identity (size + sha256) for PNGs and dotfiles. Exit contract: prints `COMPRESSION_VERIFIED` only when `failures === 0`.
- `.planning/phases/13-tune-image-compression/BACKUP-PREFLIGHT-EVIDENCE.md` — captured before any compression ran. Records the archive sha256 (`28a83a7d...b714a9`), size (`1431381138`), mtime (`1785394660`), and the verbatim stdout of `scripts/verify-tunes-backup.sh` ending in `BACKUP_VERIFIED`. Includes the post-swap note directing future backup verification to `scripts/verify-backup-archive.sh`.
- `public/tunes-compressed/` — 328 entries (320 jpg + 6 png + `.gitignore` + `.gitkeep`), 125 MB total, fully verified.

## Compression run totals

| Metric | Value |
|---|---|
| Files processed | 328 |
| JPEGs re-encoded | 320 |
| Files copied byte-identical | 8 (6 png + 2 dotfiles) |
| Total bytes before | 1,489,381,619 (1.4 GiB) |
| Total bytes after | 131,097,725 (125 MiB) |
| Reduction | 91.2% |
| `notSmaller` count | 0 |
| Peak RSS observed | ~324 MB (well under 800 MB kill threshold) |
| Compression wall clock | ~5 minutes |
| Verification wall clock | ~1 minute |
| `npx vitest run` | 14 failed / 911 passed — matches Phase 09-07 baseline |

Smallest reduction: `forest-green-solfege-0.jpg` (62.9%). Largest reduction: `st-john-solfege-1.jpg` (94.6%).

## Decisions

- **Verifier `--partial` mode iterates the compressed set, not the original set.** The first cut iterated `originalEntries` and reported 314 phantom `output exists` failures for files not yet staged in smoke runs. Fixed by branching the iteration source: `--partial` walks `compressedEntries` (the files actually present in the staged dir), full mode walks `originalEntries` (the canonical source). The set-level count equality check is skipped under `--partial` and runs in full mode only.

## Verification

- `bash scripts/verify-tunes-backup.sh` exited 0 with `BACKUP_VERIFIED` and the result is recorded in `BACKUP-PREFLIGHT-EVIDENCE.md`
- `npx tsx scripts/verify-tunes-compression.ts` exited 0 with `COMPRESSION_VERIFIED`
- `npx tsx scripts/verify-tunes-compression.ts --compressed=/tmp/t13-empty` exited 1, no `COMPRESSION_VERIFIED` printed (negative test)
- `ls -A public/tunes-compressed | wc -l` = 328
- `ls public/tunes-compressed/*.jpg | wc -l` = 320, `*.png` = 6
- `public/tunes-compressed/.gitignore` and `.gitkeep` both present
- `grep -q COMPRESSION_COMPLETE scripts/output/compress-tunes-run.log` passed
- `grep -c "did not shrink" scripts/output/compress-tunes-run.log` = 0
- `du -sh public/tunes-compressed` = 126M (under 500M target)
- `find public/tunes -type f | wc -l` still = 328, `du -sh public/tunes` still = 1.4G — live tree untouched
- `sha256sum /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` still = `28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9`
- `git status --porcelain public/tunes-compressed/` empty — gitignore holding
- `npx vitest run` = 14 failed / 911 passed — matches the Phase 09-07 baseline of 14 pre-existing failures, no new failures

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed verifier `--partial` mode iterating the wrong set**
- **Found during:** Task 2 automated verify (smoke test on 12-file staging dir)
- **Issue:** First implementation iterated `originalEntries` (all 328 files) regardless of `--partial`, so the 12-file staging dir produced 314 spurious `output exists` failures. The sentinel was correctly suppressed, but the smoke test would not print `COMPRESSION_VERIFIED` — failing the plan's Task 2 acceptance criterion.
- **Fix:** Branch the iteration source: `--partial` walks `compressedEntries`, full mode walks `originalEntries`. Set-level count equality still runs in full mode only.
- **Files modified:** `scripts/verify-tunes-compression.ts`
- **Commit:** `c40cc6e`

## Auth Gates

None.

## Known Stubs

None.

## Threat Flags

None — no new trust-boundary surfaces introduced. The verifier is read-only against the live tree and the staging dir; the backup archive was read but not written. All Phase 13 threat-model mitigations held (sequential sharp, RSS under 800 MB, free-space pre-flight, no `git clean`, no in-place writes, archive sha256 re-verified post-run).

## Self-Check: PASSED

- `scripts/verify-tunes-compression.ts` exists and contains `COMPRESSION_VERIFIED`, `function assert`, `sharp.concurrency(1)`, and the strict `<` size comparison
- `.planning/phases/13-tune-image-compression/BACKUP-PREFLIGHT-EVIDENCE.md` exists and contains the recorded sha256, size, mtime, and a fenced `BACKUP_VERIFIED` line
- `scripts/output/compress-tunes-run.log` exists and contains `COMPRESSION_COMPLETE`
- `scripts/output/verify-tunes-compression.log` exists and contains `COMPRESSION_VERIFIED`
- `scripts/output/vitest-run.log` exists
- Commits `5be0eb9` (Task 1), `c40cc6e` (Task 2), `b3feec9` (Task 3) all present in `git log --oneline`
- All three commits pushed to `origin/master`

## Commits

- `5be0eb9` — docs(13-02): record last-chance backup restorability proof
- `c40cc6e` — feat(13-02): add full-set tune-compression verifier
- `b3feec9` — docs(13-02): record full 328-file compression run + verification
