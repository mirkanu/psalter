---
phase: 14-launch-polish
plan: 01
subsystem: ui-polish
tags: [404-page, favicon, metadata-base, launch-polish]
requires: []
provides:
  - "Styled 404 page per UI-SPEC §1"
  - "Music favicon (icon.svg) + iOS home-screen icon (apple-icon.png)"
  - "metadataBase absolute URL for OG image resolution"
affects:
  - "Plan 14-02 (OG images depend on metadataBase)"
  - "All metadata-relative URLs now resolve to https://psalter.gsdlabs.dev"
tech-stack:
  added: []
  patterns:
    - "lucide-react Music icon for hymn/song branding"
    - "buttonVariants shared between Link and Button shadcn components"
    - "Next.js 15 app-directory icon conventions (icon.svg, apple-icon.png)"
key-files:
  created:
    - "src/app/icon.svg"
    - "src/app/apple-icon.png"
  modified:
    - "src/app/not-found.tsx"
    - "src/app/layout.tsx"
  deleted:
    - "src/app/favicon.ico"
decisions:
  - "Replaced minimal 19-line 404 with styled page per UI-SPEC §1: Music icon + two CTAs (primary 'Go home' + outline 'Browse psalms') + feedback hint paragraph"
  - "32x32 favicon uses oklch(0.205 0 0) (matches --primary) with 2px corner radius (matches --radius-sm aesthetic)"
  - "180x180 apple-icon.png uses inverted colors (white bg, dark #353535 glyph) per iOS conventions"
  - "metadataBase set to https://psalter.gsdlabs.dev as foundational for Plan 02 OG image absolute URLs"
  - "Removed legacy src/app/favicon.ico (not public/favicon.ico — this repo never had a public copy) so Next.js prefers icon.svg exclusively"
metrics:
  duration: "~10 min (including 4.4min build)"
  tasks: 2
  files: 4
  completed_date: 2026-08-11
---

# Phase 14 Plan 01: 404 + Favicon + metadataBase Summary

Styled 404 page (UI-SPEC §1), Music favicon for browser tab + iOS home screen, and `metadataBase` foundation for Plan 02 OG images.

## One-liner

Ship the locked styled 404 (Music icon + two CTAs + feedback hint), Music favicon (32x32 SVG + 180x180 inverted PNG), and `metadataBase` so Plan 02 OG images can resolve absolute URLs.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Rewrite not-found.tsx with locked styled 404 | e3080aa | src/app/not-found.tsx |
| 2 | Add favicon + apple-icon + metadataBase | e36bc68 | src/app/icon.svg (new), src/app/apple-icon.png (new), src/app/layout.tsx (modified), src/app/favicon.ico (deleted) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — favicon location] Deleted `src/app/favicon.ico` instead of `public/favicon.ico`**

- **Found during:** Task 2 setup (pre-check)
- **Issue:** Plan specifies `public/favicon.ico` but this Next.js 15 project stores its legacy favicon at `src/app/favicon.ico` (Next.js 13+ app-dir convention). `public/favicon.ico` does not exist in the repo. Plan's `ls public/favicon.ico 2>&1` acceptance check would have returned "No such file or directory" without any action; the intent of the step was clearly "remove the legacy favicon so Next.js prefers icon.svg".
- **Fix:** Deleted `src/app/favicon.ico`. Both `public/favicon.ico` (already absent) and `src/app/favicon.ico` (now removed) verify as missing. Net effect matches plan intent.
- **Files modified:** `src/app/favicon.ico` (deleted)
- **Commit:** e36bc68

### Other notes

- **apple-icon.png dimensions:** Plan's exact command `convert -density 300 -background none ...` produces a 562x562 PNG, not 180x180 (density 300 scales the 180-unit viewBox to 562px). Adjusted to `convert -density 96 -background white ... -resize 180x180` to satisfy the plan's `file` acceptance criterion of "PNG image data, 180 x 180". Visual output is equivalent — a 180x180 raster of the same SVG.
- **`buttonVariants` grep count:** Plan's Task 1 acceptance criterion says `grep -n 'buttonVariants' ... returns exactly 1 line (the import)` but the file legitimately references `buttonVariants` on 3 lines (1 import + 2 call sites for each CTA). The functional criterion (both CTAs use shadcn buttonVariants) is satisfied; the literal count was a plan authoring oversight.
- **File size:** not-found.tsx is 1151 bytes (plan expected 1200-1800 with verbatim snippet being ~1175). Within reasonable bounds; whitespace variance accounts for the difference.

## Acceptance Verification

| Criterion | Result |
| --------- | ------ |
| `grep "Browse psalms" not-found.tsx` returns 1 line | PASS |
| `grep "Feedback button" not-found.tsx` returns 1 line | PASS |
| `grep 'from "lucide-react"' not-found.tsx` returns 1 line | PASS |
| `buttonVariants` imported and used for both CTAs | PASS (3 lines: 1 import + 2 calls) |
| `&apos;` used for "doesn't" apostrophe | PASS (1 occurrence) |
| `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center` preserved | PASS |
| `file icon.svg` reports SVG | PASS |
| `file apple-icon.png` reports "PNG image data, 180 x 180" | PASS |
| `grep 'metadataBase' layout.tsx` returns 1 line | PASS (line 26: `metadataBase: new URL('https://psalter.gsdlabs.dev')`) |
| `public/favicon.ico` removed | PASS (was already absent) |
| `src/app/favicon.ico` removed | PASS (deleted; same intent) |
| `icon.svg` contains `viewBox="0 0 32 32"` and dark rect | PASS |
| `apple-icon.png` file size 1-30 KiB | PASS (2706 bytes) |
| `npm run build` passes with no TS errors | PASS (exit 0, .next artifacts include icon.svg + apple-icon.png) |
| `npm run lint` on changed files | PASS (no errors) |

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- src/app/not-found.tsx exists, contains required strings
- src/app/icon.svg exists, 32x32 SVG
- src/app/apple-icon.png exists, 180x180 PNG
- src/app/layout.tsx has metadataBase line
- src/app/favicon.ico deleted
- Commits e3080aa and e36bc68 present in git log
- npm run build exit code 0
