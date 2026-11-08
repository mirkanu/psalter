// The live build's BUILD_ID.
//
// Production deploys alternate between two build slots (`.next` and
// `.next-build`) so a compile never touches the directory the running server
// is serving from. `scripts/start-with-db-wait.sh` exports PSALTER_DIST_DIR
// for whichever slot is live, and `next.config.ts` uses the same variable for
// `distDir`.
//
// Anything that reads BUILD_ID at runtime must therefore read it from
// PSALTER_DIST_DIR, NOT from a hardcoded `.next` — otherwise it reports the
// idle slot's build. That matters for:
//
//   - src/app/layout.tsx — the `data-build-id` attribute DeployStatus
//     compares against /api/deploy-info to detect a stale cached HTML
//     response.
//   - src/app/api/build-version/route.ts — the public cache-bust endpoint
//     every psalm page mounts BuildVersionGuard against.
//
// Returns null when the file is missing or unreadable (dev server before the
// first build), so callers can decide their own fallback.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function getLiveBuildId(): string | null {
  try {
    const distDir = process.env.PSALTER_DIST_DIR || '.next'
    const buildId = readFileSync(
      join(process.cwd(), distDir, 'BUILD_ID'),
      'utf8',
    ).trim()
    return buildId || null
  } catch {
    return null
  }
}
