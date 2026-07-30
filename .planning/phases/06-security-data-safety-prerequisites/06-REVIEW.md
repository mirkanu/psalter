---
phase: 06-security-data-safety-prerequisites
reviewed: 2026-07-30T07:50:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - package.json
  - scripts/backup-tunes.sh
  - scripts/verify-dev-surface-locked.sh
  - scripts/verify-tunes-backup.sh
  - src/app/api/dev/asset/route.ts
  - src/app/api/dev/melisma-decision/route.ts
  - src/app/api/dev/melisma-save/route.ts
  - src/app/api/dev/sketch/route.ts
  - src/app/api/dev/test-ocr/route.ts
  - src/app/api/dev/tune-feedback/all/route.ts
  - src/app/api/dev/tune-feedback/route.ts
  - src/app/api/dev/tune-ocr-result/route.ts
  - src/app/dev/melisma-editor/page.tsx
  - src/app/dev/musicxml-preview/page.tsx
  - src/app/dev/notation-compare/page.tsx
  - src/app/dev/page.tsx
  - src/app/robots.ts
  - src/lib/admin-auth.test.ts
  - src/lib/admin-auth.ts
  - src/middleware.ts
findings:
  critical: 1
  warning: 6
  info: 3
  total: 10
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-07-30T07:50:00Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

The source-level changes for this phase (middleware relocation to `src/`, the `getAdminSessionOr401()` helper, per-route guards on the 8 `/api/dev/*` routes, and page-level `role !== 'admin'` gates on the 4 `/dev/*` pages) are logically sound: guard-before-parse ordering is correct everywhere, 401 vs 403 is distinguished properly, the `getAdminSessionOr401` unit tests cover all four branches, and the `/api/dev` traversal-prevention checks in `asset` and `sketch` are adequate for the admin-only threat model. The route matcher (`/dev`, `/dev/:path*`, `/api/dev/:path*`, `/precent`, `/precent/:path*`) was verified against Next's actual `path-to-regexp` compiler and has no gap — `/api/dev` (bare) and `/api/dev/asset` both match, and `/api/devXYZ` correctly does not.

However, live verification against the actually-running processes on this VPS surfaced one severe, currently-exploitable finding: **the production `psalter` process (port 3005, the one reachable from `psalter.gsdlabs.dev`) is running a build that predates every commit in this phase.** An anonymous, cookie-less `curl` against prod right now returns real DB rows from `/api/dev/tune-feedback/all` and a `200` for `/dev` — the exact vulnerability this phase exists to close. This is a BLOCKER: the code fix is correct, but it is not in effect where it matters. Several supporting warnings were also found, mostly around inconsistent input validation between sibling `/dev` endpoints, a shared-vs-duplicated auth-gate pattern in the four page components, and a verification-script default that (also empirically confirmed) does not reliably test this deployment.

## Critical Issues

### CR-01: Production is currently serving a build without any Phase 6 protections — live data leak confirmed

**File:** `src/middleware.ts` (fix not in effect at runtime); evidenced via the running `psalter` PM2 process (port 3005)
**Issue:**
The `psalter` PM2 process serving prod was started 2026-07-29T11:41:56Z from a `.next` build with mtime 2026-07-29 11:40 (`.next/server/middleware-manifest.json` contains `"middleware": {}, "sortedMiddleware": []` — no middleware registered at all). The commits that add the per-route guards (`c983814 feat(06-02): guard all 8 /api/dev/* routes...`) and the `getAdminSessionOr401` helper (`d282262`) were made on **2026-07-30T07:18–07:26Z — nearly 20 hours after that build and process were created.** The currently-running production code therefore has neither the middleware fix nor the per-route `getAdminSessionOr401()` guards.

Live proof against port 3005 (no cookies sent):
```
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3005/dev
200
$ curl -s http://localhost:3005/api/dev/tune-feedback/all
[{"tuneId":96,"selectedVersion":"solfege"}]
```
This is a real, currently-exploitable anonymous data leak on the deployed site (`psalter.gsdlabs.dev`), and the `/dev/*` admin UI pages are also fully reachable anonymously. `robots.txt` on this same stale build doesn't even serve the disallow rules (returns the app's custom 404 page), confirming this build predates the SEC-02 work referenced in the plan too.

**Fix:** Rebuild and restart the production process, then re-verify against the real prod port before signing off this phase:
```bash
cd /home/services/psalter
npm run build
pm2 restart psalter
bash scripts/verify-dev-surface-locked.sh http://localhost:3005   # NOT the default 3006 (see WR-05)
```
Do not close out this phase until that verification run against port 3005 shows zero failures.

## Warnings

### WR-01: `melisma-decision` POST accepts unvalidated `melismaPositions` (unlike its sibling route)

