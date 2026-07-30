#!/bin/bash
# Proves all 12 currently-guarded admin surfaces (4 /dev/* pages + 8
# /api/dev/* routes) reject anonymous access, that /robots.txt still
# disallows the admin surface, and that public routes are unaffected.
#
# Sends NO cookies on any request. Does not use `set -e` — every surface
# must be probed and reported, not aborted on the first failure.
#
# Usage: bash scripts/verify-dev-surface-locked.sh [base-url]
# Defaults to http://localhost:3006.
set -uo pipefail

BASE="${1:-http://localhost:3006}"
FAILURES=0

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; FAILURES=$((FAILURES + 1)); }

# --- 4 admin pages: expect a 3xx redirect whose Location contains /login ---
check_page_redirects_to_login() {
  local path="$1"
  local headers
  headers=$(curl -s -D - -o /dev/null "${BASE}${path}")
  local status
  status=$(echo "$headers" | head -1 | tr -d '\r')
  local location
  location=$(echo "$headers" | grep -i '^location:' | tr -d '\r')

  if echo "$status" | grep -qE '30[0-9]' && echo "$location" | grep -q '/login'; then
    pass "$path -> $status redirect to /login"
  else
    fail "$path -> expected 3xx redirect containing /login, got: status='$status' location='$location'"
  fi
}

check_page_redirects_to_login "/dev"
check_page_redirects_to_login "/dev/melisma-editor"
check_page_redirects_to_login "/dev/musicxml-preview"
check_page_redirects_to_login "/dev/notation-compare"

# --- 8 API routes: expect exactly 401 ---
check_api_401() {
  local path="$1"
  local method="${2:-GET}"
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' -X "$method" "${BASE}${path}")

  if [ "$status" = "401" ]; then
    pass "$path ($method) -> 401"
  else
    fail "$path ($method) -> expected 401, got $status"
  fi
}

check_api_401 "/api/dev/asset"
check_api_401 "/api/dev/melisma-decision"
check_api_401 "/api/dev/melisma-save" "POST"
check_api_401 "/api/dev/sketch"
check_api_401 "/api/dev/test-ocr"
check_api_401 "/api/dev/tune-feedback"
check_api_401 "/api/dev/tune-feedback/all"
check_api_401 "/api/dev/tune-ocr-result"

# --- Information-disclosure regression guard: tune-feedback/all must not ---
# --- leak a JSON array body even alongside a non-200 status (T-06-13). ---
BODY=$(curl -s "${BASE}/api/dev/tune-feedback/all")
if echo "$BODY" | grep -qE '^\s*\['; then
  fail "/api/dev/tune-feedback/all body starts with '[' — JSON array leaked to anonymous caller"
else
  pass "/api/dev/tune-feedback/all body is not a JSON array"
fi

# --- robots.txt regression guard (SEC-02) ---
ROBOTS_STATUS=$(curl -s -o /tmp/robots-body.$$ -w '%{http_code}' "${BASE}/robots.txt")
ROBOTS_BODY=$(cat /tmp/robots-body.$$ 2>/dev/null)
rm -f /tmp/robots-body.$$
if [ "$ROBOTS_STATUS" = "200" ] && echo "$ROBOTS_BODY" | grep -q 'Disallow: /dev/\*'; then
  pass "/robots.txt -> 200 with Disallow: /dev/*"
else
  fail "/robots.txt -> expected 200 with 'Disallow: /dev/*', got status=$ROBOTS_STATUS body=$(echo "$ROBOTS_BODY" | head -5)"
fi

# --- Public control routes must still serve 200 (gate must not over-block) ---
check_public_200() {
  local path="$1"
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}${path}")
  if [ "$status" = "200" ]; then
    pass "$path -> 200 (public, unaffected)"
  else
    fail "$path -> expected 200, got $status"
  fi
}

check_public_200 "/psalms/23"
check_public_200 "/tunes"

echo ""
echo "=== Summary: $FAILURES failure(s) ==="
if [ "$FAILURES" -gt 0 ]; then
  exit 1
fi
exit 0
