import { headers } from 'next/headers'

export type ServerTimer = {
  mark: (name: string) => void
  serialize: () => string
}

/**
 * Per-request Server-Timing accumulator.
 *
 * Each mark() records a delta since the previous mark (or the timer start).
 * serialize() emits the `name;dur=<ms>` form accepted by the Server-Timing spec,
 * one segment per mark, in mark order. Duplicates are kept (spec allows it);
 * the browser merges by name in the DevTools UI.
 *
 * Usage (RSC page):
 *   const t = startTimings()
 *   const psalm = t.measure('fetchPsalmDetail', () => fetchPsalmDetail(id))
 *   const tunes = t.measure('fetchTunesByMeter', () => fetchTunesByMeter(meter))
 *   t.finish()   // appends the Server-Timing response header before send
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
    h.append('Server-Timing', serialize())
  }

  return { mark, serialize, measure, finish }
}
