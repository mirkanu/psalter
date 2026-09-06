import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('deriveTuneJpgPages R2 URL contract', () => {
  beforeEach(async () => {
    // Reset module cache between tests so jpgPageCache is fresh.
    vi.resetModules()
  })

  it('returns absolute R2 URLs for staff + solfege pages', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const result = deriveTuneJpgPages('Dundee')
    expect(result.staffPages[0]).toBe('https://cdn.psalter.gsdlabs.dev/dundee-staff-0.jpg')
    expect(result.solfegePages[0]).toBe('https://cdn.psalter.gsdlabs.dev/dundee-solfege-0.jpg')
    expect(result.staffPages).toHaveLength(8)
    expect(result.solfegePages).toHaveLength(8)
  })

  it('does not include the legacy /tunes/ path prefix anywhere', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const result = deriveTuneJpgPages('Crimond')
    const allUrls = [...result.staffPages, ...result.solfegePages]
    expect(allUrls.every((u) => u.startsWith('https://cdn.psalter.gsdlabs.dev/'))).toBe(true)
    expect(allUrls.every((u) => !u.includes('/tunes/'))).toBe(true)
  })

  it('caches identical results on repeated calls with same args', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const a = deriveTuneJpgPages('Martyrdom')
    const b = deriveTuneJpgPages('Martyrdom')
    expect(b).toEqual(a)
  })

  it('respects custom maxPages', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const result = deriveTuneJpgPages('Beatitudo', 3)
    expect(result.staffPages).toHaveLength(3)
    expect(result.solfegePages).toHaveLength(3)
    expect(result.staffPages[2]).toBe('https://cdn.psalter.gsdlabs.dev/beatitudo-staff-2.jpg')
  })

  it('slugifies special characters correctly', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const result = deriveTuneJpgPages("St. Andrew's")
    expect(result.staffPages[0]).toBe('https://cdn.psalter.gsdlabs.dev/st-andrew-s-staff-0.jpg')
  })
})
