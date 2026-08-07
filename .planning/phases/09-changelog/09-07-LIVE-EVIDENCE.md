# Phase 09 (Changelog) — Live Evidence

## (a) In-flight edit guard

`git status --short` at the start of Task 1 showed two files modified that are unrelated to Phase 9:

```
 M CLAUDE.md
 M src/components/PsalmListingGrid.tsx
```

`CLAUDE.md`'s change is the GSD-Dashboard auto-managed "Stack (auto-managed)" section
(analytics/monitoring keys). `PsalmListingGrid.tsx`'s change is an unrelated scroll-to-section
fix for the mobile book-tab jump behaviour. Neither touches changelog code. Both were set aside
with `git stash push -- CLAUDE.md src/components/PsalmListingGrid.tsx` before running `npm test`
or `npm run build`, so the deployed bundle reflects only the committed Phase 9 code (through the
last `09-06` commit) plus no other in-flight edits. The stash was restored (`git stash pop`) after
the burst test completed, before writing this file — `git status --short` afterward showed the
same two files back in their pre-plan modified state, confirming a clean round trip.

## (b) Full test suite, then build

`npm test -- --run`:

```
Test Files  9 failed | 56 passed (65)
     Tests  14 failed | 729 passed | 4 todo (747)
  Start at  10:48:16
  Duration  62.36s
```

All 14 failures are pre-existing test debt in files never touched by any Phase 9 plan (09-01
through 09-06) — confirmed via `git log -1` on each failing file, whose most recent change
predates Phase 9 entirely (most recent: commit `53748e9`, 2026-07-16). Failing files: three
`src/app/api/precent/**/route.test.ts` files (Next.js App Router `headers()`-outside-request-scope
test-environment mismatch), `src/lib/abc-melisma.test.ts`, `tests/tune-quality-phrase-count.test.ts`,
`tests/psalm-detail.test.ts`, `tests/tune-detail.test.ts`, `tests/psalm-23-crimond-regression.test.ts`,
`tests/lib-utilities.test.ts`. Zero changelog-related test files appear in the failing list — every
Phase 9 test passes. Full detail logged per scope-boundary rules in
`.planning/phases/09-changelog/deferred-items.md`, not fixed as part of this plan.

`npm run build`: exit 0, no `Failed to compile`. Route table includes the new changelog routes as
dynamic (`ƒ`): `/changelog`, `/changelog/unsubscribe`, `/api/changelog`, `/api/subscribe`,
`/api/unsubscribe`.

## (c) Restart and freshness proof

```
$ pm2 restart psalter
[PM2] Applying action restartProcessId on app [psalter](ids: [ 7 ])
[PM2] [psalter](7) ✓
$ sleep 8
$ PID=$(pm2 pid psalter)   # 3740847
$ ps -o lstart= -p "$PID"
Mon Aug  3 10:53:28 2026
$ stat -c '%y' /home/services/psalter/.next/BUILD_ID
2026-08-03 10:53:10.152231135 +0000
```

Process start time (`10:53:28`) is strictly later than `.next/BUILD_ID` mtime (`10:53:10`) — by
~18 seconds. The running process is NOT a stale bundle.

## (d) HTTP smoke of the new routes

```
$ curl -s -o /dev/null -w '%{http_code}\n' https://psalter.gsdlabs.dev/changelog
200
$ curl -s -o /dev/null -w '%{http_code}\n' https://psalter.gsdlabs.dev/
200
$ curl -s -o /dev/null -w '%{http_code}\n' 'https://psalter.gsdlabs.dev/changelog/unsubscribe?token=definitely-not-a-real-token'
200
$ curl -s -X GET -o /dev/null -w '%{http_code}\n' https://psalter.gsdlabs.dev/api/unsubscribe
405
```

All four match expected values exactly (`200`, `200`, `200`, non-2xx `405`) — a GET on
`/api/unsubscribe` does not succeed.

## (e) Anonymous visitor sees no composer; invalid-token page is a dead end

```
$ curl -s https://psalter.gsdlabs.dev/changelog | grep -c 'data-changelog-composer'
0
$ curl -s 'https://psalter.gsdlabs.dev/changelog/unsubscribe?token=definitely-not-a-real-token' | grep -c 'data-unsubscribe-invalid'
1
```

