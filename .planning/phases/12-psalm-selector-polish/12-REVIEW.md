---
phase: 12-psalm-selector-polish
reviewed: 2026-08-10T14:06:23Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/components/PsalmListingGrid.tsx
  - src/components/PsalmListingGrid.test.tsx
  - src/components/PsalmNumberBox.tsx
  - src/components/PsalmNumberBox.test.tsx
  - src/app/globals.css
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-08-10T14:06:23Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the five source files touched by phase 12's gap-closure plans 12-05 (search placeholder + Book I-V tab visibility), 12-06 (collapsed meter tag gating), and 12-07 (meter overlay/sizing fix). Cross-checked against `git diff` for the exact commit range (`b076ea8^..10811e4`) to separate newly introduced code from pre-existing code that happened to sit in the same files.

No critical/security issues found. `npx tsc --noEmit` is clean for both components, all 46 relevant vitest tests pass, and `npx next build` succeeds with the `tabs-off` custom variant confirmed present in the compiled CSS chunk (`min-width:768px)and(min-height:600px)`). The five `tabs-off:`/`pr-*` sync points described in the 12-05 summary are consistently applied — no stray leftover `md:` breakpoint on the Book-tab machinery.

Findings below are either latent bugs uncovered while reading the surrounding code the phase touched, or maintainability gaps in the new logic itself. None block the gap closures from functioning as measured/tested in the phase's own live-browser verification; they are raised because they either reduce future robustness or already exist in code this phase edited without being noticed/fixed.

## Warnings

### WR-01: `className` prop is silently dropped whenever the box renders in "content" mode

**File:** `src/components/PsalmNumberBox.tsx:46-56`
**Issue:** `baseClasses` only appends the caller-supplied `className` prop inside the `!hasContent` (compact) branch's template literal:
```tsx
hasContent
  ? "flex flex-col py-2 px-2 min-h-[44px] min-w-[44px]"
  : `flex items-center justify-center relative min-w-[44px] h-12 md:h-14${className ? ` ${className}` : ''}`,
```
Since 12-07 changed `hasContent` to also become `true` whenever `meterLabel` is non-null (`showFirstLine || showRecommendedTune || !!snippet || !!meterLabel`), the set of states where a caller's `className` is honored just shrank further — any consumer that shows a meter, snippet, first line, or recommended tune and also passes `className` will have that class silently discarded. This bug pre-dates phase 12 (introduced in commit `68fe6ce4`, 2026-05-11), but 12-07 edited this exact ternary block (added the `meterLabel`-driven condition, added `shrink-0`) without noticing or fixing the asymmetry. No current caller passes `className` to `PsalmNumberBox` (confirmed via `grep -rn "PsalmNumberBox\b"` — only `PsalmListingGrid.tsx` renders it, and none of its three call sites pass `className`), so this is currently dormant, but it will silently misbehave for the next caller that does.
**Fix:** Append `className` unconditionally, e.g. build the array and `.filter(Boolean).join(' ')` after appending `className` once at the end, instead of embedding it inside only one branch:
```tsx
const baseClasses = [
  "block rounded-lg",
  "hover:border-primary transition-colors duration-200",
  "active:scale-[0.97]",
  hasContent
    ? "flex flex-col py-2 px-2 min-h-[44px] min-w-[44px]"
    : "flex items-center justify-center relative min-w-[44px] h-12 md:h-14",
  isHighlighted ? "bg-primary/5 border-primary border-2" : "bg-card border border-border",
  className,
].filter(Boolean).join(' ')
```

### WR-02: `5.5rem` meter-column width is a duplicated magic string with no single source of truth

**File:** `src/components/PsalmListingGrid.tsx:196, 292`
**Issue:** The plan's own summary calls this value "METER_COL" and treats it as a derived constant (measured: 21px label + 33px abbreviation + 20px margin = 74px, rounded up to 88px/5.5rem), but it is never actually extracted into a named constant. It appears as a bare literal string in two places — the `gridCols` ternary (line 196) and the expanded panel's hardcoded inner-grid className (line 292) — plus a third conceptual sync point implied by the "3.5rem / 5.5rem / 7rem" column-sizing comment. If the value is revised in the future (e.g. a new meter pattern is added and the measurement changes), it's easy to update one occurrence and miss the other; only the two Gap-4 tests that separately assert on each grid's className would catch the drift, and there is no compiler-enforced link between them.
**Fix:** Extract a `const METER_COL = "5.5rem"` (and ideally `NARROW_COL`/`WIDE_COL` siblings) near `BOOKS`, and interpolate it into both class strings, e.g. via a small helper that still emits the literal Tailwind arbitrary-value class Tailwind's JIT scanner can statically see (template literals with a single static variable are fine for JIT since the full class string is still present verbatim at each call site — verify this still satisfies Tailwind's static-analysis requirement before relying on it, or keep both literals but add a same-file comment cross-reference plus a regression test asserting the two literals are textually identical).

