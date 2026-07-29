# CPRC Psalter — Project Context

## What This Is

A rebuild of **psalter.cprc.co.uk** — the Covenanter Presbyterian Reformed Congregation (CPRC) Scottish Psalter website. Migrated off Airtable (backend) + Softr (frontend) onto a self-hosted Next.js 15 + PostgreSQL app, deployed live at **psalter.gsdlabs.dev**. Milestone 1 (Public Psalter) shipped 2026-07-29: full public browse, search, and the flagship feature — **live abcjs notation rendering** with syllable-aligned lyrics under the staff, replacing static JPG score images for the majority of the tune corpus. Milestone 2 (Precentor Portal & Polish) is in progress: authenticated precentor tooling is live; Airtable exit and final polish remain.

## Core Value

A precentor during worship can instantly find the psalms chosen for a service and follow the live-rendered tune notation with lyrics beneath the notes — hymnal-style — without relying on slow Softr or static images.

This held up through v1.0: the notation+lyrics singing view (mobile-first, chromeless, swipe-navigable) is the app's centre of gravity, and the precentor portal (Milestone 2, already live) builds directly on it.

## Who It's For

**General congregation (public, no login):** Browse all 150 psalms, read metrical lyrics, view tune info, explore theological metadata (topics, messianic references, doctrines), follow the 365-day daily reading plan, search by keyword or topic.

**Precentors (login required):** Create and manage service events (date + AM/PM), assign psalm+tune pairs to each service, view the service "set list" during worship with live notation.

**Future:** User accounts for congregation members (favourites, personalisation) — deferred to v2.

## Current State (post-v1.0)

- **Live at:** psalter.gsdlabs.dev (Hetzner VPS, PM2 process `psalter`, port 3005, Cloudflare Tunnel)
- **Backend:** PostgreSQL (`psalter-db` Docker container) — fully migrated off Airtable for all read paths; Airtable itself not yet decommissioned (Phase 05.4, in progress)
- **Frontend:** Next.js 15 App Router, static-rendered psalm/tune pages
- **Notation:** abcjs live SVG for 172 tunes total; 70 tunes currently marked `approved` in `/dev/melisma-editor` (unlocks live inline-Staff notation), remainder gracefully fall back to the original JPG scan — ongoing content curation, not a correctness gap
- **Auth:** Better Auth, precentor accounts admin-created only, live in production
- **~29,300 LOC** TypeScript/TSX in `src/`

### Key Data Tables (PostgreSQL, migrated from Airtable)

| Table | Purpose |
|-------|---------|
| psalms / psalm_versions | 150 psalms — KJV text, title, book, author, Haddington intro, structured lyrics |
| tunes | 172 tunes — name, meter, JPG score images, ABC notation, melisma decisions |
| naves_topics / verse_naves_topics | Nave's topical concordance cross-references |
| messianic classifications | Messianic type/reference classification |
| daily_readings | 365-day reading plan |
| precenting_sets / set_items | Precentor service events and psalm+tune assignments |
| feedback_submissions | Site feedback form |

## Target Stack (achieved)

- **Frontend:** Next.js 15 (App Router), shadcn/ui, Tailwind CSS 4, lucide-react
- **ORM/DB:** Drizzle ORM + postgres.js, PostgreSQL 16
- **Notation:** abcjs 6.6.3 (melody-only; four-part harmony still deferred, copyright check not yet done)
- **Auth:** Better Auth (precentor login, admin-created accounts only)
- **Storage:** Cloudflare R2 (tune score JPGs)
- **Analytics:** Umami (self-hosted)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Migrate data to PostgreSQL | Eliminate Airtable cost, own the data | ✓ Good — done, live, all read paths off Airtable |
| abcjs for notation | Renders ABC notation in-browser; melody-only is copyright-safe | ✓ Good — core differentiator, works well once syllable-alignment was solved |
| Melody-only encoding | 1979 RPCI typographical copyright expired 2004; traditional Scots tunes are public domain | ✓ Good — no legal issues surfaced |
| Four-part harmony deferred | Copyright status needs further legal check | — Pending, still deferred to v2 |
| Admin UI post-launch | Airtable continues to serve editorial needs short-term | ⚠️ Revisit — Airtable subscription still active pending Phase 05.4 exit verification; `/dev/melisma-editor` has become the de facto tune-data admin UI |
| Next.js + shadcn/ui | Project-wide convention; fast, accessible, self-hosted | ✓ Good |
| Deploy to psalter.gsdlabs.dev | Hetzner VPS via Cloudflare Tunnel; port 3005; psalter-db PostgreSQL container | ✓ Good — stable in production |
| Structured lyrics data model (`Stanza→Line→Syllable`) | Heuristic blob-based alignment couldn't handle DCM pairing, mid-stanza verse splits, or alternate meters correctly (Phase 4.9.6) | ✓ Good — closed a long-running class of staff-alignment bugs |
| Manual `/dev/melisma-editor` over batch OCR (Phase 4.11 pivot) | Claude Vision couldn't reliably perceive solfège underlines at batch scale; per-tune human review was more reliable | ✓ Good — mature workflow, actively used post-v1.0; slower but correct |
| Milestone boundary drawn after Phase 4.12, not after all 4.9.x melisma work | Remaining melisma/OCR phases (4.9, 4.9.11, 4.9.12, 4.10, 4.11) don't block the public site — non-approved tunes gracefully fall back to JPG | ✓ Good — avoided gating a shippable public site on open-ended content curation |

