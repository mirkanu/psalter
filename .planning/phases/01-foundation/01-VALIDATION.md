---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node --experimental-strip-types --test`) + tsx scripts |
| **Config file** | None needed — uses Node.js native test runner |
| **Quick run command** | `npx tsx scripts/verify-migration.ts --quick` |
| **Full suite command** | `npx tsx scripts/verify-migration.ts` |
| **Estimated runtime** | ~30 seconds (quick: row counts only; full: spot-checks + R2 URL HEAD checks) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx scripts/verify-migration.ts --quick` (row counts only)
- **After every plan wave:** Run `npx tsx scripts/verify-migration.ts` (full spot-checks + R2 URL checks)
- **Before `/gsd-verify-work`:** Full suite must be green + 10+ spot-check records validated
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| Schema definition | 01 | 1 | MIGR-01 | — | No raw SQL injection (Drizzle parameterises) | integration | `npx tsx scripts/verify-migration.ts --quick` | Wave 0 | ⬜ pending |
| Airtable migration | 02 | 2 | MIGR-01, MIGR-03 | T-1-01 | AIRTABLE_PAT not in git | integration | `npx tsx scripts/verify-migration.ts` | Wave 0 | ⬜ pending |
| R2 image upload | 03 | 2 | MIGR-02 | T-1-02 | R2 creds not in git | integration | `npx tsx scripts/verify-migration.ts` (includes HTTP HEAD) | Wave 0 | ⬜ pending |
| Delta migration | 04 | 3 | MIGR-04 | — | Idempotent upsert | integration | `npx tsx scripts/verify-migration.ts` (run twice, assert same counts) | Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/verify-migration.ts` — stubs for MIGR-01, MIGR-02, MIGR-03, MIGR-04 (row counts, R2 URL HEAD checks, spot-checks)
- [ ] R2 bucket created and credentials added to `.env` (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL)
- [ ] `docker-compose.yml` with `psalter-db` PostgreSQL 16 container on host port 5435 (5432 is in use by other containers on this server)
- [ ] `.gitignore` includes `.env` — prerequisite for T-1-01 (AIRTABLE_PAT must not be committed)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Spot-check 10+ records against Airtable UI | MIGR-03 | Requires human judgement on data fidelity | Open Airtable base, pick 10 random records across psalms/tunes/verses/topics, compare against PostgreSQL via psql |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
