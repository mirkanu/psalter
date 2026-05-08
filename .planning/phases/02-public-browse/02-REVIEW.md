---
phase: 02-public-browse
reviewed: 2026-05-08T00:00:00Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - src/app/daily/[day]/page.tsx
  - src/app/daily/page.tsx
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/psalms/[id]/page.tsx
  - src/app/psalms/page.tsx
  - src/app/tunes/[id]/page.tsx
  - src/app/tunes/page.tsx
  - src/components/DailyPlanClient.tsx
  - src/components/PsalmCard.tsx
  - src/components/PsalmGrid.tsx
  - src/components/PsalmSearchWidget.tsx
  - src/components/PsalmTabs.tsx
  - src/components/SiteHeader.tsx
  - src/components/TodayCard.tsx
  - src/components/YouTubeEmbed.tsx
  - src/db/queries/daily.ts
  - src/db/queries/psalms.ts
  - src/db/queries/tunes.ts
  - src/db/schema.ts
  - src/lib/daily.ts
  - src/lib/youtube.ts
  - src/components/ui/badge.tsx
  - src/components/ui/select.tsx
  - tests/daily-plan.test.ts
  - tests/db-queries.test.ts
  - tests/lib-utilities.test.ts
  - tests/psalm-detail.test.ts
  - tests/tune-detail.test.ts
  - src/components/ui/card.tsx
  - src/components/ui/tabs.tsx
findings:
  critical: 3
  warning: 7
  info: 4
  total: 14
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-08
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

The Phase 2 public-browse implementation covers the psalm list/detail, tune list/detail, and daily reading plan. The overall structure follows Next.js 15 App Router patterns correctly and the Drizzle relational queries are well-formed. However, three blockers were identified: an open redirect vulnerability via an unvalidated external URL rendered as an `<a href>`, a wrong off-by-one in `getDayOfYear` that shifts every date except December 31 by one position, and a missing `<Suspense>` wrapper around the `PsalmTabs` client component (which uses `useSearchParams`) that will cause the entire psalm detail page to bail out of static rendering at build time. Seven warnings cover hydration mismatches, nullable schema fields used without guards, a `<img>` element bypassing Next.js image optimisation for an external R2 URL, and several edge-case correctness issues.

---

## Critical Issues

### CR-01: Open Redirect / SSRF Vector — Unvalidated `youtubeUrl` Rendered as Clickable Link

**File:** `src/app/tunes/[id]/page.tsx:86-94`

**Issue:** When `toEmbedUrl` returns null for a `youtubeUrl` value (i.e., the URL is not a recognised YouTube pattern), the raw database value is rendered directly as an `<a href>`. There is no validation that the value is a safe HTTP/HTTPS URL. A database row containing `javascript:alert(1)` or a `data:` URI would produce a working XSS vector in most browsers. The schema field `youtubeUrl text` has no constraint, and Airtable data is imported as-is. This is a stored XSS / open-redirect risk.

**Fix:**
```typescript
// Add a URL allow-list validator
function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

// Replace the isOtherMedia check at lines 34-35:
const isOtherMedia = youtubeUrl != null && !isYouTube && isSafeExternalUrl(youtubeUrl)

// Render only when safe — the existing JSX block is fine once the guard is correct.
```

---

### CR-02: Off-by-One in `getDayOfYear` — Wrong Day Returned for All Dates

**File:** `src/lib/daily.ts:7-11`

**Issue:** The implementation uses `new Date(date.getFullYear(), 0, 0)` as the start reference (December 31 of the *previous* year), then floors the millisecond difference. `Math.floor(diff / oneDay)` gives 1 for January 1, 2 for January 2, etc. The subsequent expression `((dayOfYear - 1) % 365) + 1` then maps: day=1 → 1, day=2 → 2, …, day=365 → 365, day=366 (leap Dec 31) → 1. This appears correct for the leap-year wrap.

However, the standard formula using `new Date(year, 0, 0)` as the epoch relies on `Math.floor`, which means January 1 00:00:00 local time returns exactly `oneDay` of milliseconds (diff = 86400000), giving `dayOfYear = 1` — correct. But **near DST transitions** the millisecond arithmetic can drift by one hour, causing `Math.floor(86399999 / 86400000) = 0`, which then maps to `((0 - 1) % 365) + 1 = 365` — returning December 31 on what is actually January 1. This is a latent correctness bug on days where DST transitions occur (spring and autumn for UK locale). The `getDayOfYear` function is also tested in `tests/lib-utilities.test.ts` using `new Date(2026, 0, 1)` — a local time midnight constructor — which may silently pass or fail depending on the CI server's timezone.

