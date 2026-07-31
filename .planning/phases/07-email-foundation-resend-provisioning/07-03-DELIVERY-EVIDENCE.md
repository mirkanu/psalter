# Phase 07 — Email Delivery Evidence (EMAIL-02)

Sent: 2026-07-31T11:59:19.301Z   From: CPRC Psalter <psalter@mail.gsdlabs.dev>   Subdomain: mail.gsdlabs.dev

## Scope note (human decision, recorded verbatim)

The human explicitly declined to supply an Outlook/Hotmail/Live-family address for this run and
instructed: "test m***@gmail.com now, and explicitly skip the Outlook/Hotmail/Live test."
Per plan instruction, this is recorded as a **gap against EMAIL-02**, not a pass — the roadmap
requirement names both providers explicitly, and only Gmail has been exercised in this run. The
Outlook/Hotmail leg is **skipped-by-human-decision**, not attempted, not passed.

## DNS pre-flight

```
$ bash scripts/verify-email-dns.sh
PASS SPF
PASS DKIM
PASS MX
PASS DMARC
```

## Sends

| Provider | Recipient (redacted local part) | Resend message id | Script exit | Resend last_event |
|---|---|---|---|---|
| gmail   | m***@gmail.com | 846ffbbf-960b-4aee-9a57-2322a2a9a95e | 0 | delivered |
| outlook | — not attempted — | — | — | skipped-by-human-decision (no Microsoft-family address supplied) |

## mail-tester

Score: 10/10 | SPF: pass | DKIM: pass (header.d=mail.gsdlabs.dev, header.s=resend) | DMARC: pass (header.from=mail.gsdlabs.dev, p=none) | Notes: independent third-party corroboration (test-u***@srv1.mail-tester.com, message id f59198b3-8f83-4f13-9c0e-a9885bc5848f); mail-tester's own summary: "SpamAssassin likes you", "You're properly authenticated", "You're not blocklisted", "No broken links"

## Human inbox verification (filled in Task 3)

| Provider | Folder | spf | dkim | dmarc | Verified at |
|---|---|---|---|---|---|
| gmail   | | | | | |
| outlook | N/A — skipped by human decision | N/A | N/A | N/A | N/A |

## EMAIL-02 status

**Partially verified (Gmail only).** Do not mark EMAIL-02 fully complete in REQUIREMENTS.md until
the Outlook/Hotmail/Live leg is exercised and confirmed by a human in a future follow-up. The
Outlook-related truth in this plan's `must_haves` ("arrives in a real Outlook/Hotmail inbox, not
Junk") is UNMET — not attempted in this run, by explicit human decision, not a technical failure.
