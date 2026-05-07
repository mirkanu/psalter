# Technology Stack

**Project:** CPRC Psalter (psalter.cprc.co.uk rebuild)
**Researched:** 2026-05-07
**Confidence:** HIGH for all five domains (verified against official docs and npm registry)

---

## Recommended Stack

### Core Framework (already decided)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x | Full-stack React framework | Project convention; App Router enables server components for SEO-critical psalm pages, streaming for perceived performance |
| shadcn/ui | latest (copy-paste) | UI component system | Project convention; zero bundle overhead, Tailwind-native |
| Tailwind CSS | 4.x | Styling | Project convention |
| TypeScript | 5.x | Type safety | Required for Drizzle schema inference to work properly |

---

### Notation Rendering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| abcjs | **6.6.3** (stable) | ABC notation rendering to SVG | Only mature, actively-maintained ABC renderer for the browser; melody-only rendering keeps score simple and copyright-safe; outputs responsive SVG |

**Integration pattern — CRITICAL:** abcjs manipulates the DOM directly and cannot run on the server. It must be used in a `"use client"` component with `dynamic()` import and `ssr: false`.

```typescript
// app/components/AbcNotation.tsx
"use client"
import { useEffect, useRef } from "react"
import dynamic from "next/dynamic"

// abcjs is imported inside useEffect to guarantee DOM availability
export function AbcNotation({ abc, className }: { abc: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dynamic import inside effect: no SSR execution, no window-not-defined crash
    import("abcjs").then((ABCJS) => {
      if (!ref.current) return
      ABCJS.renderAbc(ref.current, abc, {
        responsive: "resize",  // SVG fills container width
        add_classes: true,     // enables CSS targeting of note elements
      })
    })
  }, [abc])

  return <div ref={ref} className={className} />
}
```

Do NOT use `process.browser ? require('abcjs') : null` — that is the old Nuxt/CJS pattern. In Next.js App Router the correct pattern is dynamic `import()` inside `useEffect`.

**Why not the `react-abc` wrapper (`/fuhton/react-abc`):** Only 13 code snippets in Context7, medium reputation, last meaningful update years ago. Use abcjs directly — it is 422 snippets of well-documented API with a high source reputation.

**Lyrics beneath notes (hymnal layout):** ABC `w:` lines attach syllables to notes natively. abcjs renders them as SVG text beneath the staff. For the precentor view this is the only approach needed; do not build a custom lyrics-overlay layer.

```
X:1
T:Crimond
M:3/4
L:1/8
K:D
...notes...
w:The Lord's my shep-herd, I'll not want,
```

**Responsive rendering:** Pass `{ responsive: "resize" }` as the options object. The rendered SVG fills its container width automatically — essential for mobile precentor use.

---

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16.x | Primary database | Self-hosted, owns all data, eliminates Airtable cost |
| **Drizzle ORM** | **0.45.2** | ORM and query layer | See rationale below |
| **drizzle-kit** | **0.31.10** | Schema migrations | Companion CLI to Drizzle ORM |
| `postgres` (postgres.js) | **3.4.9** | PostgreSQL driver | Lighter than `pg`, better TypeScript support, officially supported by Drizzle |

**Why Drizzle over Prisma:**

Prisma 7.8.0 is the current stable version. Both are mature. Choose Drizzle for this project for three reasons:

1. **Schema as TypeScript, not DSL.** With ~20 Airtable tables having rich relationships, you want full TypeScript inference on every query. Drizzle's schema is plain `.ts` files — no `.prisma` file, no code generation step in the development loop. The type-safe query result is inferred directly from the schema at the call site.

2. **Better Auth integration.** Better Auth (the chosen auth library — see below) has a first-class `drizzleAdapter` that shares the same schema file, meaning auth tables live alongside application tables with consistent typing. The Prisma adapter for Better Auth works but requires a separate Prisma schema file.

3. **Lightweight and serverless-friendly.** The `postgres.js` driver + Drizzle ORM has no binary dependencies and no background connection manager process. If the project later moves to Vercel or a serverless host, this matters. Prisma requires a query engine binary.

**Why not raw `pg`:** Raw pg requires hand-writing every query with no type safety on results. For a schema with 13+ tables and complex join queries (psalm → verses → tune → events), this creates unacceptable maintenance burden.

**Connection setup:**

```typescript
// lib/db.ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const queryClient = postgres(process.env.DATABASE_URL!)
export const db = drizzle({ client: queryClient, schema })
```

**drizzle.config.ts:**

```typescript
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  introspect: { casing: "camel" },
})
```

