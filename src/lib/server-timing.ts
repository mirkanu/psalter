import { headers } from 'next/headers'

export type ServerTimer = {
  mark: (name: string) => void
  serialize: () => string
}

/**
 * Per-request Server-Timing accumulator.
 *
 * Why request headers instead of response headers:
 *   In Next.js 16 App Router, `headers().set('Server-Timing', ...)` inside a
 *   Server Component is silently dropped — response headers are already
 *   committed by the time the page renders. So we stash the timing into a
 *   request header (`x-issue-72-server-timing`) and the proxy (proxy.ts)
 *   lifts it onto the response.
 *
 * Usage (RSC page):
 *   const t = startTimings()
 *   const psalm = t.measure('fetchPsalmDetail', () => fetchPsalmDetail(id))
 *   const tunes = t.measure('fetchTunesByMeter', () => fetchTunesByMeter(meter))
 *   await t.finish()
 */
export function startTimings(): ServerTimer & {
  measure: <T>(name: string, fn: () => Promise<T>) => Promise<T>
  finish: () => Promise<void>
} {
  const t0 = performance.now()
  let last = t0
  const segments: Array<{ name: string; dur: number }> = []

  const mark = (name: string) => {
    const now = performance.now()
    segments.push({ name, dur: Math.round((now - last) * 100) / 100 })
    last = now
  }

  const serialize = () =>
    segments.map((s) => `${s.name};dur=${s.dur}`).join(', ')

  const measure = async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
    mark(`${name}.start`)
    try {
      return await fn()
    } finally {
      mark(`${name}.end`)
    }
  }

  const finish = async () => {
    mark('render')
    const h = await headers()
    h.append('x-issue-72-server-timing', serialize())
  }

  return { mark, serialize, measure, finish }
}
