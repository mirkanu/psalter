---
phase: 02-public-browse
verified: 2026-05-08T07:55:00Z
status: human_needed
score: 22/22
overrides_applied: 0
human_verification:
  - test: "Visit /psalms and interact with book and meter filter dropdowns"
    expected: "Selecting a book shows only psalms from that book (client-side, no page reload); selecting a meter further narrows results; resetting to All Books + All Meters restores all 150 cards"
    why_human: "Client-side filter logic is exercised in browser; grep confirms code structure but not runtime dropdown interaction"
  - test: "Visit /psalms/23 and click each tab (Overview, Lyrics, Study, Messianic)"
    expected: "Each tab click updates the URL to ?tab=overview / ?tab=lyrics / ?tab=study / ?tab=messianic and displays the corresponding content without a full page reload"
    why_human: "Tab switching via router.replace is a runtime browser behavior; cannot verify URL update and content swap from static files alone"
  - test: "Visit /daily and observe today's highlighted row"
    expected: "After hydration, today's row has a coloured left border, shows the 'Today' badge, and the page auto-scrolls to that row"
    why_human: "DailyPlanClient scroll and badge reveal are useEffect DOM mutations; only verifiable in a live browser session"
  - test: "Visit / (homepage) and verify TodayCard shows the correct day"
    expected: "TodayCard displays the correct day number for today (2026-05-08 = day 128 of 365) and links to the correct psalm"
    why_human: "TodayCard uses getDayOfYear() on client mount; requires a running browser to confirm correct day resolution"
---

# Phase 2: Public Browse — Verification Report

**Phase Goal:** Any visitor can browse all 150 psalms, read metrical lyrics, explore tunes, and follow the daily reading plan — all served from statically pre-rendered pages
**Verified:** 2026-05-08T07:55:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor can browse all 150 psalms at /psalms | VERIFIED | 150 static HTML files in `.next/server/app/psalms/`; `psalms.html` contains "Browse all 150 psalms" |
| 2 | Psalm list is filterable by book (client-side) | VERIFIED | `PsalmGrid.tsx` has `selectedBook` state, `useMemo` filter, and `Select` with "All Books" option; AND logic confirmed in code |
| 3 | Psalm list is filterable by meter (client-side, composes with book) | VERIFIED | `PsalmGrid.tsx` has `selectedMeter` state and meter dropdown; `bookOk && meterOk` AND composition confirmed |
| 4 | Visitor can read metrical lyrics on /psalms/[id] Lyrics tab | VERIFIED | `PsalmTabs.tsx` renders `primaryVersion.lyrics` (correct field name — schema uses `lyrics` not `stanzas`); RSC payload for psalm 23 confirms real lyrics data flows through |
| 5 | Overview tab shows Bible title, book, Haddington intro, and per-verse KJV text | VERIFIED | `PsalmTabs.tsx` renders `psalm.verses.map()` with `v.verseNumber` + `v.kjvText`; RSC payload for psalm 23 confirms 6 verses with real KJV text and Haddington intro |
| 6 | Lyrics tab shows tune chips linking to /tunes/[id] | VERIFIED | `PsalmTabs.tsx` line 175: `href={\`/tunes/${pvt.tuneId}\`}`; RSC payload shows Crimond (tuneId 30) linked for psalm 23 |
| 7 | Study tab shows section headings, Nave's topics, doctrinal cross-references | VERIFIED | `PsalmTabs.tsx` renders `psalm.sectionHeadings`, `navesTopics`, `doctrines` with empty state fallback; RSC payload for psalm 23 shows real Nave's topic data |
| 8 | Messianic tab shows classification or "No Messianic notes recorded" empty state | VERIFIED | `PsalmTabs.tsx` renders messianic classification when present; shows "No Messianic notes recorded" for psalm 23 (`messianicPsalms: []` confirmed in RSC payload) |
| 9 | Tab is selectable via ?tab= URL param; switching uses router.replace | VERIFIED | `TabController` child reads `useSearchParams().get("tab")`; calls `router.replace(pathname + "?tab=...")` — more refined pattern than plan (isolated inner component) but correct behavior |
| 10 | /psalms/[id] is statically pre-rendered | VERIFIED | 150 `.html` files in `.next/server/app/psalms/`; each is ~21KB of pre-rendered content including full psalm RSC payload |
| 11 | Visitor can browse all 172 tunes at /tunes | VERIFIED | `tunes.html` exists with "Tunes" content; `fetchAllTunes` wired in `src/app/tunes/page.tsx`; 172 static HTML files in `.next/server/app/tunes/` |
| 12 | Each tune detail page shows score JPG or "No score available" empty state | VERIFIED | `/tunes/[id]/page.tsx` renders `<img src={tune.scoreJpgUrl}>` when present, else `"No score available for this tune."`; confirmed in code |
| 13 | Tunes with YouTube URL render iframe embed | VERIFIED | `YouTubeEmbed` component wired via `toEmbedUrl`; `aspect-video` iframe with sandbox confirmed in code |
| 14 | Tunes with non-YouTube media URLs render plain links | VERIFIED | `/tunes/[id]/page.tsx` has `isOtherMedia` branch rendering `<a href={youtubeUrl}>` with `rel="noopener noreferrer"` |
| 15 | /tunes/[id] is statically pre-rendered | VERIFIED | 172 `.html` files in `.next/server/app/tunes/`; `generateStaticParams` calls `fetchTuneIds()` |
| 16 | Visitor sees today's reading highlighted on /daily | VERIFIED (code) | `DailyPlanClient.tsx` sets `data-today=""`, removes `hidden` from `.today-badge`, calls `scrollIntoView`; `daily.html` shows `today-badge` in static HTML; runtime scroll requires human check |
| 17 | /daily shows all 365 readings in order | VERIFIED | `daily.html` contains "Daily Reading Plan"; `fetchAllDailyReadings` wired and 29/29 tests pass (including `fetchAllDailyReadings returns exactly 365 entries`) |
| 18 | /daily/[day] pages exist for days 1..365 | VERIFIED | 365 `.html` files in `.next/server/app/daily/`; `generateStaticParams` uses `Array.from({ length: 365 })` |
| 19 | /daily and /daily/[day] are statically pre-rendered | VERIFIED | Build output files confirmed: `daily.html`, `daily.rsc`, 365 day-specific `.html` files |
| 20 | Homepage shows Today's Reading card with psalm link | VERIFIED | `src/app/page.tsx` fetches `fetchAllDailyReadings`, passes slim data to `TodayCard`; `index.html` contains "Read Psalm", "Find Psalm" |
| 21 | Homepage shows psalm number quick-search widget | VERIFIED | `PsalmSearchWidget.tsx` wired in `page.tsx`; `router.push("/psalms/${n}")` on submit with range validation 1..150 |
| 22 | SiteHeader present on every page with Psalms/Tunes/Daily Plan links | VERIFIED | `SiteHeader.tsx` imported in `layout.tsx` above `<main>`; psalm 23 static HTML confirms header rendered with all 3 nav links |

