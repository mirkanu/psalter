# Domain Pitfalls

**Domain:** Scottish Psalter web app — Airtable/Softr to Next.js/PostgreSQL migration
**Researched:** 2026-05-07
**Confidence:** HIGH (Airtable API confirmed via official docs; abcjs SSR confirmed via official docs and Context7; Next.js patterns confirmed via Context7; copyright from established UK law; continuity patterns from software engineering practice)

---

## Critical Pitfalls

### Pitfall 1: Airtable Attachment URLs Expire in ~2 Hours

**What goes wrong:** You export the Airtable data (all tune JPG score images) via the API, store the `url` field values in PostgreSQL, then start the app — and within hours all image URLs return 403. The download URLs Airtable returns in the `fields.Attachments[].url` property are time-limited signed URLs from `airtableusercontent.com`. They are not permanent CDN links.

**Why it happens:** Airtable confirmed in official support docs: "The download URL property links to these files and will expire every few hours, typically remaining active for at least 2 hours." The URL is a pre-signed S3-style token, not a stable identifier.

**Consequences:** If the migration script writes raw Airtable URLs to the database, every tune image in production breaks silently a few hours after migration. This is easy to miss because the images work during testing (within the window) and break later.

**Prevention:**
- During the migration script, **download every attachment** to local storage or an S3/R2 bucket immediately after fetching each record. Do not store the Airtable URL as the canonical image URL.
- Structure the migration as two passes: first fetch all record data; second, for each attachment URL, download the binary and upload to permanent storage, then write the permanent URL to Postgres.
- Rate-limit download requests: Airtable's API is capped at 5 requests per second per base. Sleeping 200ms between API calls (not between downloads — the downloads are direct S3 fetches) is safe.

**Warning signs:** Images display correctly during dev/staging immediately after migration; broken images appear in production or after a few hours have passed.

**Phase:** Migration phase. Must be solved before the database can be considered stable.

---

### Pitfall 2: abcjs Cannot Run Server-Side — Causes Next.js Build Failures or Hydration Errors

**What goes wrong:** Importing abcjs in a React Server Component or at module scope in any component that is server-rendered causes the build to fail with `ReferenceError: document is not defined` (or `window is not defined`). abcjs calls DOM APIs (`document.createElement`, SVG operations) at render time and has no server-safe export path.

**Why it happens:** abcjs is a browser-only library. The official abcjs FAQ explicitly documents this and provides a workaround: `const abcjs = process.browser ? require('abcjs') : null`. The modern Next.js App Router equivalent is `next/dynamic` with `{ ssr: false }`.

**Consequences:** If not handled correctly: build errors in CI that are confusing to debug; or, more subtly, hydration mismatch errors that cause the notation to appear briefly then vanish, because the server renders nothing and the client tries to patch a DOM that doesn't match.

**Prevention:**
- Wrap every abcjs-using component with `dynamic(() => import('./AbcNotation'), { ssr: false })`.
- Keep the abcjs component entirely within a `'use client'` boundary. Never import from a Server Component.
- Use a `Suspense` fallback (skeleton or static JPG placeholder) to cover the client-side load gap.
- The abcjs import itself should live inside the component module, not at the app level.

```tsx
// Correct pattern
const AbcNotation = dynamic(() => import('@/components/AbcNotation'), {
  ssr: false,
  loading: () => <Skeleton className="h-32 w-full" />,
})
```

**Warning signs:** `document is not defined` errors in build logs; React hydration mismatch warnings in browser console; notation div renders empty on first load.

**Phase:** Notation rendering phase. Test in a Next.js environment before building the full tune page UI.

---

### Pitfall 3: Airtable Linked Record Fields Become Arrays of IDs — Relationships Are Lost Without a Resolution Pass

