---
phase: 02-public-browse
fixed_at: 2026-05-08T07:45:00Z
review_path: .planning/phases/02-public-browse/02-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-05-08
**Source review:** `.planning/phases/02-public-browse/02-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 10 (3 Critical + 7 Warning)
- Fixed: 10
- Skipped: 0

## Fixed Issues

### CR-01: Open Redirect / SSRF Vector — Unvalidated youtubeUrl rendered as anchor

**Files modified:** `src/app/tunes/[id]/page.tsx`
**Commit:** `45b7fdd`
**Applied fix:** Added `isSafeExternalUrl()` helper inside `TunePage` that uses `new URL()` to parse the URL and rejects any protocol that is not `http:` or `https:`. The `isOtherMedia` guard now requires `isSafeExternalUrl(youtubeUrl)` to be true before rendering the anchor, blocking `javascript:` and `data:` URIs.

---

### CR-02: Off-by-One in getDayOfYear — Wrong Day on DST Transitions

**Files modified:** `src/lib/daily.ts`
**Commit:** `b5b5197`
**Applied fix:** Rewrote `getDayOfYear` to use `Date.UTC()` arithmetic. The new implementation computes `startOfYear = Date.UTC(year, 0, 1)` and `dayMs = Date.UTC(year, date.getMonth(), date.getDate())`, then derives the day from the difference in milliseconds. This is immune to DST transitions because UTC timestamps do not shift with local timezone changes.

---

### CR-03: useSearchParams Without Proper Suspense Isolation — Static Rendering Opt-Out

**Files modified:** `src/components/PsalmTabs.tsx`
**Commit:** `15e63a5`
**Applied fix:** Extracted `useSearchParams`, `useRouter`, and `usePathname` into a new `TabController` child component that renders `null` and only syncs state via callbacks. `PsalmTabs` wraps `<TabController>` in its own internal `<Suspense fallback={null}>`, keeping the `useSearchParams` call isolated. The outer psalm detail page's existing `<Suspense>` now correctly acts as the shell boundary rather than the dynamic boundary. `PsalmTabs` itself uses local `useState` for `activeTab` with "overview" as the server-render default — no hydration mismatch.

---

### WR-01: Hydration Mismatch in TodayCard — Server Renders Day 1, Client Renders Actual Day

**Files modified:** `src/components/TodayCard.tsx`
**Commit:** `63c51be`
**Applied fix:** When `today === null` (i.e., the `useEffect` has not fired yet on the client), the component now renders a neutral skeleton (`animate-pulse h-40` div) instead of day 1's real data. This eliminates the hydration mismatch entirely — the server renders nothing meaningful, and the client fills in the correct day's data after mount.

---

### WR-02: Nullable dayNumber in Schema — Used Without Null Checks

**Files modified:** `src/db/schema.ts`, `scripts/migrate-airtable.ts`
**Commits:** `99761d7`, `d4bcb5a`
**Applied fix:** Added `.notNull()` to `dailyReadings.dayNumber` in the schema to match the actual data invariant (365 entries, each with a day). Updated `scripts/migrate-airtable.ts` to skip records where `Day of the Year` is missing rather than inserting null, satisfying the now-enforced constraint. TypeScript now correctly infers `dayNumber` as `number` (not `number | null`) throughout the codebase. Note: a Drizzle migration will be needed to apply the `NOT NULL` constraint to the existing database column.

---

### WR-03: Double DB Round-Trips in generateMetadata — Two Queries Per Page Render

**Files modified:** `src/db/queries/psalms.ts`, `src/db/queries/tunes.ts`
**Commit:** `1ab9fdb`
**Applied fix:** Wrapped `fetchPsalmDetail` and `fetchTuneDetail` with React's `cache()` function. Both functions are now exported as `const` (named function expressions inside `cache()`) so the type inference for `PsalmDetail` and `TuneDetail` is preserved. Within a single server render pass, `generateMetadata` and the page component now share one cached DB result instead of making two independent queries.

---

### WR-04: Tune Score Image Rendered with Plain img — No Optimisation

**Files modified:** `src/app/tunes/[id]/page.tsx`
**Commit:** `03da0f5`
**Applied fix:** Replaced the `<img>` element (with its `eslint-disable` bypass) with `next/image` `<Image fill>` inside a sized container (`relative w-full max-w-2xl mx-auto aspect-[3/2]`). Score images are served from the same origin (`/tunes/` path in `public/`), so no external domain configuration is needed in `next.config.ts`. Next.js will now lazy-load, generate `srcset`, and serve WebP/AVIF where supported.

---

### WR-05: PsalmSearchWidget Silent Failure on Invalid Input

**Files modified:** `src/components/PsalmSearchWidget.tsx`
**Commit:** `63c5125`
**Applied fix:** Added `error` state and an `<p role="alert">` below the form. When the user submits an empty value, the error reads "Enter a psalm number."; when the value is non-numeric or out of range, it reads "Please enter a number between 1 and 150." The error is cleared on each keystroke. The input also sets `aria-describedby` pointing to the error element when present, ensuring screen readers announce the message.

---

### WR-06: Index-Based React Keys for Section Headings

**Files modified:** `src/components/PsalmTabs.tsx`
**Commit:** `15e63a5` (committed together with CR-03)
**Applied fix:** Changed `psalm.sectionHeadings.map((s, i) => <li key={i} ...>)` to `psalm.sectionHeadings.map((s) => <li key={s.id} ...>)`. Drizzle's relational query selects all columns by default, so `s.id` (the serial PK from the `section_headings` table) is available and provides a stable identity key.

---

## Skipped Issues

None — all 10 in-scope findings were fixed.

---

## Verification

**TypeScript:** `tsc --noEmit` — PASSED (0 errors)
**Tests:** `vitest run` — PASSED (29/29 tests across 5 suites)

---

_Fixed: 2026-05-08_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
