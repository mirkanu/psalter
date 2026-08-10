---
phase: 13
slug: tune-image-compression
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-10
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^2.1.9 |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run <path-to-file>.test.ts` |
| **Full suite command** | `npm test` (runs `vitest`; add `-- run` for a non-watch, CI-style single pass) |
| **Estimated runtime** | ~30 seconds (existing 46-file vitest suite) |

This phase is fundamentally a filesystem batch-processing task, not application-code-under-test. The existing vitest suite (`src/**/*.test.ts`, `scripts/**/*.test.ts`) covers solfège parsing, melisma detection, and phrase-break annotation — none of it touches `public/tunes/` file contents directly. This phase does not need new vitest coverage; it needs a standalone compression script plus filesystem/checksum verification (mirroring `scripts/backup-tunes.sh` / `scripts/verify-tunes-backup.sh` from Phase 6, which are plain scripts, not vitest-tested code).

---

## Sampling Rate

- **After every task commit:** Run the compression/verification script directly (e.g. `npx tsx scripts/compress-tunes.ts` or `scripts/verify-tunes-compression.ts`) — not a vitest quick-run, since this is a filesystem operation, not application code.
- **After every plan wave:** Re-run the backup checksum check (`sha256sum` against `BACKUP-MANIFEST.md`'s recorded value) plus the full vitest suite (`npm test`) to confirm no unrelated regressions — in particular re-run `src/lib/tune-jpg-urls.test.ts`, which touches `public/tunes/` path derivation logic.
- **Before `/gsd-verify-work`:** All 326 tune image files verified smaller-than-original + decodable, backup archive checksum confirmed unchanged, legibility spot-check on `tune_melisma_decisions.status = 'approved'` tunes (71 of 326) passed, full vitest suite green.
- **Max feedback latency:** ~30 seconds (vitest full suite) + script runtime for the batch compression pass.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 0 | ASSET-01 | — | Compression script stages output, never overwrites originals in place | script-assertion | `npx tsx scripts/compress-tunes.ts` (new) | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 0 | ASSET-01 | — | Every compressed file is smaller than its corresponding original | script-assertion | `npx tsx scripts/verify-tunes-compression.ts` (new) | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | ASSET-01 | T-13-01 | Backup archive sha256 unchanged after compression run | shell-assertion | `sha256sum /home/services/psalter-backups/tunes-pre-compression-20260730.tar.gz` compared against `BACKUP-MANIFEST.md` | ✅ (script) / ✅ (backup) | ⬜ pending |
| 13-01-04 | 01 | 1 | ASSET-01 | — | Melisma-approved tune samples remain legible after compression | manual | Human visual review of `tune_melisma_decisions.status = 'approved'` sample set | N/A — manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/compress-tunes.ts` — the compression script itself (does not exist yet): resize-to-max-2000px + `mozjpeg: true` + `chromaSubsampling: '4:4:4'` at quality 82, stage-then-swap pattern, sequential (`sharp.concurrency(1)`) to avoid OOM per `PITFALLS.md` Pitfall 5
- [ ] `scripts/verify-tunes-compression.ts` (or equivalent inline checks) — per-file size/decode verification comparing `fs.statSync` sizes across all 326 original/compressed pairs

*No vitest framework gap — vitest is already configured and does not need new test files for this phase; existing `src/lib/tune-jpg-urls.test.ts` should be re-run post-compression as a regression check since it derives paths under `public/tunes/` (though it mocks `existsSync` rather than reading real files, so it is unlikely to be affected — verify this assumption when reading that test file during planning).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Legibility of melisma underlines/slurs on compressed tune scores | ASSET-01 | Subjective visual fidelity judgment — no automated proxy for "still legible" on hand-engraved notation | Sample several tunes from the 71 with `tune_melisma_decisions.status = 'approved'`, view compressed JPEGs at normal display size, confirm underline/slur markings and staff lines remain readable versus the original |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (excluding full batch compression runtime)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