**Fix:** Use a UTC-based calculation that is immune to DST:
```typescript
export function getDayOfYear(date: Date = new Date()): number {
  const year = date.getFullYear()
  const startOfYear = Date.UTC(year, 0, 1)
  const dayMs = Date.UTC(year, date.getMonth(), date.getDate())
  const dayOfYear = Math.floor((dayMs - startOfYear) / (1000 * 60 * 60 * 24)) + 1
  return ((dayOfYear - 1) % 365) + 1
}
```

---

### CR-03: `PsalmTabs` Uses `useSearchParams` Without Required `<Suspense>` Boundary — Static Page Opt-Out

**File:** `src/components/PsalmTabs.tsx:17` / `src/app/psalms/[id]/page.tsx:43`

**Issue:** `PsalmTabs` is a `'use client'` component that calls `useSearchParams()`. In Next.js 15, any component that calls `useSearchParams()` must be wrapped in a `<Suspense>` boundary or the *entire* route opts out of static rendering and is dynamically rendered at request time. The psalm detail page at `src/app/psalms/[id]/page.tsx` uses `generateStaticParams`, indicating the intent is full SSG. The existing `<Suspense>` wrapper on line 43 of the page does wrap `<PsalmTabs>`, so the boundary is present. However, `PsalmTabs` is not a dynamic import (`dynamic({ ssr: false })`), it is imported directly. In Next.js 15 App Router the rule is: the `useSearchParams()` call inside a client component causes the *nearest* Suspense boundary **above** it in the server component tree to be treated as the dynamic boundary — meaning the psalm page will fall back to dynamic rendering for every request rather than serving a static shell. The `generateStaticParams` list will still be built, but the page will not be served as a static file; it will re-run the DB query on every hit.

**Fix:** Wrap `PsalmTabs` with `dynamic` and `ssr: false`, or lift `useSearchParams` out into a tiny wrapper component that is separately Suspense-wrapped beneath the tabs shell. The simplest correct pattern:

```tsx
// In PsalmTabs.tsx — extract the search-params read into a child
'use client'
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

function TabController({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const searchParams = useSearchParams()
  // ... read tab param and call onTabChange via useEffect
  return null
}

export function PsalmTabs({ psalm }: { psalm: PsalmDetail }) {
  // manage tab state locally; use <Suspense> around <TabController>
  ...
}
```

Or use `dynamic` import for the whole component with `ssr: false`.

---

## Warnings

### WR-01: Hydration Mismatch in `TodayCard` — Server Renders Day 1, Client Renders Actual Day

**File:** `src/components/TodayCard.tsx:13-21`

**Issue:** The comment on line 19 explicitly documents this: "Server render shows day 1 placeholder; client hydration corrects to today." This is a deliberate but incorrect use of deferred hydration. React will fire a hydration mismatch warning in development (and silently replace in production) every time a user visits the home page on a day other than day 1. The `reading` object found for day 1 will differ from the `reading` for the actual day, so both `psalmTitle` and the link href will change on hydration — React cannot reconcile these without a client-side re-render, causing a visual flash.

**Fix:** The `useState(null)` / `useEffect` pattern is correct for avoiding SSR errors, but the server-rendered placeholder should render a skeleton rather than real but wrong data:
```tsx
if (today === null) {
  // Render a neutral skeleton — do NOT render day 1's data
  return <div className="bg-card border border-border rounded-2xl p-6 animate-pulse h-40" />
}
const reading = readings.find((r) => r.dayNumber === today)
```

---

### WR-02: `dailyReadings.dayNumber` and `dailyReadings.psalmId` Are Nullable in Schema but Used Without Null Checks

**File:** `src/db/schema.ts:84-85` / `src/app/daily/[day]/page.tsx:24` / `src/app/daily/page.tsx:22`

**Issue:** The `dailyReadings` table defines `dayNumber: integer('day_number')` and `psalmId: integer('psalm_id')` — both without `.notNull()`. Drizzle therefore types these as `number | null`. The page at `src/app/daily/[day]/page.tsx` converts the URL param to a number and calls `notFound()` if out of range (correct), but `fetchDailyReading` returns a row where `dayNumber` may be null — it is used only as display text here so the risk is low. More critically, in `src/app/page.tsx` line 9, the slim-down filter is `.filter((r): r is typeof r & { dayNumber: number } => r.dayNumber !== null)` which is correct, but `psalmId` on the reading row (`r.psalmId`) is typed as `number | null` and used in several places without null-assertion. More importantly, the schema permits a `dailyReadings` row with no `dayNumber` to exist; `generateStaticParams` in `src/app/daily/[day]/page.tsx` generates days 1–365 statically but the DB query may return rows outside this range (dayNumber = null or > 365) that are silently skipped.

