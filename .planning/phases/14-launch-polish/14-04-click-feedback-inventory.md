# 14-04 Click-Feedback Inventory

Analysis snapshot of every clickable element in `src/` that needs `:active` press feedback per UI-SPEC §4. Generated 2026-08-11.

## Total counts

| Metric | Count |
|--------|-------|
| A. Existing `active:*` classes (`active:bg-muted\|active:translate-y-px\|active:scale`) | 36 |
| B. `<Link` usages | 46 |
| C. `<button` usages | 99 |
| D. `<a href` usages | 6 |

(Sub-task A in Task 2 normalizes the 0.97 scale; sub-task B adds `bg-muted` to scale-only instances; sub-task C appends the press-feedback pattern to remaining Link/button/a elements.)

## Dialog/Sheet/Popover files to SKIP (descendants excluded)

These files contain base-ui Dialog/Sheet/Popover descendants — their internal clickable elements are owned by base-ui and MUST NOT be modified:

- src/components/FeedbackModal.tsx
- src/components/PsalmPickerModal.tsx
- src/components/ChangeTuneDialog.tsx
- src/components/GlobalSearch.tsx
- src/components/PsalmTabs.tsx
- src/components/PsalmListingGrid.tsx (uses Tabs root — only Tab triggers are excluded; psalm boxes ARE updated)
- src/components/PsalmsByTuneSection.tsx (select-psalm dialog portion only; the wrapper Link at line 31 IS updated)
- src/components/precent/CreateSetForm.tsx (Sheet content; the button at line 242 is OUTSIDE the sheet — update)
- src/components/precent/PastePsalmsDialog.tsx
- src/components/precent/TunePickerModal.tsx
- src/components/precent/SetDetail.tsx (uses Dialog; lines 285/292/300 are OUTSIDE — update)
- src/components/precent/SetItemRow.tsx (uses Popover for menu; the row itself IS updated)
- src/components/singing/SingingView.tsx
- src/components/singing/MetadataPanel.tsx
- src/components/singing/GlassBottomBar.tsx
- src/components/singing/TuneSwitcherSheet.tsx
- src/components/singing/GearPopover.tsx
- src/components/singing/TuneSwitcherSheet.test.tsx
- src/components/tune-picker/TieredTuneRowList.tsx
- src/components/TuneTable.tsx (uses Tabs root)
- src/components/ui/dialog.tsx (shadcn primitive — exclude entirely)
- src/components/ui/sheet.tsx (shadcn primitive — exclude entirely)
- src/components/ui/popover.tsx (shadcn primitive — exclude entirely)
- src/app/daily/loading.tsx (Dialog loading state)
- src/app/dev/accounts/AccountsClient.tsx (uses Tabs/Popover; the button at line 165 IS outside — update)

`SiteHeader.tsx` and `SiteFooter.tsx` appear in the dialog file list because they OPEN dialogs. Their nav Links/buttons OUTSIDE the dialog wrappers ARE updated.

## Card-wrapper normalization list (0.97 → 0.98)

These 11 instances have `active:scale-[0.97]` and need to be normalized to `active:bg-muted active:scale-[0.98] transition-transform duration-75` (replacing any existing `transition-transform duration-75` they already had, since the new pattern includes the same utilities but adds `bg-muted`):

| File | Line | Notes |
|------|------|-------|
| src/components/PsalmNumberBox.tsx | 49 | Card wrapper in `baseClasses` array. Inside Dialog? No. UPDATE. |
| src/components/PsalmListingGrid.tsx | 270 | Verse-version toggle button. Inside Dialog? No. UPDATE. |
| src/components/PsalmsByTuneSection.tsx | 33 | Card-link wrapper. Outside Dialog. UPDATE. |
| src/app/dev/accounts/AccountsClient.tsx | 165 | Action button. Outside Popover. UPDATE. |
| src/components/singing/PsalmTopBar.tsx | 42 | Inline classNames string. Outside any sheet. UPDATE. |
| src/components/precent/SetDetail.tsx | 285 | Action button. Outside any dialog. UPDATE. |
| src/components/precent/SetDetail.tsx | 292 | Action button. Outside any dialog. UPDATE. |
| src/components/precent/SetDetail.tsx | 300 | Submit button (has `disabled:opacity-50` — preserve). Outside any dialog. UPDATE. |
| src/components/precent/CreateSetForm.tsx | 242 | Form submit button. Outside Sheet content. UPDATE. |
| src/components/precent/PastePsalmsDialog.tsx | 110 | Inside PastePsalmsDialog Dialog. SKIP. |
| src/components/PsalmPickerModal.tsx | 100 | Inside Modal. SKIP. |

## Card-wrapper class enrichment list (add `active:bg-muted`, already has `active:scale-[0.98]`)

