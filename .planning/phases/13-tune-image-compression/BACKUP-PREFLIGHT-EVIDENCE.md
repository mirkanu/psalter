# Backup Pre-Flight Evidence — Phase 13 Plan 02

Recorded at: 2026-08-11T08:37:03Z (just before the first compression run of Phase 13).

This file is the last-chance proof that the Phase 6 backup archive restores to a tree byte-identical to the live `public/tunes/` directory. It is captured **while the live tree is still untouched** — the md5 byte-identity step of `scripts/verify-tunes-backup.sh` becomes invalid after Plan 03's swap by design.

## Archive identity (pre-compression)

| Field | Value |
|---|---|
| Path | `/home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` |
| sha256 | `28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9` |
| Size in bytes | `1431381138` (1.4 GiB) |
| mtime epoch | `1785394660` |
| mtime UTC | `2026-07-30T06:57:40Z` |
| Recorded | 2026-08-11T08:37:03Z (this run) |

Source commands (real output captured verbatim):

```
$ sha256sum /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz
28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9  /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz

$ stat -c '%Y %s %n' /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz
1785394660 1431381138 /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz
```

## Restorability proof

Full stdout of `bash scripts/verify-tunes-backup.sh` captured live (2026-08-11T08:37:03Z):

```
Verifying archive: /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz
Source images:   326
Restored images: 326
md5 diff: no differences (all files byte-identical)
OK /tmp/tmp.Rt3vBz9NeE/tunes/abbeyville-solfege-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.Rt3vBz9NeE/tunes/abbeyville-staff-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.Rt3vBz9NeE/tunes/agawam-solfege-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.Rt3vBz9NeE/tunes/agawam-staff-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.Rt3vBz9NeE/tunes/alexander-written-by-brian-crossett-staff-0.jpg (jpeg 1170x930)
OK /tmp/tmp.Rt3vBz9NeE/tunes/argyle-solfege-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.Rt3vBz9NeE/tunes/argyle-staff-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.Rt3vBz9NeE/tunes/arnold-solfege-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.Rt3vBz9NeE/tunes/arnold-staff-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.Rt3vBz9NeE/tunes/artaxerxes-epc-tune-solfege-0.jpg (jpeg 4032x3024)
Decoded 10/10 sample files successfully
BACKUP_VERIFIED
```

Script exit code: `0`. Final stdout line: `BACKUP_VERIFIED`.

The script ran three checks (per `scripts/verify-tunes-backup.sh` lines 28-95):

1. **File-count check** — source vs. restored both equal 326 (320 `.jpg` + 6 `.png`).
2. **Byte-identity check** — `md5sum` of every one of the 326 images in the restored tree vs. the live source tree, compared with `diff`: zero differences. All files byte-identical.
3. **Decode check** — 10 sample restored files (3 `*-solfege-*.jpg`, 3 `*-staff-*.jpg`, 4 filler) decoded via `sharp`'s `metadata()` with valid non-zero `width`/`height` and `format` of `jpeg`: 10/10 passed.

## Live tree state (pre-compression)

```
$ find public/tunes -type f | wc -l
328

$ find public/tunes -type f \( -name '*.jpg' -o -name '*.png' \) | wc -l
326

$ du -sh public/tunes
1.4G	public/tunes
```

328 entries (326 images + `.gitignore` + `.gitkeep`) — unchanged from Phase 6.

## Post-swap verification note

After the Plan 03 swap, `scripts/verify-tunes-backup.sh` will FAIL its md5 byte-identity step by design — `public/tunes/` is intentionally different from the archive. Post-swap, backup integrity is proven by `scripts/verify-backup-archive.sh` (archive-internal checks + sha256), never by diffing against the live tree.

This evidence file is therefore the **last** run where `verify-tunes-backup.sh` is meaningful as a backup-vs-live diff. Future runs must use `scripts/verify-backup-archive.sh` (added in Phase 13 Plan 03 commit `bd9c732`) which validates the archive internally without touching the live tree.

## Restore command

The one-liner from `.planning/phases/06-security-data-safety-prerequisites/BACKUP-MANIFEST.md`:

```bash
tar xzf /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz -C /home/services/psalter/public
```

This extracts a single top-level `tunes/` directory inside the archive, so the command above recreates `public/tunes/` exactly as archived.
