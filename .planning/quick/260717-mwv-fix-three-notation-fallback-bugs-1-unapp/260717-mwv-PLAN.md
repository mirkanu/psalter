---
phase: quick-260717-mwv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/notation/NotationRenderer.tsx
  - src/components/singing/SingingView.tsx
  - src/components/singing/PlayMiniBar.tsx
  - src/app/psalms/[id]/page.tsx
  - src/app/precent/[id]/sing/[pos]/page.tsx
autonomous: false
requirements: []
user_setup: []

must_haves:
  truths:
    - "Viewing Ps 42 (tune Orlington, tuneMelismaDecisions.status != 'approved') in Split-Leaf Staff on mobile shows the pre-rendered staff JPEG, not a live abcjs-rendered staff"
    - "Viewing Ps 45a (non-recommended versification, no tune yet selected) shows 'Please select a tune. Note that this versification of this psalm is not recommended.' instead of the generic 'No notation available for this psalm.' message"
    - "Viewing Ps 45b (tune Diadameta — no staff and no solfège ABC/JPEG in any form) forces Lyrics Only view with an explanatory toast, and the Play button plays the SoundCloud recording for that tune"
  artifacts:
    - path: "src/components/notation/NotationRenderer.tsx"
      provides: "staffInlineApproved prop + renderScannedPages() JPG-fallback helper reused by both split-leaf Solfège and non-approved split-leaf Staff"
      contains: "staffInlineApproved"
    - path: "src/components/singing/SingingView.tsx"
      provides: "hasAnyNotation computation, isRecommendedVersion prop, forced-Lyrics-Only fallback effect, restructured no-tune/no-notation render branch"
      contains: "hasAnyNotation"
    - path: "src/components/singing/PlayMiniBar.tsx"
      provides: "forces SoundCloud audio source when the active tune has no ABC notation at all"
      contains: "hasAbc"
  key_links:
    - from: "src/components/singing/SingingView.tsx"
      to: "src/components/notation/NotationRenderer.tsx"
      via: "staffInlineApproved prop passed to NotationRendererClient"
      pattern: "staffInlineApproved=\\{staffInlineApproved\\}"
    - from: "src/app/psalms/[id]/page.tsx"
      to: "src/components/singing/SingingView.tsx"
      via: "isRecommendedVersion prop"
      pattern: "isRecommendedVersion"
    - from: "src/components/singing/SingingView.tsx"
      to: "src/components/singing/PlayMiniBar.tsx"
      via: "PlayMiniBar rendered when abc OR soundcloudUrl present (was: abc only)"
      pattern: "\\(abc \\|\\| soundcloudUrl\\)"
---

<objective>
Fix three notation-fallback bugs found during live verification of Phase 04.9.15
(mobile inline staff optimization), all building on Plan 04.9.15-04's tune-approval
gating (`src/lib/inline-staff-gating.ts`) and the existing scanned-JPG rendering path
already used by split-leaf Solfège in `NotationRenderer.tsx`.

1. **Split-Leaf Staff must serve the staff JPEG for non-approved tunes, not live abcjs.**
   Today `viewMode === 'staff-split'` always renders via `AbcPlayer` regardless of
   `tuneMelismaDecisions.status`. Only INLINE Staff is gated (04.9.15-04's
   `shouldFallbackToSplit`/`computeInlineLayoutDisabled`) — Split-Leaf Staff was never
   gated, so a user who gets correctly bounced from inline to Split-Leaf (with the
   correct "not available" toast) still sees the unapproved tune's live-rendered
   notation there. Fix: extract the JPG-rendering logic already used by
   `viewMode === 'solfege-split'` into a shared helper, and use it for
   `staff-split` too whenever the active tune is not approved.

2. **Non-recommended versifications need a specific "select a tune" message.**
   `SingingView.tsx` currently shows a hardcoded "No notation available for this
   psalm." whenever no tune is active (`!abc`), with no distinction for *why*. For a
   non-recommended versification (e.g. Ps 45a — its `psalterNumber` lacks the
   `"Recommended"` substring `deriveVersionSlug` looks for), this message should
   instead read: "Please select a tune. Note that this versification of this psalm
   is not recommended."