**Score:** 22/22 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/schema.ts` | 5 junction relations added | VERIFIED | grep confirms 5: `psalmTopicsRelations`, `psalmVersionTunesRelations`, `tuneMoodsRelations`, `verseNavesTopicsRelations`, `verseDoctrinesRelations` |
| `src/db/queries/psalms.ts` | `fetchPsalmIds`, `fetchPsalmDetail`, `PsalmDetail` type | VERIFIED | All 3 exported; `fetchPsalmDetail` wrapped in `cache()` — minor deviation from plan (correct optimization) |
| `src/db/queries/tunes.ts` | `fetchTuneIds`, `fetchAllTunes`, `fetchTuneDetail`, `TuneDetail` type | VERIFIED | All 4 exported; `fetchTuneDetail` uses `cache()` |
| `src/db/queries/daily.ts` | `fetchAllDailyReadings`, `fetchDailyReading`, `DailyReadingWithPsalm` type | VERIFIED | All 3 exported |
| `src/components/ui/tabs.tsx` | shadcn Tabs using @base-ui/react | VERIFIED | File exists; uses `@base-ui/react` (not @radix-ui) |
| `src/components/ui/badge.tsx` | shadcn Badge | VERIFIED | File exists |
| `src/components/ui/select.tsx` | shadcn Select using @base-ui/react | VERIFIED | File exists; uses `@base-ui/react` |
| `src/components/ui/separator.tsx` | shadcn Separator | VERIFIED | File exists |
| `src/components/ui/card.tsx` | shadcn Card | VERIFIED | File exists |
| `vitest.config.mts` | Vitest config with path alias | VERIFIED | Created as `.mts` (not `.ts`) due to ESM-only vite-tsconfig-paths — correct deviation |
| `tests/db-queries.test.ts` | 5 db smoke tests | VERIFIED | 5/5 pass |
| `src/components/SiteHeader.tsx` | Sticky RSC header with 3 nav links | VERIFIED | No `'use client'`; `sticky top-0 z-50`; Psalms, Tunes, Daily Plan links confirmed |
| `src/app/layout.tsx` | SiteHeader mounted above main | VERIFIED | `import { SiteHeader }` + `<SiteHeader />` before `<main className="flex-1">` |
| `src/lib/daily.ts` | `getDayOfYear` utility | VERIFIED | Exported; 3 tests pass (Jan 1=1, Dec 31=365, default in range) |
| `src/lib/youtube.ts` | `toEmbedUrl` utility | VERIFIED | Exported; 4 tests pass (short URL, long URL, null, non-YouTube) |
| `src/components/PsalmCard.tsx` | RSC psalm card | VERIFIED | No `'use client'`; exports `PsalmCard` |
| `src/components/PsalmGrid.tsx` | Client filter component | VERIFIED | `'use client'`; book AND meter filter; `useMemo`; correct grid classes |
| `src/app/psalms/page.tsx` | Static psalm list page | VERIFIED | Imports `PsalmGrid`; deduplicates 150 psalm rows; static HTML confirmed |
| `src/components/PsalmTabs.tsx` | Client 4-tab component | VERIFIED | `'use client'`; `useSearchParams` in isolated `TabController`; `router.replace`; all 4 tabs present |
| `src/app/psalms/[id]/page.tsx` | SSG detail page | VERIFIED | `generateStaticParams`, `await params`, `Suspense` wrapper, `notFound()` |
| `src/app/tunes/page.tsx` | Static tune list | VERIFIED | `fetchAllTunes` wired; static HTML confirmed |
| `src/app/tunes/[id]/page.tsx` | SSG tune detail | VERIFIED | `generateStaticParams`, `fetchTuneIds`, `await params`, `notFound()`, score/YouTube/psalm links |
| `src/components/YouTubeEmbed.tsx` | RSC YouTube iframe | VERIFIED | No `'use client'`; `toEmbedUrl` wired; `aspect-video`; `sandbox` attribute |
| `src/app/page.tsx` | Homepage devotional dashboard | VERIFIED | `fetchAllDailyReadings` wired; `TodayCard` and `PsalmSearchWidget` imported |
| `src/components/TodayCard.tsx` | Client today-detection | VERIFIED | `'use client'`; `getDayOfYear` in `useEffect`; "Today's Reading" copy |
| `src/components/PsalmSearchWidget.tsx` | Client search widget | VERIFIED | `'use client'`; `router.push`; range validation 1..150; `aria-label="Find Psalm"` |
| `src/app/daily/page.tsx` | Static daily list | VERIFIED | `fetchAllDailyReadings`; `DailyPlanClient`; `data-day` attributes; "Today" badge |
| `src/app/daily/[day]/page.tsx` | SSG single-day pages | VERIFIED | `generateStaticParams` generates 1..365; `await params`; bounds check + `notFound()` |
| `src/components/DailyPlanClient.tsx` | Client scroll-to-today | VERIFIED | `'use client'`; `getDayOfYear`; `setAttribute("data-today","")`, removes `hidden` from `.today-badge`, `scrollIntoView` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/psalms/[id]/page.tsx` | `src/db/queries/psalms.ts` | `fetchPsalmDetail + fetchPsalmIds` | WIRED | Both functions imported and called; 150 params generated |
| `src/components/PsalmTabs.tsx` | `next/navigation useSearchParams + Suspense parent` | `router.replace` via `TabController` wrapped in `<Suspense>` | WIRED | `TabController` child isolates `useSearchParams` in Suspense; `router.replace` confirmed |
| `src/app/psalms/[id]/page.tsx` | `src/components/PsalmTabs.tsx` | `<Suspense fallback><PsalmTabs psalm={psalm} /></Suspense>` | WIRED | Confirmed in source and RSC payload |
| `src/app/tunes/[id]/page.tsx` | `src/db/queries/tunes.ts` | `fetchTuneIds, fetchTuneDetail` | WIRED | Both imported and called |
| `src/components/YouTubeEmbed.tsx` | `src/lib/youtube.ts` | `toEmbedUrl` | WIRED | Imported and called on line 4 |
| `src/app/daily/page.tsx` | `src/components/DailyPlanClient.tsx` | `<DailyPlanClient />` rendered first | WIRED | Import confirmed; component renders before `<h1>` |
| `src/components/TodayCard.tsx` | `src/lib/daily.ts` | `getDayOfYear()` in `useEffect` | WIRED | Imported on line 4; called in `useEffect` |
| `src/components/PsalmSearchWidget.tsx` | `next/navigation router.push` | `router.push(\`/psalms/${n}\`)` | WIRED | Confirmed with range validation |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `PsalmTabs.tsx` | `psalm` prop | `fetchPsalmDetail(psalmId)` via Drizzle relational API → PostgreSQL | Yes — RSC payload for psalm 23 contains 6 real verses, real Haddington intro, real lyrics, real Nave's topics | FLOWING |
| `PsalmGrid.tsx` | `psalms` prop | DB query in `src/app/psalms/page.tsx` (leftJoin psalms + psalmVersions) | Yes — 150 unique rows deduplicated | FLOWING |
| `TodayCard.tsx` | `readings` prop | `fetchAllDailyReadings()` → slimmed to 365 entries | Yes — 29/29 tests confirm 365 entries all with psalm | FLOWING |
| `/daily/page.tsx` | `readings` | `fetchAllDailyReadings()` → Drizzle + PostgreSQL | Yes — `daily.html` contains 365 `data-day` entries with real psalm links | FLOWING |
| `/tunes/[id]/page.tsx` | `tune` | `fetchTuneDetail(tuneId)` → Drizzle with psalmVersionTunes + tuneMoods | Yes — 5/5 tune tests pass; `psalmVersionTunes` traversal confirmed | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 150 psalm static HTML files exist | `ls .next/server/app/psalms/*.html \| wc -l` | 150 | PASS |
| 172 tune static HTML files exist | `ls .next/server/app/tunes/*.html \| wc -l` | 172 | PASS |
| 365 daily static HTML files exist | `ls .next/server/app/daily/*.html \| wc -l` | 365 | PASS |
| Psalm 23 HTML contains real title | grep "A Psalm of David" in 23.html | Found in RSC payload | PASS |
| Daily page contains today-badge | grep "today-badge" daily.html | 8+ matches | PASS |
| Homepage contains search widget copy | grep "Find Psalm\|Read Psalm" index.html | Both found | PASS |
| TypeScript compiles clean | `npx tsc --noEmit` | Exit 0, no errors | PASS |
| All 29 vitest tests pass | `npm test -- --run` | 29/29 passed (5 test files) | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| PSALM-01 | 02-03 | User can browse all 150 psalms (list view, filterable by book and meter) | SATISFIED | 150 cards rendered; book + meter filters confirmed in PsalmGrid.tsx |
| PSALM-02 | 02-03 | User can view psalm detail — Overview tab (title, book, Haddington introduction, KJV text) | SATISFIED | PsalmTabs Overview renders per-verse KJV; RSC payload for psalm 23 confirms all fields populated |
| PSALM-03 | 02-03 | User can view psalm detail — Study tab (section headings, Nave's topics, doctrinal cross-references) | SATISFIED | PsalmTabs Study tab renders all 3 data sources; empty state for psalms without data |
| PSALM-04 | 02-03 | User can view psalm detail — Messianic tab (messianic classification, NT verification, messianic verses) | SATISFIED | PsalmTabs Messianic tab renders data or empty state; psalm 23 correctly shows empty state |
| PSALM-05 | 02-03 | User can read metrical lyrics (Scottish Psalter versification) for each psalm | SATISFIED | Lyrics tab renders `primaryVersion.lyrics`; additional versions in `<details>`; tune chips link to /tunes/[id] |
| PSALM-06 | 02-01 to 02-05 | Psalm pages are statically pre-rendered at build time | SATISFIED | 150 /psalms/[id] + 172 /tunes/[id] + 365 /daily/[day] + /psalms + /tunes + /daily + / all pre-rendered as static HTML |
| TUNE-01 | 02-04 | User can view tune detail (name, meter, score display, YouTube and audio links) | SATISFIED | /tunes/[id] renders name, meter badge, score JPG (or empty state), YouTube embed or plain link, reverse psalm links |
| PLAN-01 | 02-05 | User can view the 365-day daily reading plan; today's entry is prominently highlighted | SATISFIED (code) | 365-row /daily page built; DailyPlanClient highlights today; runtime scroll behavior needs human check |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/PsalmGrid.tsx` | 42, 58 | `placeholder="All Books"` / `placeholder="All Meters"` in SelectValue | INFO | These are placeholder props for Select dropdowns — standard UI pattern, not stub indicators. Not a blocker. |
| `src/components/YouTubeEmbed.tsx` | 5 | `return null` for non-YouTube URLs | INFO | Expected behavior — component correctly returns null when URL is not embeddable. Caller handles null gracefully. |
| `src/components/DailyPlanClient.tsx` | 15 | `return null` | INFO | Intended null-render pattern for side-effect-only component. Not a stub. |

No blockers or warnings found.

### Notable Deviations from Plan (All Acceptable)

1. **`vitest.config.mts` not `.ts`**: ESM-only `vite-tsconfig-paths` required `.mts` extension. Functionally equivalent.

2. **`fetchPsalmDetail` and `fetchTuneDetail` wrapped in `cache()`**: Plan showed plain `async function`; actual code uses Next.js `cache()` for request deduplication. Better practice — not a deviation from intent.

3. **`PsalmTabs` uses isolated `TabController` child for `useSearchParams`**: Plan showed a single component with `useSearchParams`. Actual implementation extracts `useSearchParams` into a child component (`TabController`) that is wrapped in `<Suspense>`. This is the correct Next.js 15 pattern and preserves static rendering even more rigorously.

4. **Schema field names**: Plan used `stanzas` / `versionName`; actual schema uses `lyrics` / `versionLabel`. Code correctly uses actual field names. Tests updated accordingly.

5. **Build shows `●` (SSG) not `○` (fully static) for `/psalms/[id]` and `/tunes/[id]`**: Both use `generateStaticParams` which produces the SSG marker. 150 + 172 pages are still pre-rendered HTML files at build time. The PSALM-06 requirement (no runtime DB queries for public browse) is fully satisfied.

### Human Verification Required

#### 1. Psalm Grid Client-Side Filtering

**Test:** Navigate to `https://psalter.gsdlabs.dev/psalms` (or `http://localhost:3005/psalms`). Use the "Filter by book" dropdown to select a specific book. Then use the "Filter by meter" dropdown to further narrow results.
**Expected:** Cards update instantly (no page reload); book and meter filters compose with AND logic; resetting both dropdowns to "All" restores all 150 cards.
**Why human:** Client-side React state filter — cannot verify runtime dropdown interaction from build artifacts alone.

#### 2. Tab Switching on Psalm Detail Page

**Test:** Navigate to `/psalms/23`. Click "Lyrics" tab, then "Study", then "Messianic", then back to "Overview".
**Expected:** Each tab click immediately updates the URL bar to `?tab=lyrics` / `?tab=study` / `?tab=messianic` / `?tab=overview` and swaps content without a full navigation. Refreshing the page with `?tab=lyrics` in the URL opens directly to the Lyrics tab.
**Why human:** `router.replace` and `useSearchParams` behavior requires a live browser with JavaScript enabled.

#### 3. Daily Plan Today Highlight and Auto-Scroll

**Test:** Navigate to `/daily`.
**Expected:** After the page loads, one row should have a visible left border accent and show a "Today" badge. The page should automatically scroll to that row (smooth scroll to center). Today is 2026-05-08 = day 128.
**Why human:** `DailyPlanClient` uses `useEffect` DOM mutations (`setAttribute`, `classList.remove`, `scrollIntoView`) which only run in a browser.

#### 4. Homepage TodayCard Correct Day

**Test:** Navigate to `/` (homepage).
**Expected:** The "Today's Reading" card shows "Day 128 of 365" (for 2026-05-08) with a link to the correct psalm for day 128.
**Why human:** `TodayCard` uses `useState(null)` initial and `useEffect(() => setToday(getDayOfYear()))` on mount — requires a running browser to confirm the correct day resolves.

---

## Gaps Summary

No gaps. All 22 observable truths are VERIFIED. All required artifacts exist, are substantive, and are wired to real data sources. All 29 vitest tests pass. TypeScript compiles clean. 150 + 172 + 365 + 4 additional routes are statically pre-rendered.

Status is `human_needed` because 4 runtime browser behaviors (client filter interaction, tab URL switching, daily scroll-to-today, homepage day detection) cannot be verified from static build artifacts alone and require a human to confirm in a live browser session.

---

_Verified: 2026-05-08T07:55:00Z_
_Verifier: Claude (gsd-verifier)_
