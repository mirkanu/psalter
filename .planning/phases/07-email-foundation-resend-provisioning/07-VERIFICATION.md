---
phase: 07-email-foundation-resend-provisioning
verified: 2026-07-31T12:28:41Z
status: passed
score: 8/8 must-haves verified (1 via recorded human override)
overrides_applied: 1
overrides:
  - must_have: "A test email sent through sendEmail arrives in a real Outlook/Hotmail inbox, not Junk"
    reason: "Human explicitly declined to supply a Microsoft-family (Outlook/Hotmail/Live) test address for this run and instructed testing Gmail only. This is a deliberate, disclosed scope reduction, not an executor shortcut: the plan's own contingency (07-03-PLAN.md Task 1) anticipated exactly this case and required reporting it as a gap rather than fabricating a pass. It is recorded consistently as 'Partial' in REQUIREMENTS.md, in 07-03-DELIVERY-EVIDENCE.md, and in 07-03-SUMMARY.md. No Outlook row was fabricated (evidence file literally reads 'N/A — skipped by human decision')."
    accepted_by: "Manuel Kuhs (human decision relayed and executed during 07-03 plan execution; reaffirmed for this verification run)"
    accepted_at: "2026-07-31T12:20:00Z"
---

# Phase 07: Email Foundation (Resend Provisioning) Verification Report

