---
quick_id: 260719-kn6
status: complete
---

# Quick Task 260719-kn6: Fix mobile modal padding for About, Copyright, and Feedback modals

**Task:** On mobile ensure About, Copyright and Feedback modals have same left/right padding as the New Set modal on `/precent`.

## Root cause

The base `DialogContent` (`src/components/ui/dialog.tsx`) sets `max-w-[calc(100%-2rem)] sm:max-w-sm`, which gives a 1rem side gap on mobile. The New Set modal correctly overrides only at `sm:` (`sm:max-w-[420px]`), preserving that gap. The About, Copyright, and Feedback modals used unqualified `max-w-md`/`max-w-lg`, which tailwind-merge applies at all breakpoints — overriding the mobile gap and stretching the modal edge-to-edge.

## Fix

Scoped all five overrides to the `sm:` breakpoint (no change to `dialog.tsx`):

- `src/components/SiteHeader.tsx` — About dialog `max-w-md` → `sm:max-w-md`, Copyright dialog `max-w-lg` → `sm:max-w-lg`
- `src/components/SiteFooter.tsx` — About dialog `max-w-md` → `sm:max-w-md`, Copyright dialog `max-w-lg` → `sm:max-w-lg`
- `src/components/FeedbackModal.tsx` — Feedback dialog `max-w-lg` → `sm:max-w-lg`

## Verification

- `grep` confirms no unqualified `max-w-md`/`max-w-lg` remain on the three modals' `DialogContent`.
- `npx tsc --noEmit` — no new errors introduced (pre-existing errors are in unrelated Playwright test files).
- Desktop widths unchanged (overrides still apply at `sm:` and up).

## Files modified

- `src/components/SiteHeader.tsx`
- `src/components/SiteFooter.tsx`
- `src/components/FeedbackModal.tsx`
