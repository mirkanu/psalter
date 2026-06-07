---
slug: ps6-communion-double-length
phase: quick
status: in_progress
created: 2026-06-07
---

# Fix Ps6 Communion — wrong double_length flag in DB

## Root cause
Communion is an LM tune (32 syllable slots = 1 stanza). Its `double_length=true`
flag groups stanzas in pairs (8 lines/cycle), so `linesPerPhrase=2`. The positions
branch (04.9.12) only reads `cycleLines[0]`, silently dropping `cycleLines[1]` —
every odd-numbered stanza line is missing, causing "lyrics from wrong verse" on prod.

## Fix
Set `double_length=false` for Communion in DB. LM tune → 1 stanza/cycle →
linesPerPhrase=1 → positions branch works correctly.

## Tasks
- [ ] UPDATE tunes SET double_length=false WHERE name='Communion'
- [ ] pm2 restart psalter (no rebuild needed)
- [ ] Playwright verify on prod
- [ ] Commit (atomic)
