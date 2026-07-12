---
phase: quick-260712-lcg
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/notation/NotationRenderer.tsx
  - src/components/singing/SingingView.tsx
  - src/components/singing/GearPopover.tsx
  - src/app/api/melisma-status/route.ts
autonomous: true
requirements: [QUICK-260712-lcg]
user_setup: []

must_haves:
  truths:
    - "Selecting inline Solfège (viewMode='solfege') shows the scanned solfège JPG image — identical to split-leaf Solfège — and never an abcjs staff render"
    - "The Solfège toggle in the gear popover is enabled whenever a solfège JPG exists, with no approval-gated disabled/tooltip state for inline vs split"
    - "No 'notation hasn't been approved yet' message ever renders for inline Solfège"
    - "Staff view, split-leaf logic, thumbnails, pagination, and JPG rendering are unchanged"
  artifacts:
    - path: "src/components/notation/NotationRenderer.tsx"
      provides: "Inline + split Solfège both routed through the single JPG render branch; no abcjs solfège path, no approval gate, no solfegeAbc/isTuneApproved props, no unifiedSolfegeAbc memo"
      contains: "viewMode === 'solfege' || viewMode === 'solfege-split'"
    - path: "src/components/singing/SingingView.tsx"
      provides: "No melismaStatus state, no /api/melisma-status fetch, no solfegeAbc/isTuneApproved derivation or props"
    - path: "src/components/singing/GearPopover.tsx"
      provides: "Single ungated solfegeAvailable prop (JPG presence); no solfegeInlineAvailable, no approval tooltip/toast"
  key_links:
    - from: "src/components/notation/NotationRenderer.tsx"
      to: "solfegeJpgUrl image branch"
      via: "viewMode === 'solfege' falls through to the JPG render branch"
      pattern: "viewMode === 'solfege' \\|\\| viewMode === 'solfege-split'"
    - from: "src/components/singing/SingingView.tsx"
      to: "GearPopover solfegeAvailable"
      via: "JPG presence check"
      pattern: "solfegeJpgUrl \\|\\| solfegePages"
---

<objective>
Revert the inline Solfège view to JPG-only, removing the incomplete/misleading
abcjs "solfège" rendering added in Phase 04.9.14 Plan 02. abcjs has no tonic
sol-fa support; the inline "solfège" branch rendered a soprano-only 5-line
staff visually near-identical to Staff view, so users saw no sol-fa notation.

Purpose: inline Solfège must behave exactly as it did BEFORE 04.9.14-02 — always
render the scanned `solfegeJpgUrl` image (the real, working solfège experience,
same as split-leaf Solfège already does), never the abcjs `unifiedSolfegeAbc`
path. This is the user's already-locked decision ("Descope for now, revert to
JPG-only inline"). Do NOT re-litigate; do NOT remove solfège JPGs.

Output: three simplified components + one deleted orphaned route, no dead code left.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

<what_was_added_in_04.9.14-02_that_this_reverts>
- NotationRenderer.tsx: `solfegeAbc` + `isTuneApproved` props, `unifiedSolfegeAbc`
  useMemo, an approval-gate branch (`viewMode === 'solfege' && !isTuneApproved`),
  and an abcjs-render branch (`viewMode === 'solfege' && (solfegeAbc.trim() || abc.trim())`).
- SingingView.tsx: `solfegeAbc` useMemo (sopranoOnly(pickAbcWithMarkers(...))),
  `melismaStatus` state + `/api/melisma-status` fetch effect, `isTuneApproved`,
  and the props `solfegeAbc`/`isTuneApproved` passed to NotationRendererClient,
  plus `solfegeInlineAvailable={isTuneApproved}` passed to GearPopover.
- GearPopover.tsx (CR-04 fix): split `solfegeAvailable` into `solfegeInlineAvailable`
  (approval-gated) + `solfegeSplitAvailable`, with an approval toast + tooltip.
- /api/melisma-status/route.ts (CR-02 fix): a NEW public read route created ONLY
  to feed SingingView's inline-solfège gate. The melisma editor uses
  `/api/dev/melisma-decision` (untouched), not this route.
</what_was_added_in_04.9.14-02_that_this_reverts>

<interfaces>
<!-- Current NotationRenderer solfège branch order (NotationRenderer.tsx ~1130-1288).
     After the revert only branches [A], [D], [E] remain. -->
