---
phase: quick-260712-kov
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/notation/NotationRenderer.tsx
  - tests/diagnostics/split-leaf-staff-diff.mjs
autonomous: false
requirements: [UI-07]

must_haves:
  truths:
    - "In singing view, Split-leaf Staff notation renders the SAME staff systems and noteheads as inline Staff notation (only the interleaved w: lyric lines are absent)."
    - "Split-leaf Staff shows no visible corruption: no missing/duplicated systems, no collapsed/overlapping staves, no wrong-size or clipped notation versus inline Staff."
    - "Lyrics still render separately (StanzaList) below/beside the notation in split-leaf, not interleaved under the notes."
    - "Inline Staff, inline Solfège, and split-leaf Solfège (JPG) rendering are unchanged by the fix."
  artifacts:
    - path: "tests/diagnostics/split-leaf-staff-diff.mjs"
      provides: "Playwright-daemon diagnostic that renders a psalm in Staff and Split-leaf Staff modes and reports staff-system count, notehead count, and SVG viewBox for each so divergence is measurable."
    - path: "src/components/notation/NotationRenderer.tsx"
      provides: "Corrected split-leaf staff render path (abcForView / scale / staffWidthFactor / applyMinHeight)."
  key_links:
    - from: "src/components/notation/NotationRenderer.tsx (staff / staff-split branch, ~L1107-1140)"
      to: "AbcPlayer"
      via: "abcForView + scale + staffWidthFactor props"
      pattern: "abcForView = isSplit \\?"
    - from: "src/components/notation/NotationRenderer.tsx"
      to: "unifiedAbcNoLyrics"
      via: "w: line stripping from unifiedAbc"
      pattern: "unifiedAbcNoLyrics"
---

<objective>
Fix the split-leaf Staff notation rendering bug reported in Phase 04.9.14 UAT:
"Split leaf Staff: the staff notation doesn't render correctly (should be
identical to inline rendering except no inline lyrics)."

Purpose: Precentors using the split-leaf layout (notation on top, lyrics below)
must see the SAME engraved staff as the inline Staff view — the split-leaf
variant only removes the interleaved `w:` lyric lines (lyrics move to the
separate StanzaList). Something in the split-leaf pipeline currently distorts
the notation.

Output: A corrected split-leaf Staff render path in `NotationRenderer.tsx`, plus
a reusable Playwright-daemon diagnostic that proves inline vs split-leaf Staff
now match structurally.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@.planning/research/lyric-to-note-alignment.md

<!-- BINDING PROJECT RULE (CLAUDE.md + lyric-to-note-alignment.md):
     melisma = slur = underline = `_` in the ABC w: line. The `.` solfège dot is
     rhythm, NOT a melisma marker. Do NOT alter how `_` melisma tokens or w:
     lines are GENERATED. This bug is about how the split-leaf staff STRIPS w:
     lines and sizes the staff — not about melisma generation. Any change that
     touches w:-line CONTENT (not just its presence/absence) is out of scope and
     must be flagged, not silently made. -->

<interfaces>
<!-- Extracted from src/components/notation/NotationRenderer.tsx — the executor
     needs these exact call sites; no codebase exploration required. -->

The two ABC bodies (NotationRenderer.tsx ~L1040-1057):
```ts
// Built via buildUnifiedAbc(abc). Because SingingView passes melismaPositions,
// buildUnifiedAbc takes the Phase 04.9.12 melisma-positions branch: each phrase
// is emitted as ONE merged music line, followed by one `w:` line per visible
// cycle. It does NOT call splitMusicIntoSubLines in that branch.
const unifiedAbc = useMemo(() => buildUnifiedAbc(abc), [...])

// Split-leaf staff strips every `w: ` line from the ALREADY-BUILT unifiedAbc:
const unifiedAbcNoLyrics = useMemo(
  () => unifiedAbc.split('\n').filter((l) => !/^w:\s/.test(l.trim())).join('\n'),
  [unifiedAbc],
)
```

