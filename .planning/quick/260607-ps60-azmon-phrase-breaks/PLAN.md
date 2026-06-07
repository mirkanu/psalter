---
slug: ps60-azmon-phrase-breaks
phase: quick
status: in_progress
created: 2026-06-07
---

# Fix Ps60 Azmon/Denfield — missing PHRASE_BREAKs + stale melisma_positions

## Problem
Azmon/Denfield's `abc_notation` in DB has no `% PHRASE_BREAK` markers. The
melisma editor auto-injects them via `injectPhraseBreaksAtCounts`, so Live
Preview is correct. NotationRenderer does not inject them, so prod renders the
whole tune as one staff line with garbled lyrics.

`melisma_positions = [[]]` — only 1 phrase entry extracted by migration (because
the original ABC also had no phrase breaks). Must become `[[], [], [], []]` for
4-phrase CM (8.6.8.6) = 8+6+8+6 = 28 notes / 28 syllables.

## Tasks
- [x] Identify PHRASE_BREAK positions (after notes 8, 14, 22)
- [ ] Write DB fix script (update abc_notation + melisma_positions)
- [ ] Run script --apply
- [ ] Rebuild + restart + Playwright verify on prod
- [ ] Commit (atomic)
