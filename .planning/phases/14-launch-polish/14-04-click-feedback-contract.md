# 14-04 Click-Feedback Contract

> Source of truth for the click-feedback class patterns applied across `src/`. Future PRs that add `<Link>`, `<button>`, or `<a>` elements must follow this contract. See [`.planning/phases/14-launch-polish/14-UI-SPEC.md`](../../phases/14-launch-polish/14-UI-SPEC.md) §4 for the original locked patterns.

## Patterns

UI-SPEC §4 — verbatim.

| Element type | Class to add |
|--------------|--------------|
| `<Link>` (Next.js) | `active:bg-muted active:translate-y-px transition-all duration-75` |
| `<button>` (non-shadcn) | `active:bg-muted active:translate-y-px transition-all duration-75` |
| `<a>` plain anchor | `active:bg-muted active:translate-y-px transition-all duration-75` |
| Card-link wrappers | `active:bg-muted active:scale-[0.98] transition-transform duration-75` |

## Exclusions

Do NOT add these classes to:

1. **Elements inside `<Dialog>`, `<Sheet>`, `<Popover>`** — base-ui handles their press states. Adding `active:bg-muted` to dialog descendants causes double-flicker on press.
2. **`<Button>` shadcn primitive** (`src/components/ui/button.tsx`) — already has `active:not-aria-[haspopup]:translate-y-px` baked into the `buttonVariants` cva string. Callsites of `buttonVariants({...})` (e.g. `src/app/page.tsx`, `src/components/PsalmNav.tsx`) inherit this for free.
3. **Disabled elements** — `disabled:opacity-50 disabled:cursor-not-allowed` already removes pointer events; press feedback is meaningless.

### Card-wrapper normalization

The original card-wrappers used `active:scale-[0.97]`. UI-SPEC §4 mandates `0.98` (subtler, less janky on mobile). All card-wrappers now use the Pattern B string above.

## Audit checklist (for future PRs)

When adding a new `<Link>`, `<button>`, or `<a>`:

- [ ] Does it live inside Dialog/Sheet/Popover? If yes, STOP (base-ui handles press state).
- [ ] Is it a disabled element? If yes, STOP (already styled with `pointer-events-none opacity-50`).
- [ ] Is it a `<Button>` shadcn primitive or `buttonVariants()` call? If yes, STOP (Button already has `active:not-aria-[haspopup]:translate-y-px`).
- [ ] Is it a card-link wrapper (large clickable area with `hover:border-primary`)? Use Pattern B (`active:scale-[0.98]`).
- [ ] Otherwise (inline Link/button/a)? Use Pattern A (`active:translate-y-px`).

Run this grep before merging:

```bash
grep -rn 'active:bg-muted\|active:translate-y-px\|active:scale' src/ --include='*.tsx'
```

Every new interactive element should show up in that grep unless it's in an exclusion.

## Coverage numbers from this sweep

Audit after Task 2 (2026-08-11):

| Grep | Count |
|------|-------|
| `active:bg-muted` (any context) | 51 |
| `active:scale-[0.97]` (must be 0; remaining 2 are inside Dialog bodies — PsalmPickerModal, PastePsalmsDialog — excluded by design) | 2 |
| `active:bg-muted active:scale-[0.98] transition-transform duration-75` (Pattern B) | 9 |
| `active:bg-muted active:translate-y-px transition-all duration-75` (Pattern A) | 40 |

### What each number means

- **51 active:bg-muted instances**: Every pattern-A and pattern-B application plus the legacy `active:bg-muted` already on the active-nav-link style (`linkClass` in `SiteHeader.tsx`). This is the master coverage metric.
- **2 active:scale-[0.97] remaining**: Intentional. Both inside Dialog content where base-ui handles press states — `src/components/PsalmPickerModal.tsx:100` and `src/components/precent/PastePsalmsDialog.tsx:110`.
- **9 Pattern B instances**: Card-link wrappers (psalm boxes, tune cards, psalm-by-tune list rows, account action buttons, etc.).
- **40 Pattern A instances**: Inline `<Link>`, `<button>`, and `<a>` outside dialogs. Spans navigation, breadcrumbs, search buttons, theme toggle, footer, gallery controls, topic/nave/messianic browse links, dev account controls, etc.

