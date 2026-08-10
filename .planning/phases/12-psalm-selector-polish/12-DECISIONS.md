---
phase: 12-psalm-selector-polish
type: decisions
gap_closure: true
decided: 2026-08-10T11:30:00Z
---

# Phase 12 Gap-Closure Decisions

Recorded by 12-04-PLAN.md Tasks 1 and 2. Plans 12-05 and 12-06 branch on these values.

D-GAP2: option-a
D-GAP3: stays-hidden

## D-GAP2 — Book I–V tab visibility rule (closes 12-VERIFICATION.md Gap 2)

**Chosen:** Show the tabs whenever the screen is narrow OR short (recommended)

**Developer's words:** "Narrow OR short screen (Recommended)"

**What 12-05 must implement:** The Book I–V jump tabs must be shown whenever the viewport is narrow (matching today's existing narrow-width condition) OR short (matching the height of a sideways phone, e.g. ~390–430px tall), and hidden only when the viewport is both wide and tall (the normal desktop/laptop case). This is a pure CSS/media-query rule evaluated at paint time — no JS measurement, no flicker, and no change to the current desktop-hidden behavior for ordinary wide+tall windows.

## D-GAP3 — "Show meter" and collapsed multi-version boxes (closes 12-VERIFICATION.md Gap 3)

**Chosen:** Closed multi-version boxes never show a tag, whatever the checkbox says

**Developer's words:** "re-appears when checked - but only for the individual versification (when expanded), no meter shown when collapsed"

**Deviation:** The developer's answer does not map cleanly onto either listed option's literal wording, so it required a reduction. Their "re-appears when checked" clause refers to the already-settled expanded-row behavior — i.e. once a multi-version group is opened, the individual version rows inside it each show their own meter tag when "Show meter" is checked. This is not new; it restates the baseline behavior both options already agreed was settled (see "Settled regardless of this choice" below). The decision-relevant part of their answer is the second clause: "no meter shown when collapsed" — stated as unconditional, with no exception for the checkbox state. Because the collapsed/closed toggle box shows no meter tag regardless of whether "Show meter" is checked or unchecked, this reduces to the `stays-hidden` token, not `reappears`. `reappears` would require the checked state to bring a tag back onto the *closed* box itself, which the developer explicitly ruled out.

**Settled regardless of this choice:** with "Show meter" unchecked, a collapsed multi-version toggle box shows no meter tag; once a group is expanded, every version row inside it shows its meter.

**What 12-06 must implement:** Collapsed multi-version toggle boxes must never render a `[data-meter-tag]`, in either state of the "Show meter" checkbox. The checkbox only controls whether meter tags are shown on (a) single-version psalm rows and (b) individual version rows inside an already-expanded multi-version group. Expanding a group is the only way meter information becomes visible for a multi-version psalm; the checkbox does not add a summary tag to the closed box.
