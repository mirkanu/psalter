# Phase 13 Plan 03 — Swap Evidence

Recorded at: 2026-08-11T08:59:30Z

Live `public/tunes/` was swapped from the uncompressed originals (1.4 GiB) to the Phase 13 Plan 02 verified compressed tree (126 MiB) via two atomic `renameSync` operations on the same filesystem. The originals are held off-repo at `/home/services/psalter-backups/tunes-preswap-20260811/` until human legibility sign-off.

## Pre-swap gate results

```
$ sha256sum /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz
28a83a7d0497db7353d7919293004b07533144a26f62a7a3fb899482e5b714a9  /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz

$ npx tsx scripts/verify-tunes-compression.ts | tail -5
All checks passed
COMPRESSION_VERIFIED
```

Both pre-swap gates passed before any filesystem modification.

## Pre-swap sample URL sizes

Captured live (2026-08-11T08:58:50Z) before `pm2 restart psalter`:

```
200 7525326   https://psalter.gsdlabs.dev/tunes/beatitudo-staff-0.jpg
200 1549962   https://psalter.gsdlabs.dev/tunes/dundee-solfege-0.jpg
200 7477520   https://psalter.gsdlabs.dev/tunes/wetherby-staff-0.jpg
```

`du -sh public/tunes` before swap: `1.4G`.

## Swap commands executed (verbatim)

```
$ PRESWAP=/home/services/psalter-backups/tunes-preswap-20260811
$ test ! -e "$PRESWAP" && echo "PRESWAP check OK"
PRESWAP check OK
$ mv /home/services/psalter/public/tunes "$PRESWAP" && echo "mv 1 (originals out) OK"
mv 1 (originals out) OK
$ mv /home/services/psalter/public/tunes-compressed /home/services/psalter/public/tunes && echo "mv 2 (compressed in) OK"
mv 2 (compressed in) OK
```

Both renames happened on the same filesystem (`/dev/sda` → `/home/services`), so `renameSync` was atomic and added no extra disk.

## Post-swap assertions (immediate)

```
public/tunes file count: 328
public/tunes .gitignore exists: YES
public/tunes .gitkeep exists: YES
public/tunes-compressed exists (should be NO): NO
PRESWAP file count: 328
public/tunes-old exists (should be NO): NO
public/tunes size: 126M
```

## Post-swap sample URL sizes (after `pm2 restart psalter; sleep 8`)

```
200 709085    https://psalter.gsdlabs.dev/tunes/beatitudo-staff-0.jpg   (was 7525326, -90.6%)
200 345921    https://psalter.gsdlabs.dev/tunes/dundee-solfege-0.jpg   (was 1549962, -77.7%)
200 703499    https://psalter.gsdlabs.dev/tunes/wetherby-staff-0.jpg   (was 7477520, -90.6%)
```

All three return `200` with strictly smaller `size_download`. Note `dundee-solfege-0.jpg`'s pre-swap size (1.55MB) is well below the planning-time estimate (~5.4MB) — the live measurement is authoritative; the ground truth file size estimates were stale.

## Broad 100+ URL 404 sweep

```
unique URL count: 166
--- failure count ---
0 /tmp/t13-sweep-failures.txt
```

Source: 149 melisma-approved URLs from `npx tsx scripts/list-approved-tune-images.ts` (extracted from the per-tune sections by `grep -E '^\s+[a-z].*\.jpe?g$'`), plus 40 random jpg samples from the full tree, deduplicated. Every URL returned HTTP 200. `/tmp/t13-sweep-failures.txt` is zero bytes.

## PM2 restart

```
[PM2] Applying action restartProcessId on app [psalter](ids: [ 7 ])
[PM2] [psalter](7) ✓
┌────┬──────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬────────┐
│ id │ name                     │ mode        │ pid     │ uptime  │ ↺        │ status │ cpu  │ mem       │ user   │
├────┼──────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼────────┤
│ 7  │ psalter                  │ fork        │ 2833424 │ 0s      │ 30       │ online │ 0%   │ 0b        │ claude │
```

Restart succeeded — pid changed from prior, restart count incremented to 30. Known PM2 gotcha: open tabs may serve stale client JS until hard-refreshed; fresh curl probes are authoritative.

## Git status

`git status --porcelain public/` empty — `public/tunes/.gitignore` continues to ignore `*.jpg` / `*.png`, so no image files are tracked. The swap produced no tracked-tree change.

## Rollback command sequence (held in reserve)

If the 100+ sweep or any other check failed:

```bash
mv /home/services/psalter/public/tunes /home/services/psalter/public/tunes-compressed
mv /home/services/psalter-backups/tunes-preswap-20260811 /home/services/psalter/public/tunes
pm2 restart psalter
```

Second-line fallback (rebuild from the tarball):

```bash
tar xzf /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz \
  -C /home/services/psalter/public
pm2 restart psalter
```

Neither was executed — the sweep passed and the live URLs are healthy.