[A] if (viewMode === 'staff' || viewMode === 'staff-split') { ... }          // KEEP
[B] else if (viewMode === 'solfege' && !isTuneApproved) { ...approval msg }   // DELETE
[C] else if (viewMode === 'solfege' && (solfegeAbc.trim()||abc.trim())) {...} // DELETE (abcjs render)
[D] else if (viewMode === 'solfege' || viewMode === 'solfege-split') { ...JPG + thumbnails... } // KEEP — now handles inline too
[E] else { ...lyrics... }                                                    // KEEP

<!-- buildUnifiedAbc (NotationRenderer.tsx ~780) is STILL used by the Staff view's
     `unifiedAbc = useMemo(() => buildUnifiedAbc(abc), ...)` — KEEP its BODY intact.
     Only remove the SECOND consumer `unifiedSolfegeAbc = useMemo(() => buildUnifiedAbc(solfegeAbc || abc), ...)`.
     NOTE: buildUnifiedAbc's HEADER COMMENT (~lines 770-779) still literally mentions
     "solfegeAbc" and an "inline Solfège view" — that stale docstring must be reworded
     (see Task 1 step 7) so the Task 1 grep gate for "solfegeAbc" can reach zero. -->

<!-- GearPopover.tsx current shape: props solfegeInlineAvailable + solfegeSplitAvailable;
     const solfegeAvailable = isSplit ? solfegeSplitAvailable : solfegeInlineAvailable.
     After revert both variants are the same JPG-based value → collapse to ONE prop. -->

<!-- SingingView.tsx passes (lines ~572-574):
     staffAvailable={!!(activeTune?.abcNotation || activeTune?.abcSatb)}   // KEEP unchanged
     solfegeInlineAvailable={isTuneApproved}                              // DELETE
     solfegeSplitAvailable={!!(solfegeJpgUrl || solfegePages.length > 0)} // becomes the single solfegeAvailable -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Strip abcjs solfège render path + approval gate from NotationRenderer</name>
  <files>src/components/notation/NotationRenderer.tsx</files>
  <action>
Remove everything that made inline Solfège render via abcjs, so `viewMode === 'solfege'`
falls through to the existing JPG branch. Prefer deleting over gating — leave no dead code.

1. Delete the two props and their JSDoc blocks from `NotationRendererProps`:
   - `solfegeAbc?: string` (~line 138) and its JSDoc (~131-137).
   - `isTuneApproved?: boolean` (~line 146) and its JSDoc (~139-145).
2. Delete the two destructured default params (~lines 254-255):
   `solfegeAbc = ''` and `isTuneApproved = true`.
3. Delete the `unifiedSolfegeAbc` useMemo block (~lines 1068-1074), including its
   leading comment. KEEP the `unifiedAbc` useMemo (~1063-1066) and the
   `buildUnifiedAbc` function (~780) — both are still used by the Staff view.
4. Delete branch [B] — the approval-gate branch `else if (viewMode === 'solfege' && !isTuneApproved)`
   (~lines 1164-1172), including the "hasn't been approved yet" message.
5. Delete branch [C] — the abcjs-render branch `else if (viewMode === 'solfege' && (solfegeAbc.trim() || abc.trim()))`
   (~lines 1173-1195), including its `<AbcPlayer abc={unifiedSolfegeAbc} .../>` block.