Scale derivation (~L510-512):
```ts
const isSplitForScale = isSplitMode(viewMode)   // 'staff-split' | 'solfege-split'
const SPLIT_LEAF_NOTATION_SCALE = 1
const scale = isSplitForScale ? SPLIT_LEAF_NOTATION_SCALE : baseSize / 14
```

staffWidthFactor (~L527-531): `chromeless ? (viewportW < 768 ? 0.55 : 0.85) : 1`

The staff / staff-split branch (~L1107-1140):
```ts
if (viewMode === 'staff' || viewMode === 'staff-split') {
  const isPartialPage = visibleCycles.length < CYCLES_PER_PAGE
  const applyMinHeight = !chromeless && isPartialPage && minStaffHeight > 0
  const abcForView = isSplit ? unifiedAbcNoLyrics : unifiedAbc
  const notationBlock = (
    <div ref={staffRef} style={applyMinHeight ? { minHeight: minStaffHeight } : undefined}>
      <AbcPlayer
        abc={abcForView}
        scale={scale}
        ...
        renderLyricsBelow={isSplit ? undefined : lyricsBelow}
        staffWidthFactor={staffWidthFactor}
      />
    </div>
  )
  // isSplit ? renderSplitLeaf(notationBlock, stanzaBlock) : notationBlock
}
```

AbcPlayer sizing (src/components/AbcPlayer.tsx ~L337-369):
```ts
const containerWidth = Math.max(0, (staffWidth || 600) - 16)   // measured from outerRef
const effectiveScale = scale ?? 1
const targetStaffwidth = (containerWidth * staffWidthFactor) / effectiveScale
const effectiveStaffWidth = Math.max(120, Math.floor(targetStaffwidth))
abcjs.renderAbc(el, abc, { scale: 1, staffwidth: effectiveStaffWidth, responsive: 'resize', ... })
```
So inline staff staffwidth = W*factor/(baseSize/14); split-leaf staffwidth =
W*factor/1. abcjs re-wraps systems as staffwidth changes — a divergence to check.
</interfaces>

Runtime facts confirmed during planning:
- Singing view route: `/psalms/[id]` (e.g. `http://localhost:3005/psalms/23`).
  The running Docker instance answered 200 at localhost:3005.
- Split-leaf is selected via the Gear popover → Layout: "Split-leaf" (GearPopover
  `handleLayoutChange('split-leaf')` sets viewMode `staff-split`).
- Shared Playwright daemon: `http://localhost:3099` (CLAUDE.md). Use
  `runPlaywright` from `/home/services/playwright-daemon/client.js`. Poll
  `/status` until `browserReady: true` before submitting jobs (it was still
  warming during planning). NEVER spawn raw Chromium.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build a diagnostic that measures inline vs split-leaf Staff divergence</name>
  <files>tests/diagnostics/split-leaf-staff-diff.mjs</files>
  <action>
Create a Node diagnostic that uses the shared Playwright daemon to load the
running singing view and measure how the Staff and Split-leaf Staff notation
differ — turning a "looks wrong" report into concrete numbers before any fix.

1. Import the daemon client:
   `const { getStatus, runPlaywright } = require('/home/services/playwright-daemon/client.js')`
   (use an `.mjs` with `createRequire`, or write `.cjs` if simpler — match
   whatever the existing `tests/e2e/*.spec.ts` raw-launch convention uses; the
   daemon client is CommonJS). Base URL from `process.env.TEST_BASE_URL ??
   'http://localhost:3005'`.

2. Poll `getStatus()` until `browserReady === true` (retry ~10x, 3s apart);
   abort with a clear message if the daemon never becomes ready.

3. For a fixed psalm (`/psalms/23`, Crimond — the canonical verified tune in
   lyric-to-note-alignment.md §8) at a mobile viewport (375x667) AND a desktop
   viewport (1200x900), run one daemon job per (viewport × mode):
   - Load the page, wait for `[data-notation-renderer] svg` to exist.
   - Ensure Staff (inline) mode: open the Gear popover and select Staff +
     Inline layout if not already active. Capture metrics.
   - Switch to Split-leaf via the Gear popover (Staff + Split-leaf layout).
     Capture metrics again.
   - Metrics to capture per mode from the rendered abcjs SVG(s):
       * number of staff systems (count `.abcjs-staff` groups, or distinct
         staff-line groups — inspect the DOM and pick a stable selector)
       * number of noteheads (`.abcjs-note` element count)
       * outer SVG `viewBox` width/height and rendered client width/height
       * presence of any lyric text elements (`.abcjs-lyric`) — should be >0
         inline, 0 in split-leaf
   - Also capture a screenshot per (viewport × mode) into
     `tests/diagnostics/out/` for human reference.