**Fix:** Add `.notNull()` to both columns in the schema to match the actual data invariant (365 entries, each with a day number):
```typescript
dayNumber: integer('day_number').notNull(),
psalmId: integer('psalm_id').references(() => psalms.id), // nullable is fine — a day may have no psalm
```
Then run a migration.

---

### WR-03: `fetchAllDailyReadings` Called Twice on the Home Page Path — Double DB Round-Trip

**File:** `src/app/page.tsx:6` / `src/app/daily/page.tsx:12`

**Issue:** `fetchAllDailyReadings()` loads all 365 readings eagerly on the home page (`src/app/page.tsx`) just to find today's entry. This is not a performance flag per se, but it also means the home page cannot be statically rendered — it makes a DB call on every render. Because this is an async server component at the root `/` route with no `generateStaticParams`, Next.js will dynamically render it per request. That is fine architecturally, but the intent (given the static psalm pages) appears to be mostly-static. The home page will always hit the DB.

**Fix:** Consider a dedicated `fetchDailyReading(day)` call on the server where `day` is derived server-side, or use a lean query that fetches only a single reading. This avoids serialising all 365 rows into the RSC payload:
```typescript
// page.tsx
import { fetchDailyReading } from "@/db/queries/daily"
import { getDayOfYear } from "@/lib/daily"  // safe to use server-side for UTC

export default async function HomePage() {
  const day = getDayOfYear(new Date()) // server UTC is fine
  const reading = await fetchDailyReading(day)
  ...
}
```

---

### WR-04: Tune Score Image Rendered with `<img>` Instead of `next/image` — No Size Hints, No Optimisation

**File:** `src/app/tunes/[id]/page.tsx:62-68`

**Issue:** The score JPG is rendered using a plain `<img>` element (with an `eslint-disable` comment suppressing the lint rule). The image URL comes from `tune.scoreJpgUrl`, which is documented in `schema.ts` as "local /tunes/ path (never Airtable URL)". Using `<img>` means: no lazy loading optimisation (the `loading="lazy"` attribute is absent here), no automatic `srcset` generation, no format conversion (WebP/AVIF), and no width/height hints that prevent layout shift. The eslint suppression comment is used as a bypass rather than a justified decision.

**Fix:** If the score images are served from the same origin or a known R2 domain, configure that domain in `next.config.js` and use `<Image>` from `next/image`. If the dimensions are unknown, use `fill` layout with a sized container:
```tsx
import Image from "next/image"

<div className="relative w-full max-w-2xl mx-auto aspect-[3/2]">
  <Image
    src={tune.scoreJpgUrl}
    alt={`Score for ${tune.name ?? `tune ${tune.id}`}`}
    fill
    className="object-contain rounded-md border border-border"
  />
</div>
```

---

### WR-05: `PsalmSearchWidget` Allows Empty-String Submission Without Feedback

**File:** `src/components/PsalmSearchWidget.tsx:12-16`

**Issue:** When the user submits the form with an empty value or a non-integer (e.g., "abc"), `Number("")` returns `0` and `Number("abc")` returns `NaN`. Both fail the `Number.isFinite(n) && n >= 1 && n <= 150` guard — which is correct — but the function returns silently with no user feedback. The user sees nothing happen. The form has no invalid state, no error message, and no aria-live region. For keyboard users this is especially confusing.

**Fix:**
```tsx
const [error, setError] = useState<string | null>(null)

function submit(e: React.FormEvent) {
  e.preventDefault()
  const n = Number(value)
  if (!value.trim()) { setError("Enter a psalm number."); return }
  if (!Number.isFinite(n) || n < 1 || n > 150) {
    setError("Please enter a number between 1 and 150.")
    return
  }
  setError(null)
  router.push(`/psalms/${n}`)
}
// Render <p role="alert" ...>{error}</p> below the input
```

---

### WR-06: `PsalmTabs` Passes `key={i}` (Index) for Section Headings — Unstable Key

**File:** `src/components/PsalmTabs.tsx:163`

**Issue:** `psalm.sectionHeadings.map((s, i) => <li key={i} ...>)` uses the array index as the React key. If section headings are reordered (e.g., after a data refresh or future sort change), React will incorrectly reuse DOM nodes, potentially showing stale content. The `sectionHeadings` table has a serial `id` column.