## Constraints

- **Copyright:** Melody lines of traditional Scottish Psalter tunes are public domain. Four-part harmonisations deferred pending copyright checks.
- **Precentor continuity:** Service event workflow must be at least as capable as current Softr/Airtable flow — met (Phase 5, 05.1).
- **Future extensibility:** Architecture should support easy addition of features (vibe-code-friendly).
- **VPS resources:** Hetzner VPS has 3.7GB RAM total; shared with other GSD projects — see global CLAUDE.md memory-hygiene rules.

## Requirements

### Validated (v1.0 — Public Psalter, shipped 2026-07-29)

- [x] Migrate all Airtable data to PostgreSQL — Phase 1
- [x] Public psalm browsing — dense-grid list + instant search — Phase 4.7
- [x] Psalm detail page — 7-tab structure with all metadata — Phase 4.5
- [x] Metrical lyrics display with structured Stanza→Line→Syllable model — Phase 4.9.6
- [x] Tune pages — name, meter, score display, YouTube/audio links — Phase 2, 4.8
- [x] abcjs live notation rendering with syllable-aligned lyrics — Phase 4, 4.9.2, 4.9.6–4.9.10
- [x] Mobile-first singing view (chromeless, swipe navigation, onboarding tour) — Phase 4.9.3–4.9.4, 4.9.15, 04.9.15.1
- [x] 365-day daily reading plan — Phase 2
- [x] Full-text search + topic/meter browse — Phase 3
- [x] /explore rebuild matching reference site (6 sections) — Phase 4.12

Full detail: `.planning/milestones/v1.0-REQUIREMENTS.md`

### Active (v1.1 — Precentor Portal & Polish, in progress)

- [x] Precentor login — Phase 05.1
- [x] Precentor: create/manage service events, assign psalm+tune pairs, live precenting mode — Phase 5
- [x] Site footer, feedback form, analytics — Phase 05.2
- [x] Daily reading plan calendar view — Phase 05.3
- [ ] Airtable exit verification (gap audit, R2 backup completeness, pg_dump backup, pgweb read-only viewer, cancellation checklist) — Phase 05.4
- [ ] Remaining loading.tsx skeletons (search, explore, daily, homepage) + click-feedback + OG images + Lighthouse 90+ — Phase 6

### Carried-over technical debt (not formal requirements, tracked for future scoping)

- Melisma/notation OCR corpus: 70/172 tunes reviewed and approved in `/dev/melisma-editor`; 102 remain — ongoing background curation
- UAT/verification sign-off gaps on several shipped phases (02, 04.5, 04.7, 04.9.8, 04.9.9, 04.9.14, 05, 05.1, 05.3) — all live in production with no reported breakage, formal checkpoints never closed

### Out of Scope (v1)

- Four-part harmonisation rendering — copyright check pending
- User accounts / congregation favourites — deferred to v2
- Admin UI (Directus/NocoDB) — `/dev/melisma-editor` has organically filled part of this need for tune data; general Airtable replacement still post-launch/low priority
- Mobile app / PWA offline mode
- Dark mode — deferred to v2

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
*Last updated: 2026-07-29 after v1.0 Public Psalter milestone close. Next up: Phase 05.4 (Airtable Exit Verification) and Phase 6 (Polish) to close out v1.1.*
