---
phase: quick-260713-kkg
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/notation/NotationRenderer.tsx
  - src/components/singing/GearPopover.tsx
autonomous: true
requirements: [KKG-01, KKG-02]

must_haves:
  truths:
    - "In split-leaf singing view, the notation slot shrinks to fit its actual rendered content (SVG or JPG) instead of growing to a fixed 50% — no blank gap appears between the notation and the lyrics, even after scroll-hide reflows <main> to 100dvh."
    - "Notation still never exceeds 50% of the available height; lyrics absorb all remaining space (>=50%), in BOTH staff-split and solfege-split."
    - "The 260712-tmm guarantee holds: the scanned solfège JPG's notation slot never exceeds ~50% of the available height at any width or viewport in chromeless split-leaf; a scan taller than that scrolls within the capped slot (the tmm intent was a capped container, not a never-scroll image)."
    - "The 260712-kov guarantee holds: desktop staff-split renders byte-identical to desktop staff-inline (stacked, uncapped, no scroll region)."
    - "Clicking the Solfege notation button ALWAYS lands on viewMode 'solfege-split', auto-switching the layout to Split-Leaf when the current layout is Inline — it is never grayed out while Staff+Inline is selected (only grayed when the tune has no solfege JPG)."
    - "viewMode 'solfege' (inline solfège) remains unreachable via any button in GearPopover or the chromeless singing view; the Inline layout button still disables/toasts 'coming soon' when Solfège is the active notation (u4q behavior unchanged). (NotationRenderer's own internal viewGroup, used only by non-chromeless callers like /tunes/[id] and /study, still exposes a Solfège button — that path is out of scope for this plan and unchanged.)"
  artifacts:
    - path: "src/components/notation/NotationRenderer.tsx"
      provides: "Asymmetric split-leaf sizing: content-sized notation slot capped at 50%, flex-grow lyrics slot; width-sized JPG in chromeless split (height capped by the slot, not the img)"
      contains: "flex-none"
    - path: "src/components/singing/GearPopover.tsx"
      provides: "Solfege notation button gated purely on solfegeSplitAvailable and always routing to solfege-split"
      contains: "solfege-split"
  key_links:
    - from: "GearPopover.handleNotationChange('solfege')"
      to: "onViewModeChange('solfege-split')"
      via: "unconditional route regardless of current layout"
      pattern: "solfege-split"
    - from: "NotationRenderer.renderSplitLeaf notation slot"
      to: "content-sized flex item"
      via: "flex-none replacing flex-1 (grow removed)"
      pattern: "flex-none min-h-0 max-h-\\[50%\\]"
---

<objective>
Two follow-up UAT fixes for the singing view split-leaf mode.

Purpose:
1. Kill the growing blank gap between notation and lyrics that appears after
   scroll-hide reflows `<main>` to `100dvh` (260712-sny). Root cause: both the
   notation slot and the lyrics slot use `flex-1` (flex-grow: 1) in
   `renderSplitLeaf`, so they split available height 50/50 regardless of the
   notation's actual rendered content height. When `<main>` grows, the notation
   slot's half grows too but its SVG/JPG content does not, leaving blank space
   below the notation. Fix = asymmetric sizing: notation slot is content-sized
   and capped at <=50%; lyrics slot grows to absorb the rest (>=50%).
2. Stop the Solfege notation button graying out when Staff+Inline is selected.
   Inline solfege will never exist, so the Solfege button must behave like the
   Staff button: always clickable (when the tune has a solfege JPG) and always
   landing on `solfege-split`, auto-switching layout to Split-Leaf.

Output: Updated NotationRenderer.tsx (sizing) and GearPopover.tsx (routing).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@.planning/quick/260712-sny-scroll-hide-reflow-content-into-freed-sp/260712-sny-SUMMARY.md
@.planning/quick/260712-tmm-solfege-split-leaf-jpg-cap-at-50-viewpor/260712-tmm-SUMMARY.md
@.planning/quick/260712-u4q-disable-inline-solfege-toggle-until-real/260712-u4q-SUMMARY.md

<interfaces>
<!-- Current renderSplitLeaf chromeless branches (NotationRenderer.tsx ~1088-1120).
     Both slots currently use flex-1, causing the 50/50 split-regardless-of-content bug. -->

capBothHalvesOnDesktop === true (solfege-split, all widths):
```tsx
<div className="flex flex-col h-full gap-4 px-4 pt-4">
  <div data-notation-slot className="flex-1 min-h-0 max-h-[50%] overflow-y-auto">{notationSlot}</div>
  <div className="flex-1 min-h-0 max-h-[50%] overflow-y-auto">{stanzaSlot}</div>
</div>
```

