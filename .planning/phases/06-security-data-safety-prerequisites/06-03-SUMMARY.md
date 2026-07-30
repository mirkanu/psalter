---
phase: 06-security-data-safety-prerequisites
plan: 03
subsystem: infra
tags: [backup, tar, sharp, md5, disaster-recovery, vps]

# Dependency graph
requires: []
provides:
  - Off-repo, verified backup of the 326 hand-reviewed tune score JPGs/PNGs in public/tunes/
  - scripts/backup-tunes.sh — repeatable, disk-checked archive creation
  - scripts/verify-tunes-backup.sh — restore-and-compare verification (md5 + sharp decode)
  - BACKUP-MANIFEST.md — recorded archive path, sha256, restore command for the compression phase
affects: [JPEG compression phase (v2.0 backlog item), any future phase writing to public/tunes/]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Backup-before-write: any script that will overwrite public/tunes/ must verify a fresh, restored, byte-identical backup exists first"
    - "set +o pipefail inside command substitutions to avoid SIGPIPE aborting scripts under set -euo pipefail when piping large find output into head"

key-files:
  created:
    - scripts/backup-tunes.sh
    - scripts/verify-tunes-backup.sh
    - .planning/phases/06-security-data-safety-prerequisites/BACKUP-MANIFEST.md
  modified: []

key-decisions:
  - "Archive destination is /home/services/psalter-backups/ (outside the repo and outside public/), not the in-repo backups/ dir which is NOT git-ignored and already holds tracked SQL dumps"
  - "Verification does a full md5 diff across all 326 images rather than a sample, since it is cheap and strictly stronger evidence than a spot check"
  - "Sample decode set deliberately includes 3 solfege + 3 staff files (hand-reviewed sources) plus 4 others, totalling 10, using sharp — the same library the future compression phase will use"

patterns-established:
  - "Pattern: disk-space and destination-safety preflight checks (case statement path guard, df -Pk free-space check) before any large tar/rm operation on this resource-constrained VPS"

requirements-completed: [SEC-03]

# Metrics
duration: ~15min
completed: 2026-07-30
---

# Phase 06 Plan 03: Tune Image Backup & Restore Verification Summary

**Verified off-repo tarball (1.4GB, sha256-recorded) of all 326 hand-reviewed tune score images, proven byte-identical on restore and sample-decoded via sharp, with restore/re-verify procedure documented in BACKUP-MANIFEST.md ahead of the future JPEG-compression phase.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-30T06:55:00Z (approx)
- **Completed:** 2026-07-30T07:10:28Z
- **Tasks:** 2/2 completed
- **Files modified:** 3 (2 created scripts, 1 created manifest)

## Accomplishments
- Created a dated, checksummed tarball of `public/tunes/` at `/home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz`, confirmed outside the git repo and outside `public/`
- Proved the archive restores byte-identically: md5 diff across all 326 images reports zero differences
- Sample-decoded 10 restored images (3 solfege, 3 staff, 4 other) via `sharp`, all report valid non-zero width/height and correct format
- Documented archive path, sha256, restore command, and re-verify command in `BACKUP-MANIFEST.md` so the compression phase can find and trust the backup without re-deriving anything

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the off-repo tune archive with a disk-space precheck** - `062e977` (feat)
2. **Task 2: Prove the archive restores byte-identically and the JPEGs decode** - `dbbacaf` (feat)

_No separate plan-metadata commit — this SUMMARY.md is committed as part of the parallel worktree flow; the orchestrator handles the shared STATE.md/ROADMAP.md update after merge._

## Files Created/Modified
- `scripts/backup-tunes.sh` - Tars `public/tunes/` to `/home/services/psalter-backups/` with source-size guard, destination-safety guard, and free-space precheck
- `scripts/verify-tunes-backup.sh` - Extracts the newest archive to a temp dir, md5-diffs all 326 images against the live source, decodes 10 samples via sharp, prints `BACKUP_VERIFIED`
- `.planning/phases/06-security-data-safety-prerequisites/BACKUP-MANIFEST.md` - Archive path, sha256, verified counts, restore command, re-verify command

