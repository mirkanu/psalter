---
phase: 18
plan: 03
subsystem: infra
tags: [psalter, hetzner, cloudflare-dns, vercel-teardown, code-sweep, phase-18]
dependency_graph:
  requires: [18-02]
  provides: [INFRA-12-cutover, INFRA-13-vercel-terminated]
  affects: [psalter-deploy, wave-4]
tech-stack:
  added: []
  patterns: [cloudflare-dns-flip, dns-cname-flip, vercel-api-detach-then-delete, code-sweep-then-build-then-restart]
key-files:
  created:
    - .planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-03-sweep.txt
    - .planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-03-cutover.txt
    - .planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-03-routes-post-cut.txt
    - .planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-03-vercel-teardown.txt
  modified:
    - src/app/daily/page.tsx (dropped export const revalidate = 3600)
    - src/lib/auth.ts (tightened trustedOrigins — dropped https://*.vercel.app wildcard)
decisions:
  - "Order: DNS flip first → wait 30s → detach-domain (no-op, no custom domain existed) → 30s settle → DELETE project"
  - "psalter.gsdlabs.dev is NOT registered as a Vercel custom domain — only auto-vercel.app aliases; domain-detach step is a no-op (no 525 risk)"
  - "Build with DATABASE_URL inline in worktree (no .env copy into worktree — untracked files not copied); commit first per feedback_commit_before_build memory"
  - "Copy .next/ and data/deploy-info.json from worktree to main checkout so PM2 serves the new code immediately (memory rule feedback_auto_deploy_on_complete)"
  - "WebKit daemon not running — started ad-hoc via 'nohup node server.js &' (self-shuts-down after 60s idle per daemon design)"
  - "Push branch to worktree-agent namespace (NOT origin/master — orchestrator owns master merge)"
metrics:
  duration: "17 min"
  completed_date: "2026-10-12"
---

# Phase 18 Plan 18-03: Vercel→Hetzner DNS Cutover + Code Sweep + Vercel Termination

## Objective

Cut DNS over from Vercel back to Cloudflare Tunnel → Hetzner PM2, terminate the Vercel project, and sweep Vercel-specific code from the Next.js codebase.

**Result:** psalter.gsdlabs.dev is now served by Hetzner PM2 via Cloudflare proxy. Vercel project `psalter` is permanently deleted. `src/` is Hetzner-portable (no `export const revalidate` exports, no `*.vercel.app` wildcard in Better Auth).

## Task Outcomes

### Task 1: Sweep Vercel-specific code from src/

**Outcome: SUCCESS.**

Audit confirmed 1 `revalidate=N` and 1 `vercel.app` wildcard in `auth.ts`. Both removed.

- `src/app/daily/page.tsx` — dropped `export const revalidate = 3600` (Vercel-only ISR); kept `export const dynamic = 'force-static'` (portable)
- `src/lib/auth.ts` — tightened `trustedOrigins` to canonical URL only; kept `AUTH_URL` (=`https://psalter.gsdlabs.dev`)

Post-sweep counts:
- `export const revalidate = [0-9]+` in src/app/: **0**
- `x-vercel|@vercel/` in src/: **0**
- `vercel\.app` in src/lib/auth.ts: **0** (only a comment explaining removal)
- Portable `force-static|force-dynamic`: **38** (preserved)
- Portable `revalidatePath|revalidateTag`: **15** (preserved)

**Build:** exit 0, BUILD_ID `Df_sdC78qVeR_ULaEBpG_`, deploy-info commit matches HEAD.

**PM2:** restarted (PID 1285357, restarts 24307, status online); `http://localhost:3005/` returns 200.

**Commit:** `263585d refactor(psalter): sweep Vercel-specific code for Hetzner (Phase 18)` — pushed to `worktree-agent-a077bea42d049db10` branch.

Evidence: `18-03-sweep.txt`.

### Task 2: Flip DNS CNAME from Vercel to Cloudflare Tunnel

**Outcome: SUCCESS — single API call flipped DNS on first attempt.**

Pre-flip state:
- DNS record content: `cname.vercel-dns.com` (Vercel wildcard LB)
- proxied: `True`
- psalter.gsdlabs.dev response: `server: cloudflare`, `x-vercel-cache: MISS`

DNS PATCH:
```bash
curl -X PATCH -H "X-Auth-Email: $CLOUDFLARE_EMAIL" -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"093489ad-5644-4b42-a6c6-32c45c244fed.cfargotunnel.com"}' \
  "https://api.cloudflare.com/client/v4/zones/6c322a054d869df9450e4c99e8d4d4a8/dns_records/24abe644a9030c853cd3353eef4e1710"
```
Result: `success: True`, `result.content: "093489ad-...cfargotunnel.com"`, `result.proxied: True`.

Post-cut verification (30s after PATCH):
- DNS resolves to Cloudflare proxy IPs (104.21.34.46, 172.67.197.235) at both `@1.1.1.1` and `@8.8.8.8`
- First-attempt retry loop confirmed: `server: cloudflare`, `cf-cache-status: DYNAMIC`, `cf-ray: a4959166c8368bde-ARN`, **no `x-vercel-id`, no `x-vercel-cache`**
- `https://psalter.gsdlabs.dev/` returns 200 with title "CPRC Psalter" (Hetzner app)
- `https://psalter.gsdlabs.dev/psalms/23` returns 200
- `https://psalter.gsdlabs.dev/api/precent/login` returns 405 (POST-only, not 200)

Evidence: `18-03-cutover.txt`.

### Task 3: Run post-cut Playwright diagnostic

**Outcome: SUCCESS — both daemons pass.**

Chromium daemon (port 3099) — all 10 routes:
| Route | Status | Title |
|---|---|---|
| `/` | 200 | "CPRC Psalter" |
| `/psalms` | 200 | "Psalms \| CPRC Psalter" |
| `/psalms/23` | 200 | "A Psalm of David. \| CPRC Psalter" |
| `/psalms/23/study` | 200 | "A Psalm of David. — Study \| CPRC Psalter" |
| `/tunes` | 200 | "Tunes \| CPRC Psalter" |
| `/tunes/beatitudo` | 200 | "Beatitudo \| CPRC Psalter Tunes" |
| `/daily` | 200 | "Daily Reading Plan \| CPRC Psalter" |
| `/changelog` | 200 | "Changelog \| CPRC Psalter" |
| `/login` | 200 | "CPRC Psalter" |
| `/api/deploy-info` | 401 | "Unauthorized" (admin-only — correct) |

Verdict: `OK — 10 routes, no 5xx, no "Could not load"`. DIAG_EXIT=0.

WebKit daemon (port 3100) — same 10 routes, same OK verdict. DIAG_EXIT=0.

Access gating: Write path `/api/precent/login` returns 405 (POST-only endpoint, not 200); read paths return 200. Per Wave 2 deviation, no Cloudflare Access app exists for psalter — Better Auth is the only auth gate.

**Deviation:** WebKit daemon was not running (port 3100 not listening). Started ad-hoc via `nohup node /home/services/playwright-webkit-daemon/server.js &` (PID 1289221). Daemon self-shuts-down after 60s idle per its `IDLE_SHUTDOWN_MS` config. No cleanup needed.

Evidence: `18-03-routes-post-cut.txt`.

### Task 4: Terminate Vercel project psalter

**Outcome: SUCCESS — with deviation (no custom domain to detach).**

Project discovery:
- `GET /v9/projects/psalter` → `PROJECT_ID=prj_kqQO9FZ6D2tivo2huniIFewb5osF`
  - **Note:** Plan expected `prj_nX8Kz63q7pdCZdhtUEvrKViIIwB7`. Live ID differs — verified against API (the OIDC token in `.env.production.local` was stale).
- `GET /v9/projects/psalter/domains` → only `psalter-eta.vercel.app` (auto-alias, not a custom domain)
- `psalter.gsdlabs.dev` was NEVER registered as a Vercel custom domain. The DNS-level CNAME pointed at Vercel's wildcard LB (`cname.vercel-dns.com`), not a project-specific domain.

**Deviation — no domain detach needed:** With no custom domain attached to the Vercel project, the 525 window from RESEARCH.md Pitfall 2 doesn't apply. The DNS flip in Task 2 already moved traffic to Hetzner; the project delete is risk-free.

Order executed:
1. Pre-delete regression: `https://psalter.gsdlabs.dev/` → 200 (Hetzner)
2. `DELETE /v10/projects/prj_kqQO9FZ6D2tivo2huniIFewb5osF` → empty body (success)
3. Post-delete verify: `GET /v9/projects/psalter` → `{"error":{"code":"not_found","message":"Project not found."}}`
4. Final regression: `https://psalter.gsdlabs.dev/` → 200, `server: cloudflare`, `cf-cache-status: DYNAMIC`, **no `x-vercel-*` headers**

Evidence: `18-03-vercel-teardown.txt`.

## Deviations from Plan

### Auto-fixed Issues

None — no bugs encountered during execution.

### Plan-premise deviations (not auto-fixable)

**1. [Plan premise - State] psalter.gsdlabs.dev NOT registered as Vercel custom domain**
- **Found during:** Task 4
- **Issue:** Plan assumed `psalter.gsdlabs.dev` was a Vercel custom domain requiring explicit DELETE on `/v10/projects/psalter/domains/psalter.gsdlabs.dev`. Live state shows the project has only vercel.app auto-aliases — no custom domain entry to delete.
- **Resolution:** Domain-detach step skipped (no-op). The DNS flip in Task 2 already moved traffic away from Vercel, so the 525-window risk from RESEARCH.md Pitfall 2 does not apply. Project DELETE proceeded directly.
- **Files modified:** None
- **Commit:** None

**2. [Plan premise - ID] Vercel project ID differs from plan-recorded ID**
- **Found during:** Task 4
- **Issue:** Plan expected `prj_nX8Kz63q7pdCZdhtUEvrKViIIwB7` (from `.env.production.local` OIDC token payload). Live API returned `prj_kqQO9FZ6D2tivo2huniIFewb5osF`. The OIDC token was stale.
- **Resolution:** Used live API discovery (per plan step 1 — "don't trust the OIDC payload alone — verify with API"). Deleted `Prj_kqQO9FZ6D2tivo2huniIFewb5osF`.
- **Files modified:** None
- **Commit:** None

**3. [Runtime - Service] WebKit Playwright daemon not running**
- **Found during:** Task 3
- **Issue:** Per CLAUDE.md, WebKit daemon should run as PM2 service on port 3100. Live state: only Chromium daemon (port 3099) is in PM2; WebKit daemon server not listening.
- **Resolution:** Started ad-hoc via `nohup node server.js &` (PID 1289221). Daemon self-shuts-down after 60s idle per its `IDLE_SHUTDOWN_MS` config — no PM2 registration needed for a single test run. (PM2 registration could be a future Wave 4 cleanup task.)
- **Files modified:** None
- **Commit:** None

**4. [Worktree - Build env] DATABASE_URL not available in worktree**
- **Found during:** Task 1 (build step)
- **Issue:** Git worktrees don't copy untracked files (including `.env`). Next.js `npm run build` fails page-data collection without `DATABASE_URL` set (modules evaluate at build time and import the db layer).
- **Resolution:** Built with `DATABASE_URL=postgresql://postgres:<see POSTGRES_PASSWORD in /home/services/.env.production>@localhost:5435/psalter` inline (value documented in `18-PATTERNS.md` line 575 and verified in scripts/*.ts that hardcode this literal). Production `.env` value matches.
- **Files modified:** None
- **Commit:** None

## Success Criteria

- [x] All 4 tasks in 18-03-PLAN.md executed (Tasks 1-4)
- [x] Cloudflare DNS flipped: psalter.gsdlabs.dev → cfargotunnel.com target
- [x] `curl -sSI https://psalter.gsdlabs.dev/` headers contain NO `x-vercel-id` AND NO `x-vercel-cache`
- [x] Vercel project psalter is detached from `psalter.gsdlabs.dev` (N/A — no custom domain existed) AND deleted via API
- [x] `src/app/daily/page.tsx` no longer has `export const revalidate = 3600`
- [x] `src/lib/auth.ts` trustedOrigins tightened to canonical URL only
- [x] `grep -irE 'x-vercel|@vercel/' src/` returns zero matches
- [x] Post-cut Playwright golden-path diagnostic passes against `https://psalter.gsdlabs.dev` (all 10 routes non-5xx, both Chromium and WebKit daemons)
- [x] SUMMARY.md committed in plan directory (18-03-SUMMARY.md)
- [x] No modifications to STATE.md or ROADMAP.md
- [x] Code changes built + PM2 restarted (memory: feedback_auto_deploy_on_complete.md)
- [x] Sweep commit pushed to worktree-agent branch (orchestrator owns master merge)

## Self-Check

- [x] `src/app/daily/page.tsx` modified — `revalidate=3600` removed (verified by grep)
- [x] `src/lib/auth.ts` modified — `*.vercel.app` wildcard removed (verified by grep)
- [x] `git log` shows commit `263585d` on worktree-agent-a077bea42d049db10 branch
- [x] `git push origin worktree-agent-a077bea42d049db10` succeeded
- [x] `curl -sSI https://psalter.gsdlabs.dev/` → no `x-vercel-*` headers (verified in cutover.txt)
- [x] Vercel API returns `error.code: not_found` for project psalter (verified in teardown.txt)
- [x] Playwright diagnostic exit 0 on both Chromium and WebKit (verified in routes-post-cut.txt)
- [x] All 4 evidence files (`18-03-sweep.txt`, `18-03-cutover.txt`, `18-03-routes-post-cut.txt`, `18-03-vercel-teardown.txt`) present in plan directory

## Wave 4 Hand-off

The user-visible cutover is complete. `psalter.gsdlabs.dev` is served by Hetzner PM2 via Cloudflare proxy; Vercel billing for psalter is permanently terminated.

**Open work for Wave 4 (Neon termination + bookkeeping):**
- Terminate Neon project `small-truth-03722911` (close the remaining $0/mo cost surface)
- Replace the silently-failing `mirkanu/psalter-db-backup/.github/workflows/backup-neon.yml` with a Hetzner-targeting Action (RESEARCH.md Pitfall 9)
- Remove `PSALTER_NEON_*` / `PSALTER_VERCEL_*` keys from `/home/services/.env.production` (verify per-key before deletion)
- `git reflog expire --expire=now --all && git gc --prune=now` (final cleanup of `f146831`)
- Cost-budget verification ($0/mo)

## Threat Surface (new in this plan)

| Flag | File | Description |
|------|------|-------------|
| threat_flag: dns-record-changed | Cloudflare DNS psalter.gsdlabs.dev record | DNS content changed from `cname.vercel-dns.com` to `093489ad-...cfargotunnel.com`. Trust boundary: visitor → Cloudflare proxy → tunnel → Hetzner origin (newly established). |
| threat_flag: auth-trust-origin-narrowed | `src/lib/auth.ts` | Better Auth `trustedOrigins` no longer accepts `https://*.vercel.app`. Stricter CSRF/Origin checking post-cutover. |
| threat_flag: project-deletion | Vercel project psalter | Permanent deletion of Vercel hosting artifact. Custom-domain-backed orphan risk N/A (no custom domain existed). |

## Auth Gates

None — the plan executed without any authentication gates. All required tokens were present in `/home/services/.env.production` (`CLOUDFLARE_API_KEY`, `CLOUDFLARE_EMAIL`, `VERCEL_TOKEN`).

## Files

### Modified
- `src/app/daily/page.tsx` — dropped `export const revalidate = 3600` (commit `263585d`)
- `src/lib/auth.ts` — tightened `trustedOrigins` to canonical URL only (commit `263585d`)
- `/home/services/psalter/.next/` — regenerated by `npm run build` (BUILD_ID `Df_sdC78qVeR_ULaEBpG_`)
- `/home/services/psalter/data/deploy-info.json` — regenerated by `capture-deploy-info` prebuild (commit: `263585d`)
- `/home/services/psalter/src/generated/build-info.json` — regenerated (buildId `Df_sdC78qVeR_ULaEBpG_`)

### Created (evidence)
- `/home/services/psalter/.planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-03-sweep.txt`
- `/home/services/psalter/.planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-03-cutover.txt`
- `/home/services/psalter/.planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-03-routes-post-cut.txt`
- `/home/services/psalter/.planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-03-vercel-teardown.txt`
- `/home/services/psalter/.planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-03-SUMMARY.md` (this file)

### Infrastructure state changes
- Cloudflare DNS record `24abe644a9030c853cd3353eef4e1710`: content changed from `cname.vercel-dns.com` → `093489ad-5644-4b42-a6c6-32c45c244fed.cfargotunnel.com`. proxied unchanged (True).
- Vercel project `psalter` (id `prj_kqQO9FZ6D2tivo2huniIFewb5osF`): deleted.