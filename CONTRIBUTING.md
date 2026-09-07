# Contributing

> **Note:** This project is 100% AI-generated and maintained as a personal tool via [Claude Code](https://claude.ai/claude-code). PRs from others are welcome but unlikely to get maintainer attention. Issues may not receive responses.

## Deployment pipeline

The site is hosted on [Vercel](https://vercel.com) with [Neon](https://neon.tech) for PostgreSQL. Everything deploys automatically from GitHub — no manual CI step.

### Production — `psalter.gsdlabs.dev`

Every push to the **`master`** branch triggers a production deployment. The new version goes live as soon as the build reaches `READY` state, typically 60–90 seconds.

### Preview deployments — per-branch URLs

Every push to **any other branch** creates a preview deployment at a unique URL:

```
https://psalter-git-<branch-slug>-<your-github-username>.vercel.app
```

These previews are **publicly accessible** — anyone with the URL can view them. They share the production Neon database, so be careful with destructive writes when testing on a preview. Previews auto-expire after 30 days.

Open a PR if you want a permanent record of the change; PRs are not required to trigger previews.

### Ignored Build Step

Commits that touch **only `.md` or `.txt` files** skip the build entirely. Vercel auto-cancels the deployment in a few seconds and no preview URL is created. This saves ~80 seconds per docs-only commit.

The rule uses git pathspec exclusion — if you change any code file (anything outside `.md`/`.txt`), the build runs as normal.

## Local development

```bash
npm install
npm run dev      # http://localhost:3005
```

For the database, copy `.env.example` to `.env` and set `DATABASE_URL` to a Neon connection string. Drizzle ORM lives in `drizzle/` and `src/db/`.

### Testing notation rendering

`abcjs` notation rendering is browser-only — server-side rendering throws. If your change touches `src/components/notation/`, test in a real browser (iOS Safari preferred — mobile is the primary platform).

## Where things live

| Path | What |
|------|------|
| `src/app/` | Next.js App Router pages |
| `src/components/` | React components (notation, psalm views, precentor portal) |
| `src/db/` | Drizzle schema + client |
| `src/lib/` | Auth (Better Auth), helpers, R2 client |
| `drizzle/` | Drizzle migrations |
| `.planning/research/` | Canonical reference docs on Scottish Psalter notation |
| `.planning/phases/` | GSD phase plans (gitignored, local only) |

## Things to know

- **Mobile is primary.** Test on iOS Safari / Android Chrome first; desktop is secondary.
- **Don't commit `.env`** — secrets live in Vercel project env vars.
- **Hetzner is being retired** as of 2026-09-07; do not add new Hetzner infra.
