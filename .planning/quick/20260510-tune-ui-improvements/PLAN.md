---
slug: tune-ui-improvements
title: Tune UI improvements — hamburger width, multi-page images, tune detail overhaul, mobile autoplay
status: in-progress
---

## Tasks

### T1: Hamburger menu — reduce width
- SiteHeader.tsx: change SheetContent `w-64` → `w-48`

### T2: Multi-page tune support
- Tune detail page currently only shows `scoreJpgUrl` (single image)
- `tunes.additionalScoreUrls` (jsonb) holds extra pages (2nd, 3rd, …)
- Create `TuneScoreGallery` client component:
  - Accepts `pages: string[]` (combined scoreJpgUrl + additionalScoreUrls)
  - Shows overlaid ←/→ arrows when multiple pages
  - Always starts on page 1 (primary image first)
- Wire into tune detail page for both Staff and Solfege images

### T3: Tune detail page overhaul
- **Staff/Solfege tabs + play button** — new `TuneDetailClient` component matching psalm view
- **Remove lyrics** — no stanzas shown by default
- **Enriched metadata** (hide empty fields):
  - Meter (prominently, near the h1)
  - Mood (from tuneMoods relation)
  - # in RP Psalter (numberIn1979RpPsalter)
  - # in PR/PRCA Psalter (numInPrcaPsalter)
  - Precenting comments (precentingComment)
  - Famous Hymn (famousHymn, only if hasFamousHymn)
- **"Select Psalm" button** after "Psalms using this tune" section
  - Modal search filtered to same meter (reuse fetchTunesByMeter logic but for psalms)
  - Clicking a psalm navigates to `/psalms/{id}`
  - Similar UI to ChangeTuneDialog

### T4: YouTube autoplay on mobile
- PsalmNotationPlayer.tsx + TuneAudioPlayer.tsx:
  - Change YouTube src from `?autoplay=1` → `?autoplay=1&mute=1`
  - Allows mobile browsers to honor autoplay; user can unmute via player controls
