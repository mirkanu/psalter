---
slug: tunes-table-overhaul
status: in-progress
created: 2026-05-10
---

# Tunes Table Overhaul + Psalms Enhancements

## Goal
Overhaul /tunes page to match cprc.co.uk/tunes, add recommended-tune filter to /psalms, add CSV download to both pages.

## Tasks

### 1. DB: add missing tune columns
- Add `in_prca_psalter`, `has_famous_hymn`, `famous_hymn`, `number_in_1979_rp_psalter`, `num_in_prca_psalter` to tunes table via ALTER TABLE

### 2. Backfill from Airtable
- Write inline script to pull these 5 fields from Airtable and UPDATE tunes rows by airtable_id

### 3. Update schema.ts + fetchAllTunes query
- Add new column definitions to schema
- Update fetchAllTunes to include new fields, sort by psalm count DESC, filter placeholder tunes

### 4. New TuneTable component (replaces TuneGrid)
- Table with columns: Tune Name, Meter, Recommended Psalms, Mood, # 1979 RP Psalter, # 1912 PRCA Psalter, Famous Hymn
- Search input (tune name or psalter number)
- Advanced Filters: Mood dropdown, Meter dropdown, In PRCA checkbox, Well-Known Hymn checkbox
- SoundCloud hero box
- Download CSV button
- Sort by psalm count desc

### 5. /tunes page.tsx: use TuneTable

### 6. /psalms page.tsx: add recommended tune join

### 7. PsalmListingGrid: add Show Recommended Tune checkbox + Download CSV

### 8. PsalmNumberBox: support recommendedTune prop
