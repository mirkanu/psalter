# Tune Score Images — Backup Manifest

Records the location, checksum, and restore procedure for the off-repo
backup of `public/tunes/` — 326 hand-reviewed OCR score scans (70+ tunes
already melisma-approved) that are git-ignored and have **no copy in R2**
(contrary to what CLAUDE.md's stack table claims). This backup exists so
the future JPEG-compression phase is reversible.

## Archive

| Field | Value |
|---|---|
| Path | `/home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` |
| sha256 | `28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9` |
| Created | 2026-07-30 |
| Size | 1.4G |
| Verified image count | 326 (320 `.jpg` + 6 `.png`) |
| Source directory | `/home/services/psalter/public/tunes` |

## Verification performed (2026-07-30)

Run via `bash scripts/verify-tunes-backup.sh`:

1. **File-count check** — restored image count (326) matches live source count (326).
2. **Byte-identity check** — `md5sum` of every one of the 326 images in the restored
   tree vs. the live source tree, compared with `diff`: **zero differences**.
3. **Decode check** — 10 sample restored files (including 3 `*-solfege-*.jpg` and
   3 `*-staff-*.jpg`, i.e. hand-reviewed sources) decoded via `sharp`'s `metadata()`
   with valid non-zero `width`/`height` and `format` of `jpeg`: **10/10 passed**.
4. Script printed `BACKUP_VERIFIED` and exited 0.

## These images exist in no other location

Not tracked in git (`public/tunes/.gitignore` excludes `*.jpg`, `*.jpeg`, `*.png`,
`*.pdf`), and **not in Cloudflare R2** — CLAUDE.md's stack table lists R2 storage
for "tune score sheet JPGs" but this is stale/incorrect for the actual deployment;
the app serves these files directly from `public/tunes/` under PM2 (fork mode,
no Docker volume or bind mount for tunes). This tarball plus any future refresh of
it is the only backup.

## Restore

To restore in place (overwrites `public/tunes/` with the backed-up copies):

```bash
tar xzf /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz -C /home/services/psalter/public
```

This extracts a single top-level `tunes/` directory, so the command above
recreates `public/tunes/` exactly as archived.

## Re-verify

To re-run the same file-count, byte-identity, and decode checks against the
current archive (or a newer one, if a fresh backup is taken before compression):

```bash
bash scripts/verify-tunes-backup.sh
```

Pass an explicit archive path as `$1` to verify a specific tarball instead of the
newest one in `/home/services/psalter-backups/`.

## Regenerating the backup

If `public/tunes/` changes before the compression phase runs (e.g. new tunes
added), re-run:

```bash
bash scripts/backup-tunes.sh
```

This creates a new dated archive; re-run `verify-tunes-backup.sh` afterward and
update this manifest with the new path/checksum before the compression phase
begins.

## Post-compression status (Phase 13, 2026-08-11)

`public/tunes/` was compressed in Phase 13 and NO LONGER matches this archive — that is intentional.

- **Do not** re-run `scripts/verify-tunes-backup.sh` to check this archive: its md5 byte-identity step
  diffs the archive against the live tree and will now fail by design.
- **Do** run `bash scripts/verify-backup-archive.sh` instead — sha256 + 326-file restore count + sharp
  decode sample, with no reference to the live tree.
- Pre-compression originals also existed uncompressed at
  `/home/services/psalter-backups/tunes-preswap-20260811/` until Phase 13 sign-off. That directory
  has now been removed (2026-08-11, after human approval); this tarball is once again the sole copy
  of the uncompressed originals.
