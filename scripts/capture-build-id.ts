// Reads .next/BUILD_ID (written by `next build` at the end of its run) and
// stamps it onto both data/deploy-info.json (server-read by /api/deploy-info)
// and src/generated/build-info.json (baked into the client bundle at next
// build start).
//
// Why this is a postbuild instead of prebuild:
//   scripts/capture-deploy-info.ts runs as `prebuild` — but .next/BUILD_ID
//   does not exist until `next build` has produced it. Splitting the capture
//   into prebuild (commit + commitTime + message + deployedAt) and postbuild
//   (BUILD_ID) lets each run see the data it needs without a chicken-and-
//   egg race.
//
// Why BUILD_ID matters for the admin footer:
//   On iOS Safari, a tab can hold a stale HTML response from before the
//   latest deploy even after the JS bundle inside it has been refreshed.
//   The footer in that case reports the new deploy (because it compares the
//   bundle's baked-in commit to /api/deploy-info, both of which are fresh),
//   but the page renders older code because the HTML still references older
//   content-hashed chunks. BUILD_ID is exactly what Next.js uses in those
//   chunk URLs (/_next/static/{BUILD_ID}/...), so a mismatch between the
//   SSR'd data-build-id attribute and the server's reported buildId proves
//   the HTML is cached. DeployStatus surfaces this as a "Stale HTML" banner
//   so the admin knows to hard-refresh. See plan at
//   /home/claude/.claude/plans/fluffy-juggling-blanket.md for the full design.
//
// Wired into package.json via the `postbuild` script so every `npm run
// build` automatically refreshes the buildId. Runs after `next build` and
// before `next start` so the value is in place by the time the server boots.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface ServerDeployInfo {
  deployedAt: number
  commitTime: number
  commit: string
  commitLong: string
  message: string
  buildId?: string
}

interface ClientBuildInfo {
  commit: string
  deployedAt: number
  buildId?: string
}

const cwd = process.cwd()
const buildIdPath = join(cwd, '.next', 'BUILD_ID')
const serverJsonPath = join(cwd, 'data', 'deploy-info.json')
const clientJsonPath = join(cwd, 'src', 'generated', 'build-info.json')

if (!existsSync(buildIdPath)) {
  console.error(
    `[capture-build-id] ${buildIdPath} not found — run after \`next build\`. Skipping.`,
  )
  process.exit(0)
}

const buildId = readFileSync(buildIdPath, 'utf8').trim()
if (!buildId) {
  console.error('[capture-build-id] .next/BUILD_ID is empty. Skipping.')
  process.exit(0)
}

// Update server JSON (read by /api/deploy-info).
if (existsSync(serverJsonPath)) {
  try {
    const raw = readFileSync(serverJsonPath, 'utf8')
    const info = JSON.parse(raw) as ServerDeployInfo
    info.buildId = buildId
    writeFileSync(serverJsonPath, JSON.stringify(info, null, 2) + '\n', 'utf8')
    console.log(`[capture-build-id] updated ${serverJsonPath} with buildId=${buildId}`)
  } catch (err) {
    console.error(`[capture-build-id] failed to update ${serverJsonPath}:`, err)
    process.exit(1)
  }
} else {
  console.warn(
    `[capture-build-id] ${serverJsonPath} not found — prebuild did not run? skipping.`,
  )
}

// Update client JSON (baked into the NEXT build's bundle via webpack raw
// import in DeployStatus). This means the bundle for the *next* deploy will
// carry this buildId baked in. The current build already shipped without it
// — that's fine; DeployStatus treats a missing buildId as "could not
// verify" rather than as a mismatch.
if (existsSync(clientJsonPath)) {
  try {
    const raw = readFileSync(clientJsonPath, 'utf8')
    const info = JSON.parse(raw) as ClientBuildInfo
    info.buildId = buildId
    writeFileSync(clientJsonPath, JSON.stringify(info, null, 2) + '\n', 'utf8')
    console.log(`[capture-build-id] updated ${clientJsonPath} with buildId=${buildId}`)
  } catch (err) {
    console.error(`[capture-build-id] failed to update ${clientJsonPath}:`, err)
    process.exit(1)
  }
} else {
  console.warn(
    `[capture-build-id] ${clientJsonPath} not found — prebuild did not run? skipping.`,
  )
}