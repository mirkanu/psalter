# Project Milestones: CPRC Psalter

## v1.0 Public Psalter (Shipped: 2026-07-29)

**Delivered:** Full public-facing rebuild of psalter.cprc.co.uk — Airtable/Softr fully migrated to Next.js 15 + PostgreSQL, with live abcjs notation rendering and syllable-aligned staff view replacing static JPG scores for the majority of the 172-tune corpus.

**Phases completed:** 1 – 4.12 (23 of 28 planned Milestone-1 phases shipped; 5 deferred — see Known Gaps)

**Key accomplishments:**
- Full Airtable → PostgreSQL migration with R2-hosted tune images (Phase 1), eliminating the £20/month Airtable+Softr stack
- Complete public browse experience: 150 psalms, tune pages, full-text search, topic/meter browse, 365-day reading plan (Phases 2–3)
- Live abcjs SVG notation with syllable-aligned lyrics under the staff, replacing static JPG-only tune display (Phase 4, 4.9.1–4.9.2)
- Solved syllable-to-note staff alignment for the full Scottish Psalter meter taxonomy (CM/LM/SM/DCM/alternate meters), including DCM double-stanza pairing, mid-stanza Bible-verse boundaries, amen suppression, and melisma handling (Phase 4.9.6–4.9.10)
- Mobile-first singing view: chromeless notation+lyrics, onboarding tour, dynamic zoom, swipe stanza navigation, landscape-aware fit-to-screen (Phase 4.9.3–4.9.4, 4.9.15, 04.9.15.1)
- Full /explore rebuild matching the reference site across 6 taxonomy sections (Phase 4.12)

**Stats:**
- ~307,000 insertions / ~22,800 deletions across 2,954 file-changes (whole-project history; Milestone 1 and 2 work is chronologically interleaved, not a clean sequential slice)
- 29,278 LOC current TypeScript/TSX
- 23 phases shipped, 100+ plans, 26 phase directories total (including deferred)
- 82 days, 2026-05-07 → 2026-07-27 (Phase 1 start to last Milestone-1 phase completion)

**Git range:** first commit `2026-05-07` → last Milestone-1 phase commit `2026-07-27` (04.9.15.1)

**Known Gaps (deferred, not blocking):**
- Phase 4.9, 4.10, 4.11, 4.9.11, 4.9.12 — melisma/notation-OCR pipeline; pivoted to an ongoing manual `/dev/melisma-editor` per-tune review workflow (70/172 tunes approved at close); non-approved tunes gracefully fall back to JPG scans, no production breakage
- UAT/verification sign-off gaps on Phases 02, 04.5, 04.7, 04.9.8, 04.9.9, 04.9.14, 05, 05.1, 05.3 — all live in production with no reported issues, formal checkpoints never closed
- Full detail: `.planning/milestones/v1.0-REQUIREMENTS.md` "Scope Decisions" and `.planning/STATE.md` Deferred Items

**What's next:** v1.1 Precentor Portal & Polish — Phase 5 and 05.1–05.3 already shipped (auth, precenting sets, footer/feedback, daily calendar); remaining work is Phase 05.4 (Airtable Exit Verification) and Phase 6 (Polish: OG images, Lighthouse 90+, remaining loading skeletons).

---