4. Print a comparison table and a machine-readable summary line, e.g.:
   `RESULT staff systems=4 notes=40 lyrics=12 vb=... | split systems=4 notes=40 lyrics=0 vb=...`
   Compute and print `MATCH: systems <ok|MISMATCH>, notes <ok|MISMATCH>`.
   Exit code 0 always in this task (it is a measurement tool; Task 2 asserts on
   its output). Guard all daemon calls in try/catch so a daemon/browser outage
   prints `DIAGNOSTIC-UNAVAILABLE: <reason>` and exits 0 rather than throwing.

5. From the printed metrics + screenshots, write the ROOT CAUSE directly in your
   task report to the orchestrator (not a separate .md file), choosing among:
   - (A) Structural: split-leaf has a different systems/noteheads count than
     inline → w:-line stripping is deleting/merging music lines abcjs relied on,
     OR the melisma-positions branch's single-merged-line emission reflows
     differently without w: anchors.
   - (B) Sizing: systems/noteheads match but viewBox/rendered size differs
     wildly → the `scale=1` (split) vs `scale=baseSize/14` (inline) and/or the
     `applyMinHeight`/`staffWidthFactor` computations distort the split-leaf
     staff.
   - (C) Both.
  </action>
  <verify>
    <automated>node tests/diagnostics/split-leaf-staff-diff.mjs 2>&1 | grep -Eq 'RESULT|DIAGNOSTIC-UNAVAILABLE'</automated>
  </verify>
  <done>Diagnostic script exists, runs against localhost:3005 via the Playwright daemon (or prints DIAGNOSTIC-UNAVAILABLE if the browser is down), emits per-mode systems/noteheads/viewBox metrics and a MATCH/MISMATCH verdict, saves screenshots, and the root cause (A/B/C) is stated in the task report.</done>
</task>

<task type="auto">
  <name>Task 2: Fix the split-leaf Staff render path so it matches inline (minus lyrics)</name>
  <files>src/components/notation/NotationRenderer.tsx</files>
  <action>
Apply the fix indicated by Task 1's root cause. Do NOT change how `w:` lines or
`_` melisma tokens are GENERATED (binding rule — see context). Only change how
the split-leaf staff selects/sizes its ABC. Implement the branch Task 1 proved:

If root cause (A) STRUCTURAL (systems/noteheads differ):
  The post-hoc string strip `unifiedAbc.split('\n').filter(!w:)` is mangling the
  music. Replace `unifiedAbcNoLyrics` with a natively-built no-lyrics body so the
  split-leaf staff goes through the exact same emission as inline. Preferred:
  build it from the same factory with lyrics suppressed, e.g.
  `const unifiedAbcNoLyrics = useMemo(() => stripWLinesStructurally(unifiedAbc), [unifiedAbc])`
  where the strip also removes now-orphaned artifacts (e.g. a music line that
  became empty, or consecutive blank lines) so abcjs sees a clean
  header + one-music-line-per-phrase body. Verify the header (`K:`,`M:`,`V:`,
  `%%score`) and every phrase music line are preserved 1:1 with inline; only
  `w:` lines disappear. If the real issue is the melisma-positions branch
  emitting a single merged line that reflows differently without w: anchors,
  keep the SAME music lines — do not re-split or re-merge them — since the goal
  is identical-to-inline geometry.

