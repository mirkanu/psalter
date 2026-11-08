/**
 * Run Next's build-time TypeScript check in-process, so real diagnostics are
 * printed instead of being swallowed.
 *
 * WHY THIS EXISTS
 *   `next build` runs its type check inside a jest-worker child process
 *   (next/dist/esm/build/type-check.js). If that worker is OOM-killed, the
 *   parent catches the failure and calls process.exit(1) — printing NOTHING.
 *   A type error and a killed worker are therefore indistinguishable in the
 *   build log:
 *
 *       ✓ Compiled successfully in 14.2min
 *       Running TypeScript ...
 *
 *       BUILD FAILED — the live server was not touched.
 *
 *   This script runs the exact same check (next/dist/lib/typescript/runTypeCheck,
 *   which is what the worker calls) in the current process, so a failure prints
 *   the diagnostic and a crash prints a stack.
 *
 * USAGE (from the repo root)
 *   node scripts/repro-typecheck.mjs
 *   PSALTER_DIST_DIR=.next-build node scripts/repro-typecheck.mjs
 *
 *   Note that `next build` IGNORES diagnostics in *.test.* / *.spec.* files, so
 *   a non-zero `npx tsc --noEmit` does not by itself mean the build will fail.
 *
 * WARMING THE INCREMENTAL CACHE
 *   TS_CACHE_DIR=.next-build/cache node scripts/repro-typecheck.mjs
 *   Next preserves a distDir's cache/ directory across builds, so a warm
 *   .tsbuildinfo makes the in-build check incremental and far cheaper. This
 *   writes exactly the file the build reads.
 *
 * This file is .mjs on purpose: `next build` type-checks every file matching
 * the tsconfig include globs (*.ts / *.tsx / *.mts), and a stray .ts helper in
 * the tree can fail the production build.
 */
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const NM = path.join(REPO, 'node_modules')

const { runTypeCheck } = await import(
  pathToFileURL(path.join(NM, 'next/dist/lib/typescript/runTypeCheck.js')).href
)
const typescript = (await import(pathToFileURL(path.join(NM, 'typescript/lib/typescript.js')).href)).default

const distDir = process.env.PSALTER_DIST_DIR || '.next'
const cacheDir = process.env.TS_CACHE_DIR || path.join(NM, '.cache')

console.log('distDir  =', distDir)
console.log('cacheDir =', cacheDir)
console.log('--- running Next runTypeCheck ---')

const started = Date.now()
try {
  const result = await runTypeCheck(
    typescript,
    REPO,
    distDir,
    path.join(REPO, 'tsconfig.json'),
    cacheDir,
    true,
    { app: path.join(REPO, 'src', 'app'), pages: undefined },
    false,
  )
  console.log('RESULT:', JSON.stringify(result, null, 2))
  console.log('ELAPSED_MS:', Date.now() - started)
  console.log('Type check passed.')
} catch (err) {
  console.error('=== TYPE CHECK FAILED ===')
  console.error(err && err.message ? err.message : err)
  if (err && err.stack) console.error(err.stack)
  process.exit(1)
}
