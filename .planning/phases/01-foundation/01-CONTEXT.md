# Phase 1: Foundation - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

All Airtable data lives in PostgreSQL with integrity verified and tune images served from permanent R2 URLs.

This phase covers:
- Drizzle ORM schema for all 13 Airtable tables with foreign-key relationships
- Airtable → PostgreSQL migration scripts (one-shot + delta)
- Tune score sheet JPG download and upload to Cloudflare R2
- Data integrity verification (row counts, spot-checks)

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

Key constraints from CLAUDE.md and project context:
- ORM: Drizzle ORM 0.45.2 with drizzle-kit 0.31.10
- DB driver: postgres.js 3.4.9
- Database: PostgreSQL 16 (psalter-db container)
- Storage: Cloudflare R2 for tune score sheet JPGs
- Airtable base: appY3dB1EHtex0fUJ ("CPRC Psalter")
- Airtable PAT in .env as AIRTABLE_PAT
- Never store raw airtableusercontent.com URLs — always upload binary to R2

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Next.js 15 App Router project structure already scaffolded
- .env contains AIRTABLE_PAT and DATABASE_URL (postgres.js connection string)
- Cloudflare R2 credentials inherit from /data/home/.env (CLOUDFLARE_API_KEY, CLOUDFLARE_EMAIL)

### Established Patterns
- Drizzle ORM for schema and queries
- postgres.js as DB driver
- Migration scripts as CLI scripts (not Next.js routes)

### Integration Points
- Schema exported from src/db/schema.ts (or similar)
- Migration scripts in scripts/ directory
- DATABASE_URL used by Drizzle for connection

</code_context>

<specifics>
## Specific Ideas

- 13 Airtable tables to migrate: Psalms, Scottish Psalter (versification), Tunes, Psalm & Tune CPRC, Events, Verses, 365 Days, Topics (Nave's), Messianic Psalms, and related junction/lookup tables
- Delta migration must support re-run before launch without duplicating records (upsert strategy)
- Spot-check script: verify 10+ records across psalms, tunes, verses, topics
- R2 bucket naming to follow existing project convention

</specifics>

<deferred>
## Deferred Ideas

- Admin UI for editorial content management (deferred post-launch per project decisions)
- abcjs audio/notation (deferred to Phase 4)

</deferred>
