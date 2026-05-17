---
quick_id: 260517-cm0
slug: 04.9.4-singing-r3
created: 2026-05-17
completed: 2026-05-17
status: complete
---

# Summary: 04.9.4 singing-view round 3 polish

Twelve of fourteen user-reported items addressed across 4 phases. Two
items intentionally deferred (1c and 1f's SoundCloud half — see "Deferred"
below).

## Phase A — Audio playback bugs

| Item | Fix |
|------|-----|
| **1a** play→pause→play double playback | `onPlay()` defensively tears down any prior synth/timing; `onPause()` switched from `synth.pause()` to `synth.stop()` and nulls refs; end-of-tune callback does the same teardown |
| **1b** first-press-play silently fails | `AbcAudioControls` now tracks `visualObjReady` state and defers controlled-mode `onPlay()` until the hidden visualObj is rendered. A second effect drains the pending play once ready |
| **1d** default BPM | New `DEFAULT_BPM=151` constant; `defaultBpm` no longer derived from ABC `Q:` header. Existing users keep their localStorage override |
| **1e** bottom padding too large | GlassBottomBar `h-14→h-12` mobile / `h-15→h-13` desktop; safe-area-inset clamped to `max(env(...)-8px, 0px)`; mini-bar bottom anchor + SingingView pb adjusted to match |

## Phase B — Lyrics / Solfège views

| Item | Fix |
|------|-----|
| **4a** default font + padding | Wrapper `px-4 pt-4 space-y-4` in chromeless lyrics/solfège views; verse-text size = `1.6×` base, verse-number = `0.85×` base (set via CSS targeted at `[data-notation-body][data-view-mode="lyrics"\|"solfege"]`) |
| **4b** hide stanza nav in non-staff views | SingingView passes `currentStanza={viewMode === 'staff' ? currentStanza : null}` and same for `totalStanzas`. GlassBottomBar already hides the indicator + chevrons when `currentStanza==null` |
| **4c** JPG sizing + A+/A− support | Solfège `<img>` width = `baseSize/20` clamped 0.5–1.0 of container, so default ~70% leaves room for lyrics. Glass bar A+/A− re-flows |
| **1f** play recording in non-staff views | Existing `<TuneAudioPlayer />` (SoundCloud + YouTube) embedded at the top of chromeless lyrics/solfège viewAreas when `youtubeUrl` or `soundcloudUrl` is present. abcjs synth remains as the fallback via the glass bar Play button |

## Phase C — Tour redesign

| Item | Fix |
|------|-----|
| **2A** lighter backdrop | Box-shadow alpha `0.60 → 0.30` |
| **2B** highlighted region not darkened | Removed the full-inset `bg-black/60` overlay; spotlight box-shadow is now the sole dimming mechanism |
| **2C** highlight both arrows on step 1 | `measure()` returns the union bbox across all matching elements; Next arrow gains `data-tour-target="prev-next"` so step 1 covers both arrows. Copy: "Navigate to next/previous psalm" |
| **2D** new step 2 for psalm-label | New step `{target:'psalm-label', copy:'Tap to quickly switch to any psalm'}` |
| **2E** step 3 copy | "Open settings to change views (e.g. lyrics only) and access the study guide" |
| **2F** remove play step | Tour now 3 focused steps |

## Phase D — Stanza-range titles

| Item | Fix |
|------|-----|
| **3** "Psalm 119" → "Ps 119:N-M" | `page.tsx` parses `activeVersion.psalterNumber` for `/^N:start-end/`. Passes `versePartLabel` to SingingView → PsalmTopBar. Title renders as `Ps {id}:{range}`; labels ≥ 12 chars downsize from `text-base` to `text-sm` (e.g. "Ps 119:161-168") |

## Validation

- `/tmp/audit-r3-audio.js` — 8/8 audio assertions pass
- `/tmp/audit-r3-views.js` — 9/9 lyrics/solfège assertions pass
- `/tmp/audit-r3-tour.js` — 9/9 tour assertions pass
- `/tmp/probe-119.js` — visual check of `Ps 119:1-8` / `Ps 119:161-168` (auto-shrunk)
- `npm run build` clean for every iteration
- All three existing UATs (`test-04.9.4-quick`, `-full`, `-study-regression`) still PASS, plus 2 new SC10 / SC11 assertions guarding BPM default + stanza-hidden-in-non-staff

## Deferred (this round)

- **1c** — note highlight on visible staff. AbcAudioControls renders its own hidden visualObj so abcjs's `eventCallback` paints onto an offscreen render. Restoring the highlight on the visible staff requires either (a) sharing AbcPlayer's visualObj with AbcAudioControls (ref handoff across two `'use client'` components that currently lifecycle independently), or (b) moving the synth back into AbcPlayer. Both are substantial refactors beyond a quick task. Tracked for a follow-up session.
- **1f SoundCloud half** — DB has 12/172 `tunes.soundcloud_url` rows; the top entries contain placeholder strings ("Missing, also from youtube", "no good version"). Replaced for now with YouTube embed via the existing `TuneAudioPlayer` component, which already handles both. SoundCloud will plug in automatically once real URLs are populated.

## Commits

- `8491c92` — fix(04.9.4-r3 phase A): audio bugs + default BPM + bottom padding
- `08d8d54` — fix(04.9.4-r3 phase B): lyrics/solfège view polish + inline recording player
- `36d8e50` — fix(04.9.4-r3 phase C): tour redesign — lighter backdrop, 3 focused steps
- `c59bdf4` — fix(04.9.4-r3 phase D): show "Ps 119:N-M" range in singing view topbar
- `ed92f93` — test(04.9.4-r3): update tour assertions (3 steps) + add SC10/SC11
