#!/bin/bash
# Post-compression backup integrity check. scripts/verify-tunes-backup.sh diffs
# the archive against the live public/tunes/ tree — after Phase 13's compression
# swap that diff is EXPECTED to fail, because the live tree is intentionally
# different. This script proves the archive itself is unchanged and still
# restorable, without any reference to the live tree.
#
# Usage: bash scripts/verify-backup-archive.sh [archive-path]
# Defaults to the newest tunes-pre-compression-*.tar.gz in
# /home/services/psalter-backups/.
set -euo pipefail

BACKUP_DIR=/home/services/psalter-backups

ARCHIVE="${1:-$(ls -t "$BACKUP_DIR"/tunes-pre-compression-*.tar.gz 2>/dev/null | head -1)}"

if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "ABORT: no archive found (looked in $BACKUP_DIR, arg was '${1:-}')" >&2
  exit 1
fi

EXPECTED_SHA256=28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9
EXPECTED_SIZE=1431381138
EXPECTED_RESTORED_COUNT=326

echo "Verifying archive: $ARCHIVE"

# --- 1. sha256 identity ---
ACTUAL_SHA256=$(sha256sum "$ARCHIVE" | cut -d' ' -f1)
echo "sha256 expected: $EXPECTED_SHA256"
echo "sha256 actual:   $ACTUAL_SHA256"
if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
  echo "ABORT: sha256 mismatch (expected $EXPECTED_SHA256, got $ACTUAL_SHA256)" >&2
  exit 1
fi

# --- 2. Size + mtime ---
ACTUAL_STAT=$(stat -c '%s %Y' "$ARCHIVE")
ACTUAL_SIZE=$(echo "$ACTUAL_STAT" | cut -d' ' -f1)
ACTUAL_MTIME=$(echo "$ACTUAL_STAT" | cut -d' ' -f2)
echo "size expected:   $EXPECTED_SIZE"
echo "size actual:     $ACTUAL_SIZE"
echo "mtime (epoch):   $ACTUAL_MTIME  (not hard-failed; printed for drift visibility)"
if [ "$ACTUAL_SIZE" != "$EXPECTED_SIZE" ]; then
  echo "ABORT: size mismatch (expected $EXPECTED_SIZE, got $ACTUAL_SIZE)" >&2
  exit 1
fi

# --- 3. Restorable, correct contents ---
# Note: restored count is compared against a HARD-CODED CONSTANT, deliberately
# NOT against `find public/tunes ...` — the live tree is no longer a valid
# reference after the compression swap.
RESTORE=$(mktemp -d)
trap 'rm -rf "$RESTORE"' EXIT

tar xzf "$ARCHIVE" -C "$RESTORE"

RESTORED_COUNT=$(find "$RESTORE/tunes" -type f \( -name '*.jpg' -o -name '*.png' \) | wc -l)
echo "Restored images: $RESTORED_COUNT (expected $EXPECTED_RESTORED_COUNT)"
if [ "$RESTORED_COUNT" -ne "$EXPECTED_RESTORED_COUNT" ]; then
  echo "ABORT: restored image count mismatch (expected $EXPECTED_RESTORED_COUNT, got $RESTORED_COUNT)" >&2
  exit 1
fi

# --- 4. Decode sample ---
# Byte-identity proves faithful copying, not that the originals are valid
# images, so decode a sample of 10 restored files with sharp (the same
# library the compression phase uses). Prefer hand-reviewed sources: at
# least 3 solfege + 3 staff files.
# NOTE: `set +o pipefail` inside each command substitution below is
# deliberate — `find | sort | head -N` at 326-file scale causes `sort` to
# receive SIGPIPE when `head` closes the pipe early, and under pipefail
# that SIGPIPE (exit 141) would otherwise abort the whole script.
SOLFEGE_SAMPLES=$(set +o pipefail; find "$RESTORE/tunes" -name '*-solfege-*.jpg' | sort | head -3)
STAFF_SAMPLES=$(set +o pipefail; find "$RESTORE/tunes" -name '*-staff-*.jpg' | sort | head -3)

# Build the unique sample set first (solfege + staff, at least 3 each),
# then top up with additional unique files (not already selected) until
# we have exactly 10 total.
SAMPLE_FILES=$(printf '%s\n%s\n' "$SOLFEGE_SAMPLES" "$STAFF_SAMPLES" | grep -v '^$' | sort -u)
NEED=$((10 - $(echo "$SAMPLE_FILES" | grep -c .)))
if [ "$NEED" -gt 0 ]; then
  FILLER=$(set +o pipefail; find "$RESTORE/tunes" -type f \( -name '*.jpg' -o -name '*.png' \) | sort | grep -vFxf <(echo "$SAMPLE_FILES") | head -"$NEED")
  SAMPLE_FILES=$(printf '%s\n%s\n' "$SAMPLE_FILES" "$FILLER" | grep -v '^$' | sort -u)
fi

# Point sharp at a real source for its module — the location does not matter
# for decoding, only that require() resolves.
SHARP_REQUIRE_PATH="/home/services/psalter/public/tunes/../../node_modules/sharp"
node --input-type=commonjs -e "
const sharp = require('$SHARP_REQUIRE_PATH');
const files = \`$SAMPLE_FILES\`.split('\n').filter(Boolean);
(async () => {
  let ok = 0;
  for (const f of files) {
    const meta = await sharp(f).metadata();
    const valid = meta.width > 0 && meta.height > 0 && ['jpeg', 'png'].includes(meta.format);
    console.log(\`\${valid ? 'OK' : 'FAIL'} \${f} (\${meta.format} \${meta.width}x\${meta.height})\`);
    if (!valid) process.exit(1);
    ok++;
  }
  console.log(\`Decoded \${ok}/\${files.length} sample files successfully\`);
  if (ok !== 10) {
    console.error(\`ABORT: expected 10 samples, got \${ok}\`);
    process.exit(1);
  }
})().catch((err) => {
  console.error('ABORT: decode failed:', err.message);
  process.exit(1);
});
"

echo "ARCHIVE_VERIFIED"
