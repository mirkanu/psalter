#!/usr/bin/env node
// Phase 15.2: median-of-N Lighthouse harness.
//
// Single Lighthouse runs on this VPS have a +/-6 point spread with zero code
// change (see .planning/phases/15.2-.../15.2-measurement-noise-evidence.md).
// Any A/B verdict drawn from one run per arm is noise. This script runs each
// route N times sequentially and reports the median plus the observed spread,
// so a reviewer can tell a real change from jitter.
//
// Usage: node scripts/lighthouse-bench.mjs [--runs 5] [--out path.json]

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME_PATH =
  process.env.CHROME_PATH ||
  '/home/claude/.cache/ms-playwright/chromium-1217/chrome-linux/chrome'

const ROUTES = [
  ['homepage', 'http://localhost:3005/'],
  ['psalms', 'http://localhost:3005/psalms'],
  ['psalm-detail', 'http://localhost:3005/psalms/23'],
]

const args = process.argv.slice(2)
const runs = Number(args[args.indexOf('--runs') + 1]) || 5
const outIdx = args.indexOf('--out')
const outPath = outIdx === -1 ? null : args[outIdx + 1]

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const workDir = mkdtempSync(join(tmpdir(), 'lh-bench-'))
const results = {}

for (const [label, url] of ROUTES) {
  const samples = []
  for (let i = 0; i < runs; i++) {
    const jsonPath = join(workDir, `${label}-${i}.json`)
    execFileSync(
      'npx',
      [
        '--yes', 'lighthouse', url,
        '--output=json', `--output-path=${jsonPath}`,
        '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu',
        '--only-categories=performance', '--quiet',
      ],
      { env: { ...process.env, CHROME_PATH }, stdio: ['ignore', 'ignore', 'ignore'] },
    )
    const d = JSON.parse(readFileSync(jsonPath, 'utf8'))
    const a = d.audits
    samples.push({
      perf: d.categories.performance.score,
      benchmarkIndex: d.environment?.benchmarkIndex ?? null,
      tbt: a['total-blocking-time'].numericValue,
      fcp: a['first-contentful-paint'].numericValue,
      lcp: a['largest-contentful-paint'].numericValue,
      cls: a['cumulative-layout-shift'].numericValue,
      si: a['speed-index'].numericValue,
    })
    rmSync(jsonPath, { force: true })
    console.log(
      `  ${label} run ${i + 1}/${runs}: perf ${samples[i].perf} ` +
        `(bench ${Math.round(samples[i].benchmarkIndex)}, TBT ${Math.round(samples[i].tbt)}ms)`,
    )
  }
  const perfs = samples.map((s) => s.perf)
  results[label] = {
    url,
    runs,
    perf: { median: median(perfs), min: Math.min(...perfs), max: Math.max(...perfs) },
    tbt_median: Math.round(median(samples.map((s) => s.tbt))),
    fcp_median: Math.round(median(samples.map((s) => s.fcp))),
    lcp_median: Math.round(median(samples.map((s) => s.lcp))),
    cls_median: median(samples.map((s) => s.cls)),
    benchmarkIndex_median: Math.round(median(samples.map((s) => s.benchmarkIndex))),
    samples,
  }
  const r = results[label]
  console.log(
    `${label}: median ${r.perf.median} (spread ${r.perf.min}-${r.perf.max}), ` +
      `TBT ${r.tbt_median}ms, LCP ${r.lcp_median}ms\n`,
  )
}

rmSync(workDir, { recursive: true, force: true })
const payload = { capturedAt: new Date().toISOString(), chromePath: CHROME_PATH, results }
if (outPath) {
  writeFileSync(outPath, JSON.stringify(payload, null, 2))
  console.log(`Wrote ${outPath}`)
}