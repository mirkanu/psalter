---
status: complete
date: 2026-06-14
commit: 9b870b0
description: "5 targeted /explore UI fixes: first-line wrap, verse dedup, float badge, collapsible closed by default, authors horizontal scroll"
---

# Explore Polish Batch 2 — SUMMARY

## What was done

Five targeted fixes to the `/explore` pages, committed atomically as `9b870b0`.

### Fix 1 — topics/[slug]/page.tsx: first-line wraps fully

Changed the psalm list row from a flat flex row (`Link + Badge as siblings`) to a stacked layout inside `flex-1 min-w-0`. The first-line `Link` is now `display: block` and the meter renders as a `<span class="text-xs text-muted-foreground">` below it. Removed the `Badge` import — no longer needed. On mobile, long first-lines now wrap without being squeezed by the meter string.

### Fix 2 — QuotedInNT.tsx + NavesSubTopicList.tsx: verse dedup

Root cause: `entry.quotation` is one string for the entire entry (e.g. `"118:22, 118:23 The stone which..."`). The old code rendered it once per verse, causing duplication.

Fix: added `parseVerseSegments` (splits on `\d+:\d+\s` patterns) and `groupByPsalm` helpers. When all verse numbers parse cleanly to individual texts (`allParsed`), each verse gets its own line. When they don't (the common case where multiple verse refs share one combined text), the quotation renders **once** per psalm group with leading verse-ref prefixes stripped (`/^[\d:,\s]+\s/`). Empty verse-number placeholder lines are suppressed in the fallback path.

Applied identically to both `QuotedInNT.tsx` and `NavesSubTopicList.tsx` (the latter uses `psalmId`/`verseNumber` without a `verseId`).

### Fix 3 — ExploreTabShell.tsx TopicGrid + NavesExpand.tsx: float badge

Changed topic cards from `inline-flex items-start justify-between` to `block` with `float-right ml-2 mt-0.5` on the badge. Topic names now wrap naturally below the badge on narrow cards rather than being squeezed into the remaining space.

### Fix 4 — NavesSubTopicList.tsx: closed by default

Changed `useState(true)` to `useState(false)` in `SubTopicCollapsible`. All sub-topic collapsibles on `/explore/naves/[slug]` pages now start closed.

### Fix 5 — AuthorsTable.tsx: horizontal scroll for author filter

Changed `flex flex-wrap gap-2 mb-4` to `flex gap-2 mb-4 overflow-x-auto pb-1`. Added `whitespace-nowrap shrink-0` to both button className strings. The author filter row now scrolls horizontally on mobile instead of wrapping to multiple lines.

## Files modified

- `src/app/explore/topics/[slug]/page.tsx`
- `src/components/QuotedInNT.tsx`
- `src/components/NavesSubTopicList.tsx`
- `src/components/ExploreTabShell.tsx`
- `src/components/NavesExpand.tsx`
- `src/components/AuthorsTable.tsx`

## Verification

Playwright tests against `https://psalter.gsdlabs.dev` confirmed:

| Fix | Check | Result |
|-----|-------|--------|
| 1 | Link `display: block` in topic psalm list | PASS |
| 2 | Matthew 21:42 expanded: quotation shown once, no duplication | PASS |
| 3 | Topic card has `block` class, `float-right` badge | PASS |
| 4 | 0 open collapsibles on `/explore/naves/god` load | PASS |
| 5 | Filter row has `overflow-x-auto`, no `flex-wrap` | PASS |

## Notes

Fix 2 detail: the DB stores `118:22, 118:23 The stone which...` as a combined quotation (not per-verse). `parseVerseSegments` returns an empty map for this pattern, so `allParsed` is `false` and the fallback path renders the text once with the verse-ref prefix stripped. When data does contain individually-keyed segments, `allParsed` would be `true` and each verse would show its own line.

The build was produced from the worktree at `/data/home/psalter/.claude/worktrees/agent-a348fe00068ed8f9d/` and swapped into `/data/home/psalter/.next` for the live pm2 process.
