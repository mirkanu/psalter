#!/bin/bash
# Creates an off-repo, off-public tarball of public/tunes/ before any JPEG
# compression phase touches the hand-reviewed OCR score images.
#
# See .planning/research/PITFALLS.md (Pitfall 5) for why this exists:
# public/tunes/ is git-ignored and NOT in R2 (contrary to CLAUDE.md's stack
# table) — if a compression script corrupts these files in place there is
# currently no way back.
set -euo pipefail

SRC=/home/services/psalter/public/tunes
DEST_DIR=/home/services/psalter-backups

# --- Guard: source must exist and contain a substantial image set ---
IMG_COUNT=$(find "$SRC" -type f \( -name '*.jpg' -o -name '*.png' \) | wc -l)
if [ "$IMG_COUNT" -lt 300 ]; then
  echo "ABORT: only $IMG_COUNT images found in $SRC (expected ~326)" >&2
  exit 1
fi

# --- Guard: destination must be outside the repo and outside public/ ---
case "$DEST_DIR" in
  /home/services/psalter/*)
    echo "ABORT: destination is inside the repo" >&2
    exit 1
    ;;
esac

# --- Guard: destination filesystem must have enough free space ---
FREE_KB=$(df -Pk "$(dirname "$DEST_DIR")" | tail -1 | awk '{print $4}')
FREE_GB=$((FREE_KB / 1024 / 1024))
if [ "$FREE_GB" -lt 2 ]; then
  echo "ABORT: only ${FREE_GB}GB free on $(dirname "$DEST_DIR") filesystem (need at least 2GB)" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"

ARCHIVE="$DEST_DIR/tunes-pre-compression-$(date +%Y%m%d).tar.gz"

# Archive from the parent dir so the tarball contains a single top-level
# tunes/ directory — this is what makes the restore command unambiguous.
tar czf "$ARCHIVE" -C /home/services/psalter/public tunes

ARCHIVE_IMG_COUNT=$(tar tzf "$ARCHIVE" | grep -cE '\.(jpg|png)$')

echo "Archive:        $ARCHIVE"
echo "Size:           $(du -h "$ARCHIVE" | cut -f1)"
echo "SHA256:         $(sha256sum "$ARCHIVE" | cut -d' ' -f1)"
echo "Source images:  $IMG_COUNT"
echo "Archived images: $ARCHIVE_IMG_COUNT"

if [ "$ARCHIVE_IMG_COUNT" -ne "$IMG_COUNT" ]; then
  echo "ABORT: archived image count ($ARCHIVE_IMG_COUNT) does not match source count ($IMG_COUNT)" >&2
  exit 1
fi

echo "BACKUP_CREATED"