**What goes wrong:** In Airtable, a "Link to another record" field returns `["recABC123", "recDEF456"]` — just record IDs. Foreign key relationships between tables (Psalms ↔ Tunes ↔ Events, etc.) are expressed through these ID arrays. If the migration script writes these raw ID arrays as JSON blobs into Postgres, you lose relational integrity and cannot query across tables.

**Why it happens:** Airtable's API returns linked record fields as `Array<string>` (record IDs) in the default format, per official API docs. The human-readable linked names are only present when you expand the request or fetch the related table separately.

**Consequences:** Data migrates but is not relational. SQL joins fail. Features like "show all psalms for this tune" require re-fetching from Airtable instead of querying Postgres. Rollup/count fields (which depend on linked records) have no equivalent in the migrated schema.

**Prevention:**
- Before writing migration SQL, map the full Airtable schema: list every table, every linked-record field, and which table it points to.
- Build a two-pass migration: first, fetch all tables and build an in-memory `recordId → rowId` map for each table; second, insert rows and resolve linked IDs to foreign key integers.
- Formula fields and rollup fields in Airtable should become computed columns or materialized values in Postgres — they are not migrated directly.
- Lookup fields that aggregate linked values (e.g., a count of linked psalms) become SQL `COUNT` queries or Postgres computed columns.

**Warning signs:** Migration script completes with no errors but joined queries return no results; JSONB columns contain raw `recXXXXXX` strings.

**Phase:** Migration phase. Schema design must be done before any migration code is written.

---

### Pitfall 4: Precentor Workflow Disruption — Dual-Writes to Both Systems Create Divergence

**What goes wrong:** During the migration period, precentors continue creating service events in Airtable (via Softr). New records created after the one-time data dump are not in Postgres. When the new app launches, recent services are missing. Worse: if some precentors switch to the new app while others are still on Softr, the two systems diverge and reconciliation becomes painful.

**Why it happens:** The "keep Airtable as admin UI" decision combined with a hard-cutover launch means there is an interval where both systems exist but are not synchronised. The Airtable → Postgres migration is a one-time dump, not a live sync.

**Consequences:** Events created in Airtable after the migration snapshot are invisible in the new app. If the new app also creates events, those are invisible in Airtable. Data forks.

**Prevention:**
- Choose a precise cutover time (e.g., immediately after the last Sunday service of a given week).
- Run a "delta migration" immediately before launch: re-export only Events and Psalm & Tune CPRC records created after the initial snapshot; apply them to Postgres.
- Alternatively, build a lightweight Airtable webhook → Postgres sync for the Events and service tables only, to keep them live during the transition period.
- Communicate the cutover date explicitly to all precentors with clear instructions: "After [date], use the new app to create services."
- Do a dry-run migration + smoke test at least one week before the real cutover, on a staging database, so surprises are caught early.

**Warning signs:** Precentors report missing services on the morning of the launch; services show the wrong psalm assignments.

**Phase:** Deployment/cutover planning. Must be addressed in the launch phase, not an afterthought.

---

## Moderate Pitfalls

### Pitfall 5: abcjs `staffwidth` is Fixed-Pixel by Default — Notation Overflows on Mobile

**What goes wrong:** abcjs defaults to `staffwidth: 740` pixels. On a 375px-wide mobile screen the SVG is rendered at 740px, overflows its container, and either clips or causes horizontal scroll on the entire page. The precentor service view (a primary use case) is likely viewed on a phone or tablet during worship.

**Why it happens:** The default `staffwidth` is set to a desktop-comfortable pixel value. Unlike CSS, SVG layout does not automatically reflow to container width.

**Prevention:**
- Always use `responsive: 'resize'` option when calling `ABCJS.renderAbc`. This causes abcjs to render into the container's actual width.
- Additionally, always pass `expandToWidest: true` to prevent jagged right edges when one line of music is wider than others.
- Test notation rendering at 375px, 768px, and 1200px viewport widths before shipping.

```javascript
ABCJS.renderAbc("paper", abcString, {
  responsive: 'resize',
  expandToWidest: true,
})
```

