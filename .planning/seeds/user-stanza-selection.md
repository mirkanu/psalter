---
title: User stanza selection for singing
trigger_condition: After the psalter-alignment-implementation seed lands (structured Stanza/Verse data model exists)
planted_date: 2026-05-17
---

# User Stanza Selection

## Trigger

Depends on the structured stanza/verse data model produced by the `psalter-alignment-implementation` seed. Without that, "select which stanzas to sing" cannot be expressed coherently — the current single-blob lyrics field offers no stanza handles.

## Scope (anticipated)

- UI on the singing view to let the user pick which stanzas to display/sing
- Complexity: a Bible verse can span multiple stanzas, and a stanza can contain multiple verses — the selector needs to communicate this clearly (e.g. "Stanzas 3–5 (covers Bible vv. 4–6)")
- Persist selection per psalm in the precentor's session (and maybe in saved set lists for Phase 5)
- Interaction with the staff view: hide non-selected stanzas, renumber displayed stanzas, ensure the tune still loops correctly for DCM

## Dependencies

- `psalter-alignment-implementation` seed must have completed
- May want to align with Phase 5 (Precentor Portal) so set lists can persist stanza selections
