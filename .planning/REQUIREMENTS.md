# CPRC Psalter — Requirements

Generated: 2026-07-29 (fresh doc after v1.1 milestone close — see `.planning/milestones/v1.0-REQUIREMENTS.md` and `.planning/milestones/v1.1-REQUIREMENTS.md` for archived requirements)

No milestone is currently active. All previously-planned phases either shipped (v1.0, v1.1) or moved to `## Backlog` in `.planning/ROADMAP.md`. Run `/gsd-new-milestone` to define the next milestone's requirements, or pull an item from the Backlog to plan directly.

## Backlog (not yet scheduled as a milestone)

- **Phase 999.1 — Airtable Exit Verification**: ADMIN-01 through ADMIN-07 (gap audit, R2 attachment verification, formula-field reference doc, pg_dump backup, read-only pgweb viewer, cancellation checklist)
- **Phase 999.2 — Polish**: PERF-01 (remaining loading skeletons), PERF-02 (click-feedback states), OG images, Lighthouse 90+
- **Melisma/notation OCR corpus**: 102/172 tunes still lack an explicit `approved` decision in `/dev/melisma-editor` — ongoing manual per-tune review, not phase-tracked

See `.planning/ROADMAP.md` "## Backlog" for full detail on 999.1/999.2.

---

## v2 Requirements (Deferred)

- User accounts for congregation members (favourites, reading plan tracking) — adds GDPR surface area
- Admin UI (Directus/NocoDB) to replace Airtable editorial interface — post-launch low priority
- abcjs audio playback on public tune pages (v1 scopes audio to precentor portal only)
- Dark mode

---

## Out of Scope

- Four-part SATB harmonisation rendering — copyright legal check required before encoding
- In-app ABC notation editor — admin concern, not user concern
- Mobile app / PWA offline mode
- Social features (sharing, comments)
- Multi-tenancy (other congregations) — out of scope unless explicitly decided otherwise
