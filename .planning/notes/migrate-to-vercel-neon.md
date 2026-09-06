---
name: Migrate psalter to Vercel + Neon, with R2 tune images first
description: Decision + reasoning for moving psalter off the Hetzner VPS onto managed platforms (Vercel Hobby + Neon free + Cloudflare R2), mirroring debates Phase 44
type: note
date: 2026-09-06
context: /gsd-explore migration ideation (2026-09-06)
---

## Decision

Move psalter off the Hetzner VPS to a managed-platform deployment:

| Layer | Target |
|---|---|
| App | **Vercel Hobby** (free) |
| DB | **Neon free tier**, eu-central-1 |
| Static assets (tune images) | **Cloudflare R2** — existing `gsd-psalter` bucket (already holds uncompressed originals) |
| Cron | **GitHub Actions** (if any periodic job is needed) |
| DNS | **Cloudflare** stays; CNAME flips from tunnel → `cname.vercel-dns.com` |
| Tunnel | Removed |
| Docker | Removed |

The VPS footprint for psalter retires entirely: no `psalter-db` container, no Cloudflare Tunnel ingress, no `PSALTER_*` env vars.

## Why

Two motivations (user-confirmed 2026-09-06):

1. **Cut VPS overhead.** 3.7GB Hetzner VPS is overcommitted (~10 services running). Removing psalter reclaims ~1.5GB of memory pressure and eliminates its Docker / tunnel / env maintenance surface.
2. **Better performance guarantees at growth.** Vercel edge + CDN + ISR + auto-scaling handles traffic spikes without re-architecting. Free tier is fine for current scale.

## Reference: debates Phase 44 (v10.0)

Debates migrated off the same VPS 2026-09-03 with identical architecture (Next.js → Vercel, Postgres → Neon, GitHub Actions cron, Cloudflare DNS). Phase 44 was 6 plans (provision → deploy+import → DNS cutover → cron → skip → decommission), shipped in ~2 days. It is the verified blueprint — see `/home/services/debates/.planning/STATE.md`.

## Psalter deltas vs. debates

| | Debates | Psalter |
|---|---|---|
| Auth | None (public RSS) | **Better Auth** — server actions on every protected route |
| Dynamic surface | Static browse + 1 weekly cron | Public ISR + **precentor portal** (event CRUD, server actions) |
| Static assets | None | `public/tunes/` — **126MB, 326 JPGs** (must move to R2 BEFORE Vercel deploy) |
| Airtable PAT | None | Used in one-time scripts only — must NOT ship to Vercel env |
| Cron | Weekly Monday ingest | TBD in 17-00 verification (Telegram devotional? daily psalm-of-the-day?) |

## Why R2 first (Plan 17-00 leading)

Vercel Hobby has a 250MB build artifact cap. `public/tunes/` (126MB compressed) fits but adds deploy time and bundles stale images into every release. Cloudflare R2 already holds the uncompressed originals in `gsd-psalter`; serving compressed JPGs from R2 instead of `public/` gives:

- Smaller, faster Vercel deploys (no 126MB JPG bundle)
- Free Cloudflare CDN caching for tune images
- Zero Vercel egress for image traffic

**Order matters.** R2 migration runs as Plan 17-00 on the existing VPS deployment before any Vercel provisioning — a small, reversible change with the same rollback shape as a normal deploy.

## Free-tier sanity check (current scale)

| Limit | Headroom for psalter |
|---|---|
| Vercel Hobby: 100K function invocations/day | Public traffic ISR-cached. Precentor portal admin-only, ~hundreds of actions/day. Years of headroom. |
| Vercel Hobby: 100GB egress/mo | Tune images offloaded to R2 (zero Vercel egress for images). Remaining = HTML/JS/CSS, negligible. |
| Vercel Hobby: 6000 build min/mo | At ~3min/build, ~33 builds/day. Comfortable. |
| Vercel Hobby: 10s function timeout | Better Auth + DB queries well under 10s. No long-running work. |
| Neon free: 0.5GB storage | psalter schema (psalms + tunes + verses + deciders + auth) ≪ 100MB. |
| Neon free: 190 compute hours/mo | Read-heavy; auto-suspends after 5 min idle, ~500ms wake. |
| R2 free: 10GB egress/mo | 326 images × ~200KB = 65MB max repeat load (most cached at edge). Fine. |

## Risk register

| Risk | Mitigation |
|---|---|
| `AIRTABLE_PAT` leaks into Vercel env (visible in build logs) | Lint/grep before 17-02; explicitly exclude from Vercel env in 17-01; documented as dev-time-only |
| Neon cold start on precentor portal (~500ms) | Acceptable at admin-only scale; if precentors complain, Vercel Cron ping to keep warm |
| 126MB tune images regress into Vercel bundle | Plan 17-00 enforces removal before any Vercel deploy; CI check or build assertion |
| Rollback on DNS cutover (Vercel issues) | Tunnel kept up until 17-06; original CNAME captured in 17-03 for instant flip-back |
| R2 URL pattern / key naming ambiguity | Open verification step in 17-00 (bucket layout, key alignment with originals, access model) |

## Open verification in Plan 17-00

Three questions deferred to 17-00 execution (user confirmed 2026-09-06):

1. R2 URL pattern: custom domain (e.g. `cdn.psalter.gsdlabs.dev`), default `*.r2.dev`, or behind Cloudflare Access?
2. R2 key naming: do originals use `tunes/<slug>-staff-0.jpg` keys aligned with `public/tunes/`? Or different prefix?
3. R2 read access: public read (anonymous GET works) or signed URLs only?

## Plan structure (Phase 17 confirmed 2026-09-06)

| Plan | Title | Status |
|---|---|---|
| 17-00 | R2 tune image migration (leading — on current VPS) | Not started |
| 17-01 | Provision Neon + Vercel | Not started |
| 17-02 | Schema + data + first deploy | Not started |
| 17-03 | DNS cutover (tunnel kept as rollback) | Not started |
| 17-04 | GH Actions cron (conditional on actual cron need) | Not started |
| 17-05 | (skip — debates skipped this) | n/a |
| 17-06 | Hetzner decommission | Not started |

Plan numbering uses the Phase 17 prefix (psalter convention, matching `14-01-PLAN.md`, `15.2-...` etc.). Plan structure mirrors debates Phase 44 (6 active plans + 1 skip) for parity.

## Success criteria

- `psalter.gsdlabs.dev` serves psalms / tunes / precentor portal at parity with pre-migration
- `docker ps` shows no `psalter-db`; `pm2 jlist` shows no psalter app
- Cloudflare Tunnel ingress has no psalter entry
- DNS resolves to Vercel
- No `PSALTER_*` env vars in `/home/services/.env.production`
- Tune images served from R2; Cloudflare cache hit ratio > 90% within 24h of cutover
