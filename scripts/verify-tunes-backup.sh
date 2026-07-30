#!/bin/bash
# Proves a tunes backup archive is a real, restorable backup rather than
# just a file that exists. An archive is not a backup until it has been
# untarred and byte-compared against the live source.
#
# Usage: bash scripts/verify-tunes-backup.sh [archive-path]
# Defaults to the newest tunes-pre-compression-*.tar.gz in
# /home/services/psalter-backups/.
set -euo pipefail

BACKUP_DIR=/home/services/psalter-backups
SRC=/home/services/psalter/public/tunes

ARCHIVE="${1:-$(ls -t "$BACKUP_DIR"/tunes-pre-compression-*.tar.gz 2>/dev/null | head -1)}"

if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "ABORT: no archive found (looked in $BACKUP_DIR, arg was '${1:-}')" >&2
  exit 1
fi

echo "Verifying archive: $ARCHIVE"

RESTORE=$(mktemp -d)
trap 'rm -rf "$RESTORE"' EXIT

tar xzf "$ARCHIVE" -C "$RESTORE"

# --- 1. File-count check ---
SRC_COUNT=$(find "$SRC" -type f \( -name '*.jpg' -o -name '*.png' \) | wc -l)
RESTORED_COUNT=$(find "$RESTORE/tunes" -type f \( -name '*.jpg' -o -name '*.png' \) | wc -l)

echo "Source images:   $SRC_COUNT"
echo "Restored images: $RESTORED_COUNT"

if [ "$SRC_COUNT" -ne "$RESTORED_COUNT" ]; then
  echo "ABORT: image count mismatch (source=$SRC_COUNT restored=$RESTORED_COUNT)" >&2
  exit 1
fi

# --- 2. Byte-identity check (the decisive test) ---
( cd "$SRC" && find . -type f \( -name '*.jpg' -o -name '*.png' \) -exec md5sum {} + | sort -k2 ) > /tmp/tunes-src.md5
( cd "$RESTORE/tunes" && find . -type f \( -name '*.jpg' -o -name '*.png' \) -exec md5sum {} + | sort -k2 ) > /tmp/tunes-restored.md5

if ! diff /tmp/tunes-src.md5 /tmp/tunes-restored.md5; then
  echo "ABORT: md5 mismatch between source and restored tree" >&2
  rm -f /tmp/tunes-src.md5 /tmp/tunes-restored.md5
  exit 1
fi
echo "md5 diff: no differences (all files byte-identical)"
rm -f /tmp/tunes-src.md5 /tmp/tunes-restored.md5

# --- 3. Decode / integrity check via sharp ---
# Byte-identity proves faithful copying, not that the originals are valid
# images, so decode a sample of 10 restored files with sharp (the same
# library the future compression phase will use). Prefer hand-reviewed
# sources: at least 3 solfege + 3 staff files.
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

node --input-type=commonjs -e "
const sharp = require('$SRC/../../node_modules/sharp');
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

echo "BACKUP_VERIFIED"
