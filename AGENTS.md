# CPRC Psalter — Project Guide

This file is the canonical project guide for the `mirkanu/psalter` repository. It is intentionally short, neutral about tooling, and replaces the previous `CLAUDE.md`. Update it via PR when project state changes.

## Project

Rebuild of **psalter.cprc.co.uk** — a Scottish Psalter website for CPRC congregation and precentors. Migrating from Airtable + Softr to Next.js 16 + PostgreSQL + abcjs notation rendering.

**Deployed at:** `psalter.gsdlabs.dev` (Hetzner VPS — PM2 service `psalter` on port 3005, fronted by the shared Cloudflare Tunnel; PostgreSQL in the local Docker container `psalter-db` on `localhost:5435`; Cloudflare R2 for object storage).

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.5 (App Router, Turbopack) + React 19 |
| UI | shadcn/ui + Tailwind CSS 4 + lucide-react |
| ORM | Drizzle ORM 0.45.2 + drizzle-kit 0.31.10 |
| DB driver | postgres.js 3.4.9 |
| Database | PostgreSQL 16 (Docker container `psalter-db`, `localhost:5435` — `DATABASE_URL`) |
| Auth | Better Auth 1.6 (precentor login, admin-created accounts only) |
| Notation | abcjs 6.6.3 (client-only — `dynamic({ ssr: false })` required) |
| Storage | Cloudflare R2 (tune score sheet JPGs, bucket `gsd-psalter`) |
| Deployment | Hetzner VPS — PM2 (`scripts/start-with-db-wait.sh`, port 3005) behind the Cloudflare Tunnel; custom domain `psalter.gsdlabs.dev` |

## Backup & Recovery

- **Postgres database** is dumped daily at 03:00 UTC by a GitHub Actions workflow on [`mirkanu/psalter-db-backup`](https://github.com/mirkanu/psalter-db-backup). Workflow: `.github/workflows/backup-hetzner.yml`. Run `gh workflow run "Backup psalter DB (Hetzner)" --repo mirkanu/psalter-db-backup` to dump ad-hoc.
- **The backup secret must be `PSALTER_DB_PASSWORD`** from `/home/services/.env.production` — *not* the global `POSTGRES_PASSWORD`, which does **not** authenticate to `psalter-db`. The Postgres volume carries its own password from before the container was recreated on 2026-10-12, so the `POSTGRES_PASSWORD` env var is ignored on a non-empty volume ("volume-password-wins"). If the backup starts failing with `password authentication failed for user "postgres"`, the GitHub secret has drifted from `PSALTER_DB_PASSWORD` — update it and re-run. This broke the backup silently for 27 days; see issue #134.
- **Pre-Phase-13 uncompressed tune image originals** are preserved on R2 under the `originals/` prefix (see [`docs/notes/2026-10-12-r2-originals-backup.md`](docs/notes/2026-10-12-r2-originals-backup.md)). The Phase 13 compression replaced R2's contents — original 4032×3024 JPEGs live only at `https://cdn.psalter.gsdlabs.dev/originals/{slug}-{staff|solfege}-{n}.jpg` and in the local tarball `/home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` (sha256 `28a83a7d...`).
- **Verification scripts**: `bash scripts/verify-tunes-backup.sh` (proves the tarball restores byte-identical images), `bash scripts/verify-migration.ts` (proves the database schema/rows match).

## Critical Reference Docs — READ FIRST

These docs in `docs/research/` are the canonical record of our understanding of Scottish Psalter notation and lyric alignment. Any work touching solfège parsing, lyric-to-note alignment, melisma handling, slurs, or OCR pipelines **MUST** consult them before changing code or proposing fixes. They have been corrected through multiple painful debug cycles; treat them as binding.

| Doc | Read when working on |
|---|---|
| [`docs/research/lyric-to-note-alignment.md`](docs/research/lyric-to-note-alignment.md) | **Anything about melismas, slurs, underlines, syllable-to-note mapping, `w:` lines, `getPassingPositions`, `abc-melisma.ts`, `padWLineToNoteCount`. This is the SINGLE SOURCE OF TRUTH on alignment.** |
| [`docs/research/tonic-solfa-notation.md`](docs/research/tonic-solfa-notation.md) | Solfège syntax — pitch syllables, dot subdivisions, hold symbols, underlines, octave subscripts. Use when changing `solfege-parser.ts` or `ocr-solfege-v2.ts`. |
| [`docs/research/scottish-psalter-structure.md`](docs/research/scottish-psalter-structure.md) | Meter taxonomy (CM/LM/SM/CMD), stanza-vs-verse model, syllabification, phrase boundaries, PHRASE_BREAK placement. Use when changing `annotate-phrase-breaks.ts` or meter-related code. |
| [`docs/research/tune-digitisation-research.md`](docs/research/tune-digitisation-research.md) | Tune source catalog (Hymnary, de Boer, Sing Psalms), MusicXML→ABC conversion, per-source slur quality. Use when ingesting new tune data. |
| [`docs/research/visitor-workflows.md`](docs/research/visitor-workflows.md) | **Who actually uses the site, the four user jobs (read, sing, pick-tune, explore), and which routes are latency-critical. Read this before touching the sing view, the modal psalm picker, the precenting left/right navigation, or any caching / prefetch / ISR / hosting / Cloudflare decision. This is the source of truth for trade-offs about default view mode, default sort order, ISR TTLs, edge caching, and client prefetch priorities.** |

### Archived docs

`docs/archive/` holds research docs kept for historical reference but no longer authoritative. They were moved out of `docs/research/` and replaced with newer analysis; each file opens with a note stating what it supersedes and where the current material lives. Do **not** consult these for current behaviour — consult the successor doc in `docs/research/`, or this file, instead.

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

### ISR / T1 / T2 routes — manual redeploy after DB changes
Database content changes are rare (every few months). When you change it, you must trigger a **production redeploy** (`bash scripts/deploy.sh`) — otherwise ISR-cached routes (T1) and tag-cached reads (T2) will keep serving the old content. The `revalidatePath` / `revalidateTag` calls wired in `/api/precent/**` and `/api/dev/melisma-**` invalidate in-request, but full-DB re-imports (e.g. `seedPsalms`, `importAirtable`) need a redeploy or explicit revalidate to flush every cached psalm/tune page.

There are **two** caching tactics, not three — see `docs/research/cache-tactics.md` for the canonical taxonomy. (A third, "T3", was described in an earlier version of that doc but never existed in the tree: `/daily`'s `revalidate = 3600` was removed by PR #103 on 2026-10-12, so `/daily` is a T1 route and its day rolls over client-side anyway.) Note also that T2's `revalidate: 86400` lowers the *effective* revalidate of `/psalms/[id]` and `/tunes`, so those two routes expire after 24 h despite declaring `revalidate = false` — `cache-tactics.md` §3.5 has the mechanism and the evidence.

## Mobile-first layout (binding)

The psalter is a **mobile-first** site. Always design + verify CSS at phone widths first (<=390px), then scale up to tablet/desktop. Centring, padding, and max-width rules MUST work on a 360-390px viewport, not just on desktop. After any visual/CSS change, re-screenshot at **mobile (390), tablet (768), and desktop (1440)** before considering the change done. The Playwright measure-lyrics script enforces block.mid === parent.mid for .lyrics-block and .lyrics-subtitle across all four view modes (lyrics, staff-split, solfege-split, staff) — it must pass at every viewport, not just desktop.

## Data Sources

- **Airtable base:** `appY3dB1EHtex0fUJ` ("CPRC Psalter")
- **Airtable PAT:** stored in `.env` as `AIRTABLE_PAT` (never commit)
- **Key tables (legacy, for migration only):** Psalms, Scottish Psalter (versification), Tunes, Psalm & Tune CPRC, Events, Verses, 365 Days, Topics (Nave's), Messianic Psalms

## Deployment

**The only supported deploy path is `bash scripts/deploy.sh`.** It builds into whichever build slot is *not* live (`.next` / `.next-build`, recorded in `data/live-dist-dir`), swaps the live slot, and restarts PM2. Never run `npm run build` directly against the live slot — `next build` wipes its dist dir, which destroys the running server's route manifests and 500s every dynamic route.

`master` has gitleaks push protection with `enforce_admins: true`, so **direct pushes are rejected** — commit to a branch, open a PR, and merge.

Production URL: `https://psalter.gsdlabs.dev` (Cloudflare Tunnel → PM2 `psalter` on port 3005).

### A build that fails with no output

`next build` runs its TypeScript check inside a **jest-worker child process** (`next/dist/esm/build/type-check.js`). If that worker is OOM-killed, the parent catches the failure and calls `process.exit(1)` — printing **nothing**. A type error and a killed worker are therefore indistinguishable in the log:

```
✓ Compiled successfully in 14.2min
  Running TypeScript ...

BUILD FAILED — the live server was not touched.
```

Diagnose it by running the same check in-process, which prints real diagnostics:

```sh
node scripts/repro-typecheck.mjs
```

Two things to know when reading type-check output:

- `next build` **ignores diagnostics in `*.test.*` and `*.spec.*` files** (`next/dist/lib/typescript/runTypeCheck.js` filters them out), so a non-zero `npx tsc --noEmit` does not by itself mean the build will fail.
- The check needs roughly 1–1.5 GB. On this 3.7 GB box, before building: check `free -h`, and give the build protected memory — see **"Protecting the build from the OOM killer"** below. (Swap headroom is not enough on its own: the type-check worker is killed by the OOM killer, and swapping is far too slow for it.) Next preserves a distDir's `cache/` directory across builds, so a warm `<build-slot>/cache/.tsbuildinfo` makes the in-build check incremental and far cheaper — `TS_CACHE_DIR=.next-build/cache node scripts/repro-typecheck.mjs` writes exactly that file.

### Protecting the build from the OOM killer

`scripts/deploy.sh` does not set this up for you. On this box the type-check worker still gets OOM-killed unless the build is given a protected memory reservation and is excluded from `earlyoom` (which kills the greediest process at ~5% free RAM).

```sh
CG=/sys/fs/cgroup/system.slice/psalter-build
sudo mkdir -p "$CG"
echo 1258291200 | sudo tee "$CG/memory.min" >/dev/null   # 1200 MiB

setsid nohup bash scripts/deploy.sh > /tmp/psalter-deploy.log 2>&1 < /dev/null &
DEPLOY_PID="$(pgrep -f 'bash scripts/deploy.sh' | head -1)"

# Protect the whole tree, and keep protecting it.
#
# The move has to RACE the deploy's own forks. `npm run build` can start
# within a second of launch, and any process forked BEFORE its parent was
# moved stays in the old cgroup with oom_score_adj 0 — so a one-shot
# "move the PID, then sleep" silently protects nothing. (This was a real
# bug: on 2026-11-08 the build ran for 18 minutes with `oom_score_adj = 0`
# and outside the cgroup, because `npm` had been forked 4 seconds before
# the move.) Re-asserting every 2s closes that window.
(
  while kill -0 "$DEPLOY_PID" 2>/dev/null; do
    for p in $(pgrep -P "$DEPLOY_PID" 2>/dev/null) $(pgrep -f 'next build' 2>/dev/null); do
      sudo sh -c "echo $p > $CG/cgroup.procs" 2>/dev/null || true
      echo -1000 | sudo tee "/proc/$p/oom_score_adj" >/dev/null 2>&1 || true
    done
    sleep 2
  done
) &
```

- `setsid` puts the build outside the calling process group, so Claude Code's background-task reaper cannot kill it mid-build (this happened on 2026-11-08 and lost a ~40-minute build).
- `memory.min` stops the kernel reclaiming the build's pages; `oom_score_adj = -1000` keeps both `earlyoom` and the kernel OOM killer away from it. Both are inherited by child processes — **including the jest-worker that runs the type check**, which is what actually needs protecting.
- Verify it worked before you trust it:
  ```sh
  for p in $(pgrep -f 'next build'); do cat /proc/$p/cgroup /proc/$p/oom_score_adj; done
  ```
  Every line should show `/system.slice/psalter-build` and `-1000`.
- **Remove the cgroup afterwards** — it holds a memory reservation: `sudo rmdir /sys/fs/cgroup/system.slice/psalter-build`. Plain `rmdir` as the `claude` user fails with "Permission denied" (the cgroup dir is `root:root`).

The build also needs ~1.5 GB of **free disk**. `/home/services` is on `/dev/sda`, which runs close to full because the Docker and containerd data-roots live there. `df` hides ~3 GB of it behind ext4's root-reserved block reserve, so a non-root build sees far less than `df` suggests. If the build dies with `ENOSPC`, release the reserve (`sudo tune2fs -m 1 /dev/sda` — reversible with `-m 5`, and it deletes nothing). Do **not** `docker volume prune` to make room: `docker system df` reports ~6.5 GB of "reclaimable" volumes, but those are dangling volumes that may still hold another project's database.

## Environment Variables

See `.env.example` for required keys. Never commit real values; local `.env` is gitignored.

## Workflow

Project tracking lives in **GitHub Issues and Milestones** on this repository. Planning documents (`docs/research/*.md`) hold canonical reference material; day-to-day planning lives in issues. See [`Skills/github-workflow`](https://github.com/mirkanu/skills-public) — or the matching skill in this workspace — for the general comment-on-start / comment-on-finish / branching rules.