**Warning signs:** Horizontal scrollbar appears on a tune page on mobile; notation SVG width is wider than the viewport.

**Phase:** Notation rendering phase.

---

### Pitfall 6: Next.js App Router — Accidentally Making Everything a Client Component

**What goes wrong:** A developer adds `'use client'` to a component that needs a small interactive element (e.g., a search input), which propagates the client boundary upward and causes all child Server Components (including database-querying ones) to re-render on the client, defeating the performance gains of the App Router.

**Why it happens:** In the App Router, `'use client'` marks the boundary where React's server tree hands off to the client bundle. Everything below that boundary is included in the JS bundle and runs in the browser. Putting a `'use client'` component high in the tree re-clients the entire subtree.

**Consequences:** Large client bundles; database query logic exposed to client; the main reason Softr is slow (everything client-side) gets accidentally reproduced.

**Prevention:**
- Keep `'use client'` at the lowest possible level. Push interactive elements (buttons, notation components) into small leaf components.
- Psalm detail pages, tune pages, and daily reading pages should be Server Components with only the `AbcNotation` component isolated as a client leaf.
- Use the Next.js bundle analyser (`ANALYZE=true next build`) periodically to audit what is in the client bundle.

**Warning signs:** Page components that only display data (no interaction) have `'use client'` at the top.

**Phase:** Every phase. Enforce as a code review rule from day one.

---

### Pitfall 7: Next.js App Router — N+1 Database Queries Without Awareness

**What goes wrong:** A Psalm list page renders 150 psalm cards. Each card is a Server Component that independently queries the database for its tune name, topic count, etc. This executes 150+ sequential round-trips to Postgres for one page load.

**Why it happens:** Server Components make it natural to co-locate data fetching with the component, but without explicit awareness of batching, nested components create N+1 query patterns. Unlike REST/GraphQL where this is visible, Server Component waterfalls can be invisible.

**Prevention:**
- For list pages, fetch all necessary data in the top-level page component in a single query with JOINs, then pass data down as props.
- Use `Promise.all()` to parallelise independent queries rather than sequentially awaiting them.
- For psalm pages (150 static routes), use `generateStaticParams` to pre-render at build time — eliminating runtime database queries entirely for the public-facing read path.

```tsx
// Good: single query at page level
export default async function PsalmsPage() {
  const psalms = await db.query.psalms.findMany({
    with: { tunes: true, topics: true }
  })
  return <PsalmList psalms={psalms} />
}
```

**Warning signs:** Database logs show dozens of identical queries per page request; psalm list page takes >500ms to load.

**Phase:** Data fetching design phase. Establish the pattern early.

---

### Pitfall 8: ABC Notation Encoding Errors Are Silent at Upload But Cause Blank Renders

**What goes wrong:** You encode a tune in ABC notation with a syntax error (e.g., mismatched bar counts, invalid key signature, unsupported `%%` directive). abcjs parses the string without throwing a JavaScript exception, but renders nothing, or renders a partial/incorrect score.

**Why it happens:** `ABCJS.renderAbc` is tolerant — it does not throw on malformed ABC. Errors are only available via `ABCJS.parseOnly(abc)` which returns an object containing a `warnings` array. Many unsupported `%%` directives (e.g., `%%autoclef`, `%%pango`, `%%select`) are silently ignored.

**Consequences:** A tune page shows a blank white box where the notation should be. Without monitoring, this goes undetected until a precentor complains during a service.

**Prevention:**
- Build a validation step into the admin workflow: when ABC notation is saved for a tune, call `ABCJS.parseOnly()` and surface any warnings to the editor.
- Store the `warnings` array result alongside the ABC text in the database so problems are visible in the admin view.
- Maintain a test suite that renders all ~100 tunes and asserts that each produces a non-empty SVG.
- Fall back gracefully to the JPG score image if the ABC string is empty or produces parse warnings.

