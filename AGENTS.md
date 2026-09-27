# CPRC Psalter — Project Guide

This file is the canonical project guide for the `mirkanu/psalter` repository. It is intentionally short, neutral about tooling, and replaces the previous `CLAUDE.md`. Update it via PR when project state changes.

## Project

Rebuild of **psalter.cprc.co.uk** — a Scottish Psalter website for CPRC congregation and precentors. Migrating from Airtable + Softr to Next.js 15 + PostgreSQL + abcjs notation rendering.

**Deployed at:** `psalter.gsdlabs.dev` (Vercel — `mirkanu/psalter`, `psalter.gsdlabs.dev` custom domain; Neon Postgres for the database; Cloudflare R2 for object storage).

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS 4 + lucide-react |
| ORM | Drizzle ORM 0.45.2 + drizzle-kit 0.31.10 |
| DB driver | postgres.js 3.4.9 |
| Database | PostgreSQL 16 (Neon — connection via `DATABASE_URL`) |
| Auth | Better Auth 1.6.9 (precentor login, admin-created accounts only) |
| Notation | abcjs 6.6.3 (client-only — `dynamic({ ssr: false })` required) |
| Storage | Cloudflare R2 (tune score sheet JPGs, bucket `gsd-psalter`) |
| Deployment | Vercel, custom domain `psalter.gsdlabs.dev` |

## Critical Reference Docs — READ FIRST

These docs in `docs/research/` are the canonical record of our understanding of Scottish Psalter notation and lyric alignment. Any work touching solfège parsing, lyric-to-note alignment, melisma handling, slurs, or OCR pipelines **MUST** consult them before changing code or proposing fixes. They have been corrected through multiple painful debug cycles; treat them as binding.

| Doc | Read when working on |
|---|---|
| [`docs/research/lyric-to-note-alignment.md`](docs/research/lyric-to-note-alignment.md) | **Anything about melismas, slurs, underlines, syllable-to-note mapping, `w:` lines, `getPassingPositions`, `abc-melisma.ts`, `padWLineToNoteCount`. This is the SINGLE SOURCE OF TRUTH on alignment.** |
| [`docs/research/tonic-solfa-notation.md`](docs/research/tonic-solfa-notation.md) | Solfège syntax — pitch syllables, dot subdivisions, hold symbols, underlines, octave subscripts. Use when changing `solfege-parser.ts` or `ocr-solfege-v2.ts`. |
| [`docs/research/scottish-psalter-structure.md`](docs/research/scottish-psalter-structure.md) | Meter taxonomy (CM/LM/SM/CMD), stanza-vs-verse model, syllabification, phrase boundaries, PHRASE_BREAK placement. Use when changing `annotate-phrase-breaks.ts` or meter-related code. |
| [`docs/research/tune-digitisation-research.md`](docs/research/tune-digitisation-research.md) | Tune source catalog (Hymnary, de Boer, Sing Psalms), MusicXML→ABC conversion, per-source slur quality. Use when ingesting new tune data. |
| [`docs/research/visitor-workflows.md`](docs/research/visitor-workflows.md) | **Who actually uses the site, the four user jobs (read, sing, pick-tune, explore), and which routes are latency-critical. Read this before touching the sing view, the modal psalm picker, the precenting left/right navigation, or any caching / prefetch / ISR / Vercel / Cloudflare decision. This is the source of truth for trade-offs about default view mode, default sort order, ISR TTLs, edge caching, and client prefetch priorities.** |

### Archived docs

`docs/archive/` holds research docs kept for historical reference but no longer authoritative. They were moved out of `docs/research/` and replaced with newer analysis — see each file's `About.md` for the supersession chain and the GitHub issue that audited it. Do **not** consult these for current behaviour; consult the linked successor doc instead.

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

### ISR / T1 / T2 routes — manual Vercel redeploy after Neon changes
Neon DB content changes are rare (every few months). When you change it, you must trigger a **Vercel production redeploy** — otherwise ISR-cached routes (T1) and tag-cached routes (T2/T3) will keep serving the old content. The `revalidatePath` / `revalidateTag` calls wired in `/api/precent/**` and `/api/dev/melisma-**` invalidate in-request, but full-DB re-imports (e.g. `seedPsalms`, `importAirtable`) need a Vercel redeploy or explicit revalidate to flush every cached psalm/tune page.

## Mobile-first layout (binding)

The psalter is a **mobile-first** site. Always design + verify CSS at phone widths first (<=390px), then scale up to tablet/desktop. Centring, padding, and max-width rules MUST work on a 360-390px viewport, not just on desktop. After any visual/CSS change, re-screenshot at **mobile (390), tablet (768), and desktop (1440)** before considering the change done. The Playwright measure-lyrics script enforces block.mid === parent.mid for .lyrics-block and .lyrics-subtitle across all four view modes (lyrics, staff-split, solfege-split, staff) — it must pass at every viewport, not just desktop.

## Data Sources

- **Airtable base:** `appY3dB1EHtex0fUJ` ("CPRC Psalter")
- **Airtable PAT:** stored in `.env` as `AIRTABLE_PAT` (never commit)
- **Key tables (legacy, for migration only):** Psalms, Scottish Psalter (versification), Tunes, Psalm & Tune CPRC, Events, Verses, 365 Days, Topics (Nave's), Messianic Psalms

## Deployment — stay on preview

Free Vercel allows **unlimited preview deploys but limited production deploys** on lower tiers; production deploys happen whenever `main` is updated. Therefore: **commit and push iteration-by-iteration to preview branches; only push to `main` when a milestone (issue/PR scope) is fully done and reviewed.**

Preview URLs follow the Vercel preview shape (`<deployment-id>-<git-branch>-<team-slug>.vercel.app` or the `*.vercel.app` form shown in the Vercel dashboard for the deployment). Production URL: `https://psalter.gsdlabs.dev`.

## Environment Variables

See `.env.example` for required keys. Never commit real values; local `.env` is gitignored.

## Workflow

Project tracking lives in **GitHub Issues and Milestones** on this repository. Planning documents (`docs/research/*.md`) hold canonical reference material; day-to-day planning lives in issues. See [`Skills/github-workflow`](https://github.com/mirkanu/skills-public) — or the matching skill in this workspace — for the general comment-on-start / comment-on-finish / branching rules.
