// Captures the current git HEAD's commit time, sha, and message and writes
// them to data/deploy-info.json so the /api/deploy-info route can return
// "Deployed x ago" in the admin-only footer.
//
// Why this exists: the user (admin) wants a persistent footer indicator
// showing how long ago the running code was deployed. Without capturing
// the commit time at build time, there's no signal of when the running
// bundle was produced — Date.now() inside the API route would always
// return the current process start time, which is meaningless for a
// long-running PM2 process.
//
// Wired into package.json via the `prebuild` script so every `npm run
// build` automatically refreshes the file. The `prebuild` runs before
// `next build`, so by the time the API route is compiled and reachable,
// the file already exists with the latest commit data.
//
// Output location: data/deploy-info.json. Gitignored — committing a file
// that changes on every build would create unnecessary commit churn.

import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

interface DeployInfo {
  deployedAt: number // Unix milliseconds
  commit: string // short sha (7 chars)
  commitLong: string // full sha
  message: string // first line of commit subject
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

const deployedAtMs = commitTimeSec ? Number(commitTimeSec) * 1000 : Date.now()

const info: DeployInfo = {
  deployedAt: deployedAtMs,
  commit: commitShort,
  commitLong,
  message: commitMessage,
}

const outPath = join(process.cwd(), 'data', 'deploy-info.json')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(info, null, 2) + '\n', 'utf8')

console.log(`[capture-deploy-info] wrote ${outPath}`)
console.log(`  commit:    ${info.commit}`)
console.log(`  deployedAt: ${new Date(info.deployedAt).toISOString()}`)
console.log(`  message:   ${info.message}`)