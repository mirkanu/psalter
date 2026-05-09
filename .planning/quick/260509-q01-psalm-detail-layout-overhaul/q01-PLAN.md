---
quick_id: q01
slug: psalm-detail-layout-overhaul
date: 2026-05-09
status: complete
---

# Quick Task q01: Psalm Detail Layout Overhaul

## Goal

Restructure the single psalm page layout:
1. Reverse header: "Psalm N" becomes bold H1, bibleTitle becomes muted subtitle
2. Mobile: top tab list (Sing first) + sticky bottom nav; Sing tab shows notation
3. Desktop/landscape (≥768px): 50/50 split — notation left, tabs right (Overview default)

## Tasks

### T1: Fix header order in page.tsx
- Swap: H1 = "Psalm {id}", subtitle = bibleTitle
- Remove notation grid and divider (moves to PsalmTabs)

### T2: Restructure PsalmTabs.tsx
- Mobile: Tabs(defaultValue="sing") with top scrollable tab list + sticky bottom nav
- Desktop: hidden md:grid grid-cols-2 — left=SingPanel, right=Tabs(defaultValue="overview")
- Extract shared content into inline components (OverviewContent, DaysContent, etc.)
- Import PsalmNotationPlayerClient directly for the Sing panel
