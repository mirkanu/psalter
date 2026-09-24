# Inline Staff A+/A− Dynamic Zoom — Design, History, and Future Direction

**Status:** Open / future task. Feature hidden in `staff-inline` view as of 2026-08-26 (commit `b81adbc`) but all machinery preserved on master. To revisit, see *Future directions* at the bottom.

## What it was

A−/A+ controls in the bottom bar of the inline-staff singing view that dynamically split the music into more (A+) or fewer (A−) sub-rows. Goal: let users zoom in to read the lyrics clearly on small screens.

The control exists at `src/components/singing/GlassBottomBar.tsx` and is wired in `SingingView.tsx`. In inline-staff mode it currently drives `rowDelta` (row count). In other chromeless modes (solfège-inline, staff-split, solfege-split) it drives `--staff-base-size` (font size) — that path is unaffected and still useful.

## The twist — why it was set aside in staff-inline

Pressing A+ splits each phrase into multiple sub-rows. The lyric-fit solver then picks the LARGEST font per sub-row that fits without overlapping anything. Counter-intuitively, more rows = LESS horizontal space per row = SMALLER lyrics, not bigger. Users want bigger lyrics for legibility; the feature delivered the opposite.

The compromise that ships today: **default state (A+0) already shows the largest lyrics the solver can fit**; A− has nothing to do (you're already at the floor); A+ makes things smaller. Both controls are now `visibility:hidden` when `viewMode === 'staff'` (`b81adbc`, `b148298`). On all other chromeless modes the buttons remain visible and functional.

## Architecture

### Row count model (`SingingView.tsx`)

- `rowDelta: number` — increments when user presses A+
- Total rows = `phrasesForMeter(meter)` + `rowDelta` (e.g. CM/LM/SM baseline = 4 phrases; A+1 = 5 rows)
- `phrasesForMeter(meter)` enforced as floor — A− disabled at `rowDelta === 0`
- `MAX_ROW_DELTA` caps A+
- `notationBaseSize` (default 13, matches `MOBILE_DEFAULT_SIZE_CHROMELESS`) drives the abcjs STAFF scale separately and is never touched by A+/A−

### Distribution: LPT (Longest Processing Time)

When `rowDelta > 0`, each phrase must distribute its notes/syllables across multiple rows. The scheduler lives in `src/lib/distribute-notes-to-substaffs.ts` and `src/lib/distribute-measures-to-substaffs.ts`. The strategy evolved over five fix commits:

1. `f96c4b0` — round-robin entry order for LPT distribution
2. `6ad81e1` — LPT sorts entries by note count before assignment (balance workloads)
3. `d5f486b` — rotate LPT offset so row 0 loses syllables at each A+ (distribute evenly across sub-rows, not just pack row 0)
4. `9d81be5` — per-note LPT distribution + `\` continuation for A+ zoom; per-measure note tokenisation in `tokenizeNotes.ts`
5. `4670a79` — inject `%%staffsep 30` before every sub-staff in flatten path (abcjs needs explicit separator, otherwise sub-staves collapse)

### Flatten path

When `rowDelta > 0`, the renderer flattens multiple sub-staves into a single SVG with explicit `\` continuation characters and `%%staffsep` directives. The conditional lives in `NotationRenderer.tsx` (see the `behaviour at NotationRenderer.tsx:1454+1465` note in `4670a79`).

### Melisma / slur handling (orthogonal to LPT)

Per `lyric-to-note-alignment.md`: melisma = slur (staff/MusicXML) = underline (solfège) = `_` (ABC w-line). The zoom path introduced native abcjs slur syntax `(...)` with a series of fixes:

- `ab1031d` — draw melisma slurs via abcjs native `(...)` syntax
- `1d477d6` — draw slur arc above each melisma note group
- `2585632` — melisma slur arcs in flatten (A+) path + fix empty `()` bug
- `99ee3b6` — A+1 lyric overlap + massive slur arc on flatten path
- `966fa20` — skip slur-wrap around chord-like bare-pitch pairs at A+ zoom
- `fcf04b6` — strip trailing unmatched `(` instead of closing at end
- `1c16107` — close unclosed slur at chunk end to prevent tie arc
- `2295f14` — suppress cross-system slur reopen — abcjs renders tie at line edge
- `59442e6` — strip abcjs tie marks (`-`) from flatten-path notes
- `588b2f6` — remove `%%stretchlast` from flatten path — its tie paths look like slurs

### Lyric-fit solver

The solver runs on every chromeless viewport (`bb485e8`) and picks the largest font per row that fits without overlapping anything. iOS Safari needed:

- `LYRIC_SCALE` bump dropped in favour of solver-driven sizing (`61c93e3`)
- `rowSpacing` tuned for verse gaps on mobile (`55adac2`, `3ec2658`, `abb67bb`, `6ec4d98`); `6ec4d98` was later reverted (`09d7166`) because it pushed verses off-screen
- iOS Safari tspan absolute-y post-process required (`3ec2658`, `abb67bb`) — abcjs hardcodes `dy="1.2em"` on lyric tspans

## The commit trail (chronological, zoom-related)

| Commit | One-line |
|---|---|
| `c2b5b3a` | fill staff not fit-staff at A+1+; cap to A+3 |
| `61c93e3` | drop `LYRIC_SCALE` bump; let solver drive font |
| `1d477d6` | draw slur arc above each melisma note group |
| `ab1031d` | draw melisma slurs via abcjs native `(...)` syntax |
| `2585632` | melisma slur arcs in flatten (A+) path + fix empty `()` bug |
| `99ee3b6` | A+1 lyric overlap + massive slur arc on flatten path |
| `588b2f6` | remove `%%stretchlast` from flatten path — tie paths look like slurs |
| `59442e6` | strip abcjs tie marks (`-`) from flatten-path notes |
| `1c16107` | close unclosed slur at chunk end to prevent tie arc |
| `2295f14` | suppress cross-system slur reopen — abcjs renders tie at line edge |
| `fcf04b6` | strip trailing unmatched `(` instead of closing at end |
| `966fa20` | skip slur-wrap around chord-like bare-pitch pairs at A+ zoom |
| `6ec4d98` | widen lyrics gap + verse spacing on mobile (later reverted) |
| `abb67bb` | use absolute y coords for verse tspan spacing on iOS Safari |
| `55adac2` | bump lyric-fit `rowSpacing` 1.1em → 1.55em for verse gaps |
| `3ec2658` | restore tspan absolute-y post-process for verse gaps |
| `bd97ef3` | phrase-bound distribution with overflow split |
| `09d7166` | Revert `6ec4d98` |
| `bb485e8` | run lyric-fit solver on all chromeless viewports |
| `f96c4b0` | round-robin entry order for LPT distribution |
| `6ad81e1` | LPT now sorts entries by note count before assignment |
| `d5f486b` | rotate LPT offset so row 0 loses syllables at each A+ |
| `9d81be5` | per-note LPT distribution + `\` continuation for A+ zoom |
| `4670a79` | inject `%%staffsep 30` before every sub-staff in flatten path |
| `b81adbc` | hide A−/A+ in staff-inline + bump default lyric size |
| `b148298` | keep bar centred when A−/A+ hidden in staff-inline |

## Related research and memory

- `.planning/research/lyric-to-note-alignment.md` — canonical alignment reference (melisma, slur, `_`)
- `.planning/research/tonic-solfa-notation.md` — solfège syntax (underlines, octave subscripts)
- `.planning/research/scottish-psalter-structure.md` — meter taxonomy (drives `phrasesForMeter`)
- `feedback-inline-staff-a-plus-semantics` — A+/A− drives ROW count, not font size
- `feedback-abcjs-vocalspace` — `%%vocalspace N` shifts lyric gap by exactly +1.333·N px
- `feedback-abcjs-lyric-tspan-dy` — post-process tspan y, remove `dy`
- `feedback-abcjs-lyric-overlap-cap` — skip overlap cap at `rowDelta=0`
- `feedback-abcjs-backslash-w-line` — `\` eats next `w:` line
- `feedback-abcjs-glued-notes` — split-on-whitespace drops 75% of notes; use note-head regex
- `feedback-abcjs-bare-pitch-slur` — bare-pitch `( f' c' )` slur leaves unclosed tie ellipse

## Code reference

### Files where the machinery lives (still on master)

- `src/components/singing/GlassBottomBar.tsx` — A−/A+ buttons, `hideZoom` prop, `visibility:hidden` when hidden
- `src/components/singing/SingingView.tsx` — `rowDelta`, `phrasesForMeter`, `handleBaseSizeChange`
- `src/components/notation/NotationRenderer.tsx` — flatten path, `%%staffsep` injection, slur rendering, lyric-fit solver
- `src/components/notation/tokenizeNotes.ts` — per-measure note tokenisation
- `src/components/notation/tokenizeMeasures.ts` — measure tokenisation
- `src/components/notation/splitMusicIntoSubLines.ts` — sub-line splitting
- `src/components/notation/splitWLineByNoteCounts.ts` — w-line splitting
- `src/lib/distribute-notes-to-substaffs.ts` — per-note LPT scheduler (added in `9d81be5`)
- `src/lib/distribute-measures-to-substaffs.ts` — measure distribution (added in `d5f486b`)

### Archive branch

`archive/inline-staff-zoom` — points at `e14f59f`, the last commit where the zoom feature was fully active in `staff-inline` (before `b81adbc` hid the buttons). Check it out to see the code as users experienced it during the peak of the work:

```sh
git fetch origin archive/inline-staff-zoom
git checkout archive/inline-staff-zoom
```

## Future directions (if revisited)

1. **Re-aim A+/A− at font size** — bypass `rowDelta`, drive `notationBaseSize` directly. Simple but the lyric solver already picks max-fitting font at A+0, so users may see little benefit unless we relax the no-overlap guarantee (allow tiny overlap on small screens?).

2. **Vertical note-spacing zoom** — A+/A− drives `%%staffsep` instead of font size. Users see more notes per row at higher A+; vertical density rises. Helps users who know the tune but want to verify specific notes.

3. **Pinch-to-zoom on mobile** — iOS Safari supports it natively via `user-scalable` viewport, but conflicts with desktop UX. Would need a mobile-only gate.

4. **Per-row controls** — let users choose which phrases get split instead of a global A+/A−. Useful for psalms where one dense verse needs extra room but the rest are fine.

5. **Reverse the LPT distribution at high A+** — at A+3+ on long psalms, the longest phrases overflow the bottom of the viewport. Reverse the offset so late phrases pack the syllables instead of early phrases (matches reading direction).

6. **Two-axis zoom** — combine A+/A− for note density with a separate control for lyric font size. More UI but lets users optimise independently.

7. **Relax overlap guarantee for small screens** — only the iPhone-sized viewports have overlap trouble. Allow `getBBox` overlap up to ~2px on viewports ≤ 375px, keeping zero-overlap on tablets and desktop.

## Origin

This document was created on 2026-08-26 after the user (tester with iOS Private tab on iPhone) confirmed the feature did the opposite of what users want — A+ made lyrics smaller, not bigger — and decided to set the feature aside while keeping the machinery intact for future revisit. GitHub Issue will link to this doc.
