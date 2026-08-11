# Phase 13 Plan 03 — Backup Post-Swap Evidence

Recorded at: 2026-08-11T09:00:30Z

## Verdict

The Phase 6 backup archive (`tunes-pre-compression-20260730.tar.gz`) is byte-for-byte unchanged after the Phase 13 Plan 03 compression swap, still extracts to a complete 326-image tree, and remains restorable with the documented one-liner.

## Archive identity comparison

| Field        | Pre-compression (BACKUP-PREFLIGHT-EVIDENCE.md) | Post-swap (measured 2026-08-11T09:00Z) | Match |
|--------------|------------------------------------------------|----------------------------------------|-------|
| sha256       | `28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9` | `28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9` | yes |
| size (bytes) | `1431381138`                                  | `1431381138`                          | yes |
| mtime (epoch) | `1785394660`                                 | `1785394660`                          | yes |

## verify-backup-archive.sh output

Full stdout of `bash scripts/verify-backup-archive.sh` captured live (2026-08-11T09:00:30Z):

```
Verifying archive: /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz
sha256 expected: 28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9
sha256 actual:   28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9
size expected:   1431381138
size actual:     1431381138
mtime (epoch):   1785394660  (not hard-failed; printed for drift visibility)
Restored images: 326 (expected 326)
OK /tmp/tmp.hUqLmQTDnb/tunes/abbeyville-solfege-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.hUqLmQTDnb/tunes/abbeyville-staff-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.hUqLmQTDnb/tunes/agawam-solfege-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.hUqLmQTDnb/tunes/agawam-staff-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.hUqLmQTDnb/tunes/alexander-written-by-brian-crossett-staff-0.jpg (jpeg 1170x930)
OK /tmp/tmp.hUqLmQTDnb/tunes/argyle-solfege-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.hUqLmQTDnb/tunes/argyle-staff-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.hUqLmQTDnb/tunes/arnold-solfege-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.hUqLmQTDnb/tunes/arnold-staff-0.jpg (jpeg 4032x3024)
OK /tmp/tmp.hUqLmQTDnb/tunes/artaxerxes-epc-tune-solfege-0.jpg (jpeg 4032x3024)
Decoded 10/10 sample files successfully
ARCHIVE_VERIFIED
```

Script exit code: `0`. Final stdout line: `ARCHIVE_VERIFIED`.

The script ran four checks (all archive-internal, no live-tree reference):

1. **sha256 identity** — `EXPECTED_SHA256=28a83a7d...b714a9` constant matched actual computed sha256.
2. **Size** — expected `1431381138`, actual `1431381138`, match.
3. **Restored count** — extracted to a mktemp dir (trap-cleaned), counted `326` images (320 jpg + 6 png), matched the hardcoded constant `326` (NOT compared against the live tree).
4. **Sharp decode sample** — 10 restored files (3 solfege + 3 staff + 4 filler) decoded via `sharp`'s `metadata()` with valid non-zero `width`/`height` and `format` of `jpeg`: 10/10 passed.

## Live tree comparison (pre vs post swap)

Sampled at three URLs covering staff-heavy, solfege-heavy, and high-detail files (the critical melisma-underlines signal lives on the solfege files). All three return `200` with strictly smaller `size_download` after the swap.

| URL                                               | Pre-swap bytes | Post-swap bytes | Reduction |
|---------------------------------------------------|---------------:|----------------:|----------:|
| https://psalter.gsdlabs.dev/tunes/beatitudo-staff-0.jpg   |  7,525,326 |  709,085 | -90.6% |
| https://psalter.gsdlabs.dev/tunes/dundee-solfege-0.jpg    |  1,549,962 |  345,921 | -77.7% |
| https://psalter.gsdlabs.dev/tunes/wetherby-staff-0.jpg    |  7,477,520 |  703,499 | -90.6% |

Total `public/tunes/` size before swap: `1.4G`. Total after: `126M`. Aggregate reduction: 91.2% (from Plan 02's full-set verifier, applied to all 320 re-encoded JPEGs).

Broad 100+ URL 404 sweep (149 melisma-approved + 40 random jpg samples = 166 unique URLs): `/tmp/t13-sweep-failures.txt` is zero bytes. Every URL returned HTTP 200.

## Why verify-tunes-backup.sh is no longer the right check

`scripts/verify-tunes-backup.sh` (Phase 6) computes `md5sum` of every image in the live `public/tunes/` tree and `diff`s it against the same md5 list extracted from the archive (lines 40-50). After the Phase 13 Plan 03 swap, the live tree is **intentionally** different from the archive — the live tree holds compressed JPEGs, the archive holds the original uncompressed scans. A failure of that md5-diff step is therefore the expected post-swap state, NOT evidence of corruption. Running it now will always print `ABORT: md5 mismatch between source and restored tree` and exit 1, regardless of whether the archive is intact.

This is exactly the misreading `.planning/phases/13-tune-image-compression/13-RESEARCH.md` (Pitfall 3) warns against. The new script `scripts/verify-backup-archive.sh` performs the four checks above with no reference to the live tree, so a passing run genuinely proves archive integrity. The Phase 6 manifest (BACKUP-MANIFEST.md) has been amended to direct future readers to this script.

## Restore

The one-liner from `.planning/phases/06-security-data-safety-prerequisites/BACKUP-MANIFEST.md` is unchanged:

```bash
tar xzf /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz -C /home/services/psalter/public
```

This extracts a single top-level `tunes/` directory inside the archive, so the command above recreates `public/tunes/` exactly as archived. The compressed live tree will be overwritten by the original uncompressed scans — a deliberate destructive operation that should only be run if the human legibility sign-off rejects the compression.

A second restore path exists until the human sign-off cleanup: the uncompressed originals are also still present at `/home/services/psalter-backups/tunes-preswap-20260811/` (328 entries) as a one-rename rollback (no archive extraction needed).

## Human sign-off

- **Date:** 2026-08-11
- **Verdict:** approved
- **Images checked:** https://psalter.gsdlabs.dev/tunes/beatitudo-staff-0.jpg, https://psalter.gsdlabs.dev/tunes/dundee-solfege-0.jpg, https://psalter.gsdlabs.dev/tunes/wetherby-staff-0.jpg
- **Verifier confirmation:** `bash scripts/verify-backup-archive.sh` final stdout line `ARCHIVE_VERIFIED`, exit code 0 (full output captured at `scripts/output/verify-backup-archive-final.log`).

The local rollback copy at `/home/services/psalter-backups/tunes-preswap-20260811/` and the Plan 01 sample directory at `public/tunes-samples/` have been removed. The Phase 6 tarball is now the sole copy of the uncompressed originals.