3. **A tune with NO notation source at all must force Lyrics Only, not Split-Leaf.**
   Ps 45b (tune Diadameta) has no `abcNotation`/`abcSatb`, no staff JPG/pages, and no
   solfège JPG/pages — only a SoundCloud URL. Because `tuneMelismaDecisions.status`
   is also not `'approved'` for this tune, the EXISTING 04.9.15-04 fallback effect
   (`shouldFallbackToSplit`) unconditionally forces `viewMode = 'staff-split'` — with
   nothing at all to render there. Fix: detect "no staff AND no solfège notation in
   any form" and force `'lyrics'` instead, with its own one-time toast, taking
   priority over the Split-Leaf fallback. Also: the top-level render in
   `SingingView.tsx` currently gates the entire `NotationRendererClient` (and
   therefore Lyrics Only + `StanzaList`) on `abc` being truthy, and gates
   `PlayMiniBar` the same way — both must key off "an active tune exists" instead,
   so Lyrics Only + a working SoundCloud Play button are reachable even when `abc`
   is empty.

**Deployment note:** this app runs on the VPS via **PM2** (process name `psalter`),
NOT Docker. Rebuild with `npm run build` and restart with `pm2 restart psalter` —
do not follow any older docs/quick-task references to Docker Compose for this repo.
This plan is executed SEQUENTIALLY on the main working tree (not an isolated
worktree) because the final checkpoint needs the real, currently-running PM2
process.

Purpose: close out the three live-verification gaps found in Phase 04.9.15 before
signing off the phase.
Output: Split-Leaf Staff respects tune approval like Solfège already does;
accurate "not recommended" messaging; robust Lyrics-Only + audio fallback for
tunes with zero notation data.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@.planning/phases/04.9.15-mobile-inline-staff-optimization/04.9.15-04-SUMMARY.md
@src/lib/inline-staff-gating.ts

<interfaces>
<!-- Existing gating helpers (src/lib/inline-staff-gating.ts) — DO NOT duplicate,
     reuse directly. -->
```typescript
export type MelismaStatus = 'approved' | 'not_approved'
export function resolveStaffInlineApproved(status: string | null | undefined): boolean
export function computeInlineLayoutDisabled(opts: {
  isStaff: boolean; staffInlineApproved: boolean; solfegeInlineAvailable: boolean
}): boolean
export function shouldFallbackToSplit(opts: { viewMode: string; staffInlineApproved: boolean }): boolean
```

<!-- src/components/singing/SingingView.tsx — current relevant state/derivations
     (current as of this plan's investigation, before this plan's edits): -->
```typescript
// existing, DO NOT change:
const staffInlineApproved = resolveStaffInlineApproved(activeTune?.melismaStatus ?? null)
const activeStaffPages = activeTune?.staffPages ?? []
const activeSolfegePages = activeTune?.solfegePages ?? []
const abc = activeTune?.abcNotation ?? ''
const scoreJpgUrl = activeTune?.scoreJpgUrl ?? null
const solfegeJpgUrl = activeTune?.solfegeJpgUrl ?? null
const soundcloudUrl = activeTune?.soundcloudUrl ?? null

// existing fallback effect (Plan 04.9.15-04) — guard this with hasAnyNotation in Task 2:
const lastFallbackTuneIdRef = useRef<number | null>(null)
useEffect(() => {
  if (!mounted) return
  if (!shouldFallbackToSplit({ viewMode, staffInlineApproved })) return
  if (lastFallbackTuneIdRef.current === (activeTune?.id ?? null)) return
  lastFallbackTuneIdRef.current = activeTune?.id ?? null
  setViewMode('staff-split')
  toast('Inline Staff not available for this tune — showing Split-Leaf. Pick a different view in Settings.')
}, [activeTune, staffInlineApproved, viewMode, mounted])

// existing top-level render (Task 2 restructures this):
{abc ? (
  <NotationRendererClient abc={abc} ... viewMode={viewMode} onViewModeChange={setViewMode} ... />
) : (
  <div className="p-6 text-sm text-muted-foreground italic">No notation available for this psalm.</div>
)}

// existing PlayMiniBar gate (Task 2 changes `abc &&` to `(abc || soundcloudUrl) &&`):
{abc && (
  <PlayMiniBar abc={abc} ... soundcloudUrl={soundcloudUrl} ... />
)}

// existing GearPopover call site (Task 2 replaces the two inline booleans with
// hoisted consts of the same name — no prop-name changes):
<GearPopover
  ...
  staffAvailable={!!(activeTune?.abcNotation || activeTune?.abcSatb)}
  solfegeSplitAvailable={!!(solfegeJpgUrl || activeSolfegePages.length > 0)}
  staffInlineApproved={staffInlineApproved}
/>
```

