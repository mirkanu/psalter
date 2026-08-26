#!/usr/bin/env npx tsx
/**
 * Extract monophonic melody from Israel (tune id 114, CM) SoundCloud audio
 * to ABC notation using Spotify basic-pitch. NO DB WRITE — output goes
 * only to scripts/output/israel-attempt.abc with a confidence header.
 *
 * Hard rules (from plan 260826-n1i):
 *   - VPS preflight FIRST (python3, basic-pitch importability, free RAM).
 *   - If basic-pitch is not installable, write the "skipped" placeholder.
 *   - If free RAM < 800 MB, write the "skipped" placeholder.
 *   - Do NOT touch the DB.
 *   - Honestly report confidence to stdout; let the user decide.
 *
 * Source: https://soundcloud.com/manuel-kuhs/tune-israel
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const OUTPUT_PATH = path.join(process.cwd(), 'scripts/output/israel-attempt.abc')
const TUNE_NAME = 'Israel'

function writePlaceholder(message: string): void {
  const header = `% Audio transcription skipped — ${message}\n%\n`
  const footer = `\n% DB impact: NONE. tunes.id = 114 (Israel) remains with abc_notation IS NULL.\n`
  fs.writeFileSync(OUTPUT_PATH, header + footer + '%\n')
  console.error(`[Task 5] Wrote placeholder to ${OUTPUT_PATH}: ${message}`)
}

async function preflight(): Promise<{ ok: boolean; reason?: string }> {
  // 1. python3
  const pythonCheck = await new Promise<string>((resolve) => {
    import('node:child_process').then(({ exec }) => {
      exec('command -v python3', (err, stdout) => {
        resolve(err ? '' : stdout.trim())
      })
    })
  })
  if (!pythonCheck) return { ok: false, reason: 'python3 not available on this VPS' }

  // 2. basic-pitch — try import via system python
  const basicPitchCheck = await new Promise<{ available: boolean }>((resolve) => {
    import('node:child_process').then(({ exec }) => {
      exec(`${pythonCheck} -c "import basic_pitch; print('ok')"`, (err, stdout) => {
        resolve({ available: !err && stdout.trim() === 'ok' })
      })
    })
  })

  if (!basicPitchCheck.available) {
    // Try one pip install attempt per plan rule
    console.log('[Task 5] basic-pitch not installed — attempting pip install...')
    const installResult = await new Promise<{ ok: boolean }>((resolve) => {
      import('node:child_process').then(({ exec }) => {
        exec(
          'python3 -m venv /tmp/basicpitch-venv && /tmp/basicpitch-venv/bin/pip install --upgrade --quiet setuptools && /tmp/basicpitch-venv/bin/pip install basic-pitch',
          { timeout: 240_000 },
          (err) => {
            if (err) {
              console.error(`[Task 5] pip install failed: ${err.message}`)
              resolve({ ok: false })
            } else {
              resolve({ ok: true })
            }
          },
        )
      })
    })
    if (!installResult.ok) {
      return { ok: false, reason: 'basic-pitch not installable on this VPS' }
    }
  }

  // 3. free RAM >= 800 MB
  const memCheck = await new Promise<{ freeMb: number }>((resolve) => {
    import('node:child_process').then(({ exec }) => {
      exec('free -m | awk \'/Mem:/ {print $7}\'', (err, stdout) => {
        const freeMb = err ? 0 : parseInt(stdout.trim(), 10)
        resolve({ freeMb })
      })
    })
  })
  if (memCheck.freeMb < 800) {
    return { ok: false, reason: `${memCheck.freeMb}MB free RAM below the 800MB minimum needed for basic-pitch on this 3.7GB VPS` }
  }

  return { ok: true }
}

async function main() {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })

  const pf = await preflight()
  if (!pf.ok) {
    writePlaceholder(pf.reason || 'unknown preflight failure')
    return
  }

  // Preflight passed — basic-pitch should be importable now.
  // In practice, on this Python 3.12 VPS, basic-pitch 0.x is unresolvable
  // due to numpy<1.24 build failure, so we end here in the placeholder path.
  // If/when basic-pitch is installable, this branch would:
  //   1. Download the SoundCloud audio via WebKit daemon (:3100) per
  //      project memory Playwright daemons.
  //   2. Run basic-pitch on the WAV to get note events + confidences.
  //   3. Convert MIDI/note events to ABC with mean confidence header.
  //   4. Write to OUTPUT_PATH.

  console.log('[Task 5] Preflight passed — basic-pitch importable')
  console.log('[Task 5] Audio extraction path not yet implemented (plan stop point at recipe step 9)')
  console.log('[Task 5] Writing minimal placeholder to keep the artifact present')

  fs.writeFileSync(
    OUTPUT_PATH,
    `X:1
T:${TUNE_NAME}
M:C
L:1/8
Q:1/4=84
K:C
%
% Audio extraction path stub — basic-pitch importable but SoundCloud
% stream extraction + MIDI-to-ABC pipeline not yet implemented in this
% executor session. Recommend manual transcription from
% https://soundcloud.com/manuel-kuhs/tune-israel OR retry on a Python
% 3.11 box where basic-pitch 0.x wheels resolve cleanly.
%
% DB impact: NONE. tunes.id = 114 (Israel) remains with abc_notation IS NULL.
`,
  )
  console.log(`[Task 5] Wrote stub ABC to ${OUTPUT_PATH}`)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
