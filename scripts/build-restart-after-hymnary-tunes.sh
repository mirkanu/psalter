#!/usr/bin/env bash
#
# Single-shot build + pm2 restart. Called from Task 4 of plan
# 260826-n1i-digitise-4-missing-recommended-tunes-to-/01 after all 3 Hymnary
# tunes (Ellacomb, Leominster, Diademata) have committed DB rows.
#
# Why this script exists:
#   - psalm pages use generateStaticParams, so only the LAST build captures
#     the most-recent DB rows. Three sequential build+restart inside the
#     per-tune tasks would race on .next/ and ship partial state.
#   - Hence: ONE build here, ONE restart.
#
# Pre-build safety:
#   - capture-build-id prebuild hook reads HEAD at build start, so we MUST
#     commit + push BEFORE running this script (per project memory
#     feedback_commit_before_build.md). Tasks 1-3 all push their commits
#     before this task runs.
#
# Post-build verification (handled in Task 4, NOT in this script):
#   - test -f .next/BUILD_ID
#   - live curl /psalms/99 /psalms/70 /psalms/45
#   - /api/deploy-info buildId
#   - 3 Playwright UAT scripts via shared daemons

set -euo pipefail
cd /home/services/psalter

echo "=== Build + restart after Hymnary tunes ==="
echo "Working directory: $(pwd)"
echo "Pre-build BUILD_ID: $(cat .next/BUILD_ID 2>/dev/null || echo 'NONE')"
echo

echo "[1/2] npm run build"
npm run build

echo
echo "[2/2] pm2 restart psalter"
pm2 restart psalter

echo
echo "Post-build BUILD_ID: $(cat .next/BUILD_ID)"
echo "PASS — single build+restart complete"