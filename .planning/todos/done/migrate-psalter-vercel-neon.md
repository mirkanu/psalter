---
title: Plan + execute psalter migration to Vercel + Neon
type: todo
created: 2026-09-06
origin: /gsd-explore 2026-09-06
status: pending
priority: high
---

# What

Kick off the migration plan documented in `.planning/notes/migrate-to-vercel-neon.md`.

**Phase number confirmed: 17** (the very next phase as of 2026-09-06). User explicitly answered "yes" to 17 being correct, and confirmed it should run before Phase 6 and Phase 7 in execution order.

# First concrete actions

1. Run `/gsd-plan-phase 17` to plan Phase 17-00 first (the R2 migration leading plan)
2. Plan 17-00 must:
   - Verify R2 bucket layout (URL pattern, key naming, access model) — three open questions in the note
   - Sync compressed `public/tunes/*` → R2 bucket (preserve or align keys)
   - Rewrite `<img src="/tunes/X.jpg">` references to R2 URLs (across `AbcPlayer`, `NotationRenderer`, dev tools)
   - Update `next.config.ts` `images.remotePatterns` if using `next/image`
   - Deploy to current VPS first — validate R2 serving on production-equivalent path
   - Remove `public/tunes/` from build before any Vercel work
3. Plans 17-01..17-06 follow debates Phase 44 ordering: provision → deploy+import → DNS cutover → GH Actions cron (if needed) → decommission

# Why this matters

- VPS memory pressure (3.7GB, ~10 services) — moving psalter reclaims ~1.5GB
- Better scaling headroom at any visitor-count growth
- Sets up future projects on this VPS for the same managed-stack pattern
- debates proved the pattern works (Phase 44 shipped clean in ~2 days)

# Reference

- Note: `.planning/notes/migrate-to-vercel-neon.md`
- Blueprint: `/home/services/debates/.planning/STATE.md` Phase 44 (v10.0, completed 2026-09-03)
- debates `vercel.json` and `next.config.mjs` as concrete config examples

# Verification gates (during planning)

- AIRTABLE_PAT must NOT appear in Vercel env vars (one-time use only)
- `public/tunes/` removed from build before Vercel preview deploy
- Tunnel kept up until 17-06 (rollback safety for DNS cutover)
- Original Cloudflare CNAME captured before any flip

# Related seed

- `.planning/seeds/post-migration-vercel-optimization.md` — ISR tuning + Cloudflare Access on precentor portal after migration lands