**Warning signs:** Tune page displays a blank or empty `<div>` where notation should appear; no error in browser console.

**Phase:** ABC encoding phase. Validate each tune at encoding time, not at display time.

---

### Pitfall 9: Copyright — Four-Part Harmony Encoding Is Not Safe Without Verification

**What goes wrong:** The project correctly defers four-part harmonisations but incorrectly assumes all melody lines are unambiguously public domain. The risk is conflating the traditional Gaelic melody (public domain) with a specific typeset or harmonised arrangement.

**Why it happens:** UK copyright in a musical work expires 70 years after the death of the last surviving author. For arrangements and harmonisations, the arranger holds a separate copyright from the underlying melody. The 1650 Scottish Psalter (words) and traditional Common Metre tunes are clearly public domain. The 1929 Church Hymnary harmonisations are likely still in copyright (last arranger deaths would be mid-to-late 20th century). The 1973/1979 RPCI Psalter harmonisations are similarly under review.

**Specifically safe:**
- Melody-only encoding of traditional tunes sourced from pre-1900 or openly licensed sources.
- ABC notation files from session.org, abcnotation.com, or the ABC tunebooks pre-dating 1926 (US) / pre-1956 (UK) publications.

**Specifically risky (do not encode without legal check):**
- Four-part harmonisations from any published psalter or hymnal (even if the printed edition appears old).
- Transcriptions derived specifically from a 20th-century edition's specific rhythmic interpretation or ornamentation.

**Prevention:**
- Document the source for every ABC tune encoded: URL or publication provenance.
- For tunes sourced from session.org or similar, confirm the submitter's stated provenance.
- Never encode from a printed 20th-century psalter edition directly — verify the melody against a pre-1926 source first.
- Defer all harmony voices to a post-launch milestone when a clear legal opinion has been obtained.

**Warning signs:** ABC file has multiple voices (`V:` fields) — that is a harmonisation, not melody-only.

**Phase:** ABC sourcing phase. Must be established as policy before encoding begins.

---

## Minor Pitfalls

### Pitfall 10: Airtable Pagination — 100 Records Per Page, Easy to Miss Tail Records

**What goes wrong:** The Airtable API returns a maximum of 100 records per request. Tables with more than 100 records (Verses likely has 3,000+; Topics - Verses likely has thousands) return a `nextOffset` cursor. A naive migration script that only fetches the first page misses most records.

**Prevention:**
- All migration fetch functions must loop until `response.offset` is undefined.
- Log record counts per table and verify against Airtable's UI record count before marking migration complete.

**Phase:** Migration phase.

---

### Pitfall 11: Airtable Formula and Rollup Fields — Values Are Read-Only and Cannot Be Migrated Directly

**What goes wrong:** Formula fields (e.g., a concatenated display name) and rollup fields (e.g., count of linked psalms) appear in the API response as computed values. You cannot write them to Postgres as a column and expect them to stay current — they need to become SQL expressions, views, or be recomputed at query time.

**Prevention:**
- Audit each formula field: decide whether to materialise as a static value, compute via SQL, or simply remove if it was only a display convenience in Airtable.
- Rollup counts become SQL `COUNT()` aggregates or Postgres `GENERATED` columns.
- Do not create a Postgres column called `formula_field` with a static value unless it is truly static data, not a computation.

**Phase:** Migration schema design phase.

---

### Pitfall 12: abcjs Container Must Exist in the DOM Before `renderAbc` Is Called

**What goes wrong:** Calling `ABCJS.renderAbc("paper", abcString)` before the `<div id="paper">` element is mounted to the DOM silently does nothing — no error, no render.

**Why it happens:** abcjs uses `document.getElementById()` internally. If the element does not exist yet (e.g., called in a `useState` initialiser or too early in the component lifecycle), the call is a no-op.

**Prevention:**
- Always call `renderAbc` inside a `useEffect` with the container ref as a dependency.
- Use a `useRef` rather than a string ID when possible, to avoid ID collision on pages with multiple notation renders.