## What changed in Task 2

| Sub-task | Files modified | Result |
|----------|----------------|--------|
| A — 0.97 → 0.98 normalization | 7 | All non-dialog 0.97 instances normalized to Pattern B |
| B — bg-muted enrichment | 4 | Card-wrappers already at 0.98 gained bg-muted; Button overrides cleaned up |
| C — Pattern A on Link/button/a | 21 | 40 inline elements gained press feedback |

## Files inventory

See `.planning/phases/14-launch-polish/14-04-click-feedback-inventory.md` for the full list of files, line numbers, and edit decisions.

## Related docs

- [`.planning/phases/14-launch-polish/14-UI-SPEC.md`](../../phases/14-launch-polish/14-UI-SPEC.md) §4 — original locked pattern spec
- [`.planning/phases/14-launch-polish/14-04-PLAN.md`](../../phases/14-launch-polish/14-04-PLAN.md) — this plan
- `src/components/ui/button.tsx` — `<Button>` primitive cva string (line 7)

---

## Lighthouse 90+ Verification — DEFERRED

POLISH-03 (Lighthouse Performance ≥ 90 on `/psalms`, `/psalms/23`, `/`) was attempted on 2026-08-11 against the live production deployment at `psalter.gsdlabs.dev`. All three JSON files were generated successfully (see `.planning/phases/14-launch-polish/14-04-lighthouse-*.json`), but the measured scores were below the 90 threshold:

| Page | Score | FCP | LCP | CLS | TBT |
|------|-------|-----|-----|-----|-----|
| `/psalms` | 0.45 (45%) | 1929ms | 6239ms | 0.0010 | 3859ms |
| `/psalms/23` | 0.36 (36%) | 3165ms | 7294ms | 0.0010 | 2852ms |
| `/` | 0.62 (62%) | 1943ms | 4184ms | 0.0000 | 1096ms |

### Open gaps requiring follow-up

1. **TBT dominates the scores.** Total Blocking Time of 2.8–3.9s on the psalm list/detail pages is the main culprit. The deployed bundle is from a build predating Phase 14 changes (running process started 2026-08-05, before the Wave 1 worktree merge at 14:57 UTC). Re-run Lighthouse after a fresh Docker rebuild that includes the click-feedback commits.

2. **LCP is above 4s on all pages.** Largest Contentful Paint exceeds the 2.5s "good" threshold by 1.6–4.8s. Likely causes:
   - Tune JPG fallbacks being loaded above the fold (Phase 13's 91.2% compression may need re-verification post-deploy)
   - R2 image fetches being slow from Lighthouse's test location
   - abcjs SVG render blocking the LCP element on psalm-detail

3. **FCP is borderline.** 1.9–3.2s — under the 1.8s "good" target by 0.1–1.4s. Inline the Geist font preload or self-host the WOFF2 to eliminate the network round-trip.

4. **CLS is fine.** All three pages score < 0.005 — well within the "good" 0.1 threshold. No layout shift to fix.

### Why POLISH-03 is NOT checked in REQUIREMENTS.md

The plan's success criteria explicitly require:
- All three `14-04-lighthouse-*.json` files exist
- Each scores ≥ 0.9 on Performance

These criteria are NOT met. Per the plan's hard guard: "Before all 3 JSON files exist with score ≥ 0.9: leave `[ ]`." The checkbox stays unchecked and a future executor (after fresh deploy) must re-run Lighthouse and flip the checkbox only when scores pass.

### How to re-verify

After deploying a build that includes this plan's click-feedback commits and the Phase 13 JPG compression:

```bash
cd /home/services/psalter
CHROME_PATH=/home/claude/.cache/ms-playwright/chromium-1217/chrome-linux/chrome \
  npx --yes lighthouse <URL> \
  --output=json --output-path=<json-path> \
  --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu" \
  --only-categories=performance --quiet
```

Run against all three URLs (`/psalms`, `/psalms/23`, `/`). If all score ≥ 0.9, flip the POLISH-03 checkbox in `.planning/REQUIREMENTS.md` to `[x]` with the verification date and scores.