## Decisions Made
- Confirmed via `pm2 describe psalter | grep -i cwd` that the app runs from `/home/services/psalter` directly (PM2 fork mode, no Docker bind mount for tunes) before archiving, per the plan's verified-findings guidance — avoided the risk of backing up the wrong tree
- Kept the byte-identity check exhaustive (all 326 files) rather than sampled, since `md5sum`+`diff` over 1.4GB is cheap relative to the risk of missing a corrupted file in a sample

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sample-file selection deduped down to 6 unique files instead of the required 10**
- **Found during:** Task 2, first run of `verify-tunes-backup.sh`
- **Issue:** The initial sample logic built solfege/staff/"other" lists independently and merged with `sort -u | head -10`, but the "other" list overlapped with the solfege/staff picks, collapsing to only 6 unique files. Script correctly aborted with `expected 10 samples, got 6` rather than silently under-sampling.
- **Fix:** Rewrote to build the solfege+staff unique set first, compute how many additional unique files are needed (`NEED=$((10 - count))`), and fill from files not already selected using `grep -vFxf`.
- **Files modified:** scripts/verify-tunes-backup.sh
- **Verification:** Re-ran script, decoded exactly 10/10 unique samples (3 solfege, 3 staff, 4 other)
- **Committed in:** dbbacaf (Task 2 commit)

**2. [Rule 1 - Bug] `find | sort | head` pipelines under `set -euo pipefail` raised SIGPIPE (exit 141) at real 326-file scale**
- **Found during:** Task 2, second run of `verify-tunes-backup.sh` (after fixing #1)
- **Issue:** With only ~11 files in an isolated unit test the bug didn't reproduce, but against the real 326-file tree, `sort` writes enough output that `head -N` closes the pipe before `sort` finishes writing, delivering SIGPIPE to `sort`. Under `pipefail` this aborted the whole script with exit 141 even though the pipeline's intended result (first N lines) was already correctly captured.
- **Fix:** Wrapped each `find | sort | head` (and the `find | sort | grep | head` filler) command substitution in a subshell with `set +o pipefail` so the SIGPIPE-derived exit code doesn't propagate to the outer script, while `set -euo pipefail` remains in effect everywhere else.
- **Files modified:** scripts/verify-tunes-backup.sh
- **Verification:** Re-ran script against the real 326-image tree twice; both runs completed cleanly with `BACKUP_VERIFIED`
- **Committed in:** dbbacaf (Task 2 commit)

**3. [Rule 1 - Bug] BACKUP-MANIFEST.md failed acceptance criterion `grep -q 'sha256'` due to uppercase `SHA256` in the table**
- **Found during:** Post-Task-2 acceptance-criteria check
- **Issue:** The manifest table used `SHA256` (uppercase) as the field label; the plan's acceptance criteria require a case-sensitive `grep -q 'sha256'` match, which failed.
- **Fix:** Changed the table row label from `SHA256` to `sha256`.
- **Files modified:** .planning/phases/06-security-data-safety-prerequisites/BACKUP-MANIFEST.md
- **Verification:** Re-ran `grep -q 'sha256' BACKUP-MANIFEST.md` — passes
- **Committed in:** dbbacaf (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 — bugs found and fixed during verification before commit)
**Impact on plan:** All fixes were necessary for the verification script and manifest to actually meet the plan's stated acceptance criteria. No scope creep — no architectural changes, no new files beyond what the plan specified.

## Issues Encountered
None beyond the auto-fixed issues documented above.

## User Setup Required
None - no external service configuration required. This is a local VPS filesystem backup with no third-party dependency.

## Next Phase Readiness
- `public/tunes/` now has a verified, restorable off-repo backup with documented restore/re-verify commands — the future JPEG-compression phase can proceed knowing corruption is recoverable
- `public/tunes/` itself was left completely untouched by this plan (confirmed via `git status --porcelain public/tunes` producing no output both before and after)
- If new tunes are added before the compression phase runs, `scripts/backup-tunes.sh` should be re-run and `BACKUP-MANIFEST.md` updated with the new archive's path/checksum

---
*Phase: 06-security-data-safety-prerequisites*
*Completed: 2026-07-30*

## Self-Check: PASSED

- FOUND: scripts/backup-tunes.sh
- FOUND: scripts/verify-tunes-backup.sh
- FOUND: .planning/phases/06-security-data-safety-prerequisites/BACKUP-MANIFEST.md
- FOUND: .planning/phases/06-security-data-safety-prerequisites/06-03-SUMMARY.md
- FOUND: /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz
- FOUND: commit 062e977 (Task 1)
- FOUND: commit dbbacaf (Task 2)
- FOUND: commit 180080d (SUMMARY)
