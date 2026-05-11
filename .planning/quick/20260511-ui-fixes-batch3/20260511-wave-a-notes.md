## Wave A — Completed

### Commits
- `4230f86` fix(psalms): mobile sing tab sticky score + tune format (T2, T4)
- `133507a` fix(tunes,search): meter tap tooltip, lyrics search in psalm selector (T5, T7)

### Tasks

**A1 — T2+T4 (PsalmTabs, PsalmNotationPlayer, PsalmNotationPlayerClient)**
WIP files confirmed correct. Fixed mobile Sing TabsContent: removed height-constraining wrapper div, changed call from `makeSingPanel(true)` to `makeSingPanel(false, true)`. Desktop layout unchanged. All three WIP files committed.

**A2 — T5 (TuneTable: meter tooltip)**
Added shadcn/base-ui Tooltip to meter cell. The project uses `@base-ui/react/tooltip` (not Radix) — `TooltipTrigger` does not support `asChild`; used `render={<span />}` prop instead. Removed `title=` attribute from td. Added `openMeterRow` state for tap-to-toggle on mobile.

Deviations:
- [Rule 3 - Missing dep] `src/components/ui/tooltip.tsx` did not exist — installed via `npx shadcn@latest add tooltip`.
- [Rule 2 - Missing] `TooltipProvider` was not in the app layout — created `src/components/Providers.tsx` and wrapped layout body with it. Required for base-ui tooltips to function.

**A3 — T7 (fetchPsalmsByMeter, SelectPsalmDialog, PsalmsByTuneSection)**
Added `lyrics: true` to `fetchPsalmsByMeter` columns. Updated return type and push call to include `lyrics`. Added `lyrics: string | null` to `PsalmOption` interface in SelectPsalmDialog and extended filter to include lyrics match. Updated `psalmsForMeter` prop type in PsalmsByTuneSection to include lyrics.

### TypeScript
Clean — no errors after all changes.