**File:** `src/app/api/dev/melisma-decision/route.ts:115-120`
**Issue:** `melisma-save/route.ts` explicitly validates `melismaPositions` is `number[][] | null` before writing (lines 86-98 of that file), but `melisma-decision/route.ts` writes `body.melismaPositions` straight to `tunes.melismaPositions` with no shape check:
```ts
if (body.melismaPositions !== undefined) {
  await db.update(tunes).set({ melismaPositions: body.melismaPositions }).where(eq(tunes.id, body.tuneId))
}
```
An admin (or a compromised admin session) can write arbitrary JSON into this jsonb column, which `NotationRenderer` elsewhere assumes is `number[][]`. This is an input-validation inconsistency between two endpoints performing the same write.
**Fix:** Reuse the same validation block from `melisma-save/route.ts` (or extract it into a shared helper) before the `db.update` call.

### WR-02: `test-ocr` route parses `tuneId` without validating it's a finite positive integer

**File:** `src/app/api/dev/test-ocr/route.ts:161-165`
**Issue:**
```ts
const tuneId = request.nextUrl.searchParams.get('tuneId')
if (!tuneId) return NextResponse.json({ error: 'tuneId required' }, { status: 400 })
const tune = await db.query.tunes.findFirst({ where: eq(tunes.id, parseInt(tuneId)), ... })
```
`parseInt('abc')` is `NaN` and is passed straight into the Drizzle query with no `Number.isFinite`/`> 0` check, unlike `melisma-decision/route.ts:42-45` which does validate this exact pattern. A malformed `tuneId` causes an unhandled DB-level error (uncaught, not wrapped in try/catch) resulting in a raw 500 instead of a clean 400.
**Fix:**
```ts
const tuneIdNum = Number(tuneId)
if (!Number.isFinite(tuneIdNum) || tuneIdNum <= 0) {
  return NextResponse.json({ error: 'tuneId (positive number) required' }, { status: 400 })
}
```

### WR-03: Admin-gate logic duplicated across 4 page components, with a divergent/dead branch vs. middleware

**File:** `src/app/dev/page.tsx:9-10`, `src/app/dev/melisma-editor/page.tsx:341-342`, `src/app/dev/musicxml-preview/page.tsx:11-12`, `src/app/dev/notation-compare/page.tsx:13-14`
**Issue:** All four pages repeat the identical inline check:
```ts
const session = await auth.api.getSession({ headers: await headers() })
if (!session || session.user.role !== 'admin') redirect('/login')
```
`src/middleware.ts:34-44` runs first for these exact paths and already redirects a logged-in-but-wrong-role session to `/admin-only` (not `/login`). Since middleware intercepts before the page renders, the "logged in, wrong role → `/login`" branch in every page component is unreachable under normal operation — but if middleware ever fails to compile/register (see CR-01, which just happened), these page-level checks become the *only* protection, and they redirect to a different target than the app's own middleware does for the same failure case. This split-brain behavior (`/login` vs `/admin-only` for the identical condition, duplicated 4x with no shared helper) is a maintainability risk: a future page copy-paste is one keystroke away from getting it wrong, and there is no compile-time guarantee all 4 stay in sync.
**Fix:** Extract a shared `requireAdminPage()` helper (mirroring `getAdminSessionOr401` but calling `redirect()`), used by all `/dev/*` page components, and standardize on one redirect target for the wrong-role case.

### WR-04: `/precent/*` middleware branch is a cookie-presence check only, not a validity check

**File:** `src/middleware.ts:24-31`
**Issue:** Unlike the `/dev` and `/api/dev` branches (which call `auth.api.getSession`, a full DB-backed check), the `/precent` branch uses `getSessionCookie(request)`, which (per `better-auth/dist/cookies/index.mjs:207-216`) only checks whether a cookie named `{prefix}.session_token` is *present* — it does not verify the token's signature, expiry, or existence in the `sessions` table. Confirmed empirically:
```
$ curl -s -o /dev/null -w '%{http_code}\n' --cookie "better-auth.session_token=totally-fake-garbage-value" http://localhost:3006/precent
307   (redirected to /login)
```
The redirect above happens because the current `/precent` page independently re-validates the session — middleware itself would have let this fake cookie through (`NextResponse.next()`). This means the correctness of `/precent/*` protection today depends entirely on every current and future page under `/precent/*` performing its own full session check; nothing in `middleware.ts` enforces or documents that requirement, and a new `/precent/*` page added later that omits this check would be silently exposed to anyone who sets a garbage cookie of the right name.
**Fix:** Either perform the full `auth.api.getSession` check in middleware for `/precent/*` too (as already done for `/dev` and `/api/dev`), or add an explicit code comment plus a shared layout-level guard so this invariant can't be silently dropped by a future page.