default branch (staff-split; desktop escape-hatch to stacked):
```tsx
<div className="flex flex-col h-full gap-4 px-4 pt-4 md:h-auto md:gap-4">
  <div data-notation-slot className="flex-1 min-h-0 max-h-[50%] overflow-y-auto md:max-h-none md:overflow-visible md:flex-none">{notationSlot}</div>
  <div className="flex-1 min-h-0 max-h-[50%] overflow-y-auto md:max-h-none md:overflow-visible md:flex-none">{stanzaSlot}</div>
</div>
```

Definite-height chain (why the OUTER slot's `max-h-[50%]` is always resolvable):
`<main>` (SingingView) always has a DEFINITE height — `h-[calc(100dvh-104px)]`
in the resting state, `100dvh` when reflowed — so the chain
`<main>` → `data-notation-renderer` (`flex flex-col h-full`) →
`data-notation-viewarea` (`flex-1 min-h-0`) → `renderSplitLeaf` container
(`flex flex-col h-full`) each resolves to a definite height. The notation slot's
`max-h-[50%]` therefore resolves against the `renderSplitLeaf` container's
definite height in BOTH resting and reflowed states. Making the slot `flex-none`
does NOT change this — the slot's own `max-h-[50%]` resolves against its PARENT
(still definite); only a percentage max-height on the slot's CHILD (the img)
would break, because the child's containing block (the flex-none slot) is now
auto-height.

Solfege-split JPG (NotationRenderer.tsx ~1187-1198), current isSplit className:
```tsx
isSplit ? 'max-h-full w-auto object-contain mx-auto' : 'w-full h-auto'
```
`max-h-full` = 100% of the notation slot. Once the slot becomes `flex-none`
(content-sized, height auto), a percentage max-height on the img resolves to
`none`, so `max-h-full` no longer caps anything. Do NOT replace it with a fixed
`dvh` guess: the notation slot's true rendered cap differs between the RESTING
state (`<main>` = `100dvh-104px` minus `pb-11` 44px minus `renderSplitLeaf`'s own
`pt-4` 16px, so `max-h-[50%]` ≈ 38-43dvh on a 700-850px phone) and the REFLOWED
state (`<main>` = 100dvh, so ≈50dvh). Any single fixed constant is wrong in one
state. Instead size the img by WIDTH (`w-full h-auto`) and let the OUTER notation
slot's own `max-h-[50%] overflow-y-auto` cap + scroll it — that percentage
resolves against the slot's definite-height parent (see the chain above), so it
is correct in every state and independent of the img's own height sizing.

GearPopover.tsx current derivations (~52-56):
```tsx
const isStaff = viewMode === 'staff' || viewMode === 'staff-split'
const isSplit = viewMode === 'staff-split' || viewMode === 'solfege-split'
const solfegeAvailableForCurrentLayout = isSplit ? solfegeSplitAvailable : solfegeInlineAvailable
const inlineLayoutDisabled = !isStaff && !solfegeInlineAvailable   // KEEP — do not change
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Asymmetric split-leaf sizing (notation content-sized, lyrics absorb the rest)</name>
  <files>src/components/notation/NotationRenderer.tsx</files>
  <action>
In `renderSplitLeaf` (~1088-1120), change BOTH chromeless branches so the
notation slot is content-sized (does NOT flex-grow) while the lyrics slot
grows to absorb remaining space. This implements the user's asymmetric intent:
notation at MOST 50%, lyrics at LEAST 50%.

capBothHalvesOnDesktop === true branch:
- Notation slot: change `flex-1` -> `flex-none`. Keep `min-h-0 max-h-[50%]
  overflow-y-auto` and `data-notation-slot`. Result:
  `flex-none min-h-0 max-h-[50%] overflow-y-auto`
- Lyrics slot: change `flex-1 min-h-0 max-h-[50%] overflow-y-auto` ->
  `flex-1 min-h-0 overflow-y-auto` (REMOVE `max-h-[50%]` so lyrics can exceed
  50% and absorb the space vacated by the shrunk notation slot).

default branch:
- Notation slot: change base `flex-1` -> `flex-none`. Keep the desktop
  escape-hatch `md:max-h-none md:overflow-visible` (drop the now-redundant
  `md:flex-none` — base is already flex-none). Result:
  `flex-none min-h-0 max-h-[50%] overflow-y-auto md:max-h-none md:overflow-visible`
- Lyrics slot: change base `flex-1 ... max-h-[50%] ...` -> `flex-1 min-h-0
  overflow-y-auto`, and KEEP the desktop escape-hatch
  `md:max-h-none md:overflow-visible md:flex-none`. Result:
  `flex-1 min-h-0 overflow-y-auto md:max-h-none md:overflow-visible md:flex-none`

Why this preserves the two guarantees:
- 260712-kov (desktop staff byte-identical): on desktop the notation slot
  computes to `flex-none, max-h-none, overflow-visible` (same as before) and the
  lyrics slot to `flex-none, max-h-none, overflow-visible` (same as before).
  Only the MOBILE/reflowed base classes change.
- 260712-tmm (solfege JPG slot <=50% at all widths): the notation slot keeps
  `max-h-[50%]` at all widths in the capBothHalvesOnDesktop branch.

Then fix the solfège-split JPG img so it still fits within the now content-sized
notation slot. `max-h-full` no longer caps anything once the slot is `flex-none`
(a percentage max-height resolves to `none` against an auto-height parent), and a
fixed `dvh` value is WRONG because the slot's true `max-h-[50%]` cap differs
between the resting state (~38-43dvh on realistic phones) and the reflowed state
(~50dvh) — see the <interfaces> note. Do NOT guess a viewport constant.

Instead, size the chromeless-split img by WIDTH and delegate the height cap to
the outer notation slot. That slot keeps `max-h-[50%] overflow-y-auto`, and its
`max-h-[50%]` resolves correctly against its flex parent (`flex flex-col h-full`,
which has a definite height in BOTH resting and reflowed states — see the
<interfaces> definite-height chain). So the slot caps the visible JPG at ≤50%
and scrolls it when the scan is taller — exactly the original 260712-tmm intent
(a capped container, not a never-scroll image).

In the `viewMode === 'solfege-split'` block (~1187-1198), change the img
className. Keep the leading `'rounded-md border border-border'` line. Add a
stable comment marker (so the change is greppable), then use a nested ternary
that sizes the chromeless split path by width:

  className={cn(
    'rounded-md border border-border',
    // chromeless split-leaf: width-based natural sizing so the outer notation
    // slot's own max-h-[50%]+overflow-y-auto caps & scrolls the JPG in BOTH
    // resting and reflowed states (no fixed dvh guess).
    isSplit
      ? chromeless
        ? 'w-full h-auto'
        : 'max-h-full w-auto object-contain mx-auto'   // non-chromeless (/tunes, /study) grid layout unchanged
      : 'w-full h-auto',
  )}

Leave the `style={chromeless && !isSplit ? { maxWidth: '100%' } : undefined}`
line exactly as-is, and keep the `<div className={chromeless ? '-mx-4' : ''}>`
wrapper — `w-full` fills that edge-bled wrapper at the JPG's natural aspect
ratio.

Do NOT change the non-chromeless grid branch of renderSplitLeaf, the
non-split (inline JPG) className, or any staff/AbcPlayer code. The staff SVG
needs no img change — `flex-none` shrink-wraps the SVG intrinsic height and
`max-h-[50%]` + `overflow-y-auto` handles over-tall tunes.
  </action>
  <verify>
    <automated>cd /home/services/psalter && if grep -q "flex-none min-h-0 max-h-\[50%\] overflow-y-auto" src/components/notation/NotationRenderer.tsx && ! grep -q "max-h-\[48dvh\]" src/components/notation/NotationRenderer.tsx && grep -q "chromeless split-leaf: width-based natural sizing" src/components/notation/NotationRenderer.tsx; then echo PASS; else echo FAIL; fi
    # Note: eslint gate intentionally omitted here — NotationRenderer.tsx has 4 PRE-EXISTING
    # react-hooks/set-state-in-effect errors (lines 332/337/441/461, predating this quick task,
    # unrelated to renderSplitLeaf) that make a blanket `npx eslint` exit 1 regardless of this
    # fix's correctness. Use `npx tsc --noEmit -p .` (no NotationRenderer-attributed errors
    # expected) as the real type-safety gate instead.</automated>
  </verify>
  <done>
Both chromeless renderSplitLeaf branches have a `flex-none` (non-growing)
notation slot capped at `max-h-[50%]` and a `flex-1` lyrics slot with no
max-height cap. The chromeless solfège-split JPG uses width-based `w-full h-auto`
sizing (no fixed `dvh` value; no `max-h-[48dvh]`), so the notation slot's own
`max-h-[50%] overflow-y-auto` caps and scrolls the JPG identically in both the
resting and reflowed states. ESLint passes with no new errors. Desktop
staff-split classes still compute to the pre-change stacked layout.
  </done>
</task>

<task type="auto">
  <name>Task 2: Solfege notation button always routes to solfege-split (never layout-gated)</name>
  <files>src/components/singing/GearPopover.tsx</files>
  <action>
Make the Solfege NOTATION button behave like the Staff button: availability
based purely on whether the tune has a solfege JPG (`solfegeSplitAvailable`),
NOT on the current layout; and clicking it always produces `solfege-split`,
auto-switching the layout to Split-Leaf when currently Inline.

1. Remove the `solfegeAvailableForCurrentLayout` derivation (~line 55). It
   becomes unused after the changes below. Do NOT touch `isStaff`, `isSplit`,
   or `inlineLayoutDisabled` (the u4q inline-layout gating stays exactly as is).

2. In `handleNotationChange` (~58-75):
   - Change the solfege guard from `!solfegeAvailableForCurrentLayout` to
     `!solfegeSplitAvailable`, with a single description (no isSplit branching):
     `"Solfège isn't available for this tune"`.
   - Change the `newMode` computation so solfege ALWAYS routes to
     `'solfege-split'` regardless of `isSplit`, while staff keeps its
     layout-preserving behavior:

     ```ts
     const newMode: ViewMode =
       notation === 'solfege'
         ? 'solfege-split'                       // inline solfege never exists — always split
         : (isSplit ? 'staff-split' : 'staff')
     ```

   This means `viewMode: 'solfege'` is never produced by this handler.

3. On the Solfege notation `<button>` (~194-211):
   - `disabled={!solfegeAvailableForCurrentLayout}` -> `disabled={!solfegeSplitAvailable}`
   - className grayed-out condition `!solfegeAvailableForCurrentLayout` -> `!solfegeSplitAvailable`
   - className active condition `!isStaff && solfegeAvailableForCurrentLayout`
     -> `!isStaff && solfegeSplitAvailable`

Do NOT change: `inlineLayoutDisabled`, the Inline layout `<button>`'s
disabled/title/toast wiring, `handleLayoutChange`, or `handleMainMusicNotes`.
Those are u4q's correct behavior and must be preserved. `viewMode: 'solfege'`
must remain permanently unreachable via any button.
  </action>
  <verify>
    <automated>cd /home/services/psalter && npx eslint src/components/singing/GearPopover.tsx && test -z "$(grep -n 'solfegeAvailableForCurrentLayout' src/components/singing/GearPopover.tsx)" && grep -q "notation === 'solfege'" src/components/singing/GearPopover.tsx && grep -q "inlineLayoutDisabled = !isStaff && !solfegeInlineAvailable" src/components/singing/GearPopover.tsx</automated>
  </verify>
  <done>
`solfegeAvailableForCurrentLayout` no longer exists. The Solfege notation button
is disabled only when `!solfegeSplitAvailable`. `handleNotationChange('solfege')`
always yields `'solfege-split'`. `inlineLayoutDisabled` and the Inline layout
button gating are unchanged. ESLint passes with no unused-variable error.
  </done>
</task>

</tasks>

<verification>
- `npx eslint src/components/singing/GearPopover.tsx` passes (no unused-var / no new errors). `NotationRenderer.tsx` has 4 pre-existing, unrelated eslint errors (react-hooks/set-state-in-effect, lines 332/337/441/461) — verified via grep assertions + `npx tsc --noEmit -p .` instead of a blanket eslint gate for that file.
- Static class assertions in each task's `<automated>` block pass.
- Orchestrator live verification (rebuild + Playwright daemon, seed
  `psalter_tour_v2=done` and `psalter-player-toured=1` before nav):
  1. Split-leaf staff, scroll to hide bars -> notation slot hugs the SVG,
     lyrics fill remaining space, NO blank gap below the staff.
  2. Split-leaf solfege, BOTH resting (bars visible) and reflowed (bars
     hidden) -> the JPG's slot is capped ~<=50%, lyrics fill the rest, NO blank
     gap; a tall JPG scrolls within its capped slot rather than overflowing it.
  3. On staff-inline, open gear -> Solfege notation button is enabled (given a
     solfege JPG); clicking it lands on solfege-split (Split-Leaf layout).
  4. Inline layout button still shows "coming soon" / disabled when Solfege is
     the active notation.
  5. Desktop staff-split still stacked and identical to staff-inline.
</verification>

<success_criteria>
- No blank gap between notation and lyrics in either split-leaf mode after
  scroll-hide reflow; notation <=50%, lyrics >=50%.
- Solfege JPG slot capped ~<=50% in BOTH resting and reflowed states (no
  fixed-dvh asymmetry); tall scans scroll within the capped slot.
- Solfege notation button enabled whenever the tune has a solfege JPG,
  regardless of current layout, and always routes to `solfege-split`.
- 260712-tmm, 260712-kov, and u4q guarantees all preserved; `viewMode:'solfege'`
  unreachable via GearPopover / the chromeless singing view.
</success_criteria>

<output>
After completion, create
`.planning/quick/260713-kkg-fix-split-leaf-notation-lyrics-gap-sizin/260713-kkg-SUMMARY.md`
</output>
</content>
</invoke>