If root cause (B) SIZING (systems/noteheads already match):
  Make the split-leaf staff size the SAME way inline does. The intent behind
  Phase 04.9.14-01's `scale=1` decoupling was that A-/A+ should not resize the
  split-leaf staff — but it must still render at the same base geometry as
  inline at default zoom. Change `SPLIT_LEAF_NOTATION_SCALE`/the split scale so
  the split-leaf staff renders identically to inline at the default base size
  (i.e. use the default `DEFAULT_SIZE/14` ratio, or 1 only if inline default is
  also ~1) while remaining independent of the user's live baseSize. Also audit
  the `applyMinHeight = !chromeless && isPartialPage && minStaffHeight > 0`
  guard and `minStaffHeight` measurement effect (gated `viewMode !== 'staff'`,
  so it never measures in `staff-split`): confirm they do not squash or stretch
  the split-leaf staff. Keep inline Staff, inline Solfège, and split-leaf
  Solfège (JPG) branches untouched.

If root cause (C): apply both.

Keep the change minimal and localized to the staff/staff-split branch and the
`unifiedAbcNoLyrics`/`scale` derivations. Add a brief comment referencing this
quick task (260712-kov) and the UAT finding.
  </action>
  <verify>
    <automated>npx tsc --noEmit -p . 2>&1 | grep -v 'tests/.*\.spec\.ts' | grep -Eq 'error TS' && echo TSC_FAIL || echo TSC_OK; node tests/diagnostics/split-leaf-staff-diff.mjs 2>&1 | grep -E 'MATCH|DIAGNOSTIC-UNAVAILABLE'</automated>
  </verify>
  <done>`npx tsc --noEmit` reports no NEW errors in NotationRenderer.tsx (pre-existing errors in tests/*.spec.ts are out of scope). Re-running the Task 1 diagnostic reports systems and noteheads MATCH between Staff and Split-leaf Staff (lyrics count still 0 in split-leaf), or DIAGNOSTIC-UNAVAILABLE if the browser is down (in which case the human checkpoint is the gate).</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Split-leaf Staff notation now renders through a path that matches inline Staff
geometry, with only the interleaved w: lyric lines removed (lyrics render in the
separate StanzaList below/beside). Automated diagnostic confirms matching staff
systems and notehead counts, but engraving quality is a visual judgment that
must be confirmed in a real browser.
  </what-built>
  <how-to-verify>
1. Open the running site: `https://psalter.gsdlabs.dev/psalms/23` (or
   `http://localhost:3005/psalms/23`).
2. Open the Gear (settings) control. Under Notation choose Staff, under Layout
   choose Inline. Note how the staff looks (systems, notes, spacing).
3. Keep Staff selected, switch Layout to Split-leaf. The notation on top should
   look IDENTICAL to the inline staff you just saw — same number of staff lines,
   same notes/beaming, same size and spacing — just WITHOUT the little lyric
   words printed under the notes. The full lyrics should appear separately below
   the notation.
4. Repeat on a mobile-width window (~375px wide) and on a second psalm with a
   different tune/meter (e.g. a psalm using an LM or double-CM tune) to confirm
   it holds across meters.
5. Confirm inline Solfège and split-leaf Solfège (the scanned image view) still
   look the same as before (unchanged).
  </how-to-verify>
  <resume-signal>Type "approved" if split-leaf Staff matches inline Staff (minus lyric words) across both psalms and widths, or describe exactly what still looks wrong (e.g. "notes squished", "only 2 systems not 4", "notation tiny").</resume-signal>
</task>

</tasks>

<verification>
- `node tests/diagnostics/split-leaf-staff-diff.mjs` reports Staff vs Split-leaf
  Staff MATCH on systems + noteheads, lyrics=0 in split-leaf.
- `npx tsc --noEmit -p .` — no new errors in NotationRenderer.tsx.
- Human confirms split-leaf Staff visually matches inline Staff minus lyric words.
</verification>

<success_criteria>
Split-leaf Staff notation is visually identical to inline Staff notation except
that the interleaved w: lyric words are absent (lyrics shown separately), across
mobile and desktop widths and at least two tunes/meters. No regression to inline
Staff, inline Solfège, or split-leaf Solfège.
</success_criteria>

<output>
After completion, create
`.planning/quick/260712-kov-fix-split-leaf-staff-notation-rendering-/260712-kov-SUMMARY.md`
recording the confirmed root cause, the exact fix applied, and the human
verification result.
</output>