<!-- src/lib/psalm-slugs.ts — how "recommended" is encoded in the data. -->
```typescript
// deriveVersionSlug: psalterNumber like "6 (First Version, Recommended)" -> isRecommended = pn.includes('Recommended')
```

<!-- src/app/psalms/[id]/page.tsx and src/app/precent/[id]/sing/[pos]/page.tsx —
     both already compute `sortedVersions` (sorted psalmVersions) and
     `activeVersion` before building `<SingingView>`'s props. Task 2 adds
     `isRecommendedVersion` right after `activeVersion` is resolved in each file
     and threads it into `<SingingView isRecommendedVersion={isRecommendedVersion} .../>`. -->

<!-- src/components/singing/PlayMiniBar.tsx — current relevant state (Task 2 edits): -->
```typescript
const hasSc = !!soundcloudUrl && soundcloudUrl.startsWith('http')
const [audioSource, setAudioSource] = useState<'abc' | 'soundcloud'>('abc')
// ...restore-from-localStorage effect sets audioSource from 'psalter-audio-source'...
const showScToggle = hasSc
const showDisclaimer = showScToggle && audioSource === 'soundcloud'
// render: {audioSource === 'abc' ? <AbcAudioControls abc={abc} .../> : scIframeReady ? <iframe .../> : <span>Loading...</span>}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Split-Leaf Staff falls back to the staff JPEG for non-approved tunes (Bug 1)</name>
  <files>src/components/notation/NotationRenderer.tsx, src/components/singing/SingingView.tsx</files>
  <action>
    In `src/components/notation/NotationRenderer.tsx`:

    1. Add a new optional prop to the `NotationRendererProps` interface:
       `staffInlineApproved?: boolean` — documented as: "When false, Split-Leaf
       Staff renders the pre-rendered staff JPEG instead of live abcjs notation
       (mirrors how Split-Leaf Solfège already always shows the scanned JPG).
       Default true preserves current behavior for every caller that doesn't pass
       it (study/tune pages are never gated — locked decision from Phase 04.9.14)."
       Destructure it in the component signature as `staffInlineApproved = true,`.

    2. Extract the scanned-image rendering currently inlined in the
       `viewMode === 'solfege-split'` branch (the `pages`/`hasMultiPages`/
       `currentSrc`/`mainImageBlock`/`thumbnailStrip` block, including the prev/next
       page buttons and thumbnail strip) into a local function defined once, right
       after the `isSplit`/`usesSolfege` const declarations and before the
       `if (viewMode === 'staff' || viewMode === 'staff-split')` branch:

       ```typescript
       function renderScannedPages(pages: string[], fallbackUrl: string | null, altText: string) {
         // identical logic to the current solfege-split mainImageBlock/thumbnailStrip
         // construction — same classNames, same pageIndex state, same prev/next
         // button behavior. Returns { mainImageBlock, thumbnailStrip }.
       }
       ```

       Update the `solfege-split` branch to call
       `renderScannedPages(activePages(viewMode, staffPages, solfegePages), solfegeJpgUrl, \`Solfège for ${tuneName}\`)`
       and destructure `{ mainImageBlock, thumbnailStrip }` from it — output must be
       byte-identical to the current rendering (this is a pure refactor for reuse,
       not a behavior change to Solfège).

    3. In the `viewMode === 'staff' || viewMode === 'staff-split'` branch, compute
       `const forceStaffJpgFallback = isSplit && !staffInlineApproved` and branch
       the `notationBlock` construction:
       - When `forceStaffJpgFallback` is true: call
         `renderScannedPages(activePages('staff-split', staffPages, solfegePages), scoreJpgUrl, \`Staff notation for ${tuneName}\`)`
         and set `notationBlock` to a fragment rendering `mainImageBlock` then
         `thumbnailStrip` (same shape as the solfège branch's `notationSlot`).
       - Otherwise: keep the existing `<AbcPlayer>` block completely unchanged.

       Pass `forceStaffJpgFallback` as the third argument (`capBothHalvesOnDesktop`)
       to `renderSplitLeaf(notationBlock, stanzaBlock, forceStaffJpgFallback)` so the
       JPG-fallback case gets the same desktop 50/50 height cap solfège already uses;
       the live-abcjs case keeps passing the implicit `false` default (unchanged call
       signature: `renderSplitLeaf(notationBlock, stanzaBlock)` when not forcing JPG).

    Do not touch inline (non-split) `viewMode === 'staff'` rendering — that path is
    already fully protected by SingingView's existing `shouldFallbackToSplit` effect,
    which switches away from it before this component would render it on a
    non-approved tune.

    In `src/components/singing/SingingView.tsx`: pass the already-computed
    `staffInlineApproved` variable straight through to `<NotationRendererClient>` as
    a new `staffInlineApproved={staffInlineApproved}` prop (the variable already
    exists from Plan 04.9.15-04 — do not recompute it). This is the only change
    Task 1 makes to `SingingView.tsx`; Task 2 makes further edits to the same JSX
    block and must preserve this prop.
  </action>
  <verify>
    <automated>cd /home/services/psalter && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v "tests/e2e\|tests/precent-\|tune-notation.spec" ; grep -c "function renderScannedPages" src/components/notation/NotationRenderer.tsx; grep -c "forceStaffJpgFallback" src/components/notation/NotationRenderer.tsx; grep -c "staffInlineApproved={staffInlineApproved}" src/components/singing/SingingView.tsx</automated>
  </verify>
  <done>NotationRenderer.tsx exports the new staffInlineApproved prop, has a shared renderScannedPages() helper used by both solfege-split and the new staff-split JPG-fallback branch, and staff-split now renders the staff JPEG (not AbcPlayer) whenever staffInlineApproved is false. SingingView.tsx passes staffInlineApproved through. tsc reports no new errors (pre-existing test-file errors under tests/e2e, tests/precent-*, tune-notation.spec are expected and unrelated).</done>
</task>

<task type="auto">
  <name>Task 2: Non-recommended-versification messaging + forced Lyrics Only for zero-notation tunes (Bugs 2 &amp; 3)</name>
  <files>src/components/singing/SingingView.tsx, src/components/singing/PlayMiniBar.tsx, src/app/psalms/[id]/page.tsx, src/app/precent/[id]/sing/[pos]/page.tsx</files>
  <action>
    **In `src/components/singing/SingingView.tsx`:**

    1. Add a new optional prop to the `Props` interface: `isRecommendedVersion?: boolean`
       (doc comment: "Whether the active psalm-version's `psalterNumber` field
       contains the 'Recommended' marker — see `deriveVersionSlug` in
       `src/lib/psalm-slugs.ts`. Drives the 'no tune selected yet' message when no
       active tune exists. Default true (single-version psalms / unknown = treat as
       recommended, keep the existing generic message)."). Destructure with default
       `isRecommendedVersion = true`.

    2. Right after `activeStaffPages`/`activeSolfegePages` are computed (near where
       `staffInlineApproved` is derived), add:
       ```typescript
       const staffAvailable = !!(activeTune?.abcNotation || activeTune?.abcSatb)
       const solfegeSplitAvailable = !!(activeTune?.solfegeJpgUrl || activeSolfegePages.length > 0)
       const hasAnyNotation = staffAvailable || solfegeSplitAvailable
       ```
       Replace the two inline boolean expressions at the `<GearPopover>` call site
       (`staffAvailable={!!(activeTune?.abcNotation || activeTune?.abcSatb)}` and
       `solfegeSplitAvailable={!!(solfegeJpgUrl || activeSolfegePages.length > 0)}`)
       with `staffAvailable={staffAvailable}` and
       `solfegeSplitAvailable={solfegeSplitAvailable}` referencing these new consts
       (same values, no behavior change to GearPopover).

    3. Update the mount-hydration effect (the one that currently does
       `setViewMode(readStoredViewMode(showLyrics)); setBaseSize(...); setMounted(true)`)
       so it never restores a stored Staff/Split preference for a tune with no
       notation at all:
       ```typescript
       useEffect(() => {
         setViewMode(hasAnyNotation ? readStoredViewMode(showLyrics) : 'lyrics')
         setBaseSize(readStoredBaseSize())
         setMounted(true)
         // eslint-disable-next-line react-hooks/exhaustive-deps
       }, [])
       ```

    4. Guard the existing `shouldFallbackToSplit` effect with an early return so it
       never fires for a tune with no notation at all (the new effect in step 5 takes
       priority for that case): add `if (!hasAnyNotation) return` as the first check
       inside the effect body (before the `if (!shouldFallbackToSplit(...))` check),
       and add `hasAnyNotation` to its dependency array.

    5. Immediately after that effect, add a new one that forces Lyrics Only whenever
       the active tune has no notation source at all, guarded by a tune-id ref (same
       pattern as `lastFallbackTuneIdRef`) so the toast fires once per transition:
       ```typescript
       const lastNoNotationTuneIdRef = useRef<number | null>(null)
       useEffect(() => {
         if (!mounted) return
         if (hasAnyNotation) return
         if (lastNoNotationTuneIdRef.current === (activeTune?.id ?? null)) return
         lastNoNotationTuneIdRef.current = activeTune?.id ?? null
         setViewMode('lyrics')
         toast('No staff or solfège notation available for this tune — showing Lyrics Only. Audio may still be available via Play.')
       }, [activeTune, hasAnyNotation, mounted])
       ```

    6. Restructure the top-level render (inside `<main>`, currently
       `{abc ? (<NotationRendererClient .../>) : (<div>No notation available for this psalm.</div>)}`):
       change the condition from `abc` to `activeTune`, keep every existing prop on
       `<NotationRendererClient>` UNCHANGED (including the `staffInlineApproved` prop
       Task 1 added), and replace the else-branch content:
       ```jsx
       {activeTune ? (
         <NotationRendererClient
           abc={abc}
           /* ...all existing props unchanged, including staffInlineApproved... */
         />
       ) : (
         <div className="p-6 text-sm text-muted-foreground italic">
           {isRecommendedVersion
             ? 'No notation available for this psalm.'
             : 'Please select a tune. Note that this versification of this psalm is not recommended.'}
         </div>
       )}
       ```
       This makes Lyrics Only + `StanzaList` reachable for a tune with an empty
       `abc` (Bug 3), while still showing the improved message when there is truly
       no active tune at all (Bug 2).

    7. Change the `PlayMiniBar` render gate from `{abc && (...)}` to
       `{(abc || soundcloudUrl) && (...)}` so the mini-bar (and its SoundCloud
       player) mounts for audio-only tunes even though `abc` is empty.

    **In `src/components/singing/PlayMiniBar.tsx`:**

    8. Right after the existing `const hasSc = ...` line, add:
       ```typescript
       const hasAbc = !!abc && abc.trim().length > 0
       ```
       Change the `audioSource` state initializer from `useState<'abc' | 'soundcloud'>('abc')`
       to a lazy initializer: `useState<'abc' | 'soundcloud'>(() => (!hasAbc && hasSc ? 'soundcloud' : 'abc'))`
       so a fresh mount into an audio-only tune never briefly attempts to render the
       (broken, because `abc` is empty) ABC audio controls.

    9. Add a new effect right after the existing localStorage-restore effect (so it
       runs afterward in the same commit and wins) that re-forces SoundCloud whenever
       this instance has no ABC — this covers both a stale localStorage restore AND a
       later tune-switch to an audio-only tune (this component instance persists
       across tune switches; only its props change):
       ```typescript
       useEffect(() => {
         if (!hasAbc && hasSc) setAudioSource('soundcloud')
       }, [hasAbc, hasSc])
       ```

    10. Change `const showScToggle = hasSc` to `const showScToggle = hasSc && hasAbc`
        (hide the abc/SoundCloud toggle entirely when there is no ABC to toggle back
        to — nothing for the user to switch between). Change
        `const showDisclaimer = showScToggle && audioSource === 'soundcloud'` to
        `const showDisclaimer = hasSc && audioSource === 'soundcloud'` (the disclaimer
        about lyrics/recording mismatch is still relevant for audio-only tunes, even
        though the toggle itself is hidden there).

    11. In the render, change `{audioSource === 'abc' ? (<AbcAudioControls .../>) : scIframeReady ? (...) : (...)}`
        to `{audioSource === 'abc' && hasAbc ? (<AbcAudioControls .../>) : scIframeReady ? (...) : (...)}`
        as defense-in-depth against ever mounting `AbcAudioControls` with an empty
        `abc` string.

    **In `src/app/psalms/[id]/page.tsx`:**

    12. Right after `activeVersion` is resolved (after the `if/else if` chain that
        sets it from `versionLetter`/`verseRange`), add:
        ```typescript
        const isRecommendedVersion = sortedVersions.length <= 1
          ? true
          : (activeVersion?.psalterNumber?.includes('Recommended') ?? false)
        ```
        Pass `isRecommendedVersion={isRecommendedVersion}` as a new prop on the
        `<SingingView>` element at the bottom of the component.

    **In `src/app/precent/[id]/sing/[pos]/page.tsx`:**

    13. Apply the identical pattern: right after `activeVersion` is resolved, add
        ```typescript
        const isRecommendedVersion = sortedVersions.length <= 1
          ? true
          : (activeVersion?.psalterNumber?.includes('Recommended') ?? false)
        ```
        and pass `isRecommendedVersion={isRecommendedVersion}` to `<SingingView>`.
  </action>
  <verify>
    <automated>cd /home/services/psalter && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v "tests/e2e\|tests/precent-\|tune-notation.spec" ; grep -c "hasAnyNotation" src/components/singing/SingingView.tsx; grep -c "lastNoNotationTuneIdRef" src/components/singing/SingingView.tsx; grep -c "isRecommendedVersion" src/components/singing/SingingView.tsx; grep -c "isRecommendedVersion" src/app/psalms/\[id\]/page.tsx; grep -c "isRecommendedVersion" src/app/precent/\[id\]/sing/\[pos\]/page.tsx; grep -c "hasAbc" src/components/singing/PlayMiniBar.tsx</automated>
  </verify>
  <done>SingingView.tsx forces Lyrics Only (with a one-time toast) for any active tune with neither staff nor solfège notation, shows the new "not recommended" message only when no tune is active AND isRecommendedVersion is false, and renders NotationRendererClient/PlayMiniBar based on activeTune/abc-or-soundcloudUrl instead of abc alone. PlayMiniBar defaults to and forces the SoundCloud audio source whenever the active tune has no ABC. Both page.tsx callers compute and pass isRecommendedVersion. tsc reports no new errors.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Rebuilt and restarted the live psalter deployment (PM2, not Docker) with all
    three fixes: (1) Split-Leaf Staff now serves the pre-rendered JPEG instead of
    live abcjs for non-approved tunes, (2) non-recommended versifications with no
    tune selected show a specific "please select a tune" message, (3) tunes with
    zero notation data (staff or solfège, in any form) force Lyrics Only with a
    working SoundCloud Play button instead of a broken forced Split-Leaf view.

    The executor MUST run these steps, in order, before pausing for the human check:
    1. `cd /home/services/psalter && npm run build`
    2. `pm2 restart psalter`
    3. Confirm the process is back online: `pm2 list | grep psalter` should show
       status `online` with a fresh uptime.
  </what-built>
  <how-to-verify>
    1. Open https://psalter.gsdlabs.dev/psalms/42 (tune Orlington, not approved).
       Confirm the app falls back from inline Staff to Split-Leaf (existing toast
       still appears), and that Split-Leaf now shows the SCANNED STAFF JPEG image
       (not a live-rendered abcjs staff — compare visually: the JPEG is a scanned
       photo/print, abcjs output is crisp vector notation with a "Show original"-style
       toggle absent).
    2. Open https://psalter.gsdlabs.dev/psalms/45a (non-recommended versification).
       If no tune is pre-selected, confirm the message reads exactly:
       "Please select a tune. Note that this versification of this psalm is not
       recommended." — not the old generic "No notation available for this psalm."
    3. Open https://psalter.gsdlabs.dev/psalms/45b (tune Diadameta). Confirm:
       - The view automatically shows Lyrics Only (not a blank/broken Split-Leaf),
         with a toast/notification explaining no notation is available.
       - Pressing the Play button in the bottom bar reveals a working SoundCloud
         player (not an error message or broken ABC audio controls) that can
         actually play the recording.
    4. Sanity check no regression: open any APPROVED tune (e.g. /psalms/23, Crimond)
       and confirm Split-Leaf Staff still renders live abcjs notation as before (not
       forced to the JPEG).
  </how-to-verify>
  <resume-signal>Type "approved" or describe any of the three behaviors that still isn't correct.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| DB → client render | `tuneMelismaDecisions.status` and `psalterNumber` are editorial DB fields (not user input) consumed to choose a render branch / message string client-side |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-260717-01 | Information Disclosure | SingingView.tsx toast text | accept | Toast strings are static, non-sensitive UX copy (no tune/user data interpolated) |
| T-260717-02 | Denial of Service (self) | PlayMiniBar.tsx forced-soundcloud effect | accept | Effect only toggles a two-value enum state based on booleans already derived from trusted DB fields; no loop risk (deps are stable per render) |
</threat_model>

<verification>
- `npx tsc --noEmit -p tsconfig.json` shows no new errors beyond the pre-existing,
  already-documented test-file errors (tests/e2e, tests/precent-*, tune-notation.spec).
- Live, on the rebuilt PM2 deployment: Ps 42 Split-Leaf Staff shows the JPEG for the
  non-approved tune; Ps 45a shows the new "not recommended" message when no tune is
  selected; Ps 45b forces Lyrics Only with a working SoundCloud Play button; an
  approved tune's Split-Leaf Staff is unaffected (still live abcjs).
</verification>

<success_criteria>
- Split-Leaf Staff respects `tuneMelismaDecisions.status` exactly like Solfège
  already does — non-approved tunes never render live abcjs there.
- The "no tune selected yet" message correctly distinguishes recommended vs.
  non-recommended versifications.
- A tune with zero notation data in any form never renders a blank/broken
  Split-Leaf view; it always lands in a working Lyrics Only + audio-if-available
  state.
- No regression to approved tunes, recommended versifications, or tunes that do
  have staff/solfège notation.
</success_criteria>

<output>
After completion, create `.planning/quick/260717-mwv-fix-three-notation-fallback-bugs-1-unapp/260717-mwv-SUMMARY.md`
</output>
