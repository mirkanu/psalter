---
title: Fix verse-initial letters not capitalizing in lyrics
date: 2026-07-16
priority: medium
---

## Problem

Surfaced during exploration of mobile inline staff optimization (Phase 4.9.15): the first letter of each verse's lyrics is not capitalised where it should be. This appeared alongside the missing-verse-numbers bug in inline staff view, but is likely a separate lyrics-data or rendering issue (not a numbering bug) — worth its own quick investigation rather than folding into the staff-layout work.

## Next step

Locate where verse text is rendered/derived (lyrics-only view, split-leaf, inline staff) and check whether capitalization is expected to come from source data or should be applied at render time.
