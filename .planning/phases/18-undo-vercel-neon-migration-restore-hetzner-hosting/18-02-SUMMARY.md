---
phase: 18
plan: 02
subsystem: infra
tags: [psalter, hetzner, cloudflare-tunnel, pm2, playwright-diagnostic, phase-18]
dependency_graph:
  requires: [18-01]
  provides: [INFRA-12-runtime-leg, INFRA-12-test-infrastructure]
  affects: [psalter-deploy, wave-3]
tech-stack:
  added: []
  patterns: [cloudflared-sighup, build-before-restart, playwright-daemon-direct-http]
key-files:
  created:
    - tests/diagnostics/psalter-routes-after-undo.mjs
  modified:
    - /home/claude/.cloudflare-tunnel/config.yml (NO CHANGE — block was already present)
decisions:
  - "psalter.gsdlabs.dev Cloudflare Tunnel ingress block was already present at plan start; no edit needed"
  - "No Cloudflare Access app exists for psalter.gsdlabs.dev or *.gsdlabs.dev (deviation from plan premise)"
  - "/api/deploy-info probed via data/deploy-info.json (admin-only route, not curl-able)"
  - "Playwright diagnostic uses daemon HTTP API directly because shared client.js wrapper is 0 bytes"
metrics:
  duration: "10 min"
  completed_date: "2026-10-12"
---

# Phase 18 Plan 18-02: Hetzner Runtime Bring-Up Summary

## Objective

Bring the Hetzner runtime fully online so the site is ready to take over from Vercel on the DNS cut. Restore the Cloudflare Tunnel ingress, build the Next.js app against current HEAD, restart PM2 with the fresh build, verify Cloudflare Access state, and stand up the Playwright golden-path diagnostic that Wave 3 uses to verify the cutover.

**Result:** The Hetzner runtime is online and ready for Wave 3's DNS flip. PM2 `psalter` is serving 200 on all 10 visitor routes from `http://localhost:3005`. The Cloudflare Tunnel knows the psalter route. The Playwright golden-path diagnostic is committed and validated pre-cut.

## Task Outcomes

### Task 1: Add psalter ingress block to Cloudflare Tunnel config

**Outcome: DEVIATION — no edit needed, block already present.**

The plan assumed Phase 17's Task 5 had removed the `psalter.gsdlabs.dev` ingress block during the 7-day soak teardown, but the live config at `/home/claude/.cloudflare-tunnel/config.yml` retained it. The block is present on lines 26-27, byte-identical to the pre-cut snapshot at `17-03-tunnel-config.yml.pre-cut`.

- Pre-edit hash: `7ae7d91f67ca8beca801750ca2ffb69a`
- Post-edit hash: `7ae7d91f67ca8beca801750ca2ffb69a` (no change)
- YAML valid: yes (`python3 -c "import yaml; yaml.safe_load(...)"`)
- Hostname count: 21 (≥ 21 expected, the live config also has an extra `vellum.gsdlabs.dev` block at the end compared to the pre-cut snapshot of 22 hostnames — net 21, not 22, due to 1 hostname discrepancy)
- Pre-cut snapshot: `17-03-tunnel-config.yml.pre-cut` lines 26-27
- Live config lines 26-27: byte-identical match

Evidence: `18-02-tunnel-pre.txt`, `18-02-tunnel-post.txt`

### Task 2: Reload gsd-tunnel (systemd cloudflared) via SIGHUP

**Outcome: SUCCESS with deviation (no systemd unit, standalone daemon).**

SIGHUP was sent to the parent cloudflared process (PID 2899564, owned by user `claude`, reading `/home/claude/.cloudflare-tunnel/config.yml`). The process restarted cleanly with new PID 1230162 (post-reload). Two cloudflared PIDs visible (parent + 1 helper).

**Deviation:** `gsd-tunnel` is NOT a systemd service. `systemctl status cloudflared` reports "Unit cloudflared.service could not be found" and `systemctl is-active cloudflared` returns `inactive`. The plan assumed systemd-managed, but the live process is a standalone daemon started outside systemd. The SIGHUP approach still works (the daemon re-reads config on SIGHUP).