### WR-05: `verify-dev-surface-locked.sh` default port doesn't match this project's actual deployment, and produces misleading results in this environment

**File:** `scripts/verify-dev-surface-locked.sh:13`
**Issue:** `BASE="${1:-http://localhost:3006}"`. Per `CLAUDE.md`, this project is deployed on **port 3005**, not 3006 — there is no documented psalter instance on 3006. Running the script with no argument (as its own usage comment invites: "Defaults to http://localhost:3006") in this environment hits an unrelated process that redirects every request (including public routes) to `/login`, producing 11 spurious failures even when the actual fix is deployed correctly:
```
$ bash scripts/verify-dev-surface-locked.sh
FAIL: /api/dev/asset (GET) -> expected 401, got 307
...
FAIL: /psalms/23 -> expected 200, got 307
=== Summary: 11 failure(s) ===
```
A tool whose entire purpose is to be the safety net for this exact class of bug (see CR-01) should not have a default that silently targets the wrong server.
**Fix:** Default to `http://localhost:3005` (the documented prod port), or drop the default entirely and require an explicit base URL argument so operators can't accidentally rely on a meaningless default.

### WR-06: No CI/deploy-time enforcement of `verify:dev-locked`

**File:** `package.json:14`
**Issue:** `"verify:dev-locked": "bash scripts/verify-dev-surface-locked.sh"` exists as an npm script but isn't wired into any `postbuild`, deploy hook, or CI workflow in this repo. Nothing currently prevents the exact scenario in CR-01 (ship a build/restart that silently drops the fix) from recurring on the next deploy.
**Fix:** Run this script automatically after every deploy (e.g. a `postdeploy` step or PM2 `post_update` hook) against the real prod URL, and fail the deploy loudly if it reports any failures.

## Info

### IN-01: `asset` route traversal guard is a naive substring check with no extension allow-list

**File:** `src/app/api/dev/asset/route.ts:17-20`
**Issue:** `if (file.includes('..'))` is sufficient today (no other traversal vector exists given `path.join` semantics), but it's a substring check rather than actual path resolution/allow-listing, and the route will happily read+serve any file under `.planning/sketches` regardless of extension (MIME type is inferred, not restricted). Low risk given the admin-only gate, but worth hardening if this directory ever holds anything sensitive.
**Fix:** Resolve the path with `path.resolve` and verify it's still within the sketches root (`resolved.startsWith(sketchesRoot + path.sep)`), and/or restrict to an allow-list of extensions (`.css`, `.js`, `.json`).

### IN-02: Shell command construction via string interpolation in `test-ocr/route.ts`

**File:** `src/app/api/dev/test-ocr/route.ts:88, 95, 114, 126, 130-131, 231, 238`
**Issue:** Multiple `execSync` calls build shell command strings via template-literal interpolation of file paths (e.g. `` execSync(`python3 "${xml2abcScript}" "${xmlTmpPath}"`) ``). Currently safe because all interpolated values are either fixed script paths or derived from `slugify()`'d tune names (which can't contain quotes/shell metacharacters), but the pattern itself is fragile — any future change that puts less-sanitized data into these paths reintroduces command injection risk.
**Fix:** Prefer `execFileSync(cmd, [args...])` (argument array, no shell) over `execSync` with interpolated strings wherever the invoked program doesn't need shell features.

### IN-03: Unused variable `cwdAbc`

**File:** `src/app/api/dev/test-ocr/route.ts:137`
**Issue:** `const cwdAbc = path.join(tmpDir, 'score.abc')` is declared but never referenced — the code below it uses `altAbc` instead. Dead code left over from a refactor.
**Fix:** Remove the unused declaration.

---

## Resolution Update (2026-07-30T08:40:00Z)

**CR-01 resolved.** Deployed the fix to production: `npm run build` (fresh `.next` with the middleware and per-route guards compiled in, confirmed via `functions-config-manifest.json`'s `/_middleware` entry) → `pm2 restart psalter` → re-ran `scripts/verify-dev-surface-locked.sh http://localhost:3005` against the real prod port.

```
=== Summary: 0 failure(s) ===
```

All 16 checks pass: `/dev/*` pages redirect (307), all 8 `/api/dev/*` routes return 401 anonymously, `robots.txt` serves the disallow rules, and public routes (`/psalms/23`, `/tunes`) remain unaffected (200). The live data leak confirmed in CR-01 is closed.

WR-01 through WR-06 and IN-01 through IN-03 remain open as non-blocking follow-ups — not required to close this phase.

---

_Reviewed: 2026-07-30T07:50:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
