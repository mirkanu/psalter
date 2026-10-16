---
phase: 21-onboarding-v2-audio-restore
plan: "fqz"
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/notation/NotationRenderer.tsx
  - src/components/singing/LegacyAudioEmbed.tsx (NEW)
  - src/app/globals.css
  - src/components/singing/GearPopover.tsx
  - src/components/singing/OnboardingTour.tsx
  - src/components/singing/OnboardingTour.test.tsx
  - tests/diagnostics/onboarding-v2-trigger.mjs
autonomous: true
requirements: []
---

<objective>
Eight polish fixes to the Phase 21 Legacy view + onboarding tour, building on the patterns established by 21-01 / 21-02.

**Legacy view (`NotationRenderer.tsx`'s `viewMode === 'legacy'` branch):**
1. Lyrics styling in Legacy view matches Lyrics Only — same centred column, max-width, and mobile gutters.
3. Replace the "piano player available — press Play in the bottom bar" placeholder with the actual MIDI player embedded inline (Flow variant).
4. Make the SoundCloud iframe tall enough that the embedded widget fits without crop.
5. Match the padding above the SoundCloud box to the padding already below it (same `space-y-2` rhythm).

**Gear popover (`GearPopover.tsx` view-mode radios):**
2. All three (Music Notes / Lyrics Only / Legacy) on one row; restore their icons; rename "Lyrics Only" → "Lyrics" to free space; fix the double-active bug where Legacy + Music Notes both show as selected.

**Tour (`OnboardingTour.tsx`):**
6. Final step copy changes to: "Open settings to access the study guide or **(new feature!) change views to Music Notes or Lyrics Only**." The "(new feature!) change views to Music Notes or Lyrics Only" portion is wrapped in an orange `<span>` so it pops.
7. The audio-player tour step ALSO fires the first time the user switches to Lyrics Only (`viewMode === 'lyrics'`). Existing `psalter.tour.audioStepDone` key is shared so neither path re-fires once the user has seen it once.
8. Single-step tours (1 of 1) hide both the "Step X of Y" counter AND the "Skip tour" button — only the "Done" button shows. Multi-step tours (initial) keep the full chrome.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/21-onboarding-v2-audio-restore/21-CONTEXT.md
@.planning/phases/21-onboarding-v2-audio-restore/21-01-SUMMARY.md
@.planning/phases/21-onboarding-v2-audio-restore/21-02-PLAN.md
@.planning/phases/21-onboarding-v2-audio-restore/21-02-SUMMARY.md

# Specific files to re-read before editing (preserved across the lean form)
- `src/components/notation/NotationRenderer.tsx` lines 2775-2837 (Legacy view branch) — embed iframe + placeholder div + renderLyricsContent() call.
- `src/app/globals.css` lines 280-340 — the [data-notation-body][data-view-mode="..."] .lyrics-block selector lists that style Lyrics Only / split-leaf. Add `legacy` to each.
- `src/components/singing/GearPopover.tsx` lines 79 (isMusicNotes), 300-362 (main radio row + Legacy row).
- `src/components/singing/OnboardingTour.tsx` lines 28-56 (steps definitions), 170-185 (trigger gating), 213-234 (dismiss), 491-515 (bubble chrome).
- `src/components/singing/PlayMiniBar.tsx` lines 33-38, 220-258 — already supports `variant='flow'` with `static w-full rounded-lg border` styling (used on /tunes/[slug]).
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Legacy view layout fixes (lyrics padding, inline MIDI embed, taller SoundCloud, matched padding)</name>
  <files>
    src/components/notation/NotationRenderer.tsx,
    src/components/singing/LegacyAudioEmbed.tsx (NEW),
    src/app/globals.css
  </files>
  <action>
Four coordinated changes inside the `viewMode === 'legacy'` branch at NotationRenderer.tsx:2775-2837 (and the shared CSS that styles `.lyrics-block`).

**(a) Item 1 — lyrics padding matches Lyrics Only.**
In `src/app/globals.css` (the section starting at line ~280 with the comment "Centred lyrics column (consolidated)"), add `legacy` to each of the three selector lists that currently cover `[data-notation-body][data-view-mode="lyrics"]`, `solfege`, `staff-split`, `solfege-split`, `staff`:
- lines 295-298 (max-width + margin-inline + padding-inline rule)
- lines 305-310 (padding-block rule, applies to `.lyrics-block` only — skip for staff subtitle lines)
- lines 317-330 (mobile override)

Result: every existing selector list gets `[data-notation-body][data-view-mode="legacy"]` inserted just before `.lyrics-block`. The `staff` selectors at lines 299-300 / 311-315 should NOT get `legacy` — those rules style the inline-staff subtitle element which is not present in the Legacy view. Leave those as-is.

Implementation: edit each CSS rule to prepend the legacy selector. Verify with `grep -nE 'data-view-mode="legacy" .lyrics-block' src/app/globals.css` returning ≥4 matches.

**(b) Item 5 — match the padding above the SoundCloud box to the padding below it.**
The current `<div data-legacy-embeds className="space-y-2 mb-2">` has `space-y-2` (0.5rem) gap between the two embeds; `mb-2` for the gap to the lyrics below. The gap ABOVE the SoundCloud box (from the psalm top bar) needs to also be 0.5rem. Change `mb-2` to `my-2` so the same rhythm applies on both sides. Visually verify: the SoundCloud iframe should sit ~0.5rem below whatever it sits below in the page chrome (the top bar / page header); lyrics sit ~0.5rem below the MIDI player.

**(c) Item 4 — taller SoundCloud iframe.**
The SoundCloud Player widget renders ~166px tall in its canonical form. The current `height="80"` clips the widget to 1/2 its natural height. Change to `height="166"` (still fits the 390px mobile viewport with the MIDI player + a couple of stanzas below). Apply the same height to the iframe via the existing height attr. Keep `width="100%"` and the existing `rounded-md border border-border` classes.

Bonus mitigation: add `scrolling="no"` (legacy attribute, but SoundCloud's embed respects it) so the iframe doesn't try to add a second scrollbar. The full set of attributes becomes: `width="100%" height="166" scrolling="no"`.

**(d) Item 3 — replace the placeholder text with an embedded inline MIDI player.**
The current placeholder `<div data-legacy-midi ...>Piano player available — press Play in the bottom bar to listen</div>` is dead UI in Legacy (PlayMiniBar is unmounted here, hidePlayButton hides the bottom-right play button — there is no bottom bar to "press Play" in). Replace it with a real flow-variant player that lives in the viewport.

Create `src/components/singing/LegacyAudioEmbed.tsx` — a new `'use client'` component that:
- Accepts props: `abc: string`, `soundcloudUrl: string | null`, `tuneName: string`.
- Owns its own `audioSource` state initialised by reading `psalter.audioLastSelected` from localStorage on mount (with the same legacy-key migration PlayMiniBar.tsx:69-86 already does for `psalter-audio-source='abc'` → `'midi'`); falls back to `'midi'` when `abc` is present and `'soundcloud'` when it isn't.
- Owns its own `isPlaying` state and AbcAudioControls wiring (PlayMiniBarClient/PlayMiniBar already encapsulate this — read PlayMiniBarClient.tsx and AbcAudioControls.tsx and reuse the pattern).
- Renders `<PlayMiniBar variant='flow' mounted={true} visible={true} abc={abc} soundcloudUrl={soundcloudUrl} tuneName={tuneName} isPlaying={isPlaying} onPlayingChange={setIsPlaying} onCollapse={() => {}} />` (onCollapse is a no-op in flow variant — PlayMiniBar.tsx:270-279 hides the collapse button entirely when `isFlow`, so the no-op is unreachable but required by the type).
- Imports PlayMiniBar from `'./PlayMiniBar'`. No new dependencies.

Then in `src/components/notation/NotationRenderer.tsx` line ~2813-2827, REPLACE the placeholder `<div data-legacy-midi ...>` with:
```tsx
<LegacyAudioEmbed
  abc={abc}
  soundcloudUrl={soundcloudUrl}
  tuneName={tuneName || ''}
/>
```
Add `import { LegacyAudioEmbed } from '@/components/singing/LegacyAudioEmbed'` at the top.

Order of (b)+(c)+(d) in the source: keep the existing `<div data-legacy-embeds>` wrapper, update to `my-2`, bump the SoundCloud iframe height, and swap the placeholder for `<LegacyAudioEmbed>`. The SoundCloud iframe + LegacyAudioEmbed remain siblings inside `data-legacy-embeds`.

Note on global side effect (informational, not an edit): the legacy `psalter-audio-source` key migration that PlayMiniBar does on hydrate was originally only fired inside the `<main>` render path; that's no longer relevant — keep the migration logic inside LegacyAudioEmbed as well so a user who last picked "abc" years ago migrates correctly.
  </action>
  <verify>
- `grep -nE 'data-view-mode="legacy" .lyrics-block' src/app/globals.css | wc -l` returns ≥4 (item 1)
- `grep 'data-legacy-embeds' src/components/notation/NotationRenderer.tsx` returns the `my-2` className (item 5)
- `grep 'height="166"' src/components/notation/NotationRenderer.tsx` returns 1 hit (item 4)
- `grep -c 'data-legacy-midi' src/components/notation/NotationRenderer.tsx` returns exactly 1 — the new LegacyAudioEmbed mount — and `grep -c 'Piano player available' src/components/notation/NotationRenderer.tsx` returns 0 (item 3 placeholder removed)
- `test -f src/components/singing/LegacyAudioEmbed.tsx && grep -c 'variant=' src/components/singing/LegacyAudioEmbed.tsx` returns ≥1 (item 3 new file)
- `npx tsc --noEmit` exits 0 for changed files
  </verify>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Gear popover view-mode radios — single row, icons restored, "Lyrics Only" renamed, double-active bug fixed</name>
  <files>
    src/components/singing/GearPopover.tsx
  </files>
  <action>
All in one file: `src/components/singing/GearPopover.tsx`. Five surgical edits.

**(a) Fix the double-active "both Music Notes AND Legacy appear orange" bug.**
At line 79, change:
```ts
const isMusicNotes = viewMode !== 'lyrics'
```
to:
```ts
const isMusicNotes =
  viewMode === 'staff' ||
  viewMode === 'staff-split' ||
  viewMode === 'solfege' ||
  viewMode === 'solfege-split'
```
Same pattern already used at OnboardingTour.tsx:170-175 (`isMusicNotesView`). Add a 1-line comment above: "Excludes 'legacy' — Legacy has its own dedicated radio on the same row; without this gate Legacy view would double-activate the Music Notes radio."

Verify: when `viewMode === 'legacy'`, `isMusicNotes === false` and the Music Notes radio loses its `bg-primary` styling while the Legacy radio retains it.

**(b) Restore Music Notes icon + Lyrics icon.**
At the top imports (lines 3-19), add `FileText` from `lucide-react`:
```ts
import { ..., FileText, ..., Library } from 'lucide-react'
```
(`Library` is already imported for Legacy.)

In the Music Notes button JSX (lines 301-320), prepend a `<Music className="h-4 w-4" />` icon before the label text. Match Lucide size: `h-4 w-4 inline-flex items-center gap-1.5` already used by the Solfege/Inline sub-toggles at lines 386/440. Replace the button's className with the standard inline-flex+gap pattern (so the icon and label align on the same baseline):
```tsx
className={[
  'h-10 rounded-md text-sm font-semibold active:scale-[0.95] transition-[transform,background,color] duration-75 motion-reduce:transition-none inline-flex items-center justify-center gap-1.5',
  musicNotesBlocked && 'opacity-40',
  isMusicNotes
    ? 'bg-primary text-primary-foreground'
    : 'hover:bg-muted text-muted-foreground',
].join(' ')}
```
JSX body becomes:
```tsx
<Music className="h-4 w-4" />
<span>Music Notes</span>
```

Same treatment for the Lyrics radio at lines 321-336: prepend `<FileText className="h-4 w-4" />`, change the className to the inline-flex pattern, wrap the label in `<span>`, and rename the label text from "Lyrics Only" → "Lyrics" (per the description's requirement).

**(c) All three radios on one row.**
The current main radiogroup uses `grid-cols-2` (line 300). Change to `grid-cols-3` and remove the now-redundant `col-span-2` class on the Legacy button at line 354.

Update the Legacy button at lines 347-362:
- Remove `col-span-2` from the className.
- Update the button to match the same compact inline-icon-plus-label pattern (already has `inline-flex items-center justify-center gap-1.5` — keep that; just keep the Library icon and `<span>Legacy</span>` label).

Result: the view-mode row becomes 3 equal columns (Music Notes / Lyrics / Legacy) each with an icon + label, all clickable, exactly one shown as `bg-primary` (selected) at any time.

(d) Order of operations inside the file: do (a) first, then (b), then (c). The current Legacy button (lines 347-362) is its own `<button>` element BELOW the grid — once you switch to `grid-cols-3` you have to MOVE the Legacy button INTO the grid. Easiest is to cut the entire `<button ... data-view-option="legacy" ...>...</button>` block (lines 347-362) and paste it as the third child of the `<div role="radiogroup">` (line 300-onwards). The new grid children order: Music Notes, Lyrics, Legacy.

(e) Quick visual sanity check: with the changes in place, when `viewMode === 'staff'`, only Music Notes has `bg-primary`; when `viewMode === 'lyrics'`, only Lyrics has `bg-primary`; when `viewMode === 'legacy'`, only Legacy has `bg-primary`.
  </action>
  <verify>
- `grep "data-view-option=\"legacy\"" src/components/singing/GearPopover.tsx` returns 1 hit inside the grid, not below it
- `grep "grid-cols-3" src/components/singing/GearPopover.tsx` returns 1 hit
- `grep "col-span-2" src/components/singing/GearPopover.tsx` returns 0 hits
- `grep ">Lyrics Only<" src/components/singing/GearPopover.tsx` returns 0 hits; `grep ">Lyrics<" src/components/singing/GearPopover.tsx` returns 1 hit
- `grep -c "col-span-2\\|isMusicNotes = viewMode" src/components/singing/GearPopover.tsx` returns 0 hits — confirms the old 2-col grid + the old broad `isMusicNotes` derivation are both gone
- `npx tsc --noEmit` exits 0 for the file
  </verify>
</task>

<task type="auto" tdd="false">
  <name>Task 3: OnboardingTour final step (orange-highlighted "new feature" copy), audio-step trigger on Lyrics view, single-step tour chrome</name>
  <files>
    src/components/singing/OnboardingTour.tsx,
    src/components/singing/OnboardingTour.test.tsx,
    tests/diagnostics/onboarding-v2-trigger.mjs
  </files>
  <action>
All in `OnboardingTour.tsx`. Four coordinated changes:

**(a) Item 6 — final step wording + orange "new feature" emphasis.**
At lines 32-35 (the final INITIAL_STEP), change the `copy` from a plain string to a structured rendering. The Step type (line 18-21) currently is `{ target: string; copy: string }`. Two options:

Option A (lowest-risk): keep `copy: string`, embed the orange span via a render-time split using the bubble's JSX. Use a different field name to mark it: change the Step interface to allow either a string OR a `{ pre, highlight, post }` triple, then handle both in the bubble.

Option B (simpler): change the Step interface for the final entry to `{ target: 'view-controls'; copy: { pre: string; highlight: string } }` — ONLY the final entry uses the structured form. All other steps keep `copy: string`.

PICK OPTION B — minimal interface change, just one discriminated branch in the bubble JSX.

Edit the Step interface at line 18-21:
```ts
interface Step {
  target: string
  copy: string | { pre: string; highlight: string }
}
```

Update INITIAL_STEPS at line 32-35:
```ts
{
  target: 'view-controls',
  copy: {
    pre: 'Open settings to access the study guide or ',
    highlight: '(new feature!) change views to Music Notes or Lyrics Only',
  },
}
```

In the bubble JSX at line 502 (`<p className="text-sm font-normal mb-4">{steps[currentStep].copy}</p>`), branch on type:
```tsx
<p className="text-sm font-normal mb-4">
  {typeof steps[currentStep].copy === 'string'
    ? steps[currentStep].copy
    : (<>
        {steps[currentStep].copy.pre}
        <span className="text-orange-500 font-semibold">
          {steps[currentStep].copy.highlight}
        </span>
      </>)}
</p>
```

The orange span uses Tailwind's `text-orange-500` (matches the `#f97316` used by the gear-button ring stroke at line 321-322, so the visual emphasis is consistent — orange is the project's "new things" accent per the description).

**(b) Item 7 — audio-step trigger on first Lyrics Only entry.**
At lines 170-175, change `isMusicNotesView`:
```ts
const isMusicNotesView =
  viewMode === 'staff' ||
  viewMode === 'staff-split' ||
  viewMode === 'solfege' ||
  viewMode === 'solfege-split' ||
  viewMode === 'lyrics'   // NEW: also fire on first Lyrics Only entry (item 7)
```
Add a 1-line comment: "Phase 21 fqz: include 'lyrics' so the audio-step fires on first Lyrics Only entry too — same key, no double-firing across paths."

The SWIPE_STEP gating at lines 181-185 uses `isStaffInlineView = viewMode === 'staff'` — leave that as-is. Only `isMusicNotesView` changes (used at line 179's `shouldFireAudio`).

The `psalter.tour.audioStepDone` key is shared between both view-mode entry points (it's the same key written in `dismiss()` at line 213-234, keyed off `activeTrigger === 'audio'`). So once a user has seen the audio step on EITHER path, they won't see it on the other path. This matches the description's contract.

**(c) Item 8 — single-step tour chrome.**
At the bubble JSX lines 499-514:
```tsx
<div className="flex items-center justify-between gap-2">
  {steps.length > 1 && (
    <Button variant="ghost" size="sm" onClick={dismiss}>
      Skip tour
    </Button>
  )}
  <Button
    variant="default"
    size="sm"
    onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
  >
    {isLast ? 'Done' : 'Next →'}
  </Button>
</div>
```
and the counter at line 499-501:
```tsx
{steps.length > 1 && (
  <p className="text-xs text-muted-foreground text-center mb-2">
    Step {currentStep + 1} of {steps.length}
  </p>
)}
```

Also: the aria-label at line 494 (`aria-label={`Onboarding step ${currentStep + 1} of ${steps.length}`}`) — when `steps.length === 1`, change to `"Onboarding notice"` so screen readers don't announce "Step 1 of 1" either.

Behaviour matrix:
- `steps.length === 1` (audio / swipe triggers): no counter, no Skip, single "Done" button, aria-label is "Onboarding notice".
- `steps.length > 1` (initial): "Step X of Y" counter, "Skip tour" + "Next →"/"Done", aria-label is "Onboarding step X of Y".

The "final step displays 'Done' instead of 'Next →'" logic at line 510 (`isLast ? 'Done' : 'Next →'`) keeps working — for a single-step tour, `currentStep === 0 === steps.length - 1`, so `isLast === true` and only "Done" renders.

**(d) Tests + diagnostic.**
Two minimal updates:

`OnboardingTour.test.tsx`:
- Existing Test 5 (or whichever counter test exists): update for the new `aria-label` contract. Find by `grep -n "Onboarding step" src/components/singing/OnboardingTour.test.tsx` and adjust the assertion. For a single-step audio tour, expect `"Onboarding notice"`. For a multi-step initial tour, the existing assertion still works.
- Add a Test verifying that the final-step bubble now contains the orange-highlighted span: render the initial tour, advance to step 4 by clicking "Next →" 3 times, then `expect(container.querySelector('.text-orange-500')?.textContent).toBe('(new feature!) change views to Music Notes or Lyrics Only')`.
- Add a Test verifying the audio-step fires on first entry to `viewMode: 'lyrics'`: setup `localStorage` keys for `initialDone=true`, `audioStepDone` unset; render with `viewMode: 'lyrics'`; assert `getByText('Tap the play button to open the audio player.')` is present.

`tests/diagnostics/onboarding-v2-trigger.mjs` — add one new case (i), AFTER existing case (h):
- **Case (i): final step shows orange "(new feature!)" copy.** Clear localStorage, `goto('/psalms/1'`, advance the initial tour through all 4 steps via `page.click('[role="dialog"] button:has-text("Next")')` (button text is "Done" on the last step). Assert `page.locator('[role="dialog"] .text-orange-500').first().textContent()` equals "(new feature!) change views to Music Notes or Lyrics Only". Optional: screenshot the final step to `tests/diagnostics/out/onboarding-v2-trigger/step4-orange.png` for visual verification.

Existing cases (f/g/h) still pass — the structure changes are scope-localised.
  </action>
  <verify>
- `grep "new feature!" src/components/singing/OnboardingTour.tsx` returns 1 hit
- `grep "text-orange-500" src/components/singing/OnboardingTour.tsx` returns 1 hit
- `grep "viewMode === 'lyrics'" src/components/singing/OnboardingTour.tsx` returns ≥2 hits (the `isMusicNotesView` update + the `aria-checked={viewMode === 'lyrics'}` line elsewhere — confirm the new hit is in the `isMusicNotesView` derivation, not just the existing one)
- `grep "Onboarding notice" src/components/singing/OnboardingTour.tsx` returns 1 hit
- `grep "steps.length > 1" src/components/singing/OnboardingTour.tsx` returns 2 hits (counter + skip button)
- `grep -c "Step {currentStep + 1}" src/components/singing/OnboardingTour.tsx` returns 0 in the bubble — only inside the now-gated condition
- `grep "Skip tour" src/components/singing/OnboardingTour.tsx` returns 1 hit (the variant reference in the test mock)
- `npx vitest run src/components/TourProvider.test.tsx src/components/singing/OnboardingTour.test.tsx src/components/DesktopOptimisedBanner.test.tsx tests/components/audio-persistence.test.tsx` reports all suites green
- `npx tsc --noEmit` exits 0 for changed files
  </verify>
</task>

</tasks>

<final_steps>
After all 3 tasks complete:
1. `npm run build` exits 0 (capture buildId)
2. `pm2 restart psalter` per auto-deploy rule (memory `feedback_auto_deploy_on_complete.md`)
3. Git workflow: commit each task atomically, push to a new `phase-21-fqz` branch via `git push -u origin phase-21-fqz` (the direct-to-master push is blocked by GH006 gitleaks push protection per memory `project_github_push_protection_master.md` — never bypass), then `gh pr create --base master --head phase-21-fqz` so the squash-merge can run through the normal gitleaks-protected flow.
4. Smoke-test live: with the new buildId live, visit `https://psalter.gsdlabs.dev/psalms/1` in a fresh private browser, then verify:
   - Legacy view shows the SoundCloud iframe at ~166px tall (no cropping), MIDI player inline below it, lyrics below with centred padding matching Lyrics Only.
   - Gear popover: 3 radios (Music Notes / Lyrics / Legacy) on one row, each with an icon, only one highlighted as selected at a time.
   - Tour final step shows the orange "(new feature!)" portion visually distinct from the rest.
   - Switch to Lyrics Only via the gear popover; the audio-player tour step fires if not previously seen.
5. Per the user's request: run vitest on the touched suites — covered in Task 3's verify block (TourProvider + OnboardingTour + DesktopOptimisedBanner + audio-persistence).
</final_steps>

<output>
After completion, create `.planning/quick/261016-fqz-phase-21-polish-in-the-new-legacy-view-m/261016-fqz-SUMMARY.md` with: the buildId, vitest pass count, Playwright results, the PR URL once created, and any deviations encountered.
</output>