6. The remaining branch [D] `else if (viewMode === 'solfege' || viewMode === 'solfege-split')`
   (~line 1196) now directly follows the Staff branch and handles BOTH inline and
   split-leaf Solfège. Update its leading comment (currently references "no ABC
   available — legacy fallback") to state plainly that inline + split-leaf Solfège
   both render the scanned JPG (+ thumbnails/pagination). Do not change its body logic.
7. Reword ONLY the `buildUnifiedAbc` header comment (~lines 770-779) so it no longer
   references `solfegeAbc` or the removed "inline Solfège view". This docstring
   currently says the factory "build[s] TWO independent ABC bodies — the Staff view's
   (`abc`) and the inline Solfège view's (`solfegeAbc`)". Rewrite it to describe that
   `buildUnifiedAbc` now builds the single Staff view `unifiedAbc` body from `abc`.
   IMPORTANT: change ONLY the comment text (~lines 770-779) — do NOT alter the
   function BODY, its signature `buildUnifiedAbc(sourceAbc: string)`, or any logic
   below line 780. The grep gate below counts every occurrence of "solfegeAbc"
   including this comment, so leaving it stale would cause a FALSE verify failure.

Do NOT touch: the Staff/staff-split branch [A]; the BODY/logic of `buildUnifiedAbc`
(only its header comment is edited, per step 7); `unifiedAbc`; the JPG
`mainImageBlock`/`thumbnailStrip`/pagination; `renderSplitLeaf`; or the lyrics branch.
"Do NOT touch buildUnifiedAbc" means its body and logic stay byte-for-byte identical —
its docstring is the sole exception (step 7).
After edits, verify no leftover references to `solfegeAbc`, `isTuneApproved`, or
`unifiedSolfegeAbc` remain in this file (they would be dangling identifiers, and the
stale docstring in step 7 is the one non-code occurrence that must also go).
  </action>
  <verify>
    <automated>cd /home/services/psalter && test $(grep -cE 'solfegeAbc|isTuneApproved|unifiedSolfegeAbc' src/components/notation/NotationRenderer.tsx) -eq 0 && grep -q "viewMode === 'solfege' || viewMode === 'solfege-split'" src/components/notation/NotationRenderer.tsx && grep -q "function buildUnifiedAbc" src/components/notation/NotationRenderer.tsx && echo PASS</automated>
  </verify>
  <done>NotationRenderer.tsx has no `solfegeAbc`/`isTuneApproved`/`unifiedSolfegeAbc` references (including the reworded `buildUnifiedAbc` docstring); the Solfège JPG branch handles both inline and split; `buildUnifiedAbc` body + Staff `unifiedAbc` remain intact.</done>
</task>

<task type="auto">
  <name>Task 2: Remove solfège gating wiring from SingingView + GearPopover, delete orphaned route</name>
  <files>src/components/singing/SingingView.tsx, src/components/singing/GearPopover.tsx, src/app/api/melisma-status/route.ts</files>
  <action>
Remove all the now-dead wiring that fed the reverted inline-solfège abcjs path,
and delete the route that becomes fully orphaned. Leave no unused imports/state/props.

**SingingView.tsx:**
1. Delete the `melismaStatus` fetch effect (~lines 179-195, the `useEffect` calling
   `/api/melisma-status?tuneId=...`) including its comment block.
2. Delete the `melismaStatus` state declaration (~line 254:
   `const [melismaStatus, setMelismaStatus] = useState<...>(null)`).
3. Delete the `solfegeAbc` useMemo (~lines 355-364) including its comment.
4. Delete the `isTuneApproved` derivation (~lines 372-376) including its comment.
5. Remove the `solfegeAbc={solfegeAbc}` and `isTuneApproved={isTuneApproved}` props
   from the `<NotationRendererClient .../>` call (~lines 512-513).
6. In the `<GearPopover .../>` call (~lines 564-574): remove `solfegeInlineAvailable={isTuneApproved}`
   and rename `solfegeSplitAvailable={!!(solfegeJpgUrl || solfegePages.length > 0)}`
   to a single `solfegeAvailable={!!(solfegeJpgUrl || solfegePages.length > 0)}`.
   KEEP `staffAvailable={!!(activeTune?.abcNotation || activeTune?.abcSatb)}` unchanged.
   Update/trim the multi-line comment above these props so it no longer describes an
   approval gate (it's just JPG-availability now).
7. Remove the now-unused import: `import { pickAbcWithMarkers, sopranoOnly } from '@/lib/utils'`
   (line 16) — confirm neither symbol is used elsewhere in the file before removing
   (grep showed they were only used by the deleted `solfegeAbc` memo).
   Do NOT remove any other import (e.g. keep everything else on the import lines).

**GearPopover.tsx:**
8. Replace the two props `solfegeInlineAvailable: boolean` + `solfegeSplitAvailable: boolean`
   (and their long CR-04 JSDoc, ~lines 31-39) with a single `solfegeAvailable: boolean`
   prop with a short comment ("Whether Solfège is available — a solfège JPG exists.").
9. Update the destructure (~lines 51-52) to `solfegeAvailable` only.
10. Delete the derived line `const solfegeAvailable = isSplit ? solfegeSplitAvailable : solfegeInlineAvailable`
    (~lines 59-62) including its CR-04 comment — the prop is now used directly.
11. In `handleNotationChange` (~lines 69-74): keep the `!solfegeAvailable` guard but
    change the toast to a non-approval message, e.g.
    `toast('Coming soon', { description: 'Solfège notation for this tune is not yet available' })`
    (mirroring the Staff branch's "Coming soon" pattern). Remove approval wording.
12. On the Solfège radio button (~line 192): remove the approval `title` tooltip
    (`title={!solfegeAvailable ? 'Notation not yet approved ...' : undefined}`) — either
    drop the attribute entirely or keep a neutral availability title. Keep the
    `disabled={!solfegeAvailable}` + opacity styling driven by the single boolean.
13. While in this file, reword the `staffAvailable` JSDoc (~line 29) from
    "(has approved ABC)" to "(ABC exists for this tune)" — staff availability is
    driven by ABC presence, not any approval state; the stale "approved" wording is
    a leftover from the reverted approval gate. Leave the `staffAvailable` prop and
    its wiring otherwise unchanged.

**Delete orphaned route:**
14. Delete the file `src/app/api/melisma-status/route.ts`. It was created in CR-02
    solely to feed SingingView's inline-solfège gate; with that removed it has zero
    callers (grep confirms only SingingView referenced it, and the melisma editor
    uses `/api/dev/melisma-decision`, which is untouched). Remove the empty
    `src/app/api/melisma-status/` directory if it is left empty.

Final full-project check (this is the plan's real gate — Task 1 removed props that
Task 2's call sites were still passing, so tsc only passes once BOTH tasks are done):
run `npx tsc --noEmit -p .` and `npm run build`; confirm no NEW errors versus the
pre-existing baseline (pre-existing `tests/e2e/*.spec.ts` tsc errors and known
react-hooks lint items are out of scope — see 04.9.14-02-SUMMARY verification notes).
  </action>
  <verify>
    <automated>cd /home/services/psalter && if test ! -f src/app/api/melisma-status/route.ts && [ "$(grep -rcE 'melisma-status|solfegeInlineAvailable|isTuneApproved|melismaStatus' src/components/singing/SingingView.tsx src/components/singing/GearPopover.tsx | awk -F: '{s+=$2} END{print s}')" = "0" ] && grep -q "solfegeAvailable" src/components/singing/GearPopover.tsx && ! (npx tsc --noEmit -p . 2>&1 | grep -vE 'tests/e2e|\.spec\.ts' | grep -q 'error TS'); then echo PASS; else echo FAIL; fi</automated>
  </verify>
  <done>SingingView + GearPopover carry no melismaStatus/approval/inline-availability wiring; GearPopover uses a single JPG-driven `solfegeAvailable` and its `staffAvailable` JSDoc no longer says "approved"; `/api/melisma-status/route.ts` is deleted; `npx tsc --noEmit` and `npm run build` produce no new errors beyond the known pre-existing baseline.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit -p .` — no new errors beyond pre-existing `tests/e2e/*.spec.ts` items.
- `npm run build` — Next.js production build succeeds.
- Grep gates (comment-filtered): no `solfegeAbc`, `isTuneApproved`, `unifiedSolfegeAbc`,
  `melismaStatus`, `solfegeInlineAvailable`, or `melisma-status` references remain in the
  three components; `src/app/api/melisma-status/route.ts` no longer exists.
- Behavioral (manual, no headless browser required for sign-off): on a psalm's singing
  view, switching Notation → Solfège in inline layout shows the scanned solfège JPG
  (same image as split-leaf Solfège), the Solfège toggle is enabled whenever a JPG exists,
  and no "not approved" message or approval tooltip appears.
</verification>

<success_criteria>
- Inline Solfège renders the `solfegeJpgUrl` scan (never abcjs), identical to split-leaf Solfège.
- No approval gate, approval message, or approval tooltip anywhere for Solfège.
- GearPopover Solfège availability is driven solely by JPG presence, via one `solfegeAvailable` prop.
- Staff view, split-leaf logic, thumbnails, pagination, PlayMiniBar, and scroll-hide are untouched.
- No orphaned dead code: unused imports/state/props removed; the orphaned `/api/melisma-status` route deleted.
- `tsc` + `npm run build` pass with no new errors.
</success_criteria>

<output>
After completion, create `.planning/quick/260712-lcg-revert-inline-solfege-view-to-jpg-only-r/260712-lcg-SUMMARY.md`
</output>
