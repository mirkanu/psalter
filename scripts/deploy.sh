#!/usr/bin/env bash
#
# Zero-downtime production deploy for the psalter.
#
# WHY THIS EXISTS
#   `next build` wipes and rewrites its output directory (the "distDir") from
#   scratch. When that is the same directory the running server is serving
#   from, the live server loses its route manifests and every dynamic route
#   starts returning 500 with:
#
#       InvariantError: The client reference manifest for route
#       "/precent/[id]" does not exist. This is a bug in Next.js.
#
#   A build takes ~15 minutes on this VPS, so every deploy was a ~15 minute
#   outage. That is exactly how the site went down on 2026-11-08, when a
#   production build was run against the live `.next` directory.
#
# HOW IT WORKS
#   Two dist directories are used alternately: `.next` and `.next-build`.
#
#     * The build always writes to the slot that is NOT live, so the running
#       server's files are never touched.
#     * Next preserves the `cache/` subdirectory of a distDir across builds
#       (next/dist/build/index.js excludes /^(cache|dev|lock)/ from the
#       distDir wipe), so each slot keeps a warm Turbopack cache.
#     * After a successful build the server is restarted with
#       PSALTER_DIST_DIR pointing at the newly built slot. The runtime
#       distDir then matches the one recorded in that build's
#       required-server-files.json, which is what Next.js expects.
#     * The previously live slot stays on disk as the rollback target; the
#       next deploy overwrites it.
#
# USAGE
#   bash scripts/deploy.sh
#
# PREREQUISITE
#   The change must already be committed. scripts/capture-deploy-info.ts
#   reads HEAD at build start, so building before committing stamps the
#   wrong commit into the admin footer.

set -euo pipefail
cd "$(dirname "$0")/.."

SLOT_A='.next'
SLOT_B='.next-build'
LIVE_FILE='data/live-dist-dir'

live=''
if [ -f "$LIVE_FILE" ]; then
  live="$(tr -d '[:space:]' < "$LIVE_FILE")"
fi

case "$live" in
  "$SLOT_A") build_slot="$SLOT_B" ;;
  "$SLOT_B") build_slot="$SLOT_A" ;;
  # No live-slot file yet (fresh checkout): `.next` is what the server is
  # serving today, so build into the other slot and leave it untouched.
  *)        build_slot="$SLOT_B"; live="$SLOT_A" ;;
esac

echo "=== psalter deploy ==="
echo "live slot : $live"
echo "build slot: $build_slot"
echo "HEAD      : $(git rev-parse --short HEAD) $(git log -1 --format=%s)"
echo

# Keep the previous deploy-info so a failed build cannot leave the live
# server reporting a commit that was never deployed.
if [ -f data/deploy-info.json ]; then
  cp data/deploy-info.json data/deploy-info.json.prev
fi

echo "[1/3] building into $build_slot"
# Seed the target slot's build cache from the live slot's. Next preserves the
# `cache/` subdirectory of a distDir across builds, so a seeded slot compiles
# from the same warm cache the live slot has been using.
if [ ! -d "$build_slot/cache" ] && [ -d "$live/cache" ]; then
  mkdir -p "$build_slot"
  cp -a "$live/cache" "$build_slot/cache"
fi
PSALTER_DIST_DIR="$build_slot" NEXT_TELEMETRY_DISABLED=1 npm run build

if [ ! -f "$build_slot/BUILD_ID" ]; then
  echo
  echo "BUILD FAILED — no $build_slot/BUILD_ID. The live server was not touched."
  if [ -f data/deploy-info.json.prev ]; then
    mv data/deploy-info.json.prev data/deploy-info.json
  fi
  exit 1
fi
rm -f data/deploy-info.json.prev

echo
echo "[2/3] switching the live slot to $build_slot"
printf '%s\n' "$build_slot" > "$LIVE_FILE"

echo
echo "[3/3] restarting pm2"
pm2 restart psalter
sleep 10

echo
echo "deployed BUILD_ID=$(cat "$build_slot/BUILD_ID") from $build_slot"
curl -s -o /dev/null -w 'local HTTP %{http_code}\n' http://localhost:3005/
