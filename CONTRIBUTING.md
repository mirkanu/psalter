# Contributing

> **Note:** This project is 100% AI-generated and maintained as a personal tool via [Claude Code](https://claude.ai/claude-code). PRs from others are welcome but unlikely to get maintainer attention. Issues may not receive a response.

## Where it is hosted

The site is hosted on a **Hetzner VPS**, fronted by the shared Cloudflare Tunnel:

```
Cloudflare Tunnel → PM2 service `psalter` → Next.js on port 3005
                  → PostgreSQL 16 in the local Docker container `psalter-db` (localhost:5435)
```

Tune score-sheet images are served from Cloudflare R2 via `cdn.psalter.gsdlabs.dev`.

There is **no CI deploy pipeline**. Production deploys are deliberate, manual, and run by the
maintainer — see below.

## Deployment

```sh
bash scripts/deploy.sh
```

That is the only supported deploy path. It builds into whichever build slot is *not* live
(`.next` / `.next-build`, recorded in `data/live-dist-dir`), swaps the live slot and restarts
PM2. Never run `npm run build` against the live slot — `next build` wipes its output directory,
which 500s every dynamic route while the server is serving from it.

Two rules that bite:

- **Commit before you build.** `scripts/capture-deploy-info.ts` reads `HEAD` at build start, so
  building before committing stamps the wrong commit into the admin footer.
- **`master` is push-protected.** `gitleaks` runs with `enforce_admins: true`, so direct pushes
  are rejected. Commit to a branch, open a PR, and merge.

There are no preview deployments. If you need to see a change live, deploy it.

## Local development

```sh
npm install
npm run dev      # http://localhost:3000
```

Copy `.env.example` to `.env` and point `DATABASE_URL` at a local Postgres on port 5435 — the
same container as in the README's quick setup. `BETTER_AUTH_URL` must match the port you
actually serve on. Drizzle ORM lives in `drizzle/` and `src/db/`.

Secrets live in `/home/services/.env.production` on the VPS and in a gitignored `.env`
locally. Never commit either.

### Testing notation rendering

`abcjs` notation rendering is browser-only — server-side rendering throws. If your change
touches `src/components/notation/`, test in a real browser (iOS Safari preferred — mobile is
the primary platform).

## Where things live

| Path | What |
|------|------|
| `src/app/` | Next.js App Router pages |
| `src/components/` | React components (notation, psalm views, precentor portal) |
| `src/db/` | Drizzle schema + client |
| `src/lib/` | Auth (Better Auth), helpers, build-metadata readers |
| `drizzle/` | Drizzle migrations |
| `docs/research/` | Canonical reference docs on Scottish Psalter notation |
| `scripts/` | Deploy, backup-verification and data-migration scripts |
| `.planning/` | Project state and planning history |

## Things to know

- **Mobile is primary.** Test on iOS Safari / Android Chrome first; desktop is secondary.
- **Don't commit `.env`** — it is gitignored, and `scripts/check-airtable-pat.sh` runs on every
  build to catch a leaked Airtable token.
- **`next build` type-checks the whole repo**, including anything under `scripts/`. A stray
  temporary script with a type error fails the production build.
- **The build needs about 1.5 GB of free memory** for its type-check worker. On a small box,
  add swap headroom before building; see `AGENTS.md`.

## Contribution licence

By submitting a pull request to this repository, you agree that you may fork and modify the code solely to submit a contribution back to `mirkanu/psalter`, and that you assign copyright of any accepted contribution to the project (the `mirkanu/psalter` repository owned by its owner) so the work remains a single coherent whole. No permission is granted to deploy or host the code independently of this project.
