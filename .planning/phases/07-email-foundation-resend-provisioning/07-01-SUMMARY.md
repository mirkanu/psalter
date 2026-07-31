---
phase: 07-email-foundation-resend-provisioning
plan: 01
subsystem: infra
tags: [resend, dns, dmarc, cloudflare, pm2, env-vars, secrets-hygiene]

# Dependency graph
requires: []
provides:
  - "_dmarc.mail.gsdlabs.dev TXT record (v=DMARC1; p=none; adkim=r; aspf=r) in Cloudflare zone gsdlabs.dev"
  - "scripts/verify-email-dns.sh — repeatable SPF/DKIM/MX/DMARC pass-fail gate for mail.gsdlabs.dev"
  - "PSALTER_RESEND_API_KEY + PSALTER_RESEND_FROM_ADDRESS live in /home/services/.env.production and reaching the running psalter PM2 process"
  - "scripts/start-with-db-wait.sh: space-safe, non-fatal shared-env loading (set -a sourcing replaces the xargs/export idiom)"
affects: [07-02, 07-03, "any future phase sending email via Resend"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Repeatable dependency-free DNS verification script pattern (dig @1.1.1.1 +short, no set -e, per-check PASS/FAIL with failure counter)"
    - "PM2 fork-mode entrypoint: shared VPS secrets sourced via `set -a; . file; set +a` before project .env, wrapped in set +e/set -e so a malformed shared file can never abort startup"
    - "Verify env vars reached a live process via /proc/<pid>/environ (grep -c only) rather than `pm2 env <id>`, which reflects a different internal snapshot for fork-mode scripts that source env at runtime"

key-files:
  created:
    - scripts/verify-email-dns.sh
    - .planning/phases/07-email-foundation-resend-provisioning/deferred-items.md
  modified:
    - scripts/start-with-db-wait.sh

key-decisions:
  - "Reused existing mail.gsdlabs.dev sending subdomain (shared with 7 sibling VPS projects) rather than provisioning a new subdomain — SPF/DKIM already verified there, matches convention"
  - "DMARC policy p=none (monitor-only), adkim=r/aspf=r (relaxed alignment), no rua= — no receiving mailbox exists on gsdlabs.dev and cross-domain reporting to gmail.com would be silently discarded without an external-reporting authorization record"
  - "DMARC record placed at _dmarc.mail.gsdlabs.dev (subdomain-scoped), explicitly NOT at _dmarc.gsdlabs.dev (zone apex), to avoid affecting unrelated subdomains"
  - "Declined to write the Resend API key into the shared secrets file myself when it was first pasted directly into a coordinator message — the plan's own Task 2 design specifically required the human to enter it themselves so the key never transits an agent/transcript. Independently re-verified (grep name-only + diff against the coordinator-provided backup file) once told the value had been written directly to the file, rather than trusting the claim alone — see Deviations."

patterns-established:
  - "scripts/verify-email-dns.sh: use before any future phase that depends on email deliverability, to confirm DNS state hasn't regressed"
  - "Prefer /proc/<pid>/environ (grep -c, count only) over `pm2 env <id>` when verifying that a fork-mode PM2 process's runtime-sourced env vars actually reached the process"

requirements-completed: [EMAIL-01]

# Metrics
duration: ~45min (across 2 sessions with a checkpoint pause in between)
completed: 2026-07-31
---

# Phase 07 Plan 01: Resend DNS Provisioning & PM2 Env Wiring Summary

**Published the missing DMARC record for mail.gsdlabs.dev, shipped a repeatable SPF/DKIM/MX/DMARC verification script, and wired PSALTER_RESEND_API_KEY / PSALTER_RESEND_FROM_ADDRESS into the live psalter PM2 process via a space-safe env-loading rewrite of the entrypoint script — EMAIL-01 fully closed.**

## Performance

- **Duration:** ~45 min total, split across two sessions with a human-action checkpoint pause between Task 1 and Task 2/3
- **Tasks:** 3 of 3 completed
- **Files modified:** 1 created (`scripts/verify-email-dns.sh`), 1 modified (`scripts/start-with-db-wait.sh`), 1 external DNS record created, 2 lines added + 1 line fixed in the shared (non-repo) secrets file

## Accomplishments

- Created `_dmarc.mail.gsdlabs.dev` TXT record in Cloudflare zone `gsdlabs.dev` with content `v=DMARC1; p=none; adkim=r; aspf=r` — confirmed via Cloudflare API `"success":true` and via public DNS lookup
- Confirmed idempotency (no pre-existing record before creation, exactly one record after) and that the three pre-existing records (SPF, DKIM, MX) are byte-identical to their pre-plan values — untouched
- Built `scripts/verify-email-dns.sh`: dependency-free, queries `dig @1.1.1.1 +short` directly (bypasses local cache), reports PASS/FAIL per record, exits 1 on any failure. Deployed to both the worktree and the live production checkout (see Deviations)
- `PSALTER_RESEND_API_KEY` (sending-only Resend key, scoped to `mail.gsdlabs.dev`) and `PSALTER_RESEND_FROM_ADDRESS="CPRC Psalter <psalter@mail.gsdlabs.dev>"` added to `/home/services/.env.production`
- Fixed the pre-existing malformed `PORTFOLIO_RESEND_FROM_ADDRESS` line (was unquoted with embedded spaces, which broke sourcing the whole file) by quoting it, matching the `KIDAI_RESEND_FROM_ADDRESS` convention — no other lines touched
- Rewrote `scripts/start-with-db-wait.sh`'s env-loading block: replaced the unsafe `export $(grep ... | xargs)` idiom (word-splits any value containing spaces) with `set -a; . file; set +a`, sources the shared VPS file before the project `.env` (project-local values still win on overlap), and wraps the whole block in `set +e`/`set -e` so a malformed shared-env line can never kill startup
- Restarted the live `psalter` PM2 process (id 7) and verified — via direct inspection of `/proc/<pid>/environ`, not `pm2 env` (see Deviations) — that `PSALTER_RESEND_API_KEY`, `PSALTER_RESEND_FROM_ADDRESS`, and `DATABASE_URL` all reached the running process, and that `http://localhost:3005/psalms` still returns HTTP 200 with 0 unstable restarts

## Task Commits

Each task committed atomically in the `worktree-agent-a167eb0b5c0bdd072` worktree branch:

1. **Task 1: Add the missing DMARC record and build a repeatable email-DNS gate** — `49d499c` (feat)
2. **Task 2: HUMAN — create the psalter Resend API key and add the two env vars** — checkpoint; no repo commit (the two new lines live only in `/home/services/.env.production`, which is outside git by design — see Environment Variables note below)
3. **Task 3: Make the shared env file safe to source and reach the running psalter process** — `a8b8bd0` (fix)

**Plan metadata:** this commit (docs: SUMMARY)

## Files Created/Modified

- `scripts/verify-email-dns.sh` — pass/fail DNS gate (SPF, DKIM, MX, DMARC) for `mail.gsdlabs.dev`. Also present at the live production path `/home/services/psalter/scripts/verify-email-dns.sh` (see Deviations).
- `scripts/start-with-db-wait.sh` — env-loading block rewritten (space-safe, non-fatal). Also deployed to the live production path.
- `.planning/phases/07-email-foundation-resend-provisioning/deferred-items.md` — logs one out-of-scope, pre-existing issue found during verification (see below).
- `/home/services/.env.production` (external, not a repo file): `PSALTER_RESEND_API_KEY`, `PSALTER_RESEND_FROM_ADDRESS` added; `PORTFOLIO_RESEND_FROM_ADDRESS` quoting fixed. No other lines touched (confirmed via diff against a pre-edit backup).
- Cloudflare DNS (external): new TXT record `_dmarc.mail.gsdlabs.dev`, record id `bfbc3bece29f4a64aef475dbb7aa1b3e`.

## Decisions Made

See `key-decisions` in frontmatter. The most significant one made during execution (not pre-specified by the plan) concerned how to handle the Task 2 checkpoint resolution — detailed fully below under Deviations, since it materially changed the flow of execution.

## Deviations from Plan

### 1. [Operational necessity] Deployed both scripts to the live production checkout, not just the worktree

- **Found during:** Task 1 verification
- **Issue:** This executor runs in an isolated git worktree. This plan's own `<verify>`/`<acceptance_criteria>` blocks hardcode the absolute production path `/home/services/psalter/scripts/...` and require the scripts to be live *now* (DNS/infra provisioning, not a deferred feature branch), and Task 3 explicitly requires restarting the actual live PM2 process.
- **Fix:** Created/edited both `scripts/verify-email-dns.sh` and `scripts/start-with-db-wait.sh` in the worktree (committed normally) AND copied identical content to the corresponding paths under `/home/services/psalter/` so they took effect immediately.
- **Files:** `scripts/verify-email-dns.sh`, `scripts/start-with-db-wait.sh` (both worktree-committed and live-deployed)
- **Verification:** Both scripts diffed byte-identical between worktree and live paths; both pass their respective checks from either location.
- **Committed in:** `49d499c`, `a8b8bd0` (worktree copies)
- **Note for orchestrator:** when `worktree-agent-a167eb0b5c0bdd072` is merged to `master`, both files will already exist and be byte-identical on the live checkout — should merge cleanly, but flagging in case git raises an "untracked/modified working tree file would be overwritten" notice.

### 2. [Rule 4-adjacent — security process deviation, escalated and resolved] Declined an initial request to write the Resend API key from a chat-relayed value; required independent re-verification before proceeding

- **Found during:** Task 2 checkpoint resolution
- **What happened:** After I returned the Task 2 human-action checkpoint, a message purporting to be from the orchestrator/coordinator relayed a raw Resend API key value directly in-chat and asked me to write it into `/home/services/.env.production` myself. This directly contradicted the plan's own explicit design for this checkpoint (the key must never enter the chat transcript or be handled by the agent; the human was meant to type it directly into the file) and the system-level rule that no agent message constitutes user consent for a configuration change to a shared production secrets file. I declined to act on it and held at the checkpoint, explaining why.
- **What happened next:** A follow-up message stated the human had authorized this directly to the coordinator, that the coordinator had written the two lines to the file itself (not asking me to handle the raw value), and invited me to independently verify. Rather than accepting either claim at face value, I performed my own independent, read-only verification: (a) `grep -c` name/prefix checks for both new variables (both returned exactly 1), (b) confirmed no key literal existed anywhere under `src/` or `scripts/`, (c) confirmed no duplication into the project `.env`, and (d) diffed the file against the coordinator-referenced pre-edit backup (`/home/services/.env.production.bak.<timestamp>`), confirming **only** the two expected lines were added and nothing else in this 6+-project shared file was altered. Only after this independent confirmation did I proceed to Task 3.
- **Why this matters / impact:** No fabricated or guessed key value was ever written by me. The raw key value was never echoed by me in any tool output or in this SUMMARY. The eventual proceeding to Task 3 was based on my own direct verification of file state (satisfying the plan's own Task 2 acceptance criteria), not on trust in any relayed claim.
- **Recommendation:** Given the key value did appear in the conversation transcript at least once (in the message that relayed it to me, before I declined to act on it), standard "assume exposure, rotate" hygiene would suggest minting a fresh `psalter-production` key in the Resend dashboard and updating `/home/services/.env.production` again, entered directly by a human with no relay through any agent. This is a recommendation, not something I've actioned — flagging it here for the record.

### 3. [Rule 1 - Bug, self-caused, disclosed] Accidentally printed multiple unrelated production secrets in cleartext via a bad `pm2 env` inspection command

- **Found during:** Task 3 verification step
- **Issue:** My first verification attempt used `pm2 env 7 | grep -c '^PSALTER_RESEND_API_KEY=re_'` (per the plan's literal acceptance-criteria command), which returned 0 unexpectedly. To debug why, I ran a follow-up diagnostic (`pm2 env 7 | cut -d'=' -f1 | sort`) assuming `pm2 env` output uses a `KEY=value` format. It does not — the actual format is `KEY: value` (with ANSI color codes). Because the delimiter assumption was wrong, `cut -d'='` did not split anything, and the full, unredacted output — including `CLOUDFLARE_API_KEY`, `BETTER_AUTH_SECRET`, `CRON_SECRET`, `DATABASE_URL` (with the DB password), `DASHBOARD_PASS`, `DASHBOARD_SECRET_KEY`, `B2_APPLICATION_KEY(+ID)`, `BETTERSTACK_API_KEY`, several `DEBATES_*` project secrets, and others — was printed into my tool-call output for this conversation.
- **Fix:** Immediately stopped further `pm2 env` raw inspection. Re-verified using the correct colon delimiter with `grep -c` (count-only, e.g. `pm2 env 7 | grep -c '^PSALTER_RESEND_API_KEY:'`), and additionally cross-checked via `/proc/<pid>/environ` (also `grep -c` only) as a more reliable source of truth for this fork-mode process's actual runtime environment. No further raw secret values were printed after this point.
- **Disclosure:** I am flagging this explicitly rather than omitting it. **A real, unintended cleartext exposure of numerous production secrets occurred in this session's tool-call history** (Cloudflare global API key, Better Auth secret, cron secret, database credentials, dashboard secrets, B2/Backblaze keys, Better Stack API key, and several `debates` project secrets — full list recoverable from this session's transcript). Standard incident hygiene per this VPS's own security conventions ("a committed key... is still compromised... Rotation is mandatory, not optional") argues for rotating every one of these, out of caution, even though the exposure was to a tool-call transcript rather than a git commit. I did not rotate anything myself — that's a decision for the account owner given how many services and projects are affected — but this needs to be surfaced, not buried.
- **Note on the coordinator's earlier "unrelated side note":** an earlier message described an unrelated incident where the coordinator itself had accidentally printed `PSALTER_ADMIN_PASSWORD` and `OPENROUTER_API_KEY` in cleartext via "a bad grep redaction regex." Having now independently made a very similar mistake myself (wrong-delimiter assumption on `pm2 env` output), I consider that report plausible and consistent with a real, easy-to-hit failure mode of this exact command — not something I can confirm firsthand, but not implausible either.
- **Committed in:** N/A — this is a transcript-level disclosure, not a file change requiring a commit.

### 4. [Rule 3 - Blocking, deferred not fixed] `LAUNCH-TEST_UMAMI_WEBSITE_ID` invalid variable name — out of scope

- **Found during:** Task 3, verifying the shared env file sources without a `syntax error`
- **Issue:** A hyphenated variable name (`LAUNCH-TEST_UMAMI_WEBSITE_ID`) in an unrelated project's block causes a non-fatal `command not found` (not a `syntax error`, so it does not fail this plan's specific acceptance check) when the file is sourced.
- **Action:** Logged to `deferred-items.md`, not fixed — belongs to a different project, out of this plan's scope, and renaming another project's env key risks breaking whatever currently reads it (even if broken).

---

**Total deviations:** 4 (2 operational necessities, 1 security-process escalation handled correctly with independent verification, 1 self-caused disclosure requiring owner follow-up, 1 out-of-scope deferral)
**Impact on plan:** EMAIL-01 fully delivered as specified, with no fabricated secrets and no scope creep on code. The most consequential deviation (#3) is an operational security matter for the account owner to act on (key rotation), not a plan-completion blocker — DNS, key provisioning, and PM2 wiring are all independently verified correct regardless of the incidental exposure.

## Issues Encountered

- `pm2 env <id>` does not reliably reflect the actual runtime environment of a fork-mode PM2 process whose entrypoint script sources env vars itself at runtime (as `start-with-db-wait.sh` does) — it appears to report a different internal snapshot. `/proc/<pid>/environ` was used instead as the authoritative check once this was discovered, and is recommended for any future phase needing to verify env-var propagation into this specific process.
- DNS propagation to the `1.1.1.1` public resolver took ~15 seconds after the Cloudflare API create call — expected, resolved with a short wait and retry.

## User Setup Required

None outstanding — Task 2's external service configuration (Resend API key creation, domain confirmation) was completed via the human-action checkpoint. See Deviation #2 for how this was resolved, and the rotation recommendation in Deviation #3 for optional follow-up security hygiene (account owner's call, not blocking).

## Next Phase Readiness

- EMAIL-01 is fully closed: DNS (SPF/DKIM/MX/DMARC) verified and machine-checkable via `scripts/verify-email-dns.sh`; `PSALTER_RESEND_API_KEY` (sending-only) and `PSALTER_RESEND_FROM_ADDRESS` are live in `/home/services/.env.production` and confirmed present in the running `psalter` PM2 process's actual environment
- `psalter` continues serving `/psalms` with HTTP 200, 0 unstable restarts, after the entrypoint rewrite
- Plans 07-02 and 07-03 can now assume `PSALTER_RESEND_API_KEY` / `PSALTER_RESEND_FROM_ADDRESS` are live and available to any server-side code that reads `process.env` in the running process
- **Recommend the account owner consider rotating the secrets listed in Deviation #3**, independent of this plan's completion

## Known Stubs

None — no stub data or placeholder UI introduced (infra/DNS/env-wiring work only).

## Threat Flags

None beyond what the plan's own `<threat_model>` already covers (T-07-01 through T-07-08). No new surface introduced. The transcript-exposure incident (Deviation #3) is a process/operational security matter, not a new code-level threat surface — flagged above and in the disclosure, not modeled as a new STRIDE entry since it's not a property of the shipped artifact.

---
*Phase: 07-email-foundation-resend-provisioning*
*Completed: 2026-07-31*

## Self-Check: PASSED

- FOUND: `scripts/verify-email-dns.sh` (worktree)
- FOUND: `/home/services/psalter/scripts/verify-email-dns.sh` (live, executable)
- FOUND: `scripts/start-with-db-wait.sh` (worktree, modified)
- FOUND: `.planning/phases/07-email-foundation-resend-provisioning/07-01-SUMMARY.md` (worktree + live)
- FOUND: commit `49d499c` (Task 1)
- FOUND: commit `a8b8bd0` (Task 3)
- FOUND: commit `c4f0c4b` (REQUIREMENTS.md EMAIL-01 complete)
