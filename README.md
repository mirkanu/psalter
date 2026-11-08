# CPRC Psalter

> **Personal project:** This was built to solve a specific problem for the author. It works for that purpose. It has not been tested for general deployment and is not actively maintained — use it as inspiration or a starting point, not a supported tool.

> **100% AI-generated:** No code was written by hand. Every file was produced by [Claude Code](https://claude.ai/claude-code) via the [GSD workflow](https://github.com/open-gsd/gsd-core). The author is a non-programmer building personal tools with AI. PRs are welcome — if one arrives, Claude Code will review and merge it. Issues are unlikely to receive a response.

A Scottish Psalter for the congregation and precentors of CPRC: read the Psalms in the CPRC versification, sing them from live-rendered tune notation with the lyrics set beneath the notes, and build a precenting set for a Sunday service. It replaces the older Airtable + Softr site with a real application — a database of psalms, verses, tunes and precenting sets — where the notation is drawn in the browser rather than pasted in as flat images.

## Features

- **Read** — all 150 psalms in the CPRC versification, with the Scottish Psalter's alternative psalms and the day's reading.
- **Sing** — approved tunes rendered as live notation with the lyrics aligned under the notes, in staff or tonic solfège, inline or as a split leaf.
- **Precent** — build a set of psalms for a service, then step through them one tap at a time in singing view.
- **Explore** — browse by author, topic, Nave's subject, and the messianic psalms.
- **Tune sheets** — for tunes without approved digital notation, the original scanned score sheet is served instead and can be zoomed full-screen.
- **Study view** — a dedicated page per psalm with the psalm text, its recommended tune and its topic links, in tabs.

> **Tip:** Not sure where to start? Paste the link to this page into [Claude](https://claude.ai), [ChatGPT](https://chat.openai.com), or any AI assistant and ask it to walk you through the setup. These tools can read GitHub pages and guide you step by step.

## Quick setup

1. **Install Node.js 22 and Docker.** Check both are present:

   ```sh
   node --version    # v22 or newer
   docker ps         # the daemon must be running
   ```

2. **Clone and install dependencies.**

   ```sh
   git clone https://github.com/mirkanu/psalter.git
   cd psalter
   npm install
   ```

3. **Start PostgreSQL.** The app expects a Postgres 16 database on port 5435:

   ```sh
   docker run -d --name psalter-db -p 5435:5432 \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=psalter \
     postgres:16
   ```

4. **Configure the environment.** Copy the template and fill it in:

   ```sh
   cp .env.example .env
   ```

   | Variable | Needed for | Where to get it |
   |---|---|---|
   | `DATABASE_URL` | everything | `postgresql://postgres:postgres@localhost:5435/psalter` matches the container in step 3 |
   | `BETTER_AUTH_SECRET` | login | `openssl rand -hex 32` |
   | `BETTER_AUTH_URL` | login | `http://localhost:3000` — must match the port you actually serve on |
   | `AIRTABLE_PAT` | re-importing from Airtable | a personal access token; leave blank otherwise |
   | `PSALTER_ANTHROPIC_API_KEY` | the solfège OCR scripts | an Anthropic API key; leave blank otherwise |

5. **Create the schema.**

   ```sh
   npm run db:push
   ```

6. **Start the dev server.**

   ```sh
   npm run dev
   ```

   Open <http://localhost:3000>. Run the tests with `npm test`.

**Deploying to production** is deliberately not documented here — the live site is hosted on a Hetzner VPS behind a Cloudflare Tunnel and is deployed by a maintainer script. See [`AGENTS.md`](AGENTS.md) for the full operational guide, and [`docs/research/`](docs/research/) for the canonical notes on Scottish Psalter notation.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Drizzle ORM · PostgreSQL 16 · Better Auth · abcjs · Vitest