```tsx
const containerRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (containerRef.current) {
    ABCJS.renderAbc(containerRef.current, abcString, { responsive: 'resize' })
  }
}, [abcString])
```

**Warning signs:** Notation container is present in the DOM but remains empty; no errors in console.

**Phase:** Notation rendering phase.

---

### Pitfall 13: Postgres Connection Pool Exhaustion in Serverless/Edge Environments

**What goes wrong:** If the app is deployed to Vercel (serverless functions), each function invocation may open a new Postgres connection. With 150 concurrent page requests, 150 connections are opened, exhausting a typical Postgres `max_connections` limit (default 100) and causing connection errors.

**Prevention:**
- Use a connection pooler: PgBouncer (self-hosted) or Neon/Supabase's built-in pooler if using a managed Postgres service.
- For self-hosted Postgres on a VPS, set `max_connections` appropriately and use a singleton connection pool module that is reused across requests in the same Node.js process.
- If deploying to a traditional VPS with a long-lived Node process, a standard `pg` pool with `max: 10` is sufficient.

**Phase:** Infrastructure/deployment phase.

---

### Pitfall 14: `loading.tsx` Missing from Route Segments — Returns Softr-Like White Flash

**What goes wrong:** The entire motivation for rebuilding this app is that Softr is slow. If Next.js route segments do not have `loading.tsx` files, navigating between psalm pages shows a white screen while data loads — reproducing the exact behaviour users disliked.

**Prevention:**
- Every route segment that fetches data must have a `loading.tsx` with skeleton components matching the page layout.
- This is enforced as a project convention (see CLAUDE.md global rules).

**Phase:** Every phase with a new route.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Initial data migration | Attachment URL expiry (#1), linked record ID resolution (#3), rollup fields (#11), pagination (#10) | Two-pass migration with permanent file storage; schema-first design |
| ABC encoding | Silent parse errors (#8), copyright (#9) | `parseOnly` validation at save; source documentation policy |
| Notation rendering | SSR build failure (#2), DOM timing (#12), mobile overflow (#5) | `dynamic({ ssr: false })`, `useRef`, `responsive: 'resize'` |
| Psalm/tune pages | N+1 queries (#7), missing `loading.tsx` (#14) | `generateStaticParams` for 150 psalms; per-route skeletons |
| App-wide architecture | Client component sprawl (#6) | `'use client'` at leaf nodes only; bundle analysis |
| Launch cutover | Precentor workflow disruption (#4) | Delta migration; explicit cutover date; precentor briefing |
| Deployment | Postgres connection exhaustion (#13) | PgBouncer or managed pooler |

## Sources

- Airtable API — Rate limits: https://airtable.com/developers/web/api/rate-limits (confirmed 5 req/s)
- Airtable Support — Attachment URL behaviour: https://support.airtable.com/docs/airtable-attachment-url-behavior (confirmed ~2-hour expiry)
- Airtable API — Field model, linked records: https://airtable.com/developers/web/api/field-model
- Airtable API — List records pagination: https://airtable.com/developers/web/api/list-records
- abcjs FAQ — SSR/Next.js usage: https://github.com/paulrosen/abcjs/blob/main/docs/overview/faq.md (confirmed DOM-only)
- abcjs render options — `responsive`, `staffwidth`, `expandToWidest`: https://github.com/paulrosen/abcjs/blob/main/docs/visual/render-abc-options.md
- abcjs ABC notation — Unsupported directives: https://github.com/paulrosen/abcjs/blob/main/docs/overview/abc-notation.md
- Next.js — Dynamic imports with `ssr: false`: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/lazy-loading.mdx
- Next.js — `generateStaticParams`: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/generate-static-params.mdx
- Next.js — Streaming and Suspense: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/streaming.mdx
- UK copyright law — musical works: Duration of Copyright and Rights in Performances Regulations 1995 (70 years pma)
