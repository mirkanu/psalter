#!/usr/bin/env bash
# scripts/check-airtable-pat.sh
# Build-time guard: fail if AIRTABLE_PAT appears in any tracked file.
# Prevents accidental promotion of the Airtable Personal Access Token
# into Vercel env vars, build logs, or the bundled output.
# See .planning/phases/17-vercel-neon-migration/17-RESEARCH.md Q5.

set -euo pipefail

# Files to scan: paths that Next.js bundles into the build output
# (src/, public/, top-level configs). We deliberately EXCLUDE scripts/
# because scripts/*.ts legitimately reference process.env.AIRTABLE_PAT
# (dev-only migration tools run via `tsx scripts/...` from a shell —
# they are NEVER imported by Next.js, so they can't leak the PAT into
# the Vercel bundle). See 17-RESEARCH.md Q5.
PATTERN='AIRTABLE_PAT'
PATHS=(src public package.json next.config.ts drizzle.config.ts)

# Use git ls-files for tracked-only scan; fall back to grep if not in a
# git repo (e.g. first Vercel build before first commit).
if git rev-parse --git-dir >/dev/null 2>&1; then
  FILES=$(git ls-files "${PATHS[@]}" 2>/dev/null || true)
else
  FILES=$(find "${PATHS[@]}" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.mts" -o -name "*.js" -o -name "*.json" \) 2>/dev/null || true)
fi

if [ -z "$FILES" ]; then
  echo "[check-airtable-pat] no files to scan (skipping)"
  exit 0
fi

HITS=$(grep -nE "$PATTERN" $FILES 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "BUILD FAILED: AIRTABLE_PAT found in tracked files."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$HITS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "The Airtable PAT must NEVER be committed, bundled, or set on Vercel."
  echo "Fix: remove the reference, scrub git history if needed, rotate the PAT."
  exit 1
fi

echo "[check-airtable-pat] OK — no AIRTABLE_PAT in $(echo "$FILES" | wc -l) tracked files"
exit 0