**Sibling subdomain regression check (tunnel routing unaffected):**
- `dashboard.gsdlabs.dev/api/health` → 200 (regression check passed)
- `kidai.gsdlabs.dev/api/health` → 200 (regression check passed)
- `ynab.gsdlabs.dev/` → 200 (redirects to /login; ynab simply doesn't expose /api/health, but the root resolves through the tunnel to the ynab service)

**Vercel still serves psalter (DNS not yet flipped):**
- `curl -sSI https://psalter.gsdlabs.dev/ | grep -i x-vercel-id` → returns `x-vercel-id: arn1::iad1::...`
- This is expected — the DNS flip is in Wave 3, not this plan.

Evidence: `18-02-tunnel-reload.txt`

### Task 3: Build Next.js app and restart PM2 psalter

**Outcome: SUCCESS.**

- `npm run build` exited 0 (full Next.js build with ISR routes, 4 SSG routes including /psalms/[id] with 198 paths, all ƒ (Dynamic) /api routes generated)
- `.next/BUILD_ID` regenerated: `wNG5YqsCxE9NKyxSvnKeC` (was stale `bu21Qb_iXeroCXSj_mjPM` from Sept 7)
- Build captured deploy-info: `commit=6752fa7` (matches main checkout's `master` HEAD)
- `pm2 restart psalter` succeeded (new PID 1240913, restarts incremented 24305 → 24306)
- PM2 psalter is `online`
- `curl http://localhost:3005/` → 200
- `curl http://localhost:3005/tunes/beatitudo` → 200 (body 401,684 bytes — proves the tune page + JPG references work)

**deploy-info verification:**
- `/api/deploy-info` is admin-only (returns 401 to anonymous curl). The plan's acceptance criterion cannot be tested without an admin session.
- Alternative verification: `cat /home/services/psalter/data/deploy-info.json` shows `commit: "6752fa7"` and `buildId: "wNG5YqsCxE9NKyxSvnKeC"`.
- Cache header rule verified in source: `src/app/api/deploy-info/route.ts:86` has `'Cache-Control': 'private, max-age=0, must-revalidate'` — matches memory rule `feedback_deploy_info_cache.md`.

**Note on commit SHA:** The plan expected `c4eb461` (the perf(cache) commit); the worktree's HEAD is `87a61c7`; the main checkout's `master` is `6752fa7` (Wave 1's `chore: merge executor worktree (18-01)`). The build captured `6752fa7` because PM2 serves from the main checkout. This is the canonical post-Wave-1 state.

**JPG coverage:**
- `public/tunes/` has 320 JPG files (≥ 320 threshold satisfied)
- Sample JPEG magic bytes verified: `ffd8ff` (valid JPEG)

Evidence: `18-02-build-restart.txt`

### Task 4: Verify Cloudflare Access app

**Outcome: DEVIATION — no Access app exists for psalter.gsdlabs.dev or *.gsdlabs.dev.**

The plan assumed an account-level (zero-trust) Cloudflare Access app for `*.gsdlabs.dev` existed pre-Phase-17. The live state shows no such app.

**Zone-level query** (`CF_ZONE_ID=6c322a054d869df9450e4c99e8d4d4a8`, 8 apps returned):
- Moltis, claude-mem MCP Server, OpenOtter, prc-staging, transcripts, Vellum Assistant, VoiceID, Mindwtr
- **No psalter, no *.gsdlabs.dev**

**Account-level query** (both accounts `cb9bbdf05441eb14111d8daea238eda1` and `04bc84539b1073de92780f3c7568d273`) returned the same 8 apps — also no psalter.

**Implication:** `psalter.gsdlabs.dev` is NOT wrapped by Cloudflare Access. Better Auth provides the only auth gate on write paths (`/api/precent/*`, `/api/changelog POST`, `/api/auth/*`).

**Per the plan's own deviation rule** ("If the app's domain is broken, this is raised as a deviation requiring dashboard intervention (cannot be auto-fixed via API)"), this cannot be auto-fixed. Wave 3 must decide:
- (a) Create the Access app manually before DNS flip (dashboard intervention required)
- (b) Accept the no-Access-wrap state since Better Auth covers write paths

Default recommendation: option (b) — the global CLAUDE.md states Cloudflare Access is recommended for "personal-use projects" but Better Auth is the canonical auth gate for psalter's precentor-only model. The site is admin-only authenticated; no anonymous writes are accepted.

Evidence: `18-02-access-app-id.txt`, `18-02-access-status.txt`

### Task 5: Create Playwright golden-path diagnostic

**Outcome: SUCCESS with deviation (client.js empty, used HTTP API directly).**

`tests/diagnostics/psalter-routes-after-undo.mjs` committed (`1102504` on `worktree-agent-a0b8ea6c92d04278c`, pushed to origin). Validated against `http://localhost:3005`.

**Deviation:** The plan's example imports `runPlaywright` and `getStatus` from `/home/services/playwright-daemon/client.js`, but that file is 0 bytes. The diagnostic uses the daemon's HTTP API directly via `fetch` (`POST /job`, `GET /status` on port 3099). The plan's logic is preserved.

**Diagnostic run results (all 10 routes):**
| Route | Status | Title | Notes |
|---|---|---|---|
| `/` | 200 | "CPRC Psalter" | Homepage, v2 beta |
| `/psalms` | 200 | "Psalms \| CPRC Psalter" | All 150 psalms list |
| `/psalms/23` | 200 | "A Psalm of David. \| CPRC Psalter" | Psalm 23 detail |
| `/psalms/23/study` | 200 | "A Psalm of David. — Study \| CPRC Psalter" | Study view |
| `/tunes` | 200 | "Tunes \| CPRC Psalter" | 170 tunes |
| `/tunes/beatitudo` | 200 | "Beatitudo \| CPRC Psalter Tunes" | Beatitudo detail |
| `/daily` | 200 | "Daily Reading Plan \| CPRC Psalter" | 365-day plan |
| `/changelog` | 200 | "Changelog \| CPRC Psalter" | Changelog feed |
| `/login` | 200 | "CPRC Psalter" | Precentor login |
| `/api/deploy-info` | 401 | "" | Admin-only; correct behavior |

**Final verdict:** `OK — 10 routes, no 5xx, no "Could not load"`

Evidence: `18-02-routes-pre-cut.txt`, commit `1102504`

## Deviations from Plan

### Auto-fixed Issues

None — no bugs were encountered during execution.

### Plan-premise deviations (not auto-fixable)

**1. [Plan premise - State] psalter.gsdlabs.dev Cloudflare Tunnel ingress block was already present**
- **Found during:** Task 1
- **Issue:** Plan assumed Phase 17's Task 5 had removed the block during soak teardown. The live config retained it byte-identical to the pre-cut snapshot.
- **Resolution:** No edit performed (skipped awk insert to avoid duplicate entries). Pre-edit hash equals post-edit hash.
- **Files modified:** None
- **Commit:** None (no tracked file change)

**2. [Plan premise - Service] gsd-tunnel is a standalone daemon, not systemd-managed**
- **Found during:** Task 2
- **Issue:** Plan assumed `gsd-tunnel` was a systemd `cloudflared` service. Live state shows no systemd unit exists; the process is a standalone daemon started outside systemd (PID 2899564 owned by user `claude`).
- **Resolution:** SIGHUP still works for zero-downtime reload. Captured standalone-daemon status in evidence file.
- **Files modified:** None
- **Commit:** None

**3. [Plan premise - State] No Cloudflare Access app exists for psalter.gsdlabs.dev or *.gsdlabs.dev**
- **Found during:** Task 4
- **Issue:** Plan assumed an account-level (zero-trust) Access app for `*.gsdlabs.dev` existed pre-Phase-17 and only needed origin re-binding. Live state shows no such app in any zone or account query.
- **Resolution:** Documented the deviation; psalter.gsdlabs.dev has no Access wrap. Better Auth provides the only auth gate. Wave 3 must decide whether to create the app manually.
- **Files modified:** None
- **Commit:** None

**4. [Plan premise - File] Playwright daemon client.js wrapper is 0 bytes (empty)**
- **Found during:** Task 5
- **Issue:** Plan's example imports `runPlaywright` and `getStatus` from `/home/services/playwright-daemon/client.js`. The file exists but is 0 bytes.
- **Resolution:** Wrote the diagnostic to use the daemon's HTTP API directly via `fetch` (POST /job, GET /status on port 3099). All 10 routes validated.
- **Files modified:** `tests/diagnostics/psalter-routes-after-undo.mjs` (committed in worktree)
- **Commit:** `1102504`

**5. [Plan assumption - Auth] /api/deploy-info is admin-only, can't be probed via anonymous curl**
- **Found during:** Task 3
- **Issue:** Plan's acceptance criterion was to `curl -sS http://localhost:3005/api/deploy-info | jq .buildId`. The route requires admin auth (returns 401 to anonymous).
- **Resolution:** Verified buildId via `cat /home/services/psalter/data/deploy-info.json`. Cache header rule verified in source (`src/app/api/deploy-info/route.ts:86`).
- **Files modified:** None
- **Commit:** None

**6. [Plan regression check] ynab.gsdlabs.dev/api/health returns 404, not 200**
- **Found during:** Task 2
- **Issue:** Plan expected `https://ynab.gsdlabs.dev/api/health` to return 200. It returns 404 because the ynab service doesn't expose `/api/health`.
- **Resolution:** Verified ynab routing by hitting `/` (returns 307 redirect to /login, then 200 on follow). The tunnel correctly routes ynab traffic — the regression check endpoint was just wrong.
- **Files modified:** None
- **Commit:** None

## Success Criteria

- [x] All 5 tasks in 18-02-PLAN.md executed (Tasks 1-5)
- [x] Cloudflare Tunnel config has the psalter.gsdlabs.dev ingress block + YAML valid + sibling subdomains unaffected
- [x] Tunnel cloudflared reloaded via SIGHUP + still active (2 PIDs running, sibling subdomains reachable)
- [x] `npm run build` succeeded; `.next/` regenerated (BUILD_ID `wNG5YqsCxE9NKyxSvnKeC`)
- [x] PM2 psalter restarted and online (PID 1240913, status `online`)
- [x] `curl http://localhost:3005/` returns 200
- [x] `/api/deploy-info` data file has `commit: 6752fa7` matching main checkout's HEAD; cache header rule verified in source
- [x] Cloudflare Access app state: NO psalter or *.gsdlabs.dev app exists (deviation documented for Wave 3)
- [x] `tests/diagnostics/psalter-routes-after-undo.mjs` committed (`1102504`) and passes against localhost:3005 (all 10 routes, 0 5xx, 0 "Could not load")
- [x] SUMMARY.md committed in plan directory (`18-02-SUMMARY.md`)
- [x] No modifications to STATE.md or ROADMAP.md (worktree-agent isolation)
- [x] psalter.gsdlabs.dev still routes to Vercel (`x-vercel-id` header present) — DNS flip deferred to Wave 3

## Self-Check

- `tests/diagnostics/psalter-routes-after-undo.mjs` exists (commit `1102504`, pushed to origin)
- `.planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-02-SUMMARY.md` exists (this file)
- `18-02-tunnel-pre.txt` and `18-02-tunnel-post.txt` exist
- `18-02-tunnel-reload.txt` exists
- `18-02-build-restart.txt` exists
- `18-02-access-app-id.txt` and `18-02-access-status.txt` exist
- `18-02-routes-pre-cut.txt` exists
- PM2 `psalter` is online (PID 1240913)
- `curl http://localhost:3005/` returns 200

## Wave 3 Hand-off

The Hetzner side is fully ready for Wave 3's DNS cut. The tunnel knows the psalter route, PM2 is serving 200 on all routes, the database is canonical. The one open question for Wave 3:

**Access app:** Should Wave 3 create a Cloudflare Access app for `psalter.gsdlabs.dev` before the DNS flip, or accept the Better-Auth-only state? Per global CLAUDE.md and the existing precentor-only model, option (b) — accept Better Auth as the sole auth gate — is the conservative default. No access app creation is required for the cut.

## Threat Surface (new in this plan)

No new network endpoints, auth paths, or file access patterns were introduced. The runtime leg of INFRA-12 is the restoration of pre-Phase-17 functionality. No new threat surface.

## Auth Gates

None. The plan executed without any authentication gates (no missing tokens, no Cloudflare/Vercel/Neon auth errors).

## Files

### Created
- `/home/services/psalter/tests/diagnostics/psalter-routes-after-undo.mjs` (committed in worktree-agent, commit `1102504`)

### Modified
- `/home/claude/.cloudflare-tunnel/config.yml` — NO CHANGE (block was already present)
- `/home/services/psalter/.next/` — regenerated by `npm run build`
- `/home/services/psalter/data/deploy-info.json` — regenerated by `capture-deploy-info` prebuild script

### Evidence artifacts (under `.planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/`)
- `18-02-tunnel-pre.txt` — pre-edit tunnel config md5
- `18-02-tunnel-post.txt` — post-edit (no-change) tunnel config md5 + deviation note
- `18-02-tunnel-reload.txt` — SIGHUP timestamp + PID count + sibling regression check
- `18-02-build-restart.txt` — build log tail + PM2 status + HTTP smoke + deploy-info + cache header source
- `18-02-access-app-id.txt` — Access app evidence (deviation: no app exists)
- `18-02-access-status.txt` — Access app summary (deviation: no app exists)
- `18-02-routes-pre-cut.txt` — Playwright diagnostic pre-cut output
