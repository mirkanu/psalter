---
slug: ui-improvements-batch2
title: UI Improvements Batch 2
date: 2026-05-10
status: in-progress
---

# UI Improvements Batch 2

Seven UI improvements across multiple components.

## Tasks

### T1: Tune image fullscreen modal
**File:** `src/components/TuneScoreGallery.tsx`
- Add click handler to the image container opening a full-screen modal/dialog
- Use shadcn Dialog or a simple fixed overlay with backdrop
- X button in top-right to close
- Show full-size image with object-contain
- Also support keyboard close (Escape key via dialog)

### T2: Tune name hyperlink in psalm detail
**File:** `src/components/PsalmTabs.tsx`
- `BackupTunesContent` at line ~308: wrap `{tune.name}` in `<Link href={/tunes/${tune.id}}>`
- Style as a hover underline link (text-foreground hover:underline)

### T3: Filter auto-expand / collapse
**Files:** `src/components/PsalmListingGrid.tsx`, `src/components/TuneTable.tsx`
- When any advanced filter is active (hasAdvancedFilter=true), force advancedOpen to true via useEffect
- When clearAdvanced() is called, also setAdvancedOpen(false)
- Same pattern in both components

### T4: Sticky lyrics in psalm detail (desktop + mobile)
**File:** `src/components/PsalmTabs.tsx`

Desktop (≥md):
- The two-column grid becomes `sticky top-14` with `h-[calc(100vh-3.5rem)] overflow-hidden`
- Each column gets `overflow-y-auto h-full` so contents scroll independently
- Left col = score + lyrics; right col = overview/tabs

Mobile (<md):
- Make the tabs row `sticky top-14 z-10 bg-background` 
- The tab content area gets `overflow-y-auto` with max-height to allow scrolling

### T5: SoundCloud URL column in /tunes
**Files:** `src/components/TuneTable.tsx`, `src/db/queries/tunes.ts`

- Verify `soundcloudUrl` is already fetched in `fetchAllTunes` (check the query)
- Add `soundcloudUrl: string | null` to `TuneRow` interface in TuneTable.tsx
- Pass soundcloudUrl from tunes page → TuneTable  
- Add "Recording" as a visible column with checkbox toggle in Advanced Filters
- Render as SoundCloud link icon/badge when present
- Add sort-by-column selector (select which column to sort by: Tune Name, Meter, RP#, PRCA#, Recording, etc.)

### T6: Global search
**Files:** New `src/components/GlobalSearch.tsx`, `src/components/SiteHeader.tsx`, new `src/app/api/search/route.ts`

GlobalSearch modal:
- Triggered by magnifying glass icon in header
- Search input "Find psalms or tunes..."
- Returns psalms (by number, first line, lyrics) and tunes (by name)
- Psalm results show: psalm number badge + first line snippet (if match in lyrics, show that portion)
- Tune results show: music note icon + tune name
- Press Enter → navigate to top result
- Click result → navigate
- Typing "45" shows psalm 45a first (recommended), then 45b
- Distinguish psalm vs tune with different icons (e.g. BookOpen for psalms, Music for tunes)

SiteHeader changes:
- Add Search icon button to right of nav links (desktop: before hamburger area logic)
- On mobile: show search icon VISIBLE to the LEFT of the hamburger (not inside sheet)
- Use `useState` for searchOpen in header, render `<GlobalSearch>` modal

API route `/api/search?q=...`:
- Query psalms by: number match, firstLine ILIKE, lyrics ILIKE, kjvExcerpt ILIKE
- Query tunes by: name ILIKE
- Return JSON `{ psalms: [...], tunes: [...] }`
- Psalm results include: id, displayLabel, slug, firstLine, snippet (matched portion)
- Tune results include: id, name, meter

### T7: Tune detail psalms section rearrangement
**Files:** `src/components/PsalmsByTuneSection.tsx`, `src/app/tunes/[id]/page.tsx`, `src/db/queries/tunes.ts`

- Update `fetchTuneDetail` to include `isPrimary` in psalmVersionTunes columns
- In tune page: separate psalmList into `recommendedPsalms` (isPrimary=true) and `otherPsalms`
- Update `PsalmsByTuneSection` props to accept `recommendedPsalms` + `otherPsalms`
- New layout:
  - Heading: "Sing this tune"
  - If recommendedPsalms.length > 0:
    - Row: "Recommended Psalms" label + "Select different tune" button (right)
    - Cards grid of recommended psalms
    - Below: "Other psalms using this tune" + otherPsalms cards (if any)
  - If no recommendedPsalms: just "Select Psalm" button below heading
- Remove old "Psalms using this tune" heading; use new structure

## Commit order

Each task gets its own atomic commit:
1. `feat(tunes): fullscreen modal for score images`
2. `feat(psalms): hyperlink tune name to tune detail`
3. `fix(filters): auto-expand when active, collapse on clear`
4. `feat(psalms): sticky lyrics layout on desktop and mobile`
5. `feat(tunes): SoundCloud column, column visibility, sort selector`
6. `feat(search): global search modal with psalm and tune results`
7. `feat(tunes): rearrange psalms section as Sing This Tune`
