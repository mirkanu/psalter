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
// TIMING — read at RENDER time, not module scope.
//
// Next writes the BUILD_ID *file* late in the build: `writeBuildId` runs in
// `next/dist/build/index.js` immediately before `exportApp`, i.e. just before
// the "Generating static pages" phase. The layout module, however, is
// imported much earlier, during "Collecting page data". A module-scope read
// therefore ALWAYS misses the file and bakes "unknown" into every prerendered
// page — while dynamic routes (rendered per request) read it correctly,
// which is a confusing split.
//
// So: callers must invoke this during render, and failures must never be
// cached. A read that happened too early returns null and must not poison
// the later, correct read.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Why a BUILD_ID read did not produce a usable value. */
export type BuildIdFailure = 'missing' | 'unreadable'

/** Result of reading the live slot's BUILD_ID. */
export type BuildIdRead =
  | { ok: true; buildId: string }
  | { ok: false; reason: BuildIdFailure }

/**
 * Read the live slot's BUILD_ID, distinguishing *why* it failed:
 *   - `missing`   — the file exists but holds nothing (or only whitespace)
 *   - `unreadable` — the read itself threw (ENOENT, EACCES, …)
 *
 * Deliberately NOT cached. The file is 21 bytes and sits in the page cache,
 * so the read is cheap; caching it would:
 *   - break the timing contract above (a value read before Next writes the
 *     file would be pinned for the life of the process), and
 *   - break tests that mock `node:fs` with a different value per assertion
 *     (tests/api/build-version.test.ts).
 * Every call re-reads the file, so the value is always current.
 */
export function readLiveBuildId(): BuildIdRead {
  const distDir = process.env.PSALTER_DIST_DIR || '.next'
  const buildIdPath = resolve(process.cwd(), distDir, 'BUILD_ID')

  let raw: string
  try {
    raw = readFileSync(buildIdPath, 'utf8')
  } catch {
    return { ok: false, reason: 'unreadable' }
  }

  const buildId = raw.trim()
  if (!buildId) {
    return { ok: false, reason: 'missing' }
  }

  return { ok: true, buildId }
}

/**
 * The live build's BUILD_ID, or null when it is missing or unreadable
 * (dev server before the first build, or a render that happened before Next
 * wrote the file) so callers can decide their own fallback.
 */
export function getLiveBuildId(): string | null {
  const result = readLiveBuildId()
  return result.ok ? result.buildId : null
}
