---
title: R2 originals backup — 2026-10-12
date: 2026-10-12
context: pre-Phase-13 compression originals preserved to R2
---

# R2 originals backup, 2026-10-12

Phase 13 (Tune Image Compression, 2026-09-06) compressed the 326 tune score sheet JPEGs to 2000×1500 mozjpeg q75 (~480–710 KB each) and uploaded the compressed versions to the `psalter-tunes-backup` Cloudflare R2 bucket, **replacing** the original 4032×3024 uncompressed versions. The originals had been preserved locally only at `/home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` (sha256 `28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9`, 1.4 GB, dated 2026-07-30) — a single point of failure on the Hetzner VPS.

## What was done (2026-10-12)

Extracted the full tarball to `/tmp/restore-originals/` (328 files, 1.4 GB uncompressed) and uploaded to R2 under the `originals/` prefix:

```sh
# Configure rclone (creds from /home/services/.env.production)
cat > ~/.config/rclone/rclone.conf <<EOF
[r2]
type = s3
provider = Cloudflare
access_key_id = ${R2_ACCESS_KEY_ID}
secret_access_key = ${R2_SECRET_ACCESS_KEY}
endpoint = https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
no_check_bucket = true
EOF

# Upload (preserves filenames, adds originals/ prefix)
rclone copy /tmp/restore-originals/tunes r2:psalter-tunes-backup/originals/ \
  --transfers 8 --checkers 8 --progress
```

## Verification

- 328 files uploaded in 24.5 seconds at ~59 MB/s
- Byte-identity spot check: sha256 of `aurelia-staff-0.jpg` from tarball = `fa185942151998c5...`, identical to R2 download
- All 328 files accessible at `https://cdn.psalter.gsdlabs.dev/originals/{slug}-{staff|solfege}-{n}.jpg`

## Bucket layout (current)

| R2 path | Count | Size range | Description |
|---|---|---|---|
| `{slug}-staff-{n}.jpg` / `{slug}-solfege-{n}.jpg` | 149 slugs in manifest, ~328 files | 480–710 KB | Phase 13 compressed, served to production |
| `originals/{slug}-staff-{n}.jpg` / `originals/{slug}-solfege-{n}.jpg` | 328 files | 1.4 GB total | Pre-Phase-13 uncompressed originals (this backup) |

## Notes

- The `originals/` prefix is not referenced by `src/lib/tune-jpg-urls.ts` (production only uses the non-prefixed paths). To recover an original, fetch directly from R2 via the prefix.
- The 23 tunes that Phase 13 did not process (still PNGs in R2) also had their originals captured here — total coverage is all 326 tunes + the 2 dotfiles that were in the tarball.
- R2 free tier is 10 GB storage, 10M reads/month — 1.4 GB of originals fits comfortably with no cost.
- The local tarball at `/home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` should remain as a third copy; do not run `verify-tunes-backup.sh`'s default cleanup without confirming R2 still has the originals.

## Restoring an original

```sh
# Single file
rclone copy r2:psalter-tunes-backup/originals/aurelia-staff-0.jpg /tmp/

# Full bucket
rclone copy r2:psalter-tunes-backup/originals/ /tmp/originals-restore/
```