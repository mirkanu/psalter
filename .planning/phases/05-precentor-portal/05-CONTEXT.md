# Phase 5: Precentor Portal - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

A precentor can create Precenting Sets (Date, Type, optional Note), build an ordered list of psalm+tune pairs with optional verse ranges, reorder them via drag-and-drop, and run a live precenting mode that navigates the set with an amber bar showing position. Auth is handled in Phase 05.1 — this phase hardcodes "Manuel" as precentor.

</domain>

<decisions>
## Implementation Decisions

### Database Schema
- **D-01:** Create new tables `precenting_sets` and `set_items` — do NOT extend or reuse existing `events` + `service_items` tables (those hold Airtable-sourced historical data and remain read-only).
- **D-02:** `precenting_sets` schema: `id` (serial PK), `date` (date, required), `type` (text: 'AM Service' | 'PM Service' | 'Other', required), `note` (text, nullable), `precentor_name` (text, default 'Manuel' — replaced by auth session in Phase 05.1), `created_at` (timestamp), `updated_at` (timestamp).
- **D-03:** `set_items` schema: `id` (serial PK), `set_id` (FK → precenting_sets), `psalm_id` (FK → psalms), `tune_id` (FK → tunes, nullable), `verse_range` (text, nullable — free text like "1-3", stored but not yet used in rendering), `position` (integer — determines display order).

### Routing
- **D-04:** Precentor portal lives at `/precent/*` routes:
  - `/precent` — list of all Precenting Sets
  - `/precent/[id]` — set detail (create/edit psalm+tune rows, reorder, start precenting)
  - `/precent/[id]/sing/[pos]` — precenting mode (1-based position in set)
- **D-05:** Precenting mode (`/precent/[id]/sing/[pos]`) is a **new dedicated route** that renders the existing psalm singing view inside a precenting shell (amber bar, position counter, nav arrows). This keeps `/psalms/[id]` clean and makes auth protection in Phase 05.1 straightforward.

### Psalm Picker
- **D-06:** The "Add Psalm" modal uses the existing `PsalmListingGrid` component (dense numbered-box grid + instant search) — same as `/psalms`. Reuses established UI and search behavior.
- **D-07:** After selecting a psalm, an inline verse range input appears in the modal with placeholder text `e.g. 1-3 (leave blank for all)`. Field is optional and free-text. Value is stored in `set_items.verse_range` but has no effect on rendering in Phase 5 (verse selection not yet implemented).

### Tune Picker
- **D-08:** TunePickerModal embeds the full `/tunes` page experience (TuneGrid component, from search bar down) with the psalm's meter pre-selected in the meter filter. The precentor can clear or change the meter filter freely. The mismatch warning appears on the **set detail table row** (not in the picker) when the selected tune's meter differs from the psalm's meter.

### Phase 05.1 Handoff
- **D-09:** `precentor_name` on `precenting_sets` is hardcoded to `'Manuel'` in Phase 5. Phase 05.1 replaces this with the logged-in user's display name from the Better Auth session.
- **D-10:** All `/precent/*` routes are built as regular (unprotected) routes in Phase 5. Phase 05.1 adds route protection middleware.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 5 — Full goal, success criteria (6 items), and requirements list (PREC-01 through PREC-06, AUTH-01, AUTH-02)
- `.planning/REQUIREMENTS.md` — PREC-01 through PREC-06 and AUTH-01/AUTH-02 requirements

### Existing Code — Key Components to Reuse
- `src/components/PsalmListingGrid.tsx` (or equivalent) — reuse for psalm picker modal (D-06)
- `src/components/TuneGrid` / `/tunes` page — reuse TuneGrid for TunePickerModal (D-08)
- `src/app/psalms/[id]` — singing view to wrap inside `/precent/[id]/sing/[pos]` (D-05)

### Existing DB Schema
- `src/db/schema.ts` — defines existing `events` + `service_items` tables (read-only from Phase 5 onwards); also where new `precenting_sets` + `set_items` tables go

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PsalmListingGrid` (dense numbered-box grid + instant search): embed inside the Add Psalm modal — no need to build a new psalm picker
- `TuneGrid` with meter filter: embed inside TunePickerModal with meter pre-selected — full tune browsing experience
- Existing singing view at `/psalms/[id]`: wrap inside `/precent/[id]/sing/[pos]` — add amber precenting bar above content
- `shadcn/ui` Dialog/Sheet components: available for modals (Add Psalm, TunePicker)
- `dnd-kit`: not yet installed — needs adding; roadmap specifies pointer-event-based drag for mobile compatibility

### Established Patterns
- Drizzle ORM + postgres.js for DB access — follow existing patterns in `src/db/`
- Server Actions or API routes for mutations (create set, add psalm, reorder) — follow pattern from existing mutation code
- `'use client'` components for interactive UI (drag-and-drop, modals); RSC for data-fetching wrappers

### Integration Points
- New `precenting_sets` + `set_items` tables added to `src/db/schema.ts` alongside existing tables
- `/precent/[id]/sing/[pos]` imports and wraps existing singing view component — amber bar rendered above it
- SiteHeader needs a "Precent" nav item (already planned in roadmap success criteria item 1)

</code_context>

<specifics>
## Specific Ideas

- TunePickerModal is explicitly "the full /tunes page experience from search bar down" with meter pre-selected — not a simplified list. This means TuneGrid must be extractable as a self-contained component that accepts an initial meter prop.
- Precenting mode amber bar shows format: "3/4" with "Precenting Mode" label; left/right nav arrows also amber; back arrow hidden on first psalm, forward on last (per roadmap success criteria item 6).
- "Start Precenting" button on set detail is described as "light orange" in roadmap — use amber/orange Tailwind color consistent with the amber bar.
- Meter mismatch warning: row-level highlight on the set detail table (not in picker). Roadmap says "visible 'Warning: meter mismatch' indicator".

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-precentor-portal*
*Context gathered: 2026-06-14*
