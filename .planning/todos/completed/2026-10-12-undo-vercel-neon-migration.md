---
title: Plan Phase 18 — Undo Vercel+Neon migration, restore Hetzner hosting
date: 2026-10-12
priority: high
status: pending
---

# Plan Phase 18 — Undo Vercel+Neon migration, restore Hetzner hosting

## Goal

Restore CPRC Psalter on Hetzner (PM2 + `psalter-db` Docker container + Cloudflare Tunnel, behind `psalter.gsdlabs.dev`) so ongoing hosting cost is $0. Terminate Vercel project and Neon project after data and DNS migration are complete and verified.

## Why

User wants to stop paying for Neon compute (and likely Vercel bandwidth). Reverse the migration shipped in Phase 17 (2026-09-07).

## Acceptance criteria

- `psalter.gsdlabs.dev` resolves to Hetzner and serves the live psalter app from PM2.
- DNS cut over via Cloudflare (no registrar change); TTL low for fast re-rollback window.
- `psalter-db` Docker container running on host port 5435 with Hetzner-local Postgres.
- Latest available Neon data restored (default: `daily/2026-09-09.sql.gz` from `mirkanu/psalter-db-backup`; upgrade to a fresh Neon dump if one can be pulled).
- PM2 `psalter` service rebuilt against `origin/master` code (`c4eb461`) and restarted; `/api/deploy-info` returns the new commit SHA with `max-age=0, must-revalidate`.
- Cloudflare Access still gating write paths if needed (preserved from before).
- Vercel project deleted; Neon project terminated.
- Hard cost budget for the psalter app set to **$0/month** on Hetzner; verified after swap.

## Open questions to resolve during plan

- Which Neon snapshot to use as canonical (`daily/2026-09-09.sql.gz` vs. a fresh Neon pull if one is still possible).
- Whether Sept 10 → Oct 11 contained unrecovered writes (backups silently failed at 20 bytes for that period — see `docs/notes/2026-10-12-migration-reversal-state-snapshot.md`).
- Whether `<see POSTGRES_PASSWORD in /home/services/.env.production>` in `.env` matches `POSTGRES_PASSWORD` in `/home/services/.env.production` (must align before `psalter-db` starts).
- Vercel-specific code still present in HEAD (e.g. `x-vercel-*` references, `.vercel/` references, edge-cache imports from PRs #94 / #92). Should be greppable; recent commit `b95d0a2` already disabled ISR which helps but doesn't guarantee the tree is Vercel-free.
- DNS rollback strategy: flip Cloudflare DNS records (and revert tunnel ingress) so the live URL keeps working.
- Cloudflare Access app (`*.gsdlabs.dev` policy) — verify it still wraps Hetzner correctly after re-attach.

## Depends on

- Re-establishing node_modules and a clean `.next/` build against the synced `c4eb461` code.
- Verifying the Hetzner `/home/services/.env.production` `POSTGRES_PASSWORD` value to drive `docker-compose` `psalter-db`.

## See also

- `docs/notes/2026-10-12-migration-reversal-state-snapshot.md` — operational state captured 2026-10-12 morning.
- `done/` (this dir) — Phase 17 (Vercel+Neon migration) archive after this phase completes.
- `mirkanu/psalter-db-backup` — daily Neon dump repo, primary data source during import.
