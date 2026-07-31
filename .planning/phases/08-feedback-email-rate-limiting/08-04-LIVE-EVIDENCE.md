# Phase 08 — Live Evidence

## Deployment

- build started: 2026-07-31T18:39:45Z
- build completed: `npm run build` exit 0, no `Failed to compile`, TypeScript pass in 38.0s, 1530 static pages generated, `/api/feedback` listed as dynamic (`ƒ`) in the route table
- `.next/BUILD_ID` mtime: 2026-07-31 18:41:21.116629693 +0000
- `pm2 restart psalter` run, then `sleep 8`
- pm2 pid: 2005136
- process start (`ps -o lstart=`): Fri Jul 31 18:41:32 2026
- process start postdates BUILD_ID mtime by ~11 seconds — running process is NOT a stale bundle
- `pm2 list | grep psalter`: status `online`, restart count 7, uptime 8s at check time
- GET /psalms: `200`

## Rate limiting (FEED-02, success criterion 3)

- Burst source IP: `203.0.113.99` (forged `X-Forwarded-For`, local `curl` against `localhost:3005` bypassing the Cloudflare Tunnel — documented trust boundary T-08-01/T-08-20/T-08-32)
- 6-request burst result: `req1=200 req2=200 req3=200 req4=200 req5=200 req6=429`
- Accepted-response body (req1-5, identical shape each time): `{"ok":true}`
- req6 (429) body, verbatim: `{"error":"too many requests","retryAfterSeconds":60}`
- 7th request (separate call, same throttled IP), `Retry-After` header, verbatim: `retry-after: 60`
- All values are within the acceptance range (`retryAfterSeconds` 1-60, and a `Retry-After:` header line was present)

## Email notification (FEED-01, success criterion 1)

- 5 accepted submissions (req1-5) => 5 notification sends attempted via `sendFeedbackNotification` (fire-and-forget from `POST /api/feedback`), each labelled `PHASE08-SMOKE <n>` in the message body, name `Phase 8 smoke test`, page URL `https://psalter.gsdlabs.dev/psalms/23`
- `pm2 logs psalter --lines 60 --nostream | grep -c '\[feedback\] notification email'` => `0` (no send failures logged; the only log line this code path would emit on failure is `[feedback] notification email threw:`, which is the substring matched)
- human inbox confirmation: see "Human verification" section below (Task 3)

## Human verification (2026-07-31)

Human's verbatim reply at the Task 2 checkpoint: "All confirmed except 5, let's skip that (your smoke test was enough)"

- Smoke emails received: 5 of 5 — inbox placement: Primary
- Live modal submission: arrived, subject: `CPRC Psalter feedback from <name they used>`
- Reply-To behaviour: confirmed correct
- Rate-limit message shown on 6th rapid submission: NOT TESTED — human decision to skip, citing Task 1's automated live burst test (`200 200 200 200 200 429` + the `429` body + `Retry-After` header, all captured against the real deployed endpoint above) as sufficient evidence for the underlying FEED-02 behavior
- Recovery after ~60s: yes
- Verdict: GAPS

## Open gaps

- FEED-02 / phase success criterion 3 (rate-limit UI message): the live browser-UI rendering of the "You've sent several messages just now. Please wait a minute and try again." message on the 6th rapid submission was not manually verified by a human, by explicit human decision — not a defect, not a failed check, not a wrong message shown. The underlying 429 rejection behavior IS fully verified live end-to-end (Task 1: real deployed `/api/feedback` endpoint, real per-IP counter, real `Retry-After` header). The `FeedbackModal.tsx` message-display branch that renders that specific sentence on a 429 response was verified via Plan 08-03's unit tests only, never by a human eyeball in a live browser.

## Notes

- The working tree had two pre-existing, unrelated uncommitted changes at the start of this plan (a CLAUDE.md auto-managed Stack section update, and a `src/components/PsalmListingGrid.tsx` scroll-to-section fix) — neither is part of Phase 8. Both were set aside with `git stash push -- CLAUDE.md src/components/PsalmListingGrid.tsx` before running `npm run build`, so the deployed bundle reflects only the last committed state (through `ee778a1`, which includes Phase 8 Plans 01-03) plus no other in-flight edits. The stash was restored (`git stash pop`) after the burst test completed, before this evidence file was written, so the working tree returned to its pre-plan state and no source file is modified by this plan's Task 1 (`git status --porcelain src/` is empty for anything caused by this task).
- Requests 1-5 each triggered a real email send attempt to `manuelkuhs@gmail.com` (the code default for `getFeedbackToAddress()` — no env var override configured, per plan discovered_facts record 2). These are the direct evidence basis for "an email for every accepted submission"; the human confirms actual inbox arrival at the Task 2 checkpoint.
- No Resend API key fragment appears anywhere in this file — nothing was printed from `/proc/<pid>/environ` or any Resend key material; the environment was not inspected in this task since it was not needed to prove the burst-test and deployment claims above.
