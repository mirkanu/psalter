# CPRC Psalter — Project Context

## What This Is

A rebuild of **psalter.cprc.co.uk** — the Covenanter Presbyterian Reformed Congregation (CPRC) Scottish Psalter website. Currently running on Airtable (backend) + Softr (frontend). The rebuild migrates to a self-hosted Next.js app, eliminates Airtable's £20/month cost, delivers a fast modern UI, and introduces the flagship new feature: **live abcjs notation rendering** of psalm tunes for precentors during worship.

## Core Value

A precentor during worship can instantly find the psalms chosen for a service and follow the live-rendered tune notation with lyrics beneath the notes — hymnal-style — without relying on slow Softr or static images.

## Who It's For

**General congregation (public, no login):** Browse all 150 psalms, read metrical lyrics, view tune info, explore theological metadata (topics, messianic references, doctrines), follow the 365-day daily reading plan, search by keyword or topic.

**Precentors (login required):** Create and manage service events (date + AM/PM), assign psalm+tune pairs to each service, view the service "set list" during worship with live notation.

**Future:** User accounts for congregation members (favourites, personalisation).

## Current System

- **Backend:** Airtable base `appY3dB1EHtex0fUJ` ("CPRC Psalter")
- **Frontend:** Softr (slow, limited customisation)
- **Cost driver:** Airtable at ~£20/month due to record count

### Key Data Tables

| Table | Purpose |
|-------|---------|
| Psalms | 150 psalms — KJV text, title, book, author, Haddington intro |
| Scottish Psalter | Metrical versifications — lyrics, meter, tune assignments |
| Tunes | ~100+ tunes — name, meter, JPG score images, YouTube/SoundCloud |
| Psalm & Tune CPRC | Service records — psalm+tune pairs, date, precentor |
| Events | Service events — date, AM/PM, precentor name |
| Verses | Individual verse KJV + metrical text |
| 365 Days | Daily reading plan (complete) |
| Topics - Psalms | Topical index |
| Topics - Verses (Nave's) | Nave's topical concordance cross-references |
| Messianic Psalms | Messianic type/reference classification |
| Section Headings | Within-psalm section markers |
| Moods | Mood tags linked to tunes |
| Doctrines | Doctrinal cross-references |

### Current Score Images
Tune score sheets are **JPG photos of printed sheets** stored as Airtable attachments. No machine-readable ABC notation exists yet — sourcing or encoding ABC for traditional tunes is a required research step.

## Target Stack

- **Frontend:** Next.js (App Router), shadcn/ui, Tailwind CSS, lucide-react
- **Database:** PostgreSQL (migrated from Airtable)
- **Notation:** abcjs (melody-only; four-part harmony deferred)
- **Auth:** Precentor login (email/password); user accounts deferred to later milestone
- **Admin UI:** Keep using Airtable for now; Directus/NocoDB admin is post-launch low priority

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Migrate data to PostgreSQL | Eliminate Airtable cost, own the data | Pending |
| abcjs for notation | Renders ABC notation in-browser; melody-only is copyright-safe | Pending |
| Melody-only encoding | 1979 RPCI typographical copyright expired 2004; traditional Scots tunes are public domain | Pending |
| Four-part harmony deferred | Copyright status needs further legal check | Deferred |
| Admin UI post-launch | Airtable continues to serve editorial needs short-term | Deferred |
| Next.js + shadcn/ui | Project-wide convention; fast, accessible, self-hosted | Decided |
| Deploy to psalter.gsdlabs.dev | Hetzner VPS via Cloudflare Tunnel; port 3005; psalter-db PostgreSQL container | Decided |

## Constraints

- **Copyright:** Melody lines of traditional Scottish Psalter tunes are public domain. Four-part harmonisations deferred pending copyright checks.
- **ABC source:** No existing ABC files — need to find public domain ABC sources or encode from images/public domain editions.
- **Precentor continuity:** Service event workflow must be at least as capable as current Softr/Airtable flow.
- **Future extensibility:** Architecture should support easy addition of features (vibe-code-friendly).

## Requirements

### Validated

- [x] Migrate all Airtable data to PostgreSQL (all tables, relationships, attachments) — Validated in Phase 1: Foundation
- [x] Keyword full-text search (/search page, PostgreSQL FTS via plainto_tsquery) — Validated in Phase 3: Search
- [x] Topic/Nave's/messianic/author browse (/explore hub + sub-routes, generateStaticParams) — Validated in Phase 3: Search
- [x] Tune meter filter (TuneGrid client component, URL-synced, /tunes page) — Validated in Phase 3: Search

### Active

- [ ] Public psalm browsing — list/search all 150 psalms
- [ ] Psalm detail page — Overview, Study, Messianic tabs with all current metadata
- [ ] Metrical lyrics display (Scottish Psalter versification)
- [ ] Tune pages — name, meter, score display, YouTube/audio links
- [ ] abcjs live notation rendering replacing static JPG score images
- [ ] Lyrics beneath notation (hymnal-style layout) for precentor use
- [ ] 365-day daily reading plan
- [ ] Precentor login
- [ ] Precentor: create/manage service events
- [ ] Precentor: assign psalm+tune pairs to a service
- [ ] Precentor: service view showing assigned psalms with notation

### Out of Scope (v1)

- Four-part harmonisation rendering — copyright check pending
- User accounts / congregation favourites — deferred to future milestone
- Admin UI (Directus/NocoDB) — post-launch, low priority
- Mobile app

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-07 — Phase 1 complete: Airtable→PostgreSQL migration verified, 137/172 tune JPGs downloaded*