**Phase Goal:** The site can send real email through Resend, from a domain that lands in real inboxes, not spam
**Verified:** 2026-07-31T12:28:41Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Merged from ROADMAP.md Success Criteria (Phase 7) and all three plans' `must_haves.truths`.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `PSALTER_RESEND_API_KEY` present in shared env file, sending-only, `re_`-prefixed | ✓ VERIFIED | `grep -c '^PSALTER_RESEND_API_KEY=re_' /home/services/.env.production` → `1`. No key literal anywhere under `src/` or `scripts/` (`grep -rnE 're_[A-Za-z0-9]{10}'` → 0 matches). |
| 2 | `PSALTER_RESEND_FROM_ADDRESS` present, correctly double-quoted | ✓ VERIFIED | `grep -c '^PSALTER_RESEND_FROM_ADDRESS="CPRC Psalter <psalter@mail.gsdlabs.dev>"$'` → `1`. |
| 3 | Shared env file sources with no bash syntax error | ✓ VERIFIED | `bash -c 'set -a; . /home/services/.env.production; set +a' 2>&1 \| grep -c 'syntax error'` → `0`. (One pre-existing, documented, out-of-scope `command not found` from an unrelated project's hyphenated var name — non-fatal, does not affect this phase.) |
| 4 | Both `PSALTER_RESEND_*` vars reach the live psalter process | ✓ VERIFIED | Live PM2 process (pid 496072, status `online`, 0 unstable restarts) — `grep -zc` against `/proc/496072/environ` returns `1` for both `PSALTER_RESEND_API_KEY=re_` and `PSALTER_RESEND_FROM_ADDRESS=`; `DATABASE_URL=` also present (no regression). `curl http://localhost:3005/psalms` → `200`. |
| 5 | SPF, DKIM, MX, DMARC all resolve from public DNS for `mail.gsdlabs.dev` | ✓ VERIFIED | Live re-run: `bash scripts/verify-email-dns.sh` → 4/4 `PASS`, exit 0. `_dmarc.mail.gsdlabs.dev` TXT = `v=DMARC1; p=none; adkim=r; aspf=r` (no `rua=`/`ruf=`). `_dmarc.gsdlabs.dev` (apex) confirmed empty — no over-broad record created. |
| 6 | A single, tested, non-throwing `sendEmail({to, subject, html, text})` entry point exists | ✓ VERIFIED | `src/lib/email.ts` exports `sendEmail`, `getFromAddress`, `isEmailConfigured`, `DEFAULT_FROM_ADDRESS` exactly as specified. Client constructed lazily inside `sendEmail` (not module scope). `npx vitest run src/lib/email.test.ts` → 17/17 passing (re-ran live). Never-throws contract wraps the whole body in try/catch; key never interpolated into error strings (verified by reading source and by the code review's sentinel-key test). |
| 7 | A CLI test-send exists, runnable with one command, rehearsable via `--dry-run` with no key | ✓ VERIFIED | `npx tsx scripts/send-test-email.ts nobody@example.com --dry-run` (re-ran live) → exit 0, prints `from=`, `to=`, `subject=`, `configured=true`, no `re_` substring anywhere in output. |
| 8 | A real test email sent through `sendEmail` lands in a real Gmail inbox (not Spam/Promotions), with `spf=pass`, `dkim=pass`, `dmarc=pass` aligned to `mail.gsdlabs.dev` | ✓ VERIFIED | `07-03-DELIVERY-EVIDENCE.md`: message id `846ffbbf-960b-4aee-9a57-2322a2a9a95e`, Resend `last_event: delivered`. Human-pasted raw Gmail `Authentication-Results` header shows `spf=pass`, `dkim=pass` (`header.i=@mail.gsdlabs.dev`), `dmarc=pass` (`header.from=mail.gsdlabs.dev`), landed in Primary inbox. Independently corroborated by mail-tester.com 10/10 (same three verdicts, message id `f59198b3-8f83-4f13-9c0e-a9885bc5848f`). |
| 9 | A real test email sent through `sendEmail` lands in a real Outlook/Hotmail inbox (not Junk), same header verdicts | ⚠️ PASSED (override) | Not attempted — human explicitly declined to supply a Microsoft-family address for this run. See `overrides` in frontmatter. `07-03-DELIVERY-EVIDENCE.md` records this honestly as "N/A — skipped by human decision" (no fabricated pass). `REQUIREMENTS.md` traceability table marks EMAIL-02 `Partial`, not `Complete`. |

**Score:** 8/9 truths independently VERIFIED, 1/9 accepted via recorded human override (accurately and consistently disclosed) = 9/9 effective.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/verify-email-dns.sh` | Repeatable pass/fail gate over SPF/DKIM/MX/DMARC | ✓ VERIFIED | Exists, executable, contains `_dmarc.mail.gsdlabs.dev`, no `set -e`, uses `dig @1.1.1.1 +short`. Ran live: 4/4 PASS, exit 0. |
| `scripts/start-with-db-wait.sh` | PM2 entrypoint loading shared env safely | ✓ VERIFIED | Contains `/home/services/.env.production`, `set -a`, no `xargs`, `pg_isready` wait loop intact, port 3005 unchanged. |
| `src/lib/email.ts` | Resend client wrapper | ✓ VERIFIED | Exports match spec exactly; `new Resend(` appears once, inside `sendEmail` body (not module scope); no caller-supplied `from` field; CRLF guard present (`CRLF_RE = /[\r\n]/`). |
| `src/lib/email.test.ts` | Unit tests, SDK mocked | ✓ VERIFIED | 17/17 tests pass live; SDK fully mocked, no network/key required. |
| `scripts/send-test-email.ts` | CLI test-send with `--dry-run` | ✓ VERIFIED | Runs, exits correctly per case (0 on dry-run/success, 2 on bad args, 1 on send failure). No hardcoded recipient. |
| `.planning/phases/07.../07-03-DELIVERY-EVIDENCE.md` | Recorded message ids, auth results, placement | ✓ VERIFIED | Exists, contains `dmarc=pass`, gmail row fully populated, outlook row honestly marked not-attempted, no `re_` fragment, redacted local parts. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `scripts/start-with-db-wait.sh` | `/home/services/.env.production` | `set -a` sourcing | ✓ WIRED | Confirmed both in source and by live `/proc/<pid>/environ` inspection. |
| `_dmarc.mail.gsdlabs.dev` TXT | Cloudflare zone `gsdlabs.dev` | Cloudflare DNS API | ✓ WIRED | Live `dig` confirms record present and correctly scoped (apex untouched). |
| `src/lib/email.ts` | `resend` npm package | lazy `new Resend(...)` inside `sendEmail` | ✓ WIRED | Confirmed by source read; module-scope has no `new Resend(`. |
| `scripts/send-test-email.ts` | `src/lib/email.ts` | `import { sendEmail } from '@/lib/email'` | ✓ WIRED | Confirmed by source read and successful dry-run execution (which imports the module). |
| `scripts/send-test-email.ts` | real Gmail mailbox | Resend API send | ✓ WIRED (Gmail only) | Real send executed, delivered, human-confirmed Primary inbox + pass headers. Outlook leg not exercised (override, see above). |

### Data-Flow Trace (Level 4)

Not applicable in the UI-rendering sense — this phase is infra/backend only (no component renders this data). The equivalent "does the data actually flow" check is the end-to-end real send, which was performed and independently corroborated (Resend `last_event: delivered` + mail-tester 10/10 + human-read raw headers all agree). Treated as ✓ FLOWING.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| EMAIL-01 | 07-01, 07-02 | Resend API key provisioned; sending subdomain verified (SPF/DKIM/DMARC) | ✓ SATISFIED | DNS gate passes live; key present in shared env and live process; `sendEmail` client built, tested, and used successfully for a real delivered send. REQUIREMENTS.md marks it Complete — consistent with codebase evidence. |
| EMAIL-02 | 07-03 | Test sends confirmed landing in real Gmail/Outlook inboxes | ◐ PARTIAL (accepted via override) | Gmail leg fully satisfied with independent corroboration. Outlook leg explicitly not attempted by human decision. REQUIREMENTS.md correctly reflects `Partial`, not `Complete` — consistent across REQUIREMENTS.md, 07-03-DELIVERY-EVIDENCE.md, and 07-03-SUMMARY.md. |

No orphaned requirements: `EMAIL-01` and `EMAIL-02` are the only two requirement IDs mapped to Phase 7 in REQUIREMENTS.md's traceability table, and both appear in plan frontmatter (`07-01`/`07-02` claim EMAIL-01, `07-03` claims EMAIL-02).

### Anti-Patterns Found

No blockers. Carried forward from `07-REVIEW.md` (already ran, status `issues_found`, 0 critical / 4 warning / 3 info) — not re-litigated in full here, but factored into this assessment:

| File | Severity | Impact on phase goal |
|---|---|---|
| `src/lib/email.ts:91` (`data!.id` on `data: null, error: null`) | Warning (WR-01) | Low-probability SDK edge case; still honors "never throws" contract; produces a confusing but non-blocking error string. Does not affect the goal — real sends in this phase all returned proper `data`. |
| `scripts/start-with-db-wait.sh` (malformed line can silently truncate rest of sourced file) | Warning (WR-02) | Latent risk for *future* env additions above `DATABASE_URL`/`PSALTER_RESEND_*`; does not affect current state (verified no truncation occurred — `DATABASE_URL` and both `PSALTER_RESEND_*` vars all reached the live process). |
| `scripts/start-with-db-wait.sh` (project `.env` can silently override shared `PSALTER_RESEND_*`) | Warning (WR-03) | Ownership-boundary gap, not exploited today — confirmed `grep -c 'PSALTER_RESEND' /home/services/psalter/.env` returns 0. |
| `src/lib/email.ts` (`to` array not validated per-element) | Warning (WR-04) | Minor; Resend SDK is the actual backstop today. Does not affect goal achievement. |

**Additional finding surfaced during this verification (not in 07-REVIEW.md, disclosed by the executor itself in 07-01-SUMMARY.md Deviation #3):** during Task 3 troubleshooting, a malformed `pm2 env` inspection command printed numerous unrelated production secrets in cleartext into the session's tool-call transcript (Cloudflare API key, Better Auth secret, cron secret, `DATABASE_URL` with password, dashboard secrets, B2/Backblaze keys, BetterStack key, several `debates`-project secrets). This was self-disclosed, not hidden, and does not affect whether Phase 7's email functionality works — but it is a real operational security event the account owner should act on (rotation), independent of this phase's goal. Flagging here per this workflow's transparency requirement rather than treating it as resolved by virtue of being disclosed.

### Human Verification Required

None outstanding for phase-goal purposes. The two items that inherently require a human (Gmail inbox placement/headers, Outlook inbox placement/headers) have already been through their checkpoint: Gmail is done and confirmed; Outlook was explicitly declined by the human and recorded as an accepted override rather than left open-ended. No further automated-but-uncertain items remain.

Recommended (non-blocking) follow-up for the account owner, not required to close this phase:
1. Whenever convenient, supply a real Outlook/Hotmail/Live address and run `npx tsx scripts/send-test-email.ts <address> --label "outlook"`, then check Inbox vs Junk and `Authentication-Results`, to fully close EMAIL-02 to `Complete`.
2. Consider rotating the secrets listed in 07-01-SUMMARY.md's Deviation #3 (accidentally printed in cleartext to a tool-call transcript during this phase's execution), and the Resend key itself per Deviation #2's recommendation, out of standard "assume exposure" hygiene.

### Gaps Summary

No blocking gaps. All EMAIL-01 truths are independently verified against the live codebase and running infrastructure (DNS, secrets wiring, live process, tested client code, and a real delivered send). EMAIL-02's Outlook leg is genuinely incomplete relative to the strict roadmap wording ("real Gmail account and a real Outlook account"), but this is a disclosed, human-directed, explicitly-authorized scope reduction — consistently recorded as `Partial` (not silently upgraded to `Complete`, not hidden) across `REQUIREMENTS.md`, `07-03-DELIVERY-EVIDENCE.md`, and `07-03-SUMMARY.md`. Recorded here as an accepted override rather than a blocker, per this run's explicit instruction not to over-penalize a deliberate human scope call. Phase 7's goal — "the site can send real email through Resend, from a domain that lands in real inboxes, not spam" — is demonstrated true for the one channel actually tested (Gmail), with strong independent corroboration (mail-tester 10/10) that the underlying authentication mechanism itself is provider-agnostic and correctly configured.

---

_Verified: 2026-07-31T12:28:41Z_
_Verifier: Claude (gsd-verifier)_
