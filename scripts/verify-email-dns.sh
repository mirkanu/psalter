#!/bin/bash
# Phase 07 (Email Foundation) / EMAIL-01: repeatable pass/fail gate over the
# four DNS records that authenticate psalter's sending subdomain,
# mail.gsdlabs.dev, with Resend.
#
# Each record closes one part of the trust chain:
#   - the sender-policy record proves psalter is allowed to send from the domain
#   - the domain-key record lets receivers cryptographically verify the message
#   - the mail-exchange record accepts bounce/feedback notifications from the ESP
#   - the alignment-policy record tells receivers what to do if the above fail
#
# Queries go straight to a public resolver (not the local cache) so this
# script can never produce a false pass from stale local DNS state.
#
# Usage: bash scripts/verify-email-dns.sh
# Exit 0 only when all four checks pass; exit 1 if any fails.

set -uo pipefail

RESOLVER="1.1.1.1"
FAILURES=0

check() {
  local label="$1"
  local record_type="$2"
  local name="$3"
  local expect="$4"
  local actual
  actual=$(dig "@${RESOLVER}" +short "${record_type}" "${name}")

  if echo "${actual}" | grep -qF -- "${expect}"; then
    echo "PASS ${label}"
  else
    echo "FAIL ${label} (expected: ${expect}, got: ${actual})"
    FAILURES=$((FAILURES + 1))
  fi
}

check_multi() {
  local label="$1"
  local record_type="$2"
  local name="$3"
  shift 3
  local actual
  actual=$(dig "@${RESOLVER}" +short "${record_type}" "${name}")
  local missing=0
  local expect
  for expect in "$@"; do
    if ! echo "${actual}" | grep -qF -- "${expect}"; then
      missing=1
    fi
  done

  if [ "${missing}" -eq 0 ]; then
    echo "PASS ${label}"
  else
    echo "FAIL ${label} (expected all of: $*, got: ${actual})"
    FAILURES=$((FAILURES + 1))
  fi
}

check "SPF" "TXT" "send.mail.gsdlabs.dev" "v=spf1 include:amazonses.com"
check "DKIM" "TXT" "resend._domainkey.mail.gsdlabs.dev" "p=MIG"
check "MX" "MX" "send.mail.gsdlabs.dev" "feedback-smtp.us-east-1.amazonses.com"
check_multi "DMARC" "TXT" "_dmarc.mail.gsdlabs.dev" "v=DMARC1" "p=none"

if [ "${FAILURES}" -gt 0 ]; then
  exit 1
fi

exit 0