### WR-03: `groupMeterTag` is now dead in production code but still exported and only exercised by its own unit test

**File:** `src/components/PsalmListingGrid.tsx` (import removed by 12-06); `src/lib/meter-abbrev.ts:38-44` (unchanged, out of this review's file scope but directly affected)
**Issue:** 12-06 correctly removed the `import { groupMeterTag } from "@/lib/meter-abbrev"` and its only call site from `PsalmListingGrid.tsx` as part of implementing D-GAP3 "stays-hidden". `groupMeterTag` is exported from `meter-abbrev.ts` but, after this change, has zero production callers anywhere in `src/` (confirmed via `grep -rn "groupMeterTag" src` — the only remaining references are its own definition and its own 8-case test suite in `meter-abbrev.test.ts`). It is not flagged by `tsc` because it's still exported and tested, so it will not surface as obviously dead code in normal CI.
**Fix:** Either delete `groupMeterTag` and its test block now that D-GAP3 permanently retired the "reappears" behavior it existed to support, or add a one-line comment above its definition noting it is currently unused in production and retained only for a possible future "reappears" spec change — so the next reader doesn't have to archaeology-dig through phase 12's decisions doc to find out why an exported, tested function has no callers.

## Info

### IN-01: Leftover `relative` utility class on the now-childless compact branch

**File:** `src/components/PsalmNumberBox.tsx:52`
**Issue:** The compact (`!hasContent`) branch's className still includes `relative`: `` `flex items-center justify-center relative min-w-[44px] h-12 md:h-14...` ``. This was needed pre-12-07 to position the absolutely-positioned meter overlay span (`absolute top-1 right-1.5`, deleted by commit `ff71ce8`). With that span gone, the compact branch's `inner` JSX (line 86-91) renders only a single centered `<span>` with no positioned descendant, so `relative` is now dead CSS on this branch.
**Fix:** Drop `relative` from the compact-branch string (cosmetic cleanup only, no behavior change): `` `flex items-center justify-center min-w-[44px] h-12 md:h-14...` ``.

### IN-02: `[data-meter-tag]` assertions in the PSEL-02 describe block are vacuously true

**File:** `src/components/PsalmListingGrid.test.tsx:148, 159-161`
**Issue:** The `data-meter-tag` attribute no longer exists anywhere in `PsalmListingGrid.tsx` (12-06 deleted the entire block that rendered it). `expect(toggle(container, 6).querySelector('[data-meter-tag]')).toBeNull()` will therefore always pass, including under a regression where someone reintroduces a *different* meter-tag marker (e.g. a class-based indicator instead of a `data-*` attribute) — the test would not catch it. This isn't a false-positive risk today, just a weaker-than-it-looks regression guard.
**Fix:** Consider asserting on visible text content instead/in addition, e.g. `expect(toggle(container, 6).textContent).not.toMatch(/CM|LM|SM|HM/)`, so the guard is tied to what a user would actually see rather than to an attribute name that could simply be renamed away.

### IN-03: `title` attribute is not a reliable accessibility signal, and the toggle now conveys no meter info to any assistive tech

**File:** `src/components/PsalmListingGrid.tsx:275`
**Issue:** Not a regression introduced by 12-06 (the pre-existing code also relied on `title` for the meter hint), but worth flagging since 12-06 simplified `title` to a plain string as part of "closing" Gap 3: `title` attributes are not reliably announced by screen readers and are not shown on touch devices at all, so even before this change the meter-tag hint in `title` was effectively invisible to a large slice of users. This is now moot for the collapsed state (no meter hint is shown there by design), but the same pattern is not otherwise flagged for the expanded panel, which conveys meter purely via visible text (fine) — no action needed here beyond noting the `title` pattern is not a robust accessibility mechanism if it resurfaces in a future gap-closure plan.
**Fix:** No action required for this phase; noted for awareness only.

---

_Reviewed: 2026-08-10T14:06:23Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
