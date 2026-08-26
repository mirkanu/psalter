# Archive: Inline Staff A+/A− Zoom

This branch is an archival snapshot of the inline-staff A+/A− dynamic zoom feature at its peak working state, before the feature was hidden in `staff-inline` view.

**Base commit:** [`e14f59f`](https://github.com/mirkanu/psalter/commit/e14f59f) on master history.

## Why this branch exists

The A+/A− feature for inline-staff was hidden on 2026-08-26 (commit [`b81adbc`](https://github.com/mirkanu/psalter/commit/b81adbc)) because A+ made lyrics *smaller* per sub-row rather than larger — the opposite of what users want. All machinery is preserved on master for future revisit; this branch freezes the working code as it shipped at the zoom peak.

## See also

- **Canonical doc (on master):** [`.planning/research/inline-staff-zoom.md`](https://github.com/mirkanu/psalter/blob/master/.planning/research/inline-staff-zoom.md)
- **GitHub Issue:** [#1 — Inline Staff A+/A− zoom — design, history, and future direction](https://github.com/mirkanu/psalter/issues/1)

## How to use this branch

```sh
git fetch origin archive/inline-staff-zoom
git checkout archive/inline-staff-zoom
```

The code on this branch is identical to master at commit `e14f59f`. The A−/A+ buttons are visible and active when `viewMode === 'staff'`.
