---
phase: 06-security-data-safety-prerequisites
verified: 2026-07-30T08:45:00Z
status: passed
score: 9/9 must-haves verified
overrides_applied: 0
---

# Phase 6: Security & Data-Safety Prerequisites Verification Report

**Phase Goal:** Close the two live security holes (unauthenticated /dev and /api/dev admin surface, no middleware enforcement) and the one data-safety gap (326 unbacked-up tune images) identified as prerequisites before v2.0 Public Beta features (JPEG compression, public signup, etc.) can safely proceed.
**Verified:** 2026-07-30T08:45:00Z
**Status:** passed
**Re-verification:** No — initial verification (a code-review CR-01 finding was resolved before this run; see "Crux Check" below)

## Crux Check: Is the fix actually live in production right now?

This is the load-bearing question for this phase. 06-REVIEW.md documented a CRITICAL finding (CR-01): the running `psalter` PM2 process on port 3005 was serving a stale `.next` build from 2026-07-29 with zero middleware registered, meaning the phase's entire fix was committed to git but **not in effect** on the deployed site — a live, exploitable anonymous data leak. A "Resolution Update" was appended claiming a rebuild + `pm2 restart` + re-run of the sweep fixed this. Per instructions, this was independently re-verified rather than trusted:

| Check | Result |
|---|---|
| `pm2 describe psalter` | status `online`, `created at` **2026-07-30T08:39:57Z**, exec cwd `/home/services/psalter` |
| `.next/BUILD_ID` mtime | **2026-07-30 08:39:40** — matches the PM2 process creation time, i.e. this is the build the running process was started from |
| `.next/server/functions-config-manifest.json` | Contains a populated `/_middleware` entry with all 5 matcher regexes (`/dev`, `/dev/:path*`, `/api/dev/:path*`, `/precent`, `/precent/:path*`) and `runtime: "nodejs"` — middleware is compiled into this build (the legacy `middleware-manifest.json` is empty by Next.js 16.2.5 design, per 06-01-SUMMARY's documented deviation, and is not the correct place to check post-Next-16) |
| Anonymous curl `GET http://localhost:3005/dev` | `307` → `Location: /login?callbackUrl=%2Fdev` |
| Anonymous curl `GET http://localhost:3005/dev/melisma-editor` | `307` → `/login?callbackUrl=%2Fdev%2Fmelisma-editor` |
| Anonymous curl `GET http://localhost:3005/api/dev/tune-feedback/all` | `401` `{"error":"Unauthorized"}` — **not** the JSON array of feedback rows CR-01 found live |
| Anonymous curl `POST http://localhost:3005/api/dev/melisma-save` | `401` |
| Anonymous curl on all 8 `/api/dev/*` routes | all `401` |
| `bash scripts/verify-dev-surface-locked.sh http://localhost:3005` (run independently, not reusing the review's transcript) | `=== Summary: 0 failure(s) ===`, all 16 assertions PASS |
| `GET http://localhost:3005/robots.txt` | `200`, body contains `Disallow: /dev`, `Disallow: /dev/*`, `Disallow: /api/dev`, `Disallow: /api/dev/*` |
| `GET http://localhost:3005/psalms/23`, `/tunes` | both `200` — public routes unaffected |

**Conclusion: the crux holds.** The currently-running production process genuinely serves the fixed build, independently confirmed via build timestamps, manifest contents, and live anonymous HTTP probes against port 3005 — not by trusting 06-REVIEW.md's transcript.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Anonymous requests to `/dev/*` pages and `/api/dev/*` routes are rejected server-side (401/redirect), not rendered or executed | ✓ VERIFIED | Live curl against prod port 3005 (see Crux Check table) — all 4 pages 307→/login, all 8 API routes 401 |
| 2 | `GET /robots.txt` lists `Disallow: /dev/*` | ✓ VERIFIED | curl body against port 3005 contains literal `Disallow: /dev/*` and `Disallow: /api/dev/*` |
| 3 | A verified, restorable off-repo backup of `public/tunes/` (326 images) exists before compression code is written | ✓ VERIFIED | Archive at `/home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz`; sha256 independently recomputed matches BACKUP-MANIFEST.md exactly (`28a83a7d...b714a9`); `tar tzf` count = 326, live source count = 326, single top-level `tunes/` dir |
| 4 | The Next.js build actually compiles a middleware entry (perimeter defence exists, not dead code) | ✓ VERIFIED | `functions-config-manifest.json` `/_middleware` populated with all 5 matcher regexes; root `middleware.ts` confirmed absent (`git mv` completed), only `src/middleware.ts` exists |
| 5 | `getAdminSessionOr401()` exists and is unit-tested across anonymous/user/precentor/admin cases | ✓ VERIFIED | `npx vitest run src/lib/admin-auth.test.ts` → 4/4 pass; source confirms 401 (no session) / 403 (`role !== 'admin'`) / pass-through (admin) |
| 6 | All 8 `/api/dev/*` route files (11 exported handlers) are guarded independently of middleware | ✓ VERIFIED | `grep -rl 'getAdminSessionOr401' src/app/api/dev --include=route.ts \| wc -l` = 8; guard-call-site count = 11; manually inspected `test-ocr/route.ts` and `asset/route.ts` — guard is the first statement inside the exported `GET`/`POST` handler, preceding all `execSync`/`readFile` calls |
| 7 | All 4 previously-unprotected `/dev` pages (plus the pre-existing accounts page) redirect anonymous visitors to `/login` before any DB/FS access | ✓ VERIFIED | `grep -rl "session.user.role !== 'admin'" src/app/dev --include=page.tsx \| wc -l` = 5; `dev/page.tsx` confirmed converted to `async` |
| 8 | A single scripted sweep proves all 12 surfaces are closed and is re-runnable against the real deployment | ✓ VERIFIED | `scripts/verify-dev-surface-locked.sh` exists, `verify:dev-locked` npm alias wired; independently re-run against `http://localhost:3005` (not the review's transcript) — 0 failures, 16/16 PASS |
| 9 | Production is running this code right now, not a stale build (the actual crux, per CR-01) | ✓ VERIFIED | See "Crux Check" section above — BUILD_ID/PM2-creation-time correlation + independent curl re-run, not a re-read of 06-REVIEW.md's claim |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/middleware.ts` | Compiled node-runtime middleware gating `/dev/*`, `/api/dev/*`, `/precent/*` | ✓ VERIFIED | Exists, `runtime: 'nodejs'`, matcher covers all 5 paths, `/api/dev` branch returns JSON 401/403 ahead of `/dev`/`/precent` branches |
| `src/lib/admin-auth.ts` | Reusable `getAdminSessionOr401()` | ✓ VERIFIED | Exports the exact discriminated-union contract; unit-tested |
| `src/app/robots.ts` | Next.js App Router robots metadata route | ✓ VERIFIED | Default export, no `sitemap` field, serves at `/robots.txt` (confirmed live) |
| `scripts/verify-dev-surface-locked.sh` | Repeatable 12-surface sweep | ✓ VERIFIED | 16-assertion script, executable, independently run against port 3005, 0 failures |
| `scripts/backup-tunes.sh` | Disk-checked archive creation | ✓ VERIFIED (existence + prior successful run; not re-executed per instructions) | Present, executable; archive it produced verified independently below |
| `scripts/verify-tunes-backup.sh` | Restore-and-compare verification | ✓ VERIFIED (existence; re-run not required — manifest claims independently cross-checked) | Present, executable |
| `.planning/phases/06-security-data-safety-prerequisites/BACKUP-MANIFEST.md` | Recorded path, sha256, restore command | ✓ VERIFIED | sha256 in manifest matches independently recomputed sha256 of the actual archive on disk; restore command and re-verify command both present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/middleware.ts` | `src/lib/auth.ts` | `auth.api.getSession` DB-backed role check | ✓ WIRED | Confirmed in source; live curl proves it executes (403 semantics reachable, 401 confirmed) |
| `src/middleware.ts` | `/api/dev/*` | matcher entry | ✓ WIRED | `functions-config-manifest.json` shows the compiled regex for `/api/dev/:path*`; curl confirms enforcement |
| `src/lib/admin-auth.ts` | `src/lib/auth.ts` | session lookup + `role === 'admin'` assertion | ✓ WIRED | Source + unit tests confirm; live 401s on 8/8 routes confirm end-to-end |
| `src/app/api/dev/*/route.ts` | `src/lib/admin-auth.ts` | `getAdminSessionOr401()` as first statement | ✓ WIRED | grep counts (8 files, 11 call sites) plus manual read of `test-ocr` and `asset` routes confirm ordering precedes all side effects |
| `src/app/dev/*/page.tsx` | `src/lib/auth.ts` | server-side session + role check before data fetch | ✓ WIRED | grep count = 5 (4 new + accounts); live curl confirms redirects |
| `scripts/backup-tunes.sh` | `/home/services/psalter-backups/` | `tar czf` outside repo/public | ✓ WIRED | Archive confirmed present at that path, outside `/home/services/psalter/` |
| `scripts/verify-tunes-backup.sh` | `public/tunes` | md5sum diff | ✓ WIRED | Manifest documents zero-diff result; independently cross-checked file counts (326=326) and sha256 of the archive itself |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Anonymous `/dev` page rejected | `curl -s -o /dev/null -w '%{http_code}' http://localhost:3005/dev` | `307` | ✓ PASS |
| Anonymous `/dev/melisma-editor` rejected | same, path `/dev/melisma-editor` | `307` → `/login?callbackUrl=...` | ✓ PASS |
| Anonymous `/dev/musicxml-preview`, `/dev/notation-compare` rejected | curl | both `307` | ✓ PASS |
| Anonymous `/api/dev/tune-feedback/all` no longer leaks data | `curl -s http://localhost:3005/api/dev/tune-feedback/all` | `{"error":"Unauthorized"}` (not a JSON array) | ✓ PASS |
| Anonymous POST `/api/dev/melisma-save` rejected | curl -X POST | `401` | ✓ PASS |
| All remaining 6 `/api/dev/*` routes rejected | curl each | all `401` | ✓ PASS |
| `robots.txt` disallows admin surface | `curl -s http://localhost:3005/robots.txt` | contains `Disallow: /dev/*` and `Disallow: /api/dev/*` | ✓ PASS |
| Public routes unaffected | `curl` `/psalms/23`, `/tunes` | both `200` | ✓ PASS |
| Full regression sweep against real prod port | `bash scripts/verify-dev-surface-locked.sh http://localhost:3005` | `0 failure(s)`, 16/16 PASS | ✓ PASS |
| `admin-auth.test.ts` unit tests | `npx vitest run src/lib/admin-auth.test.ts` | 4/4 pass | ✓ PASS |
| Backup archive integrity | `sha256sum` of the archive on disk vs. BACKUP-MANIFEST.md's recorded value | Exact match | ✓ PASS |
| Backup file count | `tar tzf ... \| grep -cE '\.(jpg\|png)$'` vs. live source `find` count | 326 = 326 | ✓ PASS |
| Source tree untouched | `git status --porcelain public/tunes` | empty | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | 06-01, 06-02 | `/dev/melisma-editor` and its 8 `/api/dev/*` routes require an authenticated admin session (server-side, not client-only) | ✓ SATISFIED | Middleware + per-route guards both verified live on port 3005; unit tests pass; negative-control (middleware removed) already proven in 06-02 execution, and per-route guards independently confirmed present via grep + manual read |
| SEC-02 | 06-01 | `robots.txt` disallows `/dev/*` | ✓ SATISFIED | Live curl against port 3005 confirms body content |
| SEC-03 | 06-03 | A verified, restorable backup of `public/tunes/` JPGs exists before any compression script touches the originals | ✓ SATISFIED | Archive sha256 and file count independently reconfirmed against BACKUP-MANIFEST.md's claims; source tree confirmed unmodified |

No orphaned requirements — REQUIREMENTS.md's traceability table maps only SEC-01/02/03 to Phase 6, and all three plans (06-01/02/03) declare exactly these in their frontmatter.

### Anti-Patterns Found

All items below were already surfaced in `06-REVIEW.md` and explicitly marked non-blocking follow-ups (not required to close this phase). Re-confirmed still present but do not affect goal achievement:

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/app/api/dev/melisma-decision/route.ts` | Writes `body.melismaPositions` with no shape validation (unlike sibling `melisma-save`) | ⚠️ Warning (pre-existing, WR-01) | Input-validation inconsistency between two admin-only write endpoints; not an auth gap |
| `src/app/api/dev/test-ocr/route.ts` | `parseInt(tuneId)` not validated as finite/positive before DB query | ⚠️ Warning (pre-existing, WR-02) | Malformed input causes raw 500 instead of clean 400; not an auth gap |
| 4x `src/app/dev/*/page.tsx` | Identical admin-gate logic duplicated inline, redirect target diverges from middleware's `/admin-only` for the wrong-role case | ⚠️ Warning (pre-existing, WR-03) | Maintainability risk, not a live hole — both paths still deny access, just to different destinations |
| `src/middleware.ts` `/precent` branch | Cookie-presence check only (`getSessionCookie`), not full DB validation | ⚠️ Warning (pre-existing, WR-04) | `/precent` pages independently re-validate today, so no live hole; documented as an invariant that must not be silently dropped by a future page |
| `scripts/verify-dev-surface-locked.sh:13` | Default base URL is `http://localhost:3006`, not this project's documented port 3005 | ⚠️ Warning (pre-existing, WR-05) | Confirmed still present; does not affect this verification since the script was invoked with an explicit `http://localhost:3005` argument throughout |
| `package.json` | `verify:dev-locked` not wired into any deploy/CI hook | ℹ️ Info (pre-existing, WR-06) | The exact class of failure that produced CR-01 (stale prod build) has no automated guard against recurring on a future deploy |
| `src/app/api/dev/asset/route.ts` | Naive substring path-traversal check (`includes('..')`) | ℹ️ Info (pre-existing, IN-01) | Admin-only gate limits blast radius |
| `src/app/api/dev/test-ocr/route.ts` | `execSync` with string-interpolated shell commands | ℹ️ Info (pre-existing, IN-02) | Currently safe (slugified/fixed inputs only); fragile pattern |

No new blocker-class anti-patterns found beyond what 06-REVIEW.md already documented and explicitly closed out.

### Human Verification Required

None. Every observable truth for this phase is server-side, HTTP-status-driven behavior that was independently confirmed via curl/script against the live production process — no visual, real-time, or subjective UX judgment is needed to close this phase.

### Gaps Summary

No gaps. All 3 roadmap Success Criteria and all must-haves declared across the 3 plans (06-01, 06-02, 06-03) are independently verified against the actual, currently-running production deployment — not against SUMMARY.md or 06-REVIEW.md claims. The one CRITICAL issue raised during code review (CR-01: fix committed but not deployed) was re-verified independently here and confirmed genuinely resolved: the running PM2 process's build timestamp, compiled middleware manifest, and live anonymous HTTP responses are all mutually consistent with the fix being in effect. The six pre-existing warnings and three info-level findings from 06-REVIEW.md remain open as documented, non-blocking follow-ups and do not compromise the phase goal (closing the live `/dev`/`/api/dev` hole and backing up the tune images).

---

_Verified: 2026-07-30T08:45:00Z_
_Verifier: Claude (gsd-verifier)_
