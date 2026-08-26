// Captures the current git HEAD's commit sha, message, and commit time, plus
// the build's wall-clock time, and writes them to data/deploy-info.json so
// the /api/deploy-info route can return "Deployed x ago" in the admin-only
// footer.
//
// Why this exists: the user (admin) wants a persistent footer indicator
// showing how long ago the running code was deployed. The two distinct
// signals are kept separate so the main label can answer "when did this go
// live" (deployedAt = Date.now() at build time) while the tooltip answers
// "what code is this" (commit + commitTime + message).
//
// Why we keep them separate:
//   The prebuild runs at the start of `npm run build`, BEFORE the user's
//   pending changes are committed. If we used the HEAD commit's timestamp
//   as `deployedAt`, the indicator would always lag the actual build by the
//   length of the commit → build → push → restart cycle, and would also
//   point at the previous commit if the build is run before committing.
//   Using Date.now() here captures the moment the new bundle is being
//   produced — which is the closest in-process signal to "this code is
//   about to go live".
//
// Wired into package.json via the `prebuild` script so every `npm run
// build` automatically refreshes the file. The `prebuild` runs before
// `next build`, so by the time the API route is compiled and reachable,
// the file already exists with the latest data.
//
// Output location: data/deploy-info.json. Gitignored — committing a file
// that changes on every build would create unnecessary commit churn.

import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

interface DeployInfo {
  /** Wall-clock time at the moment this script ran (= build start time).
   *  Used by the footer's "Deployed x ago" label. */
  deployedAt: number
  /** HEAD commit's author/committer time (Unix ms). Shown in the tooltip
   *  so the admin can see when the source code was last touched. */
  commitTime: number
  commit: string
  commitLong: string
  message: string
}

function safeExec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

const commitLong = safeExec('git rev-parse HEAD')
const commitShort = commitLong ? commitLong.slice(0, 7) : 'unknown'
const commitTimeSec = safeExec('git log -1 --format=%ct HEAD')
const commitMessage = safeExec('git log -1 --format=%s HEAD')

const commitTimeMs = commitTimeSec ? Number(commitTimeSec) * 1000 : 0
const deployedAtMs = Date.now()

const info: DeployInfo = {
  deployedAt: deployedAtMs,
  commitTime: commitTimeMs,
  commit: commitShort,
  commitLong,
  message: commitMessage,
}

const serverOutPath = join(process.cwd(), 'data', 'deploy-info.json')
mkdirSync(dirname(serverOutPath), { recursive: true })
writeFileSync(serverOutPath, JSON.stringify(info, null, 2) + '\n', 'utf8')

// Also write a client-importable copy so DeployStatus can detect when the
// loaded JS bundle is older than the server's deploy-info. The client bundle
// is hashed and immutable once built, so a stale tab holding an old bundle
// would otherwise keep showing the previous commit in the footer even after
// a new deploy — comparing the bundle's baked-in commit to what the server
// reports reveals the mismatch and lets us warn the admin to hard-refresh.
const clientOutPath = join(process.cwd(), 'src', 'generated', 'build-info.json')
mkdirSync(dirname(clientOutPath), { recursive: true })
writeFileSync(
  clientOutPath,
  JSON.stringify({ commit: commitShort, deployedAt: deployedAtMs }, null, 2) + '\n',
  'utf8',
)

console.log(`[capture-deploy-info] wrote ${serverOutPath}`)
console.log(`[capture-deploy-info] wrote ${clientOutPath}`)
console.log(`  deployedAt: ${new Date(info.deployedAt).toISOString()}`)
console.log(`  commitTime: ${info.commitTime ? new Date(info.commitTime).toISOString() : 'unknown'}`)
console.log(`  commit:     ${info.commit}`)
console.log(`  message:    ${info.message}`)