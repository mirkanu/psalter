# CPRC Psalter — Project Guide

## Project

Rebuild of **psalter.cprc.co.uk** — a Scottish Psalter website for CPRC congregation and precentors. Migrating from Airtable + Softr to Next.js 15 + PostgreSQL + abcjs notation rendering.

**Deployed at:** `psalter.gsdlabs.dev` (Hetzner VPS, port 3005, Cloudflare Tunnel)

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS 4 + lucide-react |
| ORM | Drizzle ORM 0.45.2 + drizzle-kit 0.31.10 |
| DB driver | postgres.js 3.4.9 |
| Database | PostgreSQL 16 (psalter-db container) |
| Auth | Better Auth 1.6.9 (precentor login, admin-created accounts only) |
| Notation | abcjs 6.6.3 (client-only — `dynamic({ ssr: false })` required) |
| Storage | Cloudflare R2 (tune score sheet JPGs) |
| Deployment | Docker container → Cloudflare Tunnel → psalter.gsdlabs.dev |

## Critical Rules

### abcjs — Never use server-side
abcjs manipulates the DOM directly. Any component using `ABCJS.renderAbc` MUST be:
1. Marked `'use client'`
2. Imported via `dynamic(() => import('./AbcRenderer'), { ssr: false })`
3. Call `renderAbc` inside `useEffect` with a `useRef` container
4. Have a `<Suspense>` skeleton fallback

### Airtable attachment URLs
Never store raw `airtableusercontent.com` URLs in the database — they expire in ~2 hours. Always download the binary and upload to R2 during migration.

### Static rendering
Public psalm and tune pages use `generateStaticParams` — no runtime DB queries on the read path.

## Data Sources

- **Airtable base:** `appY3dB1EHtex0fUJ` ("CPRC Psalter")
- **Airtable PAT:** stored in `.env` as `AIRTABLE_PAT`
- **Key tables:** Psalms, Scottish Psalter (versification), Tunes, Psalm & Tune CPRC, Events, Verses, 365 Days, Topics (Nave's), Messianic Psalms

## GSD Workflow

All non-trivial work goes through GSD phases. Current roadmap: 6 phases.

```
Phase 1: Foundation      — Schema + Airtable→PostgreSQL migration + R2 JPGs
Phase 2: Public Browse   — Psalm list/detail (3 tabs), tune pages, daily plan
Phase 3: Search          — Full-text, topic browse, meter filter
Phase 4: Notation        — abcjs live SVG + hymnal layout + JPG fallback
Phase 5: Precentor Portal — Auth, service events, set list, live service view
Phase 6: Polish          — Skeletons, click feedback, OG images, Lighthouse 90+
```

Start Phase 1: `/gsd-plan-phase 1`

## Environment Variables

See `.env` for:
- `AIRTABLE_PAT` — Airtable Personal Access Token
- `DATABASE_URL` — PostgreSQL connection string
- Cloudflare R2 credentials (inherit from `/data/home/.env`: `CLOUDFLARE_API_KEY`, `CLOUDFLARE_EMAIL`)
