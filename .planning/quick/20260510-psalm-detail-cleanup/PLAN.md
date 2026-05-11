---
slug: psalm-detail-cleanup
created: 2026-05-10
status: in-progress
---

# Quick Task: Psalm Detail Cleanup

Three improvements to the `/psalms/[id]` page.

---

## Task 1: Remove stanza numbering

**File:** `src/components/PsalmNotationPlayer.tsx`

Remove the `{i + 1}.` stanza number span that appears before each stanza in every lyrics render location. The Scottish Psalter uses verse numbers embedded in the stanza text itself (e.g. "1 A" or "1A" format), so the numeric prefix added by the component is redundant and wrong.

Affected spots (all `{i + 1}.` spans):
- Lyrics-only mode stanza map (~line 181)
- imageOnlyMode full-lyrics section (~line 228)
- Solfège mode full-lyrics section (~line 270)

Remove the entire `<span className="text-xs text-muted-foreground font-mono mr-2">{i + 1}.</span>` element in each location.

Also remove the `counterLabel` stanza counter text from the nav (currently shows "Stanzas 1–4 / 12") — replace it with just the prev/next nav buttons (no label needed since stanza numbers in the text already provide context).

---

## Task 2: Audio play button (lazy-load SC/YT widget)

### New component: `src/components/TuneAudioPlayer.tsx`

```tsx
'use client'
// Props: soundcloudUrl: string | null, youtubeUrl: string | null, tuneName: string
// State: expanded (bool)
// Default: shows a play button row — [▶] "Play recording (lyrics may not match)"
// On click: sets expanded=true, renders the widget with autoplay
// - SoundCloud: iframe with auto_play=true
// - YouTube: iframe with autoplay=1&mute=0
// - If both present, prefer SoundCloud
// - If neither, render nothing
// Attribution visible once expanded (native SC/YT widget shows it)
```

Design:
- Collapsed: `<button>` with a `Play` icon (lucide `Play`) + text "Play recording (lyrics may not match)" in muted style
- Expanded: the widget iframe replaces the button row. Height 96px for SC, 160px for YT (compact embed).
- SC embed params: `auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false`
- YT embed: extract video ID via existing `toEmbedUrl()` util from `@/lib/youtube`, append `?autoplay=1`

### Wire up in `src/components/PsalmTabs.tsx`

In `singPanel`, the existing hardcoded SoundCloud iframe:
```tsx
{primaryTune?.soundcloudUrl && (
  <iframe .../>
)}
```
Replace with:
```tsx
<TuneAudioPlayer
  soundcloudUrl={selectedTune?.soundcloudUrl ?? null}
  youtubeUrl={selectedTune?.youtubeUrl ?? null}
  tuneName={selectedTune?.name ?? ''}
/>
```
(Uses `selectedTune` so it updates when user changes tune — see Task 3)

Note: `youtubeUrl` is already in the tune record (fetched via `with: { tune: true }` in psalm query). Check `PsalmDetail` type — if `youtubeUrl` is missing from the type, it's present in the DB schema so it's already fetched, just not typed. No DB query changes needed.

---

## Task 3: Tune name header + Change Tune dialog

### Prop changes

**`src/components/PsalmNotationPlayerClient.tsx`** — add props:
```ts
tuneMeter: string | null
tuneId: number | null
alternateTunes: AlternateTune[]
onChangeTune: (tune: AlternateTune) => void
```

**`src/components/PsalmNotationPlayer.tsx`** — same new props, plus render tune header.

### New type `AlternateTune`

Define in `src/components/PsalmNotationPlayer.tsx` (or a shared types file):
```ts
export interface AlternateTune {
  id: number
  name: string
  meter: string | null
  abcNotation: string | null
  scoreJpgUrl: string | null
  solfegeJpgUrl: string | null
  soundcloudUrl: string | null
  youtubeUrl: string | null
}
```

### New tune header in `PsalmNotationPlayer.tsx`

Above the Staff/Solfège/Lyrics button row, add:
```tsx
<div className="flex items-center gap-3 flex-wrap">
  <span className="text-sm font-medium text-foreground">
    Tune: {tuneName}{tuneMeter ? ` (${tuneMeter})` : ''}
  </span>
  {alternateTunes.length > 0 && (
    <button onClick={() => setChangeTuneOpen(true)} ...>
      Change Tune
    </button>
  )}
</div>
```

### New component: `src/components/ChangeTuneDialog.tsx`

A shadcn `Dialog` containing:
- Title: "Select a Tune"
- Subtitle: "Showing tunes in {meter} meter"  
- Search `Input` (filters by tune name)
- Grid of tune cards: each shows tune name, meter badge. Clicking selects and closes.
- Currently selected tune highlighted with a ring/border.

```tsx
'use client'
// Props: open, onClose, currentTuneId, tunes: AlternateTune[], onSelect
// State: query (search string)
// Filtered tunes: tunes.filter name includes query (case-insensitive)
```

Use shadcn Dialog, Input, Badge. Tune card: `<button>` with hover state, selected ring.

### Data fetching: `src/db/queries/tunes.ts`

Add `fetchTunesByMeter(meter: string)`:
```ts
export async function fetchTunesByMeter(meter: string): Promise<AlternateTune[]> {
  return db.query.tunes.findMany({
    where: eq(tunes.meter, meter),
    columns: { id: true, name: true, meter: true, abcNotation: true, scoreJpgUrl: true, solfegeJpgUrl: true, soundcloudUrl: true, youtubeUrl: true },
    orderBy: asc(tunes.name),
  })
}
```

### Wire up in `src/app/psalms/[id]/page.tsx`

After fetching `psalm`, derive `primaryMeter` and call `fetchTunesByMeter`. Pass `alternateTunes` to `PsalmTabs`.

### State management in `src/components/PsalmTabs.tsx`

Add `useState<AlternateTune | null>(null)` for `overrideTune`.
`selectedTune = overrideTune ?? primaryTune`

Pass `selectedTune` data (abc, lyrics, scoreJpgUrl, solfegeJpgUrl, tuneName, tuneMeter) to `PsalmNotationPlayerClient`.
Pass `alternateTunes`, `onChangeTune`, `tuneId` to `PsalmNotationPlayerClient`.

When user selects a tune from `ChangeTuneDialog`, set `overrideTune` and close dialog.

---

## Commit plan

1. Task 1: stanza numbering — atomic commit
2. Tasks 2+3: audio player + tune header + change tune — single commit (tightly coupled)
