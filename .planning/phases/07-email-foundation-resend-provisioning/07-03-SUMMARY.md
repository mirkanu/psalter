---
phase: 07-email-foundation-resend-provisioning
plan: 03
subsystem: infra
tags: [resend, email, deliverability, dkim, dmarc, spf, mail-tester, playwright]

# Dependency graph
requires:
  - phase: 07-01
    provides: "mail.gsdlabs.dev SPF/DKIM/MX/DMARC all live and verified; PSALTER_RESEND_API_KEY / PSALTER_RESEND_FROM_ADDRESS in the running psalter PM2 process"
  - phase: 07-02
    provides: "sendEmail() wrapper + scripts/send-test-email.ts CLI (tested, --dry-run rehearsed)"
provides:
  - "Real-world proof that sendEmail() delivers to a real Gmail inbox (Primary) with spf/dkim/dmarc all pass at mail.gsdlabs.dev — human-confirmed via raw 'Show original' headers, corroborated independently by mail-tester.com (10/10)"
  - ".planning/phases/07-email-foundation-resend-provisioning/07-03-DELIVERY-EVIDENCE.md — audit trail of message ids, DNS pre-flight, Resend last_event, mail-tester score, and human-reported folder/header verdicts"
affects: ["Phase 8 (feedback notifications)", "Phase 9 (changelog broadcasts)", "any future Outlook/Microsoft-family deliverability follow-up"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "mail-tester.com objective spam-score corroboration via the shared Playwright daemon (never raw chromium.launch): scrape the generated test-address from input[name=id].value, send to it via the existing CLI script, then re-navigate to the same slug (domain part stripped) to read score + per-check SPF/DKIM/DMARC verdicts from test-result divs"
    - "Evidence file with redacted recipient local parts (first char + ***) as the standing audit record for real-inbox deliverability checks — reusable pattern for any future provider-specific follow-up"

key-files:
  created:
    - .planning/phases/07-email-foundation-resend-provisioning/07-03-DELIVERY-EVIDENCE.md
  modified:
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Human explicitly declined to supply a Microsoft-family (Outlook/Hotmail/Live) test address for this run and instructed testing Gmail only — recorded as an intentional, human-directed scope reduction, not a technical failure or an oversight"
  - "EMAIL-02 marked 'Partial' in REQUIREMENTS.md (a new status value; the project previously only used Complete/Pending) rather than 'Complete', because marking it Complete would misrepresent the still-unverified Outlook/Microsoft-family leg that the requirement explicitly names"
  - "mail-tester.com's independent 10/10 result (spf/dkim/dmarc all pass) is treated as strong corroboration, not a substitute for the human's own Gmail 'Show original' confirmation — both were obtained and both agree"

requirements-completed: []  # EMAIL-02 is Partial, not Complete — see Deviations and REQUIREMENTS.md

# Metrics
duration: ~20min
completed: 2026-07-31
---

# Phase 07 Plan 03: Email Delivery Evidence (Real Gmail Inbox Verification) Summary

**Sent a real test email through the production `sendEmail()` wrapper to a real Gmail inbox and got explicit human confirmation of Primary-inbox placement with `spf=pass`, `dkim=pass`, `dmarc=pass` all aligned to `mail.gsdlabs.dev` (independently corroborated by a 10/10 mail-tester.com score) — but the Outlook/Microsoft-family leg was explicitly skipped by human decision, so EMAIL-02 is recorded as Partial, not Complete.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-31
- **Tasks:** 3 of 3 completed, with Task 1's scope narrowed by an explicit human decision (Gmail only) and Task 3 resolved via a relayed but directly-pasted human header confirmation
- **Files modified:** 1 created (`07-03-DELIVERY-EVIDENCE.md`), 1 modified (`REQUIREMENTS.md`)

## Accomplishments

- Re-ran `scripts/verify-email-dns.sh` immediately before sending — all four checks (SPF, DKIM, MX, DMARC) passed, confirming no DNS regression since Plan 01
- Sent a real message via `scripts/send-test-email.ts` to `manuelkuhs@gmail.com` — Resend accepted it (message id `846ffbbf-960b-4aee-9a57-2322a2a9a95e`), and the Resend API's own retrieve-email endpoint (the sending-only key worked here, unlike the "restricted key" scenario anticipated in discovered_facts record 4) reported `last_event: delivered`
- Ran an independent, objective corroboration check via mail-tester.com using the shared Playwright daemon (never raw Chromium): scraped the generated test address from the page's `input[name=id]` value attribute (`test-u7j3kvzr4@srv1.mail-tester.com`), sent the identical message pipeline to it, and read back a **10/10** score with SPF pass, DKIM pass (`header.d=mail.gsdlabs.dev`, selector `resend`), and DMARC pass (`header.from=mail.gsdlabs.dev`, `p=none`) directly from the report's per-check HTML
- Human confirmed the Gmail message landed in the Primary inbox and pasted the raw `Authentication-Results` header from Gmail's "Show original" view — `spf=pass`, `dkim=pass` (both `mail.gsdlabs.dev` and `amazonses.com` signatures present), `dmarc=pass` (`header.from=mail.gsdlabs.dev`) — matching mail-tester's independent finding exactly
- Wrote `07-03-DELIVERY-EVIDENCE.md` with the full audit trail: DNS pre-flight output, both message ids, Resend `last_event`, mail-tester score/verdicts, and the human-reported folder + raw header block, with the recipient's local part redacted to `m***@gmail.com` throughout
- Updated `REQUIREMENTS.md`: introduced a `Partial` status value (previously only `Complete`/`Pending` existed) for EMAIL-02, with an inline note pointing to the specific unverified leg and the evidence file, rather than either silently marking it Complete or leaving it a bare unqualified `Pending` that would lose the Gmail confirmation that did happen

## Task Commits

1. **Task 1 (scope-narrowed): HUMAN — supply test mailbox(es)** — resolved via coordinator relay (Gmail confirmed as `manuelkuhs@gmail.com`; Outlook/Hotmail/Live explicitly declined by the human) — no repo commit (information-gathering only)
2. **Task 2: Send the test message(s) and capture delivery evidence** — `fd9644d` (feat) — DNS pre-flight, real Gmail send, Resend status lookup, mail-tester corroboration, evidence file created
3. **Task 3: HUMAN — confirm inbox placement and header authentication** — `fc02641` (docs) — human-confirmed Gmail Primary-inbox placement + raw header verdicts recorded; REQUIREMENTS.md updated to Partial

**Plan metadata:** this commit (docs: SUMMARY)

## Files Created/Modified

- `.planning/phases/07-email-foundation-resend-provisioning/07-03-DELIVERY-EVIDENCE.md` — the audit-trail evidence file: DNS pre-flight, sends table (gmail confirmed, outlook explicitly not attempted), mail-tester score, human inbox-verification table with the raw `Authentication-Results` header block, and an explicit "EMAIL-02 status" section stating what is and isn't verified
- `.planning/REQUIREMENTS.md` — EMAIL-02 checkbox annotated with the partial-verification note; traceability table row changed from `Pending` to `Partial — Gmail confirmed; Outlook/Microsoft-family unverified ...`

## Decisions Made

See `key-decisions` in frontmatter. The most consequential decision was not mine to make but the human's: explicitly narrowing this run to Gmail-only and instructing that the Outlook leg be recorded as a gap rather than silently dropped or guessed at. I followed that instruction literally — the evidence file and REQUIREMENTS.md both name the gap explicitly, in the specific places a future `/gsd-plan-phase --gaps` pass or a future reader of REQUIREMENTS.md would look.

## Deviations from Plan

### 1. [Scope reduction, human-directed, not an auto-fix rule] Outlook/Hotmail/Live leg not attempted

- **Found during:** Task 1 checkpoint resolution
- **What happened:** The plan's Task 1 explicitly anticipated this exact possibility (discovered_facts record 3, and the task's own action block: "If the human confirms a Gmail address but declines to supply a Microsoft-family address, stop and report a gap against EMAIL-02 ... Do not silently proceed with one provider"). The human did decline, and I followed the plan's own pre-written contingency: proceeded with the Gmail send only, recorded the Outlook leg as `skipped-by-human-decision` (not attempted, not passed) in the evidence file, and did **not** mark EMAIL-02 fully `Complete` in REQUIREMENTS.md.
- **Files modified:** `07-03-DELIVERY-EVIDENCE.md`, `.planning/REQUIREMENTS.md`
- **Verification:** `grep -c` checks confirm the evidence file has no fabricated Outlook row (folder/verdicts are literally `N/A — skipped by human decision`); REQUIREMENTS.md traceability table names the gap inline rather than using a bare `Complete`.
- **Committed in:** `fd9644d`, `fc02641`
- **Impact:** EMAIL-02 is genuinely half-open. A future follow-up (new quick-task or a 07-04 plan, at the account owner's discretion) must supply a real Outlook/Hotmail/Live address and repeat Task 2/3 of this plan against it before EMAIL-02 can be marked fully `Complete`.

### 2. [Corroboration channel worked better than anticipated] Resend's retrieve-email endpoint did not reject the sending-only key

- **Found during:** Task 2, step (c)
- **Issue:** Discovered_facts record 4 anticipated `GET /emails/{id}` might return `{"statusCode":401,"name":"restricted_api_key"}` for a sending-only key, based on another project's prior experience. That did not happen here — the call succeeded and returned `last_event: delivered`.
- **Action:** No fix needed; this is a positive deviation. Recorded the actual `delivered` value rather than the anticipated fallback text, per the plan's own instruction to record what's actually observed.
- **Files modified:** none beyond the evidence file's factual content.
- **Committed in:** `fd9644d`

---

**Total deviations:** 1 human-directed scope reduction (handled per the plan's own pre-written contingency, not an ad-hoc decision), 1 positive/no-op deviation (better-than-expected API behavior, no fix needed)
**Impact on plan:** All 3 tasks completed as designed given the human's explicit input at Task 1. The plan's own acceptance criteria for a "gap, not a silent pass" when one provider is declined were followed exactly.

## Issues Encountered

- mail-tester.com's generated test address is not in the page's visible `innerText` (contrary to the plan's stated assumption) — it lives in `input#email[name="id"]`'s `value` attribute, populated client-side. Read it via `page.$eval("input[name=id]", el => el.value)` instead of a text-content regex. No functional impact; just a different DOM-scraping approach than the plan's action block literally described.
- The shared `/home/services/.env.production` file still contains the pre-existing, out-of-scope `LAUNCH-TEST_UMAMI_WEBSITE_ID` hyphenated-variable-name issue (logged in Plan 01's `deferred-items.md`) — produces a harmless `command not found` on `set -a; . file` sourcing. Confirmed non-fatal (script continued and the subsequent `curl` call succeeded); not fixed, out of scope for this plan per Plan 01's own deferral.

## User Setup Required

**Outlook/Hotmail/Live real-inbox verification is still outstanding** for EMAIL-02 to be fully satisfied. Whenever convenient, supply a real Microsoft-family address (existing or freshly created at outlook.com) and re-run:
```
cd /home/services/psalter
npx tsx scripts/send-test-email.ts <outlook-address> --label "outlook"
```
then check Inbox vs Junk Email and the `Authentication-Results` line in "View message source."

## Next Phase Readiness

- Gmail deliverability is proven end-to-end with human sign-off: Phase 8 (feedback notifications) and Phase 9 (changelog broadcasts) can proceed on the assumption that mail sent via `sendEmail()` reaches Gmail inboxes correctly authenticated
- Outlook/Microsoft-family deliverability remains an **open, explicitly-tracked gap** — not a blocker invented by this plan, but a real unknown that Phase 8/9 should be aware of if any of their recipients use Outlook/Hotmail/Live
- The mail-tester.com corroboration pattern (shared Playwright daemon, DOM-scrape the generated address, send via the existing CLI, re-navigate to read the score) is reusable for the eventual Outlook follow-up or any future deliverability regression check

## Known Stubs

None — no application code was written in this plan; it is a verification/evidence-recording plan only.

## Threat Flags

None beyond what this plan's own `<threat_model>` already covers (T-07-17 through T-07-22). No new surface introduced. Recipient/test addresses were kept out of `src/`/`scripts/` (grep-confirmed) and redacted in the committed evidence file; the Resend API key was never echoed (referenced only via `$PSALTER_RESEND_API_KEY` in an `Authorization` header).

---
*Phase: 07-email-foundation-resend-provisioning*
*Completed: 2026-07-31*

## Self-Check: PASSED

- FOUND: `.planning/phases/07-email-foundation-resend-provisioning/07-03-DELIVERY-EVIDENCE.md`
- FOUND: commit `fd9644d` (Task 2 — real Gmail send + evidence file)
- FOUND: commit `fc02641` (Task 3 — human confirmation recorded + REQUIREMENTS.md Partial)