---

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Better Auth** | **1.6.9** (stable) | Precentor login + future user accounts | See rationale below |
| `better-auth/adapters/drizzle` | bundled with 1.6.9 | Drizzle schema adapter | Shares existing Drizzle instance, no second DB connection |

**Why Better Auth over Auth.js v5 (NextAuth):**

Auth.js v5 (next-auth@beta, currently 5.0.0-beta.31) is still in beta as of the research date. The `latest` tag on npm is still v4.24.14, which does not support the App Router natively and requires a workaround. Using a beta library as the auth foundation of a production app is unnecessary risk when a stable alternative exists.

Better Auth 1.6.9 is marked `latest` on npm and is stable. Its advantages for this project:

- **Native App Router support.** Middleware, server components, and route handlers are all first-class. The `auth.api.getSession({ headers })` pattern works cleanly in both middleware and server components.
- **Drizzle adapter ships in the box.** `drizzleAdapter(db, { provider: "pg" })` requires no extra package and no separate schema file.
- **Designed for extensibility.** The project requires "precentor login now, congregation accounts later." Better Auth's plugin architecture (username, magic link, passkey) makes this incremental path clean without rearchitecting auth.
- **Email/password with full control.** Password hashing policy, custom verification flows, and reset-password email are all configurable in the same config object.

**Why not Lucia:** Lucia v3 moved to a "reference implementation" model rather than a maintained library. The project was explicitly wound down in favour of community-maintained forks. It should not be used for new projects.

**Why not Clerk:** Clerk is a hosted SaaS service. This project explicitly aims to eliminate third-party dependencies and recurring service costs.

**Minimal setup:**

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,  // precentors are admin-created, not self-registered
    requireEmailVerification: false,  // small known user list, not public signup
  },
})
```

**Middleware for protected precentor routes:**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/precentor/:path*"],
}
```

---

### File Storage (Airtable Attachment Migration)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Cloudflare R2** | — | Store migrated JPG score images | S3-compatible, zero egress fees, generous free tier (10 GB storage + unlimited egress on R2.dev subdomain), permanent URLs |
| `@aws-sdk/client-s3` | **3.1044.0** | R2 upload/access (S3-compatible API) | R2 uses the S3 API; this SDK covers upload scripts and any future signed URL generation |

**Why R2 over S3:** Score images are read-only after migration. Zero egress cost is the deciding factor for a church website with no budget.

**Why not uploadthing:** uploadthing (7.7.4) is designed for user-upload flows (drag-and-drop, browser-initiated uploads). The migration is a one-time server-side script downloading from Airtable and re-uploading to R2. uploadthing adds unnecessary complexity.

---

## Installation

