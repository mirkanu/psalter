---
title: Migration reversal — state snapshot 2026-10-12
date: 2026-10-12
context: pre-undo-of-Phase-17
---

# Migration reversal — state snapshot, 2026-10-12 morning

User returned from working on the project via a different coding app. The local checkout (`/home/services/psalter`) had not changed since the Sept 7 Phase 17 migration commit (`f146831`). Meanwhile, `origin/master` had 30+ merged PRs (Sept 8 → Oct 10) on a **completely different history baseline** — no merge base existed with local.

## Sync decision (taken this session)

Reset local `master` to `origin/master` (`c4eb461`). Pre-reset safety snapshot: `/tmp/psalter-pre-reset-20261012-074819.tar.gz` (152 MB, 30-day retention). Untracked items (`.planning/ps23-mobile-webkit.png`, `data/`) preserved.

The old `f146831` commit is reachable via `git reflog` for ~90 days in case anything was unique to local-only history.

## Operating state at snapshot time

| Component | State |
|---|---|
| `psalter.gsdlabs.dev` DNS | Resolves to Cloudflare → Vercel (`x-vercel-id: arn1::iad1` in headers). Vercel ISR is OFF per commit `b95d0a2` ("completely disable ISR; restore pre-ISR dynamic rendering") |
| Cloudflare Tunnel (`/home/services/hetzner-vps/config.yml`) | Header-only — no `psalter` ingress rule. Tunnel was removed during the 7-day soak teardown |
| PM2 `psalter` service | "online" (PID 884910, 13s uptime — recently healthcheck-restarted). But `.env` points at `localhost:5435`; no `psalter-db` container exists. Service is effectively dead |
| `psalter-db` Docker container | Does not exist (`docker inspect psalter-db` → no such object) |
| `.env` (gitignored, June 20) | `DATABASE_URL=postgresql://postgres:psalter_secure_2024@localhost:5435/psalter` — Hetzner local DB target |
| `.env.production.local` (gitignored) | Vercel-generated overlay. `DATABASE_URL` → Neon pooler `ep-divine-cell-b1jrmt7e-pooler.c-5.eu-central-1.aws.neon.tech`. Full of `VERCEL_*` and `TURBO_*` env vars. Needs neutralising for Hetzner run |
| `docker-compose.yml` (origin/master) | `psalter-db: postgres:16-alpine` reading `POSTGRES_PASSWORD=${POSTGRES_PASSWORD}` from `/home/services/.env.production` |
| `POSTGRES_PASSWORD` in `/home/services/.env.production` | Key present (value redacted here). **Needs verification against the `psalter_secure_2024` literal in `.env`** before bringing the container up — if they don't match, the DB will refuse connections |
| `node_modules/` | Present (631 packages) — preserved through reset because gitignored |
| `.next/` | Sept 7 build artifacts — stale, needs rebuild before serving |

## Data: Neon backup state

Backup repo `mirkanu/psalter-db-backup` (auto-populated by `.github/workflows/backup-neon.yml`):

| File | Size | Status |
|---|---|---|
| `daily/2026-09-08.sql.gz` | 989,403 bytes | ✅ full dump |
| `daily/2026-09-09.sql.gz` | 989,402 bytes | ✅ full dump |
| `daily/2026-09-10.sql.gz` → `daily/2026-10-11.sql.gz` (32 files) | **20 bytes each** | ❌ silent failure |
| `weekly/2026-09-13` → `weekly/2026-10-11` (5 files) | 20 bytes each | ❌ silent failure |
| `monthly/2026-10-01.sql.gz` | 20 bytes | ❌ silent failure |
| `enrichment-tunes.csv.gz` | 46,682 bytes | ✅ static enrichment |
| `enrichment-lyrics-structured.csv.gz` | 124,485 bytes | ✅ static enrichment |

Backups have been silently failing for ~5 weeks. The GitHub Action is committing a 20-byte placeholder rather than a real `pg_dump`. We thought backups were healthy; they were not.

**Practical implication:** we have a real dump from Sept 9 (2 days after cutover; ~989 KB). Anything written to Neon between Sept 10 and Oct 11 is unrecovered in the backup repo. To get that, we need to either:

1. Connect to Neon directly using the connection string in `.env.production.local` (`postgresql://neondb_owner:...@ep-divine-cell-b1jrmt7e-pooler.c-5.eu-central-1.aws.neon.tech/neondb?...`) and `pg_dump` a fresh snapshot **before terminating the project**. This is the only window.
2. Or query Neon's activity log via their console/API for table-row deltas since Sept 9.

## Decisions made this session

- Reset local → origin/master: **done.**
- Sync strategy: full reset rather than preserve old history: **done.**
- Data canonical question: **deferred to Phase 18 plan.** Default is the Sept 9 dump unless we can pull a fresh one.
- Cost driver specifics: **deferred to user discussion.**
- Vercel teardown policy: full removal per user's "kill Vercel + Neon" answer.

## Cost driver (user-supplied)

> "I keep incurring costs on Neon and it's hard to avoid"

Most likely contributors (to confirm during planning):

1. **Neon compute-hours.** Neon Free has included compute but autoscroll-up past the Free tier boundary charges per active-second of compute. A serverless Postgres with continuous low traffic can still bill $5–15/mo even at small scale.
2. **Vercel bandwidth.** Static asset serving (tune JPGs, font files) crossing Cloudflare → Vercel edge is mostly free, but uncached responses or bandwidth past the included GB start charging.
3. **Vercel image optimization.** Only if `.next/image` is used (probably not in this project since melody rendering uses abcjs client-side).

The plan should set a hard cost budget ($0/mo for this app on Hetzner) and verify it after the swap.

## Open questions for the Phase 18 plan

1. **Are there unrecovered writes Sept 10 → Oct 11?** Needs direct Neon connection or SQL Activity log query. This is the highest-risk unknown.
2. **`psalter_secure_2024` vs `POSTGRES_PASSWORD`?** Mismatch would break the DB on startup.
3. **Vercel-specific code in HEAD?** Recent commits include Vercel-target work (PRs #94, #92 edge caching, ISR). Even with ISR disabled in `b95d0a2`, there may still be Vercel-specific imports/configs. Plan should `grep -i 'vercel\|x-vercel'` the repo.
4. **Cloudflare Access config?** Tunnel ingress is gone. Plan should preserve the existing `*.gsdlabs.dev` Access app and verify it still wraps Hetzner correctly after the tunnel re-attaches.
5. **`git reflog` cleanup.** Once we confirm the migration reversal worked, the old `f146831` reflog entry can be expired.

## See also

- `.planning/todos/pending/2026-10-12-undo-vercel-neon-migration.md` — Phase 18 plan task.
- `docs/research/visitor-workflows.md` — who's using the site and which routes are latency-critical (relevant when re-introducing Hetzner-side caching).
- `docs/research/lyric-to-note-alignment.md` — canonical for any notation work touched during reversal.