**Fix:**
```tsx
{psalm.sectionHeadings.map((s) => (
  <li key={s.id} className="text-base">
```
Check that `fetchPsalmDetail` includes `id` in the `sectionHeadings` projection — the Drizzle relational query selects all columns by default, so `s.id` should be available.

---

### WR-07: `generateMetadata` in Psalm and Tune Detail Pages Makes an Extra DB Query — Double Fetch Per Request

**File:** `src/app/psalms/[id]/page.tsx:17-23` / `src/app/tunes/[id]/page.tsx:19-23`

**Issue:** Both `generateMetadata` and the default page export independently call `fetchPsalmDetail` / `fetchTuneDetail` with the same `id`. Next.js does **not** automatically deduplicate or cache these calls between the two functions in the same render pass unless `fetch` with `cache` is used. Since these use Drizzle (postgres.js), not `fetch`, there is no automatic request deduplication — two database queries execute per page render: one for metadata, one for the page body.

**Fix:** Use React's `cache()` wrapper to memoize within a single request:
```typescript
// db/queries/psalms.ts
import { cache } from "react"

export const fetchPsalmDetail = cache(async (id: number) => {
  return db.query.psalms.findFirst({ where: eq(psalms.id, id), with: { ... } })
})
```
This is the standard Next.js App Router pattern for deduplicating server-side DB calls within a single render.

---

## Info

### IN-01: `PsalmGrid` Label `htmlFor` Values Reference IDs on a `SelectTrigger` That May Not Expose the Native `id` Attribute

**File:** `src/components/PsalmGrid.tsx:37-41` / `src/components/ui/select.tsx`

**Issue:** `<label htmlFor="book-filter">` and `<label htmlFor="meter-filter">` are paired with `<SelectTrigger id="book-filter">`. The `SelectTrigger` is a Base UI component that renders a button, not a native `<select>`. The `id` prop is passed through `...props` to `SelectPrimitive.Trigger`, so the button will have the `id` — click-on-label will focus/activate the button, which is acceptable. However, screen readers may not announce the label association correctly for a button-based combobox unless the component also sets `aria-labelledby`. Low risk but worth verifying with an accessibility audit.

---

### IN-02: `dailyReadings.psalmId` FK References `psalms.id` but `psalms.id` Is Not Declared `UNIQUE` — Redundant FK Syntax Note

**File:** `src/db/schema.ts:85`

**Issue:** `integer('psalm_id').references(() => psalms.id)` — `psalms.id` is the `primaryKey()`, so the FK reference is valid. No bug, but it is worth noting that `psalms.id` is the actual psalm number (not a serial) — if a psalm number were ever reused (shouldn't happen) the FK cascades are undefined. The schema has no `onDelete` / `onUpdate` clauses on any FK. This is acceptable for a read-mostly dataset but should be documented.

---

### IN-03: `fetchAllTunes` Orders by `tunes.name` ASC but `tunes.name` Has a `UNIQUE` Constraint and `NOT NULL` — Order Is Deterministic, but NULL Names Would Silently Sort to the End

**File:** `src/db/queries/tunes.ts:11-17`

**Issue:** `tunes.name` is declared `.notNull().unique()`, so null ordering is not an issue in practice. However, `fetchTuneIds` orders by `tunes.id` (serial, insertion order) while `fetchAllTunes` orders by `name` (alphabetical). The `generateStaticParams` in the tune detail page calls `fetchTuneIds` — so static page IDs are in insertion order, which is fine. But if a consumer expects `fetchTuneIds` and `fetchAllTunes` to be in the same order (e.g., a "next tune" link), they diverge. This is an API contract inconsistency, not a current bug.

---

### IN-04: `toEmbedUrl` Regex Does Not Anchor the Video ID Pattern — Accepts Malformed IDs

**File:** `src/lib/youtube.ts:7-10`

**Issue:** The regex `url.match(/youtu\.be\/([\w-]+)/)` will match `youtu.be/abc123?si=xyz` and extract `abc123` — correct. But it will also match a URL like `https://notreally.youtu.be/abc123` (subdomain spoofing) because the pattern does not check the protocol or full host. Similarly, `[?&]v=([\w-]+)` would match `evil.com/?v=abc123`. In practice the URLs come from a curated Airtable database, so the risk is low — but if `youtubeUrl` is ever user-supplied (Phase 5 precentor portal), these patterns become exploitable.

**Fix:**
```typescript
export function toEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0]
      if (/^[\w-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`
    }
    if (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'youtube.com') {
      const id = parsed.searchParams.get('v')
      if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`
    }
  } catch { /* invalid URL */ }
  return null
}
```

---

_Reviewed: 2026-05-08_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
