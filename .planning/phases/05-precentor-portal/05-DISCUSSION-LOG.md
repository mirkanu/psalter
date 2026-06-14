# Phase 5: Precentor Portal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 05-precentor-portal
**Areas discussed:** DB schema, Precenting mode routing, Psalm picker in Add Psalm modal, TunePickerModal filter behavior

---

## DB Schema

| Option | Description | Selected |
|--------|-------------|----------|
| New tables | Create precenting_sets + set_items — clean separation from Airtable-sourced historical data | ✓ |
| Extend existing tables | Add missing columns to events + service_items; airtableId becomes nullable | |
| You decide | Claude picks | |

**User's choice:** New tables
**Notes:** Historical events + service_items hold Airtable data and should remain read-only.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Roadmap fields only | date, type, note, created_at, updated_at on set; standard set_items fields | |
| Add precentor_name now | Same plus precentor_name (hardcoded 'Manuel', replaced by auth in Phase 05.1) | ✓ |
| You decide | Claude picks | |

**User's choice:** Add precentor_name now
**Notes:** Phase 05.1 will replace hardcoded name with Better Auth session display name.

---

## Precenting Mode Routing

| Option | Description | Selected |
|--------|-------------|----------|
| URL params on /psalms/[id] | ?set=123&pos=3 added to existing psalm view | |
| New /precent/[setId]/[pos] route | Dedicated route wrapping psalm view in precenting shell | ✓ |
| You decide | Claude picks | |

**User's choice:** New /precent/[setId]/[pos] route
**Notes:** Cleaner auth protection boundary for Phase 05.1; /psalms/[id] stays unchanged.

---

| Option | Description | Selected |
|--------|-------------|----------|
| /precent list; /precent/[id] detail; /precent/[id]/sing/[pos] singing | 3-level hierarchy | ✓ |
| /precent list+detail combined; /precent/[id]/sing/[pos] | Combined list/detail SPA-style | |
| You decide | Claude picks | |

**User's choice:** /precent list; /precent/[id] detail; /precent/[id]/sing/[pos]
**Notes:** Clean hierarchy, conventional Next.js routing.

---

## Psalm Picker in Add Psalm Modal

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse PsalmListingGrid | Dense numbered-box grid + instant search (same as /psalms page) | ✓ |
| Simple searchable list | Text input + scrollable list — lighter, purpose-built for modal | |
| You decide | Claude picks | |

**User's choice:** Reuse PsalmListingGrid
**Notes:** Familiar to precentor, no new component needed.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Optional, empty by default | Matches roadmap spec — empty means "all verses" | |
| Optional with placeholder hint | Same but shows "e.g. 1-3 (leave blank for all)" | ✓ |
| You decide | Claude picks | |

**User's choice:** Optional with placeholder hint `e.g. 1-3`
**Notes:** User clarified that verse selection code is not yet implemented — field is stored only, has no effect on rendering in Phase 5.

---

## TunePickerModal Filter Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Same-meter only by default, "Show all" toggle | Precentor sees matching tunes; toggle for others | |
| All tunes, sorted by match | Matching tunes first with badge; no filtering | |
| Full /tunes experience | Embed TuneGrid from search bar down, meter pre-selected but changeable | ✓ |

**User's choice:** Full /tunes experience (free-text response)
**Notes:** Modal should be the complete /tunes page UI (TuneGrid with search + meter filter) with the psalm's meter pre-selected. Precentor can change the filter freely. Mismatch warning shows on the set detail table row, not in the picker.

---

## Claude's Discretion

None — user made explicit choices for all gray areas.

## Deferred Ideas

None — discussion stayed within phase scope.