Both match expected values exactly.

## (f) Playwright smoke via the shared daemon

Used `/home/services/playwright-daemon/client.js` (`getStatus()` confirmed `browserReady: true`
before submitting the job — an earlier attempt hit a daemon-side job timeout mid-run and the
daemon auto-relaunched Chromium; the job was re-submitted successfully once `browserReady` was
confirmed `true` again). One job loaded the homepage and the changelog page and returned:

```json
{
  "heroText": "New\nCPRC Psalter v2.0 is here\n\nSee what's new in the latest release.\n\nRead the changelog",
  "heroHref": "/changelog",
  "h1Text": "Changelog",
  "composerCount": 0,
  "hasSubscribeSection": true
}
```

- `heroText` contains `CPRC Psalter v2.0 is here` — matches expectation
- `heroHref` is `/changelog` — matches expectation
- `h1Text` is `Changelog` — matches expectation
- `composerCount` is `0` (anonymous visit, no composer visible) — matches expectation
- `hasSubscribeSection` is `true` — matches expectation

## (g) Live subscribe round trip

Subscribed `manuelkuhs+psalter-chlg@gmail.com` (Gmail plus-alias, lands in the owner's own inbox):

```
$ curl -s -X POST https://psalter.gsdlabs.dev/api/subscribe \
    -H 'Content-Type: application/json' \
    -d '{"email":"manuelkuhs+psalter-chlg@gmail.com"}' -w '\n%{http_code}\n'
{"ok":true}
200

$ curl -s -X POST https://psalter.gsdlabs.dev/api/subscribe \
    -H 'Content-Type: application/json' \
    -d '{"email":"manuelkuhs+psalter-chlg@gmail.com"}' -w '\n%{http_code}\n'
{"ok":true}
200
```

Both responses are byte-identical (`{"ok":true}`, `200`) despite the second call hitting an
existing row — live proof of the anti-enumeration property (T-09-11).

```
$ docker exec psalter-db psql -U postgres -d psalter -t -A -c \
    "SELECT count(*), left(max(unsubscribe_token), 8) FROM changelog_subscribers WHERE email = 'manuelkuhs+psalter-chlg@gmail.com';"
1|99aeeddf
```

Row count is exactly `1` (not two) despite two POSTs. Only the first 8 characters of the
unsubscribe token are recorded here, per T-09-60 mitigation — the full token is never written to
this file.

## (h) Live throttle check

Six rapid subscribe POSTs against `http://localhost:3005` (bypassing the Cloudflare Tunnel per
discovered_facts 6, using a spoofed `X-Forwarded-For: 203.0.113.99` — the same documented trust
boundary as Phase 08's T-08-01/T-08-20/T-08-32):

```
$ for i in 1 2 3 4 5 6; do
    curl -s -o /dev/null -w '%{http_code} ' -X POST http://localhost:3005/api/subscribe \
      -H 'Content-Type: application/json' -H 'X-Forwarded-For: 203.0.113.99' \
      -d "{\"email\":\"burst-$i@example.invalid\"}"
  done; echo
200 200 200 200 200 429
```

Literal burst sequence matches expectation exactly: `200 200 200 200 200 429`.

A supplemental 7th request against the same still-throttled IP confirmed the 429 error body shape:

```
$ curl -s -X POST http://localhost:3005/api/subscribe \
    -H 'Content-Type: application/json' -H 'X-Forwarded-For: 203.0.113.99' \
    -d '{"email":"burst-check@example.invalid"}' -w '\n%{http_code}\n'
{"error":"too many requests","retryAfterSeconds":53}
429
```

(This 7th call was rejected by the limiter before any DB insert was attempted — a follow-up
`DELETE ... WHERE email = 'burst-check@example.invalid'` confirmed `DELETE 0`, i.e. no row was
ever created by it.)

Cleanup of the 6 throwaway burst rows:

```
$ docker exec psalter-db psql -U postgres -d psalter -c \
    "DELETE FROM changelog_subscribers WHERE email LIKE 'burst-%@example.invalid';"
DELETE 5
$ docker exec psalter-db psql -U postgres -d psalter -t -A -c \
    "SELECT count(*) FROM changelog_subscribers WHERE email LIKE 'burst-%@example.invalid';"
0
```

Zero `burst-%@example.invalid` rows remain.

## Notes

- The pre-existing unrelated `CLAUDE.md` / `PsalmListingGrid.tsx` edits (see step (a)) were
  restored via `git stash pop` after step (h), before this file was written — the working tree
  returned to its pre-plan state and no source file was modified by Task 1 beyond this evidence
  document itself.
- No Resend API key fragment, database credential, or full unsubscribe token appears anywhere in
  this file. `pm2 env` was never invoked (forbidden per discovered_facts 4); no environment
  inspection was needed for this task's claims.
- `manuelkuhs+psalter-chlg@gmail.com` remains subscribed (1 row) at the end of Task 1, ready for
  Task 2's human-verification checkpoint (admin publish → broadcast → inbox → unsubscribe).

## Human Verification

Checkpoint (Task 2) was presented to the human after Task 1's deployment and smoke tests. The
human's verbatim response: **"All Confirmed working!"** — a full pass across all of steps 2-6,
with no partial verdict, no reported failure, and nothing skipped.

| Step | What was checked | Verdict |
|---|---|---|
| 2. Anonymous view | `/changelog` heading reads "Changelog"; no "Write a post" card visible while logged out; a "Get notified of updates" single-email-field section present at the bottom | Pass |
| 3. Homepage hero | Hero card at top of `/` reads "CPRC Psalter v2.0 is here" with a "New" badge and a "Read the changelog" button linking to `/changelog`; "Changelog" present in site header navigation | Pass |
| 4. Admin publish | Logged-in admin session showed a "Write a post" card with an "Admin" badge at the top of `/changelog`; a post was published inline (no page navigation) with today's date and the entered line break preserved | Pass |
| 5. Inbox check | Broadcast email arrived at `manuelkuhs+psalter-chlg@gmail.com` within a minute or two, landed in Primary/Inbox (not Spam), subject and body matched the published post with the line break intact, and an "Unsubscribe:" link was present at the bottom | Pass |
| 6. Unsubscribe | Clicking the unsubscribe link showed "Unsubscribe from updates" with a masked address; nothing was removed before confirming; pressing "Unsubscribe" showed the success message and a "Back to Psalter" link; reloading the same link afterward showed the invalid/already-used state | Pass |

Mechanical confirmation of the two checkable halves of this verdict (run after the human's
response, from `/home/services/psalter`):

```
$ docker exec psalter-db psql -U postgres -d psalter -t -A -c \
    "SELECT count(*) FROM changelog_subscribers WHERE email = 'manuelkuhs+psalter-chlg@gmail.com';"
0
```

Row count is `0` — the unsubscribe click the human reported did in fact remove the subscriber row.
This corroborates step 6's "Pass" verdict rather than merely taking the human's word for the
database side-effect.

```
$ docker exec psalter-db psql -U postgres -d psalter -c \
    "SELECT id, title, created_at FROM changelog_posts ORDER BY created_at DESC LIMIT 3;"
 id |   title   |         created_at
----+-----------+----------------------------
 31 | V2 (Beta) | 2026-08-07 15:31:56.942781
(1 row)
```

Exactly one post exists in the table, `id=31`, titled **"V2 (Beta)"** — the human published this
during the live checkpoint (the checkpoint prompt suggested the title `CPRC Psalter v2.0` as an
example; the human used their own wording instead, which is expected and fine — the requirement
is that a real post was published through the live admin UI, not a specific title string). Being
the only row, it is trivially the newest, corroborating step 4's "Pass" verdict.

## Open Gaps

None.

## Cleanup decision (Task 3 step (e))

The human's published post ("V2 (Beta)", id 31) was created deliberately during a real,
human-run verification pass — not injected as disposable test data by a script. Per the plan,
a published changelog post is user-visible content and must not be silently deleted; asking the
human before deletion is required, and per the calling agent's explicit instruction this plan
does not pause again to ask. Decision: **the post is left in place** as real release content. It
remains live at `https://psalter.gsdlabs.dev/changelog` and is not treated as a throwaway to be
cleaned up.