| File | Line | Notes |
|------|------|-------|
| src/components/TuneGrid.tsx | 129 | `cardClasses` const. Already has `transition-all duration-200`. Replacement should keep `transition-transform duration-75` (per UI-SPEC pattern B). UPDATE with per-file Edit. |
| src/components/TuneAudioPlayer.tsx | 26 | Play-recording toggle button. Already has `transition-colors`. UPDATE. |
| src/components/PsalmListingGrid.tsx | 365 | `<Button>` ghost override `className` adds `active:scale-[0.98] px-0 hover:bg-transparent` to a Button primitive (which already has `active:translate-y-px`). The combined effect produces scale-down but no bg-muted flash. Since this is a Button primitive, the cleaner fix is to REMOVE `active:scale-[0.98]` (let Button's existing press state handle it). UPDATE: remove `active:scale-[0.98]` from this line. |
| src/components/TuneTable.tsx | 593 | Same as above — `<Button>` ghost override. UPDATE: remove `active:scale-[0.98]`. |

## New Link/button/a class additions

Files containing `<Link`, `<button`, or `<a href` elements that lack `active:bg-muted` / `active:translate-y-px`. **Excludes** Dialog/Sheet/Popover internals, Button shadcn primitive (`buttonVariants(...)`), and disabled elements.

| File | Elements | Action |
|------|----------|--------|
| src/components/SiteHeader.tsx | 4 nav `<Link>` callsites (line 103 logo, line 119 nav, line 163 sheet-wrapped, line 169 sheet-wrapped logout) + 2 plain `<button>` callsites (line 123 logout, line 129 search, line 142 search-mobile, line 179-189 sheet-wrapped footer buttons) + 1 `<a>` (line 200 hamburger "Made by GSD Labs") | Append Pattern A to logo Link, desktop nav Link, and the 4 plain buttons (theme toggle at line 41, search at 129, search-mobile at 142). The `<button onClick={handleLogout}>` line 123 and the Sheet-wrapped ones at 169/179-189 are inside Sheet context — apply Pattern A only to elements rendered outside any Sheet wrapper (the desktop nav block 117-138). |
| src/components/SiteFooter.tsx | 3 plain `<button>` (lines 15-17) + 1 `<a>` (line 19). Inside footer; outside any Dialog body. | Append Pattern A. |
| src/components/PsalmNav.tsx | 5 `<Link>` callsites (lines 53, 80, 110, 124, 151). All use `buttonVariants({ variant: 'outline' })` — Button primitive already handles press state. | SKIP — Button primitive handles it. |
| src/app/page.tsx | 1 `<Link>` (line 26) uses buttonVariants default | SKIP — Button primitive. |
| src/app/not-found.tsx | 2 `<Link>` use buttonVariants | SKIP. |
| src/app/explore/authors/[author]/page.tsx | 2 `<Link>` (line 43, 62). Line 43 is small inline `hover:text-foreground`. Line 62 is a card-like block. | Append Pattern A to line 43; Pattern B to line 62 if card-like, else Pattern A. |
| src/app/explore/messianic/page.tsx | 2 `<Link>` (lines 18, 46) | Append Pattern A. |
| src/app/explore/topics/[slug]/page.tsx | 2 `<Link>` (lines 76, 104). Line 104 is list link — Pattern A. | Append Pattern A. |
| src/app/explore/naves/[slug]/page.tsx | 1 `<Link>` (line 48) | Append Pattern A. |
| src/app/admin-only/page.tsx | 1 `<Link>` (line 8) | Append Pattern A. |
| src/app/psalms/[id]/study/page.tsx | 1 `<Link>` (line 139) | Append Pattern A. |
| src/app/daily/[day]/page.tsx | 2 `<Link>` (lines 34, 42) | Append Pattern A. |
| src/app/dev/sketch-viewer.tsx | 1 `<Link>` (line 55) | Append Pattern A. |
| src/components/DailyCalendarClient.tsx | 1 `<Link>` (line 127) | Append Pattern A. |
| src/components/DailyTodayCard.tsx | 1 `<Link>` (line 47) — uses buttonVariants | SKIP. |
| src/components/TodayCard.tsx | 1 `<Link>` (line 49) | Append Pattern A. |
| src/components/PsalmNumberBox.tsx | (handled in normalization list) | — |
| src/components/TuneGrid.tsx | (handled in enrichment list) | — |
| src/components/UnsubscribeButton.tsx | 1 `<Link>` uses buttonVariants | SKIP. |
| src/components/precent/PrecentingSetList.tsx | 1 `<Link>` (line 86) | Append Pattern A. |
| src/components/precent/PrecentingBar.tsx | 1 `<Link>` (line 15) | Append Pattern A. |
| src/components/PsalmsByTuneSection.tsx | (handled in normalization list, line 33) | — |
| src/components/QuotedInNT.tsx | 1 `<Link>` (line 108) | Append Pattern A. |
| src/components/NavesSubTopicList.tsx | 1 `<Link>` (line 65) | Append Pattern A. |
| src/components/NavesExpand.tsx | 1 `<Link>` (line 40) + 1 `<button>` (line 53) | Append Pattern A. |
| src/components/MessianicByTopic.tsx | 1 `<Link>` (line 18) | Append Pattern A. |
| src/components/ExploreTabShell.tsx | 2 `<Link>` (lines 52, 165) | Append Pattern A. |
| src/components/TuneScoreGallery.tsx | 5 `<button>` (lines 38, 47, 72, 83, 92) | Append Pattern A. |
| src/components/AuthorsTable.tsx | 1 `<button>` (line 57) | Append Pattern A. |
| src/app/dev/melisma-editor/MelismaEditorClient.tsx | 19 `<button>` callsites | Append Pattern A to each. |
| src/components/dev/accounts/AccountsClient.tsx | (handled in normalization list) | — |

### Skip (already correct or excluded)

- `<Button>` shadcn primitive + `buttonVariants()` callsites
- Disabled elements (`disabled:opacity-50 disabled:cursor-not-allowed`)
- Inside `<DialogContent>`, `<SheetContent>`, `<PopoverContent>` body content
- Test files (`*.test.tsx`)

## Audit baseline (pre-edit)

- `grep -rn 'active:bg-muted' src/ --include='*.tsx'` → 0
- `grep -rn 'active:scale-\[0\.97\]' src/ --include='*.tsx'` → 11
- `grep -rn 'active:bg-muted active:scale-\[0\.98\] transition-transform duration-75' src/ --include='*.tsx'` → 0
- `grep -rn 'active:bg-muted active:translate-y-px transition-all duration-75' src/ --include='*.tsx'` → 0
