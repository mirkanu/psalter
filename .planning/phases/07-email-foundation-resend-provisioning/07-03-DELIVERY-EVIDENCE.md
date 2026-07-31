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

## Human inbox verification

| Provider | Folder | spf | dkim | dmarc | Verified at |
|---|---|---|---|---|---|
| gmail   | Inbox (Primary) | pass | pass | pass | 2026-07-31T12:20:00Z |
| outlook | N/A — skipped by human decision | N/A | N/A | N/A | N/A |

Raw `Authentication-Results` header from Gmail "Show original", pasted directly by the human and
verified against mail-tester's independent finding (both agree: spf/dkim/dmarc all pass at
`mail.gsdlabs.dev`):

```
Authentication-Results: mx.google.com;
  dkim=pass header.i=@mail.gsdlabs.dev header.s=resend header.b=FR7qtcDx;
  dkim=pass header.i=@amazonses.com header.s=224i4yxa5dv7c2xz3womw6peuasteono header.b=I9juDsWh;
  spf=pass (google.com: domain of ...@send.mail.gsdlabs.dev designates 54.240.48.49 as permitted sender)
    smtp.mailfrom=...@send.mail.gsdlabs.dev;
  dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=mail.gsdlabs.dev
```

## EMAIL-02 status

**Partially verified.** Gmail leg is fully confirmed: real message delivered to a real Gmail
inbox (Primary, not Spam/Promotions), with `spf=pass`, `dkim=pass`, `dmarc=pass` all aligned to
`mail.gsdlabs.dev` — confirmed both by the human's own "Show original" header paste and
independently by mail-tester.com (10/10, same three verdicts).

**Outlook/Hotmail/Live remains UNMET — not attempted in this run, by explicit human decision, not
a technical failure.** This is a real, open gap against EMAIL-02 (which names both providers
explicitly) and must not be silently closed. A future follow-up must exercise
`scripts/send-test-email.ts <outlook-address> --label "outlook"` against a real Microsoft-family
mailbox and have a human confirm placement + `Authentication-Results` before EMAIL-02 can be
considered fully satisfied.
