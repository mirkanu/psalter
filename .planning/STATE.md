---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Public Beta
status: executing
stopped_at: Phase 15.2 complete -- POLISH-03 closed via Google PageSpeed Insights (96/100/100 on / / /psalms / /psalms/23); local Lighthouse was unreliable due to VPS CPU contention
last_updated: "2026-08-13T00:00:00.000Z"
last_activity: 2026-08-13 -- Phase 15.2 closed via real-world PageSpeed Insights verification (96/100/100 on /, /psalms, /psalms/23); all v1 milestones complete except POLISH-01/02/04 (out of 15-phase scope)
progress:
  total_phases: 12
  completed_phases: 9
  total_plans: 51
  completed_plans: 51
  percent: 98
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-29 after v1.0 and v1.1 milestone close)

**Core value:** A precentor during worship can instantly find the psalms chosen for a service and follow live-rendered tune notation with lyrics beneath the notes — without relying on slow Softr or static images.
**Current focus:** Phase 15 — Lighthouse 90+ ✅ complete; next priority is Phase 10 (Tune Data Fixes)

## Current Position

Phase: 15.2 (Lighthouse final TBT reduction) — COMPLETE (3/3 plans)
Plan: 15.2-03 of 3
Status: Phase 15.2 complete; POLISH-03 closed via Google PageSpeed Insights (96/100/100 on / / /psalms / /psalms/23)
Last activity: 2026-08-21 -- Completed quick task 260821-p2y (3 follow-up rounds): fixed 4 homepage issues from Playwright review, masonry-flowed the card grid + rebalanced Daily font size, then fixed multicol gap cross-browser safety + simplified the Daily card to a single sentence with a small psalm-ref badge (master @ b519bb8); previous quick task 260817-ssc: homescreen rebuild to mirror Softr layout (master @ 0f57a6c); Phase 15.2 closed previously; POLISH-03 flipped to `[x]` complete based on external Lighthouse measurement (Lighthouse v13.4.1, emulated Moto G Power, Slow 4G, run from Google's data centers — no VPS CPU contention)

**Authoritative Lighthouse record:** `.planning/phases/15.2-lighthouse-final-tbt-reduction/15.2-pagespeed-insights-results.txt` (Google PageSpeed Insights, scores 96/100/100). Supplementary: `15.2-FINAL-ANALYSIS.md` (median-of-5 localhost measurements + measurement-noise disproof). The local Lighthouse harness (`scripts/lighthouse-bench.mjs --runs 5`) remains useful for CI/PR regression gates, but its measurements on this 3.7GB VPS are dominated by host CPU contention and cannot detect anything smaller than a ~10-point change.

## Performance Metrics

**Velocity:**

- Total plans completed: 86
- Average duration: 22 min
- Total execution time: ~1.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 Foundation | 5/5 | ~110 min | 22 min |
| 01 | 5 | - | - |
| 3 | 6 | - | - |
| 04.9.3 | 6 | - | - |
| 04.9.4 | 5 | - | - |
| 04.9.10 | 2 | - | - |
| 04.12 | 5 | - | - |
| 05.1 | 5 | - | - |
| 05.2 | 3 | - | - |
| 04.9.13 | 3 | - | - |
| 04.9.15 | 5 | - | - |
| 06 | 3 | - | - |
| 07 | 3 | - | - |
| 08 | 4 | - | - |
| 09 | 7 | - | - |
| 10 | 5 | - | - |
| 11 | 6 | - | - |
| 12 | 8 | - | - |

**Recent Trend:**

- Last 5 plans: 01-01 (20 min), 01-02 (36 min), 01-03 (10 min), 01-04 (49 min), 01-05 (15 min)
- Trend: Phase 01 complete

*Updated after each plan completion*
| Phase 01 P04 | 49 | - tasks | - files |
| Phase 01 P05 | 15 | 1 task | 1 file |
| Phase 02 P02 | 10 | 2 tasks | 5 files |
| Phase 02 P03 | 25 | 2 tasks | 6 files |
| Phase 03 P02 | 5 | 2 tasks | 2 files |
| Phase 03 P03 | 8 | 2 tasks | 2 files |
| Phase 04 P01 | 15 | 2 tasks | 4 files |
| Phase 04 P02 | 20 | 2 tasks | 2 files |
| Phase 04 P03 | 5 | 1 task | 1 file |
| Phase 04.5 P03 | 15 | 2 tasks | 3 files |
| Phase 04.5 P04 | 15 | 2 tasks | 1 file |
| Phase 04.7 P02 | 25 | 3 tasks | 4 files |
| Phase 04.9.3 P05 | 12 | 3 tasks | 5 files |
| Phase 04.9.7 P01 | 10min | 2 tasks | 5 files |
| Phase 04.9.8 P05 | 41 | 3 tasks | 3 files |
| Phase 04.11 P04 | 19m | 4 tasks | 5 files |
| Phase 04.12 P05 | 25 | 2 tasks | 3 files |
| Phase 05-precentor-portal P01 | 1015 | 3 tasks | 11 files |
| Phase 05 P04 | 900 | 3 tasks | 7 files |
| Phase 04.9.14 P01 | 45 | 6 tasks | 6 files |
| Phase 04.9.14 P02 | 35 | 4 tasks | 3 files |
| Phase 04.9.14 P03 | 30 min | 5 tasks | 3 files |
| Phase 04.9.15 P05 | 215 min | 3 tasks | 3 files |
| Phase 07 P03 | 20 min | 3 tasks | 2 files |
| Phase 08 P04 | 30 min | 3 tasks | 2 files |
| Phase 09-changelog P07 | 35 min | 3 tasks | 1 files |
| Phase 10 P01 | 12min | 3 tasks | 3 files |
| Phase 10 P02 | 18 min | 2 tasks | 4 files |
| Phase 10 P03 | 12min | 4 tasks | 12 files |
| Phase 10 P04 | 20 min | 3 tasks | 5 files |
| Phase 10 P05 | 15 min | 3 tasks | 5 files |
| Phase 12 P04 | 10min | 1 tasks | 1 files |
| Phase 12 P05 | 14min | 3 tasks | 3 files |
| Phase 12 P06 | 10min | 2 tasks | 2 files |
| Phase 12 P07 | 17min | 3 tasks | 4 files |

## Accumulated Context

### Roadmap Evolution

- v2.0 Public Beta roadmap created 2026-07-29: 9 phases (6-14), continuing numbering from v1.1's last phase (05.3). Derived from research/SUMMARY.md's 6-phase suggestion (Security prereqs -> Resend provisioning -> Feedback -> Changelog -> Tune Data Fixes -> Embed player+JPEG compression), split into 9 to fold in Psalm Selector (12), Tune Selector consolidation (merged into 11), and Tune List display/mobile/sticky-header (11) as their own coherent phases, and to separate Assets/JPEG compression (13) from the embed player (kept in 11 with Tune List, since both touch TuneTable.tsx) so compression's Phase 6 backup dependency stays explicit. Phase 14 (Launch Polish) absorbs the old Backlog Phase 999.2 scope and runs last since it depends on routes finalized by every other phase. 31/31 requirements mapped, no orphans.
- Phase 4.9.12 added: Melisma positions as tune-level data — strip w: lines from stored ABC, add tunes.melisma_positions jsonb column, migrate 17 approved tunes, update save route + editor + NotationRenderer to use positions at render time (dropping embedded-w: branch)
- Phase 4.9.4 inserted after Phase 4.9.3: Staff View Refinements & Onboarding — header cleanup, first-run tour, dynamic zoom, glass bottom bar, A+/A- relocation, Play/Gear split (URGENT)
- Phase 4.9.6 inserted after Phase 4.9.5: Psalter Alignment Implementation — promotes seeds/psalter-alignment-implementation.md; consumes Phase 4.9.5 doc; fixes DCM/alternate-meter/amen alignment bugs (URGENT)
- Phase 04.9.8 inserted after Phase 04.9.7: Staff Display Word Alignment Fix — 4 PHRASE_BREAKs per CM tune, z2 phantom-bar fix, archaic word overrides (URGENT)
- Phase 5 edited: edited fields: goal, requirements, success_criteria — full precentor portal redesign with Precenting Sets, psalm table, meter mismatch checker, precenting mode
- Phase 05.1 inserted after Phase 5: Auth Gate — Better Auth login, route protection, admin-created accounts, auto-populate Precentor from session (URGENT)
- Phase 04.9.15.1 inserted after Phase 4.9.15: Inline Staff Landscape Fit + Swipe Stanza Navigation — captured from /gsd-explore session; not urgent, queued for later planning

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: TUNE-02/03/04 (abcjs rendering) scoped to Phase 4; Phase 2 uses JPG fallback only
- [Init]: PERF-01/PERF-02 deferred to Phase 6 Polish (applied consistently across all routes after portal is complete)
- [Init]: Four-part SATB harmonisation out of scope — copyright check required
- [Init]: Admin UI (Directus/NocoDB) deferred post-launch; Airtable continues editorial role
- [01-01]: psalter_tunes Docker named volume replaces Cloudflare R2 for tune JPG storage — simpler, no external dependency
- [01-01]: Port 5435 for psalter-db to avoid conflict with other DB containers on this server
- [01-02]: shadcn Nova preset used (--style new-york flag removed from shadcn v4.7.0 CLI; Nova is equivalent)
- [01-02]: DATABASE_URL never hardcoded — always via process.env in src/db/index.ts
- [01-02]: tw-animate-css@1.4.0 replaces deprecated tailwindcss-animate for Tailwind CSS 4 compatibility
- [01-03]: psalms.id = integer PK (actual psalm number 1-150) — stable URL slugs, meaningful FK references
- [01-03]: tunes.score_jpg_url stores local Docker volume paths (not R2 URLs) per Plan 01-01 decision
- [01-03]: additional_score_urls as jsonb on tunes handles multi-attachment tune records
- [Phase ?]: SKIP_IMAGES=1 env flag added to migration — tune JPGs total ~1.1GB, larger than 38GB VPS root partition can accommodate; disk must be expanded before full image download
- [Phase ?]: Airtable field names must be verified via Meta API before migration — research-phase assumptions were incorrect for 6 fields across 4 tables
- [02-01]: vitest.config.mts (not .ts) required — vite-tsconfig-paths is ESM-only; .mts extension forces ESM module resolution
- [02-01]: Three reverse relations (sectionHeadingsRelations, messianicPsalmsRelations, dailyReadingsRelations) were missing from schema — added as part of plan execution
- [02-01]: psalter-db postgres password was out of sync with .env; reset via ALTER USER to restore test connectivity
- [02-02]: SiteHeader is RSC (no 'use client') — no auth state or active-link detection needed in Phase 2
- [02-02]: getDayOfYear wraps day 366 to day 1 via modulo to keep 365-entry plan bounded on leap years
- [02-02]: toEmbedUrl regex restricts extracted video IDs to [\w-]+ — mitigates T-02-04 injection risk
- [02-03]: Schema uses lyrics (not stanzas) and versionLabel (not versionName) on psalmVersions; sectionHeadings has no verseEnd column — components use actual schema field names
- [02-03]: PsalmTabs isTabValue() type guard restricts ?tab= to 4 known values; unknown values fall back to "overview" (T-02-08 mitigated)
- [02-03]: Base UI Select onValueChange wraps setter in arrow function to handle null value and discard eventDetails argument
- [02-04]: YouTubeEmbed kept as RSC — toEmbedUrl runs server-side, no client state needed; iframe sandbox restricts capabilities (T-02-13)
- [02-04]: soundcloudUrl ignored in Phase 2 — all 27 DB values are placeholder text ("missing", "need to upload")
- [02-04]: youtubeUrl field stores both YouTube and non-YouTube media URLs; toEmbedUrl returns null for non-YouTube, enabling plain link fallback
- [02-05]: TodayCard is 'use client' — today detection must run on mount; useState(null) initial avoids static-render mismatch
- [02-05]: DailyPlanClient reveals today-badge by DOM mutation (removes 'hidden'), not React state — avoids hydration race on static /daily page
- [02-05]: dailyReadings.dayNumber is nullable in schema — RSC filters null entries before passing to TodayCard ReadingProp (dayNumber: number)
- [02-05]: data-[today]: Tailwind selector (empty-string attribute set by DailyPlanClient) used for today row highlight — no inline script needed
- [03-03]: SiteHeader converted to 'use client' — usePathname() requires client boundary; minimal impact as header is already at the root of every page layout
- [03-03]: TuneGrid initialises meter from useSearchParams on mount — enables sharing filtered tune URLs
- [03-03]: encodeURIComponent applied to meter value in router.replace — defensive encoding for meter strings with special characters
- [03-06]: /tunes page delegates to TuneGrid client component via Suspense boundary; RSC retains fetchAllTunes data fetch
- [04-02]: "Old 100th" is the exact DB name for Old Hundredth tune; LM meter stored as "LM (long meter, 88 88)" not abbreviated "LM"
- [04-02]: St. Michael absent from DB; Trentham (SM) substituted to maintain CM(3)+LM(1)+SM(1) coverage
- [04-02]: Pre-existing score_jpg_url test failure is out-of-scope disk constraint from Phase 1 — not fixed in Phase 4
- [04.5-04]: Two-effect localStorage pattern used in PsalmNotationPlayer: separate restore-on-mount and persist-on-change effects to avoid race conditions
- [04.5-04]: psalter-db container password mismatch diagnosed and fixed via ALTER USER — db was initialised with stale credentials; production verified via E2E curl tests
- [04.7-02]: renderSnippet uses strong (not b) — Wave 0 Playwright stub selects [data-psalm-box] strong; globals.css updated to target both b and strong
- [04.7-02]: psalter-db password re-fixed via ALTER USER (regressed between sessions); .env password is 'postgres'
- [04.9.2-01]: Phrase-split + stanza-cycle library (splitOnPhraseBreaks, buildPhraseAbc, phrasesForMeter, splitStanzaIntoPhrasePortions, buildAbcWithSyllables, groupStanzasIntoCycles, mapCycleToPhraseSyllableLines) — pure functions, fully unit-tested
- [04.9.2-02]: % PHRASE_BREAK markers backfilled into 75 tunes.abc_notation rows via annotate-phrase-breaks script; SATB column NOT yet backfilled (follow-up)
- [04.9.2-03]: AbcPlayer scale prop, FullscreenOverlay component, --staff-base-size CSS var, .verse-text / .verse-number utility classes
- [04.9.2-04]: NotationRenderer + NotationRendererClient (dynamic ssr:false wrapper) implementing D-19 (one row per phrase), D-20 (stanza-cycle pairing), D-21 (two-axis pagination, tune-half flips first)
- [04.9.2-05]: pickAbcWithMarkers selects ABC variant containing % PHRASE_BREAK markers (preserves D-19 when tune has both abc_notation and abc_satb)
- [04.9.2-05]: Single AbcPlayer instance replaces per-phrase array — visual N-row layout via ABC native newlines; preserves D-19 while enabling single synth, single BPM source, single highlight target
- [04.9.2-05]: Auto-advance pagination during synth playback — cyclePage/halfPage advance as synth crosses phrase/cycle boundaries; manual nav and pause both interrupt
- [04.9.2-05]: Phase 04.9.2 ships unified control bar grouping stanza-nav, view-mode, A+/A−, and play/BPM/transpose with vertical dividers (D-19 control-grouping rule). Visual re-review: APPROVED 2026-05-14.
- [04.9.3-02]: NotationRenderer optionally-controlled (viewMode + baseSize props) with chromeless mode that suppresses internal controlBar and disables FS overlay; chromeless mobile (<768px) default --staff-base-size lowered to 13 per UI-SPEC §3, legacy uncontrolled default (24 at <480 portrait) preserved for zero regression; STORAGE_SIZE_FS_KEY no longer WRITTEN; data-notation-body + data-view-mode root attrs added for Plan 06 UATs.
- [04.9.3-03]: Singing-view chrome components built (PsalmTopBar, TuneSubBar, PsalmSelectorSheet, TuneSwitcherSheet) + shared types.ts. PsalmTopBar uses useTransition + ArrowLeft/ArrowRight keyboard nav (bails on editable focus). TuneSubBar inlines meter abbreviation (C.M./L.M./S.M./D.C.M.). TuneSwitcherSheet writes ?tune={id} via router.replace({scroll:false}) and auto-closes 120ms after select. PsalmListingGrid confirmed as named export; PsalmSelectorSheet imports it named. All data-singing-* / data-tune-* markers in place for Phase 06 UATs. Not yet wired into a route (Plan 05 composes).
- [04.9.3-04]: FAB-side chrome built — AbcAudioControls (standalone Play/Key/BPM block with own off-DOM abcjs visualObj + synth, AbcPlayer.tsx untouched), MetadataPanel (About-this-psalm content with SheetClose-wrapped study link), PsalmActionsFAB (56x56 fixed FAB + bottom Sheet with View radiogroup / Audio / About sections, auto-closes 120ms after view select). shadcn Sheet is built on @base-ui/react/dialog (not Radix) — switched from `asChild` to base-ui `render={...}` slot prop on SheetClose + SheetTrigger; semantically equivalent. Audio section omitted silently when abcForAudio is null. data-singing-fab / data-singing-fab-sheet / data-view-option markers in place for Phase 06 UATs. Not yet wired into a route (Plan 05 composes).
- [Phase 04.11]: 04.11-04: WAVE_B_THRESHOLD=20 and LOW_CONFIDENCE_THRESHOLD=0.85 (tunable constants in ocr-melisma-batch.ts)
- [Phase 04.11]: 04.11-04: real DB lyrics_structured shape is Array<{index,lines:[{text}]}> NOT cycles/stanzas - syllabification at read-time via syllabifyForAbc
- [Phase ?]: drizzle-kit not installed due to NODE_ENV=production suppressing devDependency installation; fixed by npm install --include=dev
- [Phase 04.9.14-01]: Split-leaf layout always stacks notation above lyrics (single column); mobile chromeless caps each region at 50% height with independent scroll
- [Phase 04.9.14-01]: Notation rendering scale fixed at 1 in split-leaf mode; baseSize only drives lyrics CSS var, decoupling A-/A+ zoom from staff size
- [Phase 04.9.14-01]: Scroll-hide wired to NotationRenderer's internal [data-notation-viewarea] scroll container (not window.scrollY) since SingingView's fixed-height layout never scrolls at window level
- [Phase 04.9.14-01]: Onboarding tour bumped psalter_tour_v1 to psalter_tour_v2; 3 new scroll-hide steps gated to split-leaf mobile (<768px)
- [Phase 04.9.14-02]: Inline solfège renders via same abcjs pipeline as Staff view (buildUnifiedAbc factory shared between abc and solfegeAbc sources); split-leaf solfège stays JPG-only, unaffected by approval
- [Phase 04.9.14-02]: isTuneApproved (melismaStatus === 'approved') gates ONLY inline solfège; Staff view and split-leaf solfège are never gated per CONTEXT locked decision
- [Phase 04.9.14-02]: Fixed melisma-decision GET response field bug (currentStatus not status) that left melismaStatus permanently null
- [Phase 04.9.14-03]: PlayMiniBar inline variant switched to fixed positioning (bottom offset matches GlassBottomBar h-11/h-13 + safe-area formula) instead of document flow, which had placed it below the fixed bottom bar requiring scroll
- [Phase 04.9.14-03]: PlayMiniBar reports its own height via ResizeObserver (onHeightChange) so SingingView reserves exact dynamic bottom padding instead of a static guess, correctly handling both 44px compact and 80px SoundCloud-mode profiles
- [Phase 04.9.14-03]: PlayMiniBar auto-hide reuses Plan 01's scroll listener; effectiveMiniBarVisible = miniBarVisible && !miniBarAutoHidden ensures manual collapse is never restored by scrolling up
- [Phase 04.9.15-05]: Clef/key/time-signature shrink on inline Staff implemented as a post-render JS DOM pass (applyLeadingGlyphShrink), not static CSS — CSS transform-origin percentages default to the whole SVG viewport (not the element's own bbox) without transform-box:fill-box, and independently-scaled glyphs leave inter-glyph gaps untouched -- both required measured DOM geometry to fix correctly, which only JS can compute
- [Phase 04.9.15-05]: MOBILE-07 row-stretch fix uses abcjs's native expandToWidest render option — staffWidthFactor narrowing was not the root cause (empirically disproven); every wrapped row's natural minimum content width already exceeded any reasonable staffwidth target, so expandToWidest (letting the widest row's natural width become the shared target for all rows) was the correct built-in abcjs mechanism
- [Phase 04.9.15-05]: All rows shrink clef/key/time-signature (not just wrapped rows), per explicit user override of the original plan text — User decided consistency across all rows (including row 1) was preferred over the original reader-orientation-point rationale for keeping row 1 full size
- [Phase 07]: EMAIL-02 marked Partial (Gmail confirmed, Primary inbox, spf/dkim/dmarc all pass at mail.gsdlabs.dev); Outlook/Microsoft-family leg explicitly skipped by human decision, recorded as an open gap in 07-03-DELIVERY-EVIDENCE.md, not silently closed
- [Phase 08-04]: Human confirmed 5/5 smoke-test emails delivered to Primary inbox and a live modal submission arrived with correct subject/Reply-To; explicitly skipped the live-UI rate-limit-message check, judging Task 1's automated live burst test sufficient — FEED-01 marked Complete, FEED-02 marked Partial — Mirrors the Phase 07 EMAIL-02 precedent: record an honest partial verdict with an explicit open gap rather than upgrading to a clean pass
- [Phase 08-04]: Stashed two pre-existing unrelated uncommitted changes (CLAUDE.md stack section, PsalmListingGrid.tsx scroll fix) before the live production build, restored after the burst test — Ensures the deployed bundle reflects only committed Phase 8 code, not unreviewed in-flight edits, during a live-verification plan
- [Phase 09-07]: 14 pre-existing test failures (precent-route headers() test-scope mismatch, tune/psalm data-shape assertions, melisma heuristics) found during Task 1's full-suite gate predate Phase 9 entirely (last touched 2026-07-16) and are unrelated to changelog code — Logged to deferred-items.md per scope-boundary rules, not fixed; build proceeded since zero changelog tests failed
- [Phase 09-changelog]: [Phase 09-07] Human's real published post ('V2 (Beta)', changelog_posts.id=31) left in place as genuine release content rather than deleted as test data, per threat register T-09-62 requiring an explicit decision before deleting any live-visible post
- [Phase 10-01]: Darwall (id 57) confirmed primary for Ps 148 Second Version via live Airtable CPRC Standard[0] lookup; Clarkeville demoted
- [Phase 10-01]: psalm_version_historical_tunes is its own junction table, not a third flag on psalm_version_tunes, to avoid corrupting 3 consumers that read every row unconditionally
- [Phase 10-02]: meterMismatch/meterMismatchBanner derived once right after rootStyle, before the fullscreen-branch conditional, so both NotationRenderer return branches share one JSX value
- [Phase 10-02]: Banner uses role=status and a red palette (not amber) to visually distinguish an actionable warning from PsalmTabs.tsx's existing informational amber banner
- [Phase 10-03]: tuneNameToSlug moved out of tune-jpg-urls.ts (fs-importing) into zero-import src/lib/tune-slug.ts so it is safe to import from 'use client' components; slug travels as a server-computed data field on every tune shape
- [Phase 10-03]: PsalmTabs.tsx BackupTunesContent numeric tune link left untouched per this plan's scope boundary — Plan 05 deletes the whole component
- [Phase 10-04]: unquoteRollupName() required for Historical CPRC Usage rollup — 2/91 distinct tune names arrive CSV-quoted; all 393 pairs now resolve, 0 unmatched
- [Phase 10-04]: psalm_version_tunes.is_backup upserts use onConflictDoUpdate touching only isBackup, never isPrimary — a backup tune is often already linked via CPRC Standard
- [Phase 10-04]: postgres.js update/insert results expose affected-row count as .count not .rowCount — migrate-double-length.ts's template snippet used the wrong property (silent no-op logging bug), fixed in the new script
- [Phase 10-04]: Regression-guard baseline corrected from plan's stated is_primary=173 to the actual live value 184 (one primary per psalm_versions row, 0 missing, 0 duplicates) — confirmed via code review this migration never writes isPrimary, so 184 predates this plan and 173 was a stale figure from Plan 02's research
- [Phase 10-05]: A tune present in both backupTuneIds and historicalTuneIds classifies as backup (backup outranks historical) — verified live: Ellacomb (psalm 71, CM) is both, renders once under Backup
- [Phase 10-05]: TuneSwitcherSheet.tsx (singing view's tune picker) left untiered pending Phase 11 TSEL-01 picker consolidation, per plan's explicit out-of-scope boundary
- [Phase 12-04]: D-GAP2 = option-a — Book I-V jump tabs shown whenever the viewport is narrow OR short (fixes iPhone-landscape disappearance, no desktop change)
- [Phase 12-04]: D-GAP3 = stays-hidden — collapsed multi-version toggle boxes never show a meter tag regardless of 'Show meter' checkbox state; meter only appears once a group is expanded
- [Phase 12-05]: D-GAP2 = option-a implemented — tabs-off Tailwind custom-variant (min-width:768px and min-height:600px), all 5 sync points switched from md: to tabs-off:
- [Phase 12-05]: Search placeholder fallback string 'Number or keyword…' shipped (not the plan's first-choice 'Psalm number or keyword…') after live-browser measurement showed the first choice still didn't fit at 320px
- [Phase 12]: [Phase 12-06]: D-GAP3 stays-hidden implemented — collapsed multi-version toggle boxes never render a meter tag under any Show meter checkbox state; expanded panel forces showMeter=true on every version row regardless of the checkbox
- [Phase 12-07]: METER_COL = 5.5rem chosen from live-measured text widths (21px max label + 33px second-widest abbreviation + 20px margin = 74px, fits 5.5rem/88px not 4.5rem/72px); the one outlier numeric pattern (10 10 10 10 10, 62px) is excluded and allowed to wrap
- [Phase 12-07]: Gap 4 (oversized meter boxes + meter/number overlay) confirmed pre-existing via measurement, not a Phase 12 regression — traced to commits 1583e3af (2026-06-15) and f2e85d39 (2026-07-19); absolute meter span deleted outright, meter now renders only in normal flow

### Pending Todos

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| q01 | Psalm detail layout: split desktop, reversed header, Sing tab on mobile | 2026-05-09 | eebcbbb | [260509-q01-psalm-detail-layout-overhaul](./quick/260509-q01-psalm-detail-layout-overhaul/) |
| q02 | UI fixes batch 3: tune format, mobile sticky score, meter tooltip, search overlay, lyrics search, search bugs (T2,T4-T8) | 2026-05-11 | 133507a | [20260511-ui-fixes-batch3](./quick/20260511-ui-fixes-batch3/) |
| q03 | UI fixes batch 4: T4 gap+progressive sticky, T5 Popover meter, T6 GlobalSearch→Dialog, T7 lyrics snippet, sticky list headers | 2026-05-11 | cb9b448 | [20260511-ui-fixes-batch4](./quick/20260511-ui-fixes-batch4/) |
| q04 | UI fixes batch 5: T4 sticky score fix (scroll listener), tunes sticky search bar, psalm 5-book sections, Ps 119 sub-section, mobile vertical book tabs, "versifications" text | 2026-05-11 | 75acead | [20260511-ui-fixes-batch5](./quick/20260511-ui-fixes-batch5/) |
| q05 | UI fixes batch 6: T4 fixed-position score (IntersectionObserver+rootMargin+ResizeObserver spacer), Ps119 vertical left bar, book tabs vertical text, scroll offset fix, pr-10 for tab overlap | 2026-05-11 | 3eed8f5 | [20260511-ui-fixes-batch6](./quick/20260511-ui-fixes-batch6/) |
| q06 | Fix OCR pipeline bugs: Old 124th page order swap + Glasgow dotted-comma octave parser fix | 2026-05-12 | 7c03c35 | [260512-qmy-fix-ocr-pipeline-bugs-old-124th-page-order-swap-plus-glasgow](./quick/260512-qmy-fix-ocr-pipeline-bugs-old-124th-page-order-swap-plus-glasgow/) |
| 260512-ssp | Phase 4.9 OCR pipeline completion — add solfege_ocr_text + abc_satb columns; 75/144 tunes populated (partial — PSALTER_ANTHROPIC_API_KEY exhausted) | 2026-05-12 | 661b65b | [260512-ssp-phase-4-9-ocr-pipeline-completion](./quick/260512-ssp-phase-4-9-ocr-pipeline-completion/) |
| 260516-vi4 | Fix 04.9.4 chrome dedup: remove duplicate A+/A- and stanza nav still rendered by NotationRenderer chromeless mode; add stanza prev/next to GlassBottomBar; harden UATs to assert absence of legacy chrome | 2026-05-16 | e47aae5 | [260516-vi4-04.9.4-chrome-dedup](./quick/260516-vi4-04.9.4-chrome-dedup/) |
| 260517-bmz | 04.9.4 singing chrome polish: drop view buttons from glass bar (now in GearDrawer only), move gear far-right, icon-only Play; fit PlayMiniBar on one row at 375; add Restart-tour to GearDrawer; hide Solfège back-button in chromeless view | 2026-05-17 | 078480c | [260517-bmz-04.9.4-singing-chrome-polish](./quick/260517-bmz-04.9.4-singing-chrome-polish/) |
| 260517-cm0 | 04.9.4 singing r3: audio fixes (1a double-play, 1b first-press, 1d BPM 151), bottom padding, lyrics/solfège font+padding, hide stanza nav off-staff, solfège JPG sizing, inline YouTube embed via TuneAudioPlayer, tour redesign (3 focused steps, lighter backdrop, both arrows on step 1, new psalm-label step), "Ps 119:N-M" titles. Deferred: 1c highlight (refactor) + 1f SoundCloud half (no real DB data) | 2026-05-17 | 8491c92 | [260517-cm0-04.9.4-singing-r3](./quick/260517-cm0-04.9.4-singing-r3/) |
| 260517-ht8 | 04.9.4 singing r4: STICKY-fix first-press play (prevControlledRef init bug — first effect short-circuited and synth never started); tour reorder to 4 steps (tune-name re-inserted); per-arrow individual spotlights via SVG mask; mobile bar h-11 (44px) — substantially slimmer; view-change auto-hides mini-bar + resets play state | 2026-05-17 | 28f0936 | [260517-ht8-04.9.4-singing-r4](./quick/260517-ht8-04.9.4-singing-r4/) |
| 260517-u35 | Migrate Airtable Tunes "Double length" boolean → tunes.double_length column. 26/172 tunes flagged DCM. Key prereq for alignment-implementation seed; double_length is broader than CMD — covers all doubled-stanza tunes across all meter families (Aurelia 76 76 D, Old 124th 10 10 10 10 10, four 66 66 88, etc.) | 2026-05-17 | c4b3be7 | [20260517-migrate-tunes-double-length](./quick/20260517-migrate-tunes-double-length/) |
| 260601-i5d | Fix Contemplation sharps-as-naturals: append trailing `\|` to splitMusicIntoSubLines emissions so abcjs synth resets accidental scope at phrase boundaries. Extracted splitMusicIntoSubLines to a sibling module + unit tests + UAT verifier (MIDI buggy-vs-fixed diff confirmed exactly one NoteOn divergence at idx=16: buggy=76, fixed=75). Regression sweep clean on Crimond/Martyrdom/Old-100th. | 2026-06-01 | 38a6093 | [260601-i5d-fix-contemplation-sharps-as-naturals-app](./quick/260601-i5d-fix-contemplation-sharps-as-naturals-app/) |
| 260607-gju | Fix Dunfermline psalm 106 phrase 4 misalignment: double-strip Amen notes from solfège soprano string. Single-pass lastIndexOf('||') left "d \| d" Amen notes in cleaned string, inflating totalEvents 28→30 and giving phrase 4 eight note slots instead of six. Fix adds second-pass guard: strips tail after penultimate \|\| if it has no beat-colon (Amen notes never have :). Confirmed via Playwright: all 4 phrases render with correct lyric alignment. | 2026-06-07 | b99c7c2 | [260607-gju-dunfermline-psalm-106-rendering-wrong-de](./quick/260607-gju-dunfermline-psalm-106-rendering-wrong-de/) |
| 260614-k0h | Convert /explore from flat anchor-nav to tabbed layout with icons — Themes/In the NT/Other Topics/Authors/Catechism tabs; Themes has sub-tabs Main Topic, Mood, Song Type, When you...; new ExploreTabShell client component | 2026-06-14 | 35bbd2d | [260614-k0h-convert-explore-from-flat-anchor-nav-to-](./quick/260614-k0h-convert-explore-from-flat-anchor-nav-to-/) |
| 260614-l60 | Explore polish batch (a-j): Messianic own tab (Gem icon), URL-based tab routing (?tab=), card text wrap, Nave's source credits, tab-bar no vertical scroll, psalm row items-start, NT canonical sort, verse citation dedup, Other Topics search, Nave's collapsible sub-topics | 2026-06-14 | 176c46d | [260614-l60-explore-page-polish-batch-messianic-tab-](./quick/260614-l60-explore-page-polish-batch-messianic-tab-/) |
| 260614-qkc | Explore polish batch 2: first-line fully wraps (stacked meter below), verse dedup (quotation shown once per psalm group not once per verse), float-right badge so card text wraps below it, Nave's collapsibles closed by default, authors filter single horizontal scroll row | 2026-06-14 | 9b870b0 | [260614-qkc-explore-polish-batch-2-first-line-wrap-v](./quick/260614-qkc-explore-polish-batch-2-first-line-wrap-v/) |
| 260616-drk | Dark mode toggle: next-themes ThemeProvider, Moon/Sun button in desktop nav + mobile bar (next to Search, outside hamburger); logo PNG adapted with invert+hue-rotate(180deg) filter in dark mode | 2026-06-16 | aab6fba | — |
| 260628-betterstack-monitor | Add BetterStack uptime monitor for psalter.gsdlabs.dev (monitor id 4599638, 180s check frequency, email alerts) | 2026-06-28 | — | [betterstack-monitor](./quick/20260628-betterstack-monitor/) |
| 260712-kd1 | Fix scroll-hide UAT bugs: full off-screen translate (was only fading inner text), site-wide SiteHeader now hides via new chrome-hidden-store, capture-phase scroll listener fixes split-leaf (previously never fired) | 2026-07-12 | 929e0d1 | [260712-kd1-fix-scroll-hide-navigation-bugs-in-singi](./quick/260712-kd1-fix-scroll-hide-navigation-bugs-in-singi/) — pending human verification |
| 260712-kov | Fix split-leaf Staff notation rendering: root cause was sizing (staffWidthFactor over-narrowed split-leaf staffwidth), not structural corruption; added Playwright diagnostic to measure systems/notes/viewBox divergence | 2026-07-12 | 6e19a28 | [260712-kov-fix-split-leaf-staff-notation-rendering-](./quick/260712-kov-fix-split-leaf-staff-notation-rendering-/) — pending human verification |
| 260712-lcg | Revert inline Solfège to JPG-only: abcjs has no tonic sol-fa support, the 04.9.14-02 abcjs branch just rendered soprano-only staff notation indistinguishable from Staff view; removed approval gate, melismaStatus fetch, and orphaned /api/melisma-status route | 2026-07-12 | 0b71bf1 | [260712-lcg-revert-inline-solfege-view-to-jpg-only-r](./quick/260712-lcg-revert-inline-solfege-view-to-jpg-only-r/) |
| 260712-lp9 | Fix PlayMiniBar: restored allow-same-origin on SoundCloud iframe sandbox (WR-03 code-review fix had broken playback — widget needs localStorage on init), aligned desktop right edge to content column via calc() (md:-only, mobile untouched) | 2026-07-12 | 12b4b26 | [260712-lp9-fix-playminibar-soundcloud-playback-and-](./quick/260712-lp9-fix-playminibar-soundcloud-playback-and-/) — pending human verification |
| 260712-sny | Scroll-hide round 2: true fullscreen reflow (negative margin-top + height/padding growth on <main data-notation-region> when bars hide, not just bars translating away) + gated to mobile-only via matchMedia(max-width:767px) | 2026-07-13 | f8cd992 | [260712-sny-scroll-hide-reflow-content-into-freed-sp](./quick/260712-sny-scroll-hide-reflow-content-into-freed-sp/) — verified via Playwright post-rebuild (2026-07-13) |
| 260712-szw | Split-leaf Staff round 2 (mobile): abcjs JS-level format options (topmargin/staffsep) are silently ignored — only work as ABC %% directives; combined a %% spacing directive with a CSS transform-scale height-fit so all systems fit the 50%-viewport mobile region without scrolling | 2026-07-13 | f031d28 | [260712-szw-fix-split-leaf-staff-mobile-reduce-exces](./quick/260712-szw-fix-split-leaf-staff-mobile-reduce-exces/) — verified via Playwright post-rebuild (2026-07-13) |
| 260712-tmm | Solfège split-leaf JPG: capped at 50% viewport height on desktop too (renderSplitLeaf's md:max-h-none previously removed the cap only for Solfège, not Staff); fixed tune-switch stale image by threading per-tune staffPages/solfegePages through AlternateTune instead of page-level-only arrays (also fixed /precent/[id]/sing/[pos] + /psalms/[id]/study, which had the same latent bug) | 2026-07-13 | 7f781cd | [260712-tmm-solfege-split-leaf-jpg-cap-at-50-viewpor](./quick/260712-tmm-solfege-split-leaf-jpg-cap-at-50-viewpor/) — verified via Playwright post-rebuild (2026-07-13) |
| 260712-u4q | Disable inline Solfège entirely (hardcoded false, not tune-approval-based) — real tonic sol-fa rendering doesn't exist; closed all 3 entry paths (notation button, Inline-layout button, stale-localStorage restore) with a "coming soon" message; split-leaf Solfège (JPG) unaffected | 2026-07-13 | d5b56a8 | [260712-u4q-disable-inline-solfege-toggle-until-real](./quick/260712-u4q-disable-inline-solfege-toggle-until-real/) — verified via Playwright post-rebuild (2026-07-13) |
| 260713-a5b | Fix SoundCloud desktop first-activation: confirmed live that the fresh iframe was inserted mid-height-transition (44px→80px); deferred iframe mount via scIframeReady (double-rAF + settle timeout) until the bar reaches its stable size, keeping the element persistent across tune switches | 2026-07-13 | b50da6a | [260713-a5b-fix-soundcloud-desktop-privacy-policy-fa](./quick/260713-a5b-fix-soundcloud-desktop-privacy-policy-fa/) — verified via Playwright post-rebuild (2026-07-13) |
| 260713-kkg | Split-leaf notation/lyrics gap: both slots used flex-1 (rigid 50/50) so the notation slot grew with the 260712-sny reflow even though its content (SVG/JPG) didn't — made notation flex-none (content-sized, capped 50%), lyrics flex-1 (absorbs the rest); solfège JPG switched from percentage max-height to width-based sizing (robust in both resting and reflowed states). Also: Solfège notation button was incorrectly gated by current layout (grayed on Staff+Inline) — now gated only on JPG existence and always routes to solfege-split, auto-switching layout; Inline-layout gating (u4q) unchanged | 2026-07-13 | 6830030 | [260713-kkg-fix-split-leaf-notation-lyrics-gap-sizin](./quick/260713-kkg-fix-split-leaf-notation-lyrics-gap-sizin/) — verified via Playwright post-rebuild (2026-07-13) |
| 260713-lf9 | Desktop solfège split-leaf had 3 scrollbars (notation slot vertical+horizontal overflow, redundant outer lyrics wrapper, inner StanzaList) — now exactly 1 (StanzaList only): JPG switched to object-contain within a flex-1 centering wrapper so it shrinks to fit its 50%-capped slot instead of scrolling/clipping; -mx-4 horizontal bleed scoped to full-page view only; outer wrapper overflow-y-auto removed (redundant with inner StanzaList scroll). Also clamped scrollTop to [0, scrollHeight-clientHeight] + 4px delta threshold in the mobile scroll-hide handler to stop iOS rubber-band overscroll from flickering the hide state | 2026-07-13 | 74ebf5c | [260713-lf9-fix-desktop-split-leaf-triple-scrollbar-](./quick/260713-lf9-fix-desktop-split-leaf-triple-scrollbar-/) — scrollbar fix verified via Playwright (2026-07-13); iOS bounce fix code-verified only, needs real-device confirmation |
| 260713-m5n | Follow-up to 260713-lf9's iOS bounce fix: real-device testing showed gentle flicks were fixed but HARD flicks still flickered (large-delta bounce events pass the 4px threshold filter). Root-caused via research (MDN + WebSearch) to the standards-based fix: overscroll-behavior-y:none (not contain) disables the element's own native rubber-band bounce entirely so iOS never generates the erratic scrollTop oscillation in the first place, regardless of flick force. Added Tailwind overscroll-y-none to all 6 flickable scroll containers in NotationRenderer.tsx's chromeless render path; 260713-lf9's JS clamp stays as defense-in-depth | 2026-07-13 | 7fc0aeb | [260713-m5n-add-overscroll-behavior-none-to-mobile-s](./quick/260713-m5n-add-overscroll-behavior-none-to-mobile-s/) — CSS compiles correctly (confirmed overscrollBehaviorY:none via Playwright computed style); actual bounce-elimination outcome needs real iOS device confirmation (desktop Chromium cannot simulate iOS touch physics) |
| 260719-q3k | Consolidated three duplicate psalm-picker wrappers (PsalmSelectorSheet, precent/PsalmPickerModal, SelectPsalmDialog) into one shared PsalmPickerModal (navigate / verse-range-add / select-and-close modes); fixed real horizontal-overflow + digit-clipping bug in PsalmListingGrid by switching viewport-breakpoint grid columns to container-relative grid-cols-[repeat(auto-fill,minmax(...))]; gated search autofocus to desktop-only at both input-effect and Dialog focus-trap level; removed compounding title-to-search double-gap. Live-verified via Playwright daemon across 6 route/viewport combos (/psalms/80, /precent/28, /tunes/2 × mobile/desktop) | 2026-07-19 | 23e4acf | [260719-q3k-consolidate-the-psalm-selector-modal-int](./quick/260719-q3k-consolidate-the-psalm-selector-modal-int/) — verified via Playwright |
| 260715-s7b | Fix inline Staff notation mobile issues for St Agnes, Durham (psalm 62) and other CM tunes, in 5 rounds: (1) mobile sub-divides phrases at measure boundaries then split syllables by equal token count, cramming syllables onto a lone held final note — fixed by weighting the split by each sub-staff's real note-head count; (2) still broken on real device — misdiagnosed forceMatchMeterShape's word-splitter as the cause and added detectRepeatedPitchContinuations, but this tune uses the solfege-driven buildWLineFromSolfa path which never reaches that code; (3) installed Playwright on the VPS, instrumented the live page, found the real bug: buildWLineFromSolfa's duration heuristic marks the shortest-duration note as a melisma continuation, tie-broken by earliest index — fixed by preferring detectRepeatedPitchContinuations' output; (4) separate issue — whole tune required a page scroll on mobile; extended the chromeless split-leaf fit-to-viewport transform-scale mechanism (260712-szw) to inline Staff too; (5) user flagged round 4's fix was worse in a sense — 8 cramped systems with wasted side margins instead of Wetherby's clean 4; root-caused to a blanket "always split every mobile phrase in half" rule that applies ONLY to tunes lacking DB melisma_positions (tunes with melisma data bypass it and render cleanly at 1-system-per-phrase already) — removed the forced split for chromeless<1280, verified broadly via Playwright across ~10 tunes/meters with/without melisma data (found 2 unrelated pre-existing data bugs while sampling, confirmed present before this change too — tune 12's truncated ABC and tune 136/Clarkeville's lost-lyrics-after-phrase-1, both out of scope) | 2026-07-16 | 0b773a3 | [260715-s7b-fix-inline-staff-notation-layout-broken-](./quick/260715-s7b-fix-inline-staff-notation-layout-broken-/) — CONFIRMED FIXED by user on their own mobile device |
| 260716-dtm | Fix verse-initial letters not capitalizing under staff notation: `syllabifyForAbc`'s multi-syllable branch lowercased text before syllabifying and only the single-syllable early-return preserved case, so capitalized verse-openers ("Before", "Because", "According") rendered lowercase in every abcjs `w:`-line path (Staff view + inline-staff/solfège) while single-syllable openers ("Lord", "Praise") stayed correct — fixed via a parallel alphabetic-letter walk that copies each source letter's case onto the syllabified output, correctly handling digit-glued verse prefixes (`"1Before"` → `"1Be- fore"`). Surfaced during /gsd-explore of Phase 4.9.15 (mobile inline staff optimization). Verified live on psalm 90/St. Anne via Playwright SVG tspan extraction post-rebuild | 2026-07-16 | c98b816 | [260716-dtm-fix-verse-initial-letters-not-capitalizi](./quick/260716-dtm-fix-verse-initial-letters-not-capitalizi/) — verified via Playwright post-rebuild (2026-07-16) |
| 260717-mwv | Fix 3 notation-fallback bugs (Split-Leaf Staff JPG fallback for non-approved tunes, "not recommended" versification messaging, zero-notation tunes force Lyrics Only) across 4 checkpoints (initial build + 3 rounds of live feedback, 22 commits total): flanking JPEG page-nav (no thumbnails), real Lyrics Only content for no-tune psalm-versions with a Gear-popover-driven tune-selection flow, generalized tap-to-explain toasts on every disabled Music Notes control, scroll-hide fixed for empty-abc tunes, and a real root-cause fix for page-level scroll leaking through `<SiteFooter>` on the singing view (document-scroll-lock while mounted). One item (Gear-popover-reopen reliability) left as known-imperfect per explicit user instruction. APPROVED after round 4 | 2026-07-19 | e178d88 | [260717-mwv-fix-three-notation-fallback-bugs-1-unapp](./quick/260717-mwv-fix-three-notation-fallback-bugs-1-unapp/) — approved live on psalter.gsdlabs.dev after 3 rounds of Playwright-verified fixes |
| 260719-kn6 | Fix mobile modal padding for About, Copyright, and Feedback modals to match New Set modal | 2026-07-19 | e0cb35e | [260719-kn6-fix-mobile-modal-padding-for-about-copyr](./quick/260719-kn6-fix-mobile-modal-padding-for-about-copyr/) — approved live on psalter.gsdlabs.dev |
| 260723-cpt | iOS home-screen ("Add to Home Screen") landscape safe-area fix: iOS reserves a phantom status-bar strip at the top of standalone web apps in landscape unless the page opts into `viewport-fit=cover`; added Next.js `viewport` export + `appleWebApp`/`apple-mobile-web-app-capable` meta tags, padded SiteHeader with `env(safe-area-inset-top)`, and folded the same inset term into SingingView's `<main>` height/hide-margin calc (collapses to the pre-existing 104/116/-104 constants when the inset is 0, i.e. no regression in browser tabs or landscape) plus both loading skeletons | 2026-07-23 | a7f58e3 | [260723-cpt-fix-ios-home-screen-landscape-safe-area-](./quick/260723-cpt-fix-ios-home-screen-landscape-safe-area-/) — verified 7/7 must-haves (plan-checker caught+fixed a real Next.js meta-tag emission bug pre-execution); real iOS device confirmation still pending |
| 260727-fast | Split A+/A- font-size localStorage into two buckets (`psalter-staff-size` for solfège inline + both split-leaf modes, new `psalter-lyrics-size` for Lyrics Only) so zooming one no longer affects the other; hid A+/A- controls in Inline Staff (already inert there — scale driven by viewport-resize via `notationBaseSize`, not `baseSize`) | 2026-07-27 | a4fe25b | — |
| 260817-sdm | iOS Safari URL-bar shrink + right-side abcjs whitespace on Sing view: (1) SingingView temporarily unsets documentElement overflow for one frame so the existing scrollTo(0,0) first-touch trigger engages iOS URL-bar shrink (page scroll was being suppressed by the mount-time overflow:hidden lock); (2) drop `stretchlast: 1` from AbcPlayer render options — `expandToWidest` already governs uniform row widths, `stretchlast` was leaving non-last rows at their natural widths inside a viewBox that scaled them down, producing visible right-side whitespace. Two atomic commits, one per file. | 2026-08-17 | 89d8920 | [260817-sdm-on-the-sing-view-route-precent-id-sing-p](./quick/260817-sdm-on-the-sing-view-route-precent-id-sing-p/) — both fixes are iOS Safari-only behaviours that cannot be reproduced from the VPS; manual real-device verification deferred to owner |
| 260817-ssc | Rebuild homepage to mirror psalter.cprc.co.uk Softr layout: two centered sections ("Helping CPRC Saints Sing the Psalms!" + "Tools for Precenters") with 6 icon cards (Choose Psalm/Explore/Daily/Learn Tunes/Tunes Database/Precenting Tool) using lucide-react icons (Home/Library/CalendarDays/Music2/Church). New reusable `HomeCard` component handles the no-children (whole card is link) vs. with-children (Daily slot — link scoped to header+description to avoid nested anchors from DailyTodayCard's own Link) cases. PsalmSearchWidget removed from homepage. All grids `grid-cols-1 md:grid-cols-2`, icons `text-amber-500` to match Softr #EAB10B. Build clean, 6/6 HomeCard tests pass. | 2026-08-17 | 0f57a6c | [260817-ssc-rebuild-src-app-page-tsx-to-mirror-the-p](./quick/260817-ssc-rebuild-src-app-page-tsx-to-mirror-the-p/) — visual confirmation deferred to owner |
| 260821-p2y | Fix 4 homepage issues found via Playwright review of the Softr rebuild: (1) `HomeCard` now always renders exactly one `Card` — when `children` are passed they render in a `CardContent` sibling inside the same Card instead of a stretched sibling `<div>` outside it; (2) `DailyTodayCard` stripped of its own `bg-muted`/`border-l-4` box chrome so it reads as part of the Daily HomeCard's single bordered surface; (3) new `ChangelogBanner` component — compact single-line "New: {latest post title} — Read the changelog" link above the h1, renders nothing with zero posts; (4) new `ExploreHighlights` component — 2x2 grid of Mood/Topic/Nave's Topics/Messianic shortcut links inside the Explore card, hrefs verified against `ExploreTabShell`'s actual `tab`/`sub` query-param values (not guessed). Follow-up round 1: added `items-start` to both homepage grid containers — without it, CSS grid's default `align-items:stretch` was still forcing shorter cards (Learn Tunes, Tunes Database) to match taller row siblings (Daily, Precenting Tool), reproducing the interior-void bug one level in. Follow-up round 2 (user-requested re-review): `items-start` still left lopsided gaps between rows since it only stops stretching, not repositioning — switched section 1's grid to a CSS multi-column masonry layout (`columns-1 md:columns-2` + `break-inside-avoid` wrapper divs) so cards pack into height-balanced columns (Choose Psalm+Explore stack in column 1, Daily+Learn Tunes in column 2) instead of sitting in rigid same-height rows; also shrank the Daily card's psalm-ref text from a raw `text-[28px]` down to `text-2xl` (24px) since it was visually outweighing the card's own 18px "Daily" title. Follow-up round 3 (second user re-review): switched the masonry grid's `gap-6` shorthand to `gap-x-6` (explicit `column-gap` longhand) for cross-browser multicol safety — the generic CSS `gap` shorthand's support for multi-column containers has a spottier browser history than the dedicated `column-gap` property. Also simplified the Daily homepage card from a full rich block (date, day badge, big psalm title, italic subtitle, "Sing psalm" button, via the shared `DailyTodayCard` component) down to one sentence — new `TodayPsalmBadge` component renders just the psalm ref as a small pill styled to match `ExploreHighlights`' font size (text-xs) and border chrome, appended inline to the existing description as "...Today's Psalm: [badge]". `HomeCard`'s `description` prop widened from `string` to `React.ReactNode` to allow embedding the badge inline. Daily no longer uses the `children` slot (badge is non-interactive, lives inside the card's own link, so no nested-anchor risk) — it's back to a plain single-link card like Choose Psalm/Learn Tunes. The shared `DailyTodayCard` component itself is untouched and still powers the full-featured `/daily` page unchanged. Every round verified via before/after Playwright screenshots on a throwaway `next start -p 3999` preview (not trusting the automated gate alone) at 390/768/1024/1280/1440px. Build/tsc/eslint/vitest all clean on the touched files throughout (16/16 tests passing after round 3). | 2026-08-21 | b519bb8 | [260821-p2y-fix-four-homepage-layout-content-issues-](./quick/260821-p2y-fix-four-homepage-layout-content-issues-/) |

- [04.9.8-05]: Character-level tokenizer for insertPhraseBreaks replaces text-line-granular Path NH — emits PHRASE_BREAK at exact note-head offsets independent of ABC text-line boundaries
- [04.9.8-05]: NotationRenderer cleanedBody merges multi-text-line phrase bodies into single line to prevent phantom extra sub-staves from internal newlines
- [04.9.8-05]: 66/150 psalms now pass sweep (up from 14); 84 remaining failures are extended-final-phrase structural variance (Crimond/Old100th/Crediton have 12-24 notes in phrase 4 vs expected 6-8) — awaiting human triage at checkpoint

### Blockers/Concerns

- ABC notation source: No existing ABC files for Scottish Psalter tunes. Phase 4 requires sourcing public-domain ABC or encoding from printed editions. The Session API lookup spike is the first plan in Phase 4.
- Tune JPG download incomplete — 172 tunes have NULL score_jpg_url. VPS root filesystem is 97% full (38GB). Expand disk before running migrate-airtable.ts without SKIP_IMAGES=1.
- REQUIREMENTS.md has no UI-06/UI-07/UI-08 rows — Phase 04.9.14 plans reference these IDs in frontmatter but they were never added to the traceability table during planning; requirements.mark-complete no-ops until rows are added

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | User accounts / congregation favourites | Deferred | Init |
| v2 | Admin UI (Directus/NocoDB) | Deferred | Init |
| v2 | abcjs audio on public tune pages | Deferred | Init |
| v2 | Dark mode | Deferred | Init |
| Out of scope | Four-part SATB rendering | Out of scope | Init |
| v1 close | Phase 4.9 Tune Notation Conversion | Superseded by manual /dev/melisma-editor workflow (4.11) | v1.0 close |
| v1 close | Phase 4.10 Verified MusicXML Pilot (Crimond) | Superseded by 4.11; 4/5 plans done, sing-test checkpoint never run | v1.0 close |
| v1 close | Phase 4.11 Solfège Underline OCR | Pivoted to manual per-tune editor; 70/172 tunes approved, rest fall back to JPEG (no breakage) | v1.0 close |
| v1 close | Phase 4.9.11 Lyric-Count False Positive Fix | Not started — Playwright checker + phrase-4 note-count investigation | v1.0 close |
| v1 close | Phase 4.9.12 Melisma positions as tune-level data | 3/4 plans done; Wave 4 NotationRenderer positions-based rewire not applied | v1.0 close |
| v1 close | UAT gaps: Phases 02, 04.9.14, 05 | Partial human-verification checkpoints (4 pending scenarios each); all in production with no reported breakage | v1.0 close |
| v1 close | Verification gaps: Phases 02, 04.5, 04.7, 04.9.8, 04.9.9, 04.9.14, 05, 05.1, 05.3 | `human_needed` or `gaps_found` verification status, unresolved; all in production with no reported breakage | v1.0 close |
| Backlog 999.1 | Phase 05.4 Airtable Exit Verification | Never started (0 plans); moved to ROADMAP.md Backlog. Airtable subscription remains active but is a cost line, not a dependency — all reads already off Airtable | v1.1 close |
| Backlog 999.2 | Phase 6 Polish | Never started (0 plans); moved to ROADMAP.md Backlog. Covers OG images, Lighthouse 90+, remaining loading skeletons, click-feedback states | v1.1 close |

## Session Continuity

Last session: 2026-08-11T10:00:22.856Z
Stopped at: Phase 14 UI-SPEC approved
Resume file: .planning/phases/14-launch-polish/14-UI-SPEC.md

### Deferred from 04.9.4 polish (separate tickets when needed)

- **abcjs note-highlight on visible staff:** restoring the playing-note highlight in chromeless SingingView requires sharing AbcPlayer's visualObjRef with AbcAudioControls (or moving synth back into AbcPlayer). See `.planning/quick/260517-cm0-04.9.4-singing-r3/SUMMARY.md` "Deferred" section.
- **SoundCloud embedding:** 12/172 `tunes.soundcloud_url` rows; top entries are placeholder strings ("Missing, also from youtube"). YouTube fallback active via TuneAudioPlayer; plug SoundCloud in when real URLs are populated.
| 260813-fast1 | Move Changelog from header nav into footer menu (desktop + mobile Sheet mirror). Removes the Changelog item from `navLinks` and adds it after Feedback in both `SiteFooter.tsx` and the mobile Sheet's footer-menu block. | 2026-08-13 | fad49a6 | n/a |
| 260813-fast2 | iOS Safari URL bar shrink baseline: added `overscroll-behavior-y: contain` to html/body in globals.css so the document body retains its own scroll across all routes (defensive guard against nested overflow-y-auto wrappers stealing the gesture). | 2026-08-13 | b5b498e | n/a |
| 260813-quick1 | Tour swipe trail colour fix: rgba(120,120,120,0.5) → rgba(255,255,255,0.5). Trail now reads on the dark cutout in dark mode. Theme default is already `system` (Providers.tsx:8), no change needed. | 2026-08-13 | 3fb6daa | n/a |
| 260813-quick2 | "Install on your phone" dialog: new entry in footer menu + mobile Sheet footer block. Links to web.dev's evergreen PWA install-criteria article (kept current by Chrome team). | 2026-08-13 | 3cf3b7c | n/a |
| 260813-quick3 | Change Tune modal: drop redundant "Showing tunes in X meter" header (modal is always meter-filtered). Removed unused `meter` prop and updated both PsalmTabs call sites. No "Backup/Historical Tunes" tabs exist on the psalm page — they're tier section headings inside the modal, which already sort Backup → Historical → Other via sortTunesByTier. | 2026-08-13 | fa6139a | n/a |
| 260813-debug-darwall | Darwall (Ps148b) melisma diagnosis: not a dev/prod divergence. `/tunes/[slug]` is by-design `showLyrics: false` (D-02), so NotationRenderer.tsx:1104 emits no `w:` lines and abcjs renders no lyric/melisma text. Same code, data, build artefact on dev and prod. Same code path on /psalms/148b renders correctly because that route passes `showLyrics: true` and `melismaPositions=[[],...]` (40 notes = 40 syllables, 0 `_` marks). Proposed fix (pending user decision): plumb `melismaPositions` through `buildNotationRendererProps` so `/tunes/[slug]` can render slur/melisma contours even without lyrics. See `.planning/debug/darwall-ps148b-prod-melisma.md`. |
| 260813-phase16-roapmap | Phase 16 added to ROADMAP.md: "Tune Page First-Class Surface" — TPAGE-01 (unified modal under /tunes), TPAGE-02 (notation view mirroring psalm page), TPAGE-03 (Details/Notation tabs). Depends on Phase 11. Plans pending — see `.planning/phases/16-tune-page-first-class-surface/`. |
| 260813-phase16-planned | Phase 16 plans created and verified by gsd-plan-checker (VERIFICATION PASSED on first iteration). 3 plans in 2 waves: 16-01 (TPAGE-01: unify tune modal), 16-02 (TPAGE-02: share NotationRendererClient + player), 16-03 (TPAGE-03: Details/Notation tabs with URL state). Reuses Phase 11 components; abcjs client-only chain validated. Ready for /gsd-execute-phase 16. |
