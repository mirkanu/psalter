# CPRC Psalter — Project Guide

## Project

Rebuild of **psalter.gsdlabs.dev** — a Scottish Psalter website for CPRC congregation and precentors. Migrating from Airtable + Softr to Next.js 15 + PostgreSQL + abcjs notation rendering.

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

## Critical Reference Docs — READ FIRST

These docs in `.planning/research/` are the canonical record of our understanding of Scottish Psalter notation and lyric alignment. Any work touching solfège parsing, lyric-to-note alignment, melisma handling, slurs, or OCR pipelines **MUST** consult them before changing code or proposing fixes. They have been corrected through multiple painful debug cycles; treat them as binding.

| Doc | Read when working on |
|---|---|
| [`.planning/research/lyric-to-note-alignment.md`](.planning/research/lyric-to-note-alignment.md) | **Anything about melismas, slurs, underlines, syllable-to-note mapping, `w:` lines, `getPassingPositions`, `abc-melisma.ts`, `padWLineToNoteCount`. This is the SINGLE SOURCE OF TRUTH on alignment.** |
| [`.planning/research/tonic-solfa-notation.md`](.planning/research/tonic-solfa-notation.md) | Solfège syntax — pitch syllables, dot subdivisions, hold symbols, underlines, octave subscripts. Use when changing `solfege-parser.ts` or `ocr-solfege-v2.ts`. |
| [`.planning/research/scottish-psalter-structure.md`](.planning/research/scottish-psalter-structure.md) | Meter taxonomy (CM/LM/SM/CMD), stanza-vs-verse model, syllabification, phrase boundaries, PHRASE_BREAK placement. Use when changing `annotate-phrase-breaks.ts` or meter-related code. |
| [`.planning/research/tune-digitisation-research.md`](.planning/research/tune-digitisation-research.md) | Tune source catalog (Hymnary, de Boer, Sing Psalms), MusicXML→ABC conversion, per-source slur quality. Use when ingesting new tune data. |

### Hard rules derived from these docs

1. **Melisma = slur (staff/MusicXML) = underline (solfège) = `_` (ABC w-line).** They are the same musical concept in different formats. Never treat the solfège `.` (rhythm) as a melisma marker — it isn't.
2. **"Passing note" has two unrelated meanings in our reference materials.** Curwen-pedagogy "passing note" = melisma continuation (text-setting). Harmonic "passing note" = chromatic auxiliary (voice-leading). Our codebase's `passing: true` flag is the former. Don't conflate.
3. **The current solfège OCR pipeline lost underline data** (the prompt told the model to discard it). All current `*-melisma*` code is heuristic compensation, not canonical detection. Plan accordingly.

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

<!-- Stack (auto-managed by GSD Dashboard — do not edit manually) -->
## Stack (auto-managed)

| Service | Key / Reference | Purpose |
|---------|-----------------|---------|
| Umami | `PSALTER_UMAMI_WEBSITE_ID` | Analytics (umami.gsdlabs.dev) |
| BetterStack | monitor: `gsd-psalter` | Uptime monitoring |
| Cloudflare R2 | bucket: `gsd-psalter` | Storage |
| Sentry | `PSALTER_SENTRY_DSN` | Error tracking (sentry.io) |
| Telegram | `POST http://localhost:4820/api/services/telegram/send-file` | File push to owner's Telegram |

*Last updated: 2026-07-25T09:16:34.330Z — updated automatically on each stage transition.*
<!-- /Stack -->
