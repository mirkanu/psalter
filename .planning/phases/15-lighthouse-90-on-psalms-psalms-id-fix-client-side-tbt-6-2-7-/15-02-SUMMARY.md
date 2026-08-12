---
phase: 15-lighthouse-90-on-psalms-psalms-id-fix-client-side-tbt-6-2-7
plan: 15-02
title: Logo next/image conversion + Geist tuning + Playwright assertion
wave: 2
completed: 2026-08-12
status: complete
one_liner: SiteHeader logo converted to next/image with priority preload, Geist fonts pruned to 4 weights, remotePatterns allow-list added, Playwright daemon asserts logo HTML carries /_next/image?url + fetchpriority=high
key-files:
  created:
    - .planning/phases/15-lighthouse-90-on-psalms-psalms-id-fix-client-side-tbt-6-2-7-/15-lighthouse-logo-playwright-check.txt
  modified:
    - next.config.ts
    - src/components/SiteHeader.tsx
    - src/app/layout.tsx
commits:
  - 076ffb7: chore(15-02): add assets.softr-files.com to images.remotePatterns
  - 17abb0d: chore(15-02): convert SiteHeader logo to next/image with priority
  - a2cddcc: chore(15-02): tighten Geist font options for FCP and weight pruning
  - e006abb: chore(15-02): add fetchPriority="high" to logo Image
  - 3089663: test(15-02): Playwright daemon proof of logo next/image conversion
---

# Plan 15-02 SUMMARY

## Result

Complete. All 5 tasks executed and committed before the executor hit a 429 API rate limit during the final doc step. SUMMARY.md written directly by orchestrator after spot-verifying the worktree work.

## What shipped

**next.config.ts** — added `images.remotePatterns` for `assets.softr-files.com` with the exact asset path glob (unblocks next/image from optimizing the Softr-hosted logo).

**src/components/SiteHeader.tsx** — replaced the raw `<img>` header logo with `<Image src=… width=… height=… alt="CPRC Psalter" priority fetchPriority="high">`. Adjacent ThemeToggle / navLink / logout classes also got the Wave-14 click-feedback `active:bg-muted active:translate-y-px transition-all duration-75` tokens (Rule 3 — banner fix carried forward from the Phase-14 audit).

**src/app/layout.tsx** — `Geist` and `Geist_Mono` now declare `display: "swap"`, `preload: true` (sans only), and explicit `weight` lists (sans: 400/500/600/700; mono: 400 only). Drops the critical-path payload from the default 8 sans + 2 mono weights to 4 + 1.

## Playwright assertion (15-VALIDATION.md T3)

The shared playwright-daemon (`/home/services/playwright-daemon`) was driven against the worktree-local dev server. Returned HTML attributes for `header img[alt="CPRC Psalter"]`:

| Gate | Result |
|---|---|
| `src` starts with `/_next/image?url=` | **PASS** — optimizer is serving the logo |
| `alt` is "CPRC Psalter" | **PASS** — correct element matched |
| `fetchpriority` is "high" | **PASS** — `fetchPriority="high"` prop emitted as HTML attr |
| `<link rel="preload" as="image">` exists with `imageSrcSet` + `imageSizes="28px"` | **PASS** — `priority` flag emitted the preload hint, sized to 28px |

Full assertion transcript lives at `.planning/phases/15-lighthouse-90-on-psalms-psalms-id-fix-client-side-tbt-6-2-7-/15-lighthouse-logo-playwright-check.txt`.

## Deviations

- Executor agent terminated mid-write of this file with a `429 Token Plan usage limit reached` API error after the 5 commits were already on the worktree branch. All 5 commits merged cleanly into master; this SUMMARY.md is written by the orchestrator from spot-checks against the merged tree.
- `next.config.ts` retained the existing `experimental.cpus: 1` comment block (and its Hetzner 3.7 GB RAM rationale) — out-of-scope for this plan.

## Cross-plan dependencies

- `15-01` (dynamic-import wrappers) was prerequisite; provides the psalm-detail bundle that no longer eagerly loads abcjs synth. Wave 2's logo + font savings complement those bundle reductions on the home/psalms page first-paint.

## Self-Check: PASSED