```bash
# Database
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Auth
npm install better-auth

# Notation
npm install abcjs

# File storage (for migration script and future signed URLs)
npm install @aws-sdk/client-s3
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| ORM | Drizzle ORM 0.45.2 | Prisma 7.8.0 | Prisma requires a separate DSL schema file, binary engine, and code generation step; Drizzle integrates more cleanly with Better Auth |
| ORM | Drizzle ORM | Raw pg | No type safety on query results; 13+ table schema with joins would be unmaintainable |
| Auth | Better Auth 1.6.9 | Auth.js v5 (next-auth@beta) | Auth.js v5 still in beta (5.0.0-beta.31 as of research date); v4 `latest` is not App Router native |
| Auth | Better Auth 1.6.9 | Lucia | Project wound down; explicitly no longer maintained as a library |
| Auth | Better Auth 1.6.9 | Clerk | SaaS with monthly cost; contradicts self-hosting goal |
| Storage | Cloudflare R2 | AWS S3 | R2 has zero egress fees; S3 charges per GB egress |
| Storage | Cloudflare R2 | Local filesystem | Not durable; no CDN; breaks on server redeploy |
| PostgreSQL driver | postgres.js | pg (node-postgres) | postgres.js is lighter, has better TypeScript types, and is the Drizzle-preferred driver for new projects |

---

## Q5: Airtable to PostgreSQL Migration Strategy

This is a one-time script, not an ongoing concern. The recommended approach:

### Phase 1: Schema

1. Define the Drizzle schema in TypeScript based on the Airtable table structure (13 tables listed in PROJECT.md).
2. Run `npx drizzle-kit generate` to produce SQL migrations.
3. Apply with `npx drizzle-kit migrate` against the target PostgreSQL database.

### Phase 2: Data migration script

Write a Node.js script (not part of the Next.js app) that:

1. Calls the Airtable REST API using the `airtable` npm package (0.12.2) to page through all records.
2. For each table, maps Airtable field names to Drizzle schema column names.
3. Inserts rows into PostgreSQL using `db.insert(table).values(...)` — leveraging Drizzle for type-safe inserts.
4. For attachment fields (tune JPG score images): downloads each Airtable temporary URL, re-uploads to Cloudflare R2 via `@aws-sdk/client-s3`, stores the permanent R2 public URL in the database.

```typescript
// scripts/migrate-airtable.ts (run once, not part of the app)
import Airtable from "airtable"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base("appY3dB1EHtex0fUJ")
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,  // https://<account>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
})
```

**Important:** Airtable attachment URLs are temporary (expire after a few hours). The migration script must download and re-host them before the export window closes. Run the script promptly after generating the API key.

### Phase 3: Validate

- Row counts must match between Airtable and PostgreSQL for each table.
- Spot-check 5-10 records per table for field mapping correctness.
- Verify all R2 image URLs are publicly accessible before removing Airtable access.

---

## Q3: ABC Notation Sources for Scottish Psalter Tunes

**Summary:** No ready-made, comprehensive ABC notation corpus for traditional Scottish Psalter tunes was found. Manual encoding or MusicXML conversion is required for most tunes. Here is what does exist:

### What exists

| Source | Content | Format | License | Notes |
|--------|---------|--------|---------|-------|
| `dieuwedeboer/scottishmetricalpsalter` (GitHub) | 7 tunes: Crimond, Felix, Old 100th, Richmond, Spohr, Tallis, Tallis' Canon | MusicXML | No license stated (source: FCC 2013 Psalmody) | MEDIUM confidence on copyright status; taken from a church publication; contact repo author before using |
| thesession.org API | Irish/Scottish traditional tunes; psalm tunes not present (0 results for "psalm" query) | ABC (CC BY) | Creative Commons Attribution | Not a source for psalter tunes |
| abcnotation.com | Community-submitted ABC files; no verified psalm tune collection | ABC | Varies per submitter | Site returned 404 on search; use with caution |
| IMSLP | Public domain editions of psalter music (pre-1928) as PDFs | PDF scans | Public domain | Requires manual transcription to ABC |

### Recommended approach

The traditional Scottish Psalter tunes (e.g., Dundee, Martyrs, French, Old 124th, Coleshill, Abbey) predate 1700. Their melodies are unequivocally public domain worldwide. The practical blocker is not copyright but the absence of a machine-readable source.

**Recommended encoding workflow:**

1. Use MuseScore (free, open source) to engrave each tune from a public domain printed edition (pre-1928 psalters on IMSLP or the 1929 Church of Scotland psalter).
2. Export from MuseScore as MusicXML.
3. Convert MusicXML to ABC using `xml2abc` (Python tool, available on PyPI) or the online converter at `https://www.mandolintab.net/abcconverter.php`.
4. Store the resulting `.abc` files in the database's `abc_notation` column on the `tunes` table.

This is a data-entry project, not a technical one. For ~100 tunes, estimate 5-15 minutes per tune. The dieuwedeboer MusicXML files (7 tunes) can be used as starting points for those specific tunes, but verify the copyright situation before using them in a public site.

**Do NOT use AI-generated ABC notation for tunes.** LLMs hallucinate note sequences convincingly. Any AI-generated ABC must be verified against a printed source bar-by-bar before use.

---

## Sources

- abcjs Context7 docs: `/paulrosen/abcjs` (HIGH confidence — official GitHub repo documentation)
- abcjs FAQ on SSR: https://github.com/paulrosen/abcjs/blob/main/docs/overview/faq.md
- abcjs version: `npm view abcjs dist-tags` — confirmed `latest: 6.6.3`
- Drizzle ORM Context7 docs: `/drizzle-team/drizzle-orm-docs` (HIGH confidence)
- Drizzle version: `npm view drizzle-orm version` — confirmed `0.45.2`
- drizzle-kit version: `npm view drizzle-kit version` — confirmed `0.31.10`
- postgres.js version: `npm view postgres version` — confirmed `3.4.9`
- Auth.js Context7 docs: `/websites/authjs_dev` (HIGH confidence)
- Auth.js npm dist-tags: confirmed `latest: 4.24.14`, `beta: 5.0.0-beta.31`
- Better Auth Context7 docs: `/llmstxt/better-auth_llms_txt` (HIGH confidence)
- Better Auth version: `npm view better-auth dist-tags` — confirmed `latest: 1.6.9`
- `dieuwedeboer/scottishmetricalpsalter`: https://github.com/dieuwedeboer/scottishmetricalpsalter — 7 MusicXML psalm tunes
- thesession.org API: queried directly — confirmed 0 results for "psalm" tune type
- @aws-sdk/client-s3 version: `npm view @aws-sdk/client-s3 version` — confirmed `3.1044.0`
- Airtable npm package: `npm view airtable version` — confirmed `0.12.2`
