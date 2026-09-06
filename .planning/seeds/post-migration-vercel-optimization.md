---
title: Post-migration Vercel optimization (ISR tuning + Cloudflare Access precentor portal)
type: seed
created: 2026-09-06
origin: /gsd-explore 2026-09-06
status: planted
trigger: Vercel + Neon migration phase ships and psalter.gsdlabs.dev is fully Vercel-served
---

# What

After psalter migrates to Vercel + Neon, two optimizations become natural follow-ons:

1. **ISR cache tuning on psalm / tune pages.**
   Today `generateStaticParams` pre-builds every psalm and tune at deploy time. On Vercel, ISR with on-demand revalidation (e.g. `revalidate: 3600`) keeps pages fast without a full rebuild. Evaluate:
   - Psalm pages (rarely change) → ISR with longer TTL or pure static
   - Tune pages (change when melisma decisions approved) → webhook-triggered `revalidateTag` on the tune slug
   - `/api/changelog` and `/api/search` → stale-while-revalidate cache headers (mirror debates `next.config.mjs`)

2. **Cloudflare Access on precentor portal.**
   Once on Vercel, the precentor portal is reachable directly from the internet. Wrap `/precent/*` behind Cloudflare Access (already configured on the same account) so precentors pass through Cloudflare's identity layer before hitting Better Auth. Defense-in-depth: even if Better Auth has a session bug, Access blocks unauthenticated traffic at the edge.

# Why these are deferred (not part of the migration)

- The migration must land first to know what the new platform actually affords
- ISR strategy may differ once on Vercel (`revalidateTag` vs `revalidatePath` vs pure static)
- Access on a working portal is a UX / identity decision (which identity provider? email OTP? service token for automation?) that benefits from seeing production behavior post-migration

# Trigger condition

Vercel + Neon migration phase ships and `psalter.gsdlabs.dev` is fully Vercel-served. At that point the platform primitives are stable and these optimizations can be planned against confirmed behavior.

# Reference

- Migration note: `.planning/notes/migrate-to-vercel-neon.md`
- debates `next.config.mjs` cache header patterns
- Cloudflare Access docs for Vercel-fronted apps
