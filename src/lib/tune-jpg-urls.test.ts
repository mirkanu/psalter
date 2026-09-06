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
  })

  it('emits only the pages that exist in R2, not maxPages worth', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const single = deriveTuneJpgPages('Dundee')
    expect(single.staffPages).toHaveLength(1)
    expect(single.solfegePages).toHaveLength(1)

    const double = deriveTuneJpgPages('Aurelia')
    expect(double.staffPages).toHaveLength(2)
    expect(double.solfegePages).toHaveLength(2)
    expect(double.staffPages[1]).toBe('https://cdn.psalter.gsdlabs.dev/aurelia-staff-1.jpg')
  })

  it('returns empty arrays for a tune with no scans in the manifest', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const result = deriveTuneJpgPages('No Such Tune At All')
    expect(result.staffPages).toEqual([])
    expect(result.solfegePages).toEqual([])
  })

  it('does not include the legacy /tunes/ path prefix anywhere', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const result = deriveTuneJpgPages('Crimond')
    const allUrls = [...result.staffPages, ...result.solfegePages]
    expect(allUrls.length).toBeGreaterThan(0)
    expect(allUrls.every((u) => u.startsWith('https://cdn.psalter.gsdlabs.dev/'))).toBe(true)
    expect(allUrls.every((u) => !u.includes('/tunes/'))).toBe(true)
  })

  it('caches identical results on repeated calls with same args', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const a = deriveTuneJpgPages('Martyrdom')
    const b = deriveTuneJpgPages('Martyrdom')
    expect(b).toEqual(a)
  })

  it('clamps to maxPages when it is lower than the real page count', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const result = deriveTuneJpgPages('Aurelia', 1)
    expect(result.staffPages).toHaveLength(1)
    expect(result.solfegePages).toHaveLength(1)
  })

  it('slugifies special characters correctly', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    const { TUNE_JPG_MANIFEST } = await import('./tune-jpg-manifest')
    const { tuneNameToSlug } = await import('./tune-slug')
    expect(tuneNameToSlug("St. Andrew's")).toBe('st-andrew-s')
    // Only assert URL shape when the slug actually has scans.
    if (TUNE_JPG_MANIFEST['st-andrew-s']?.staff) {
      const result = deriveTuneJpgPages("St. Andrew's")
      expect(result.staffPages[0]).toBe('https://cdn.psalter.gsdlabs.dev/st-andrew-s-staff-0.jpg')
    }
  })
})

describe('tune JPG manifest', () => {
  it('matches the 320 JPGs across 149 tunes present in R2', async () => {
    const { TUNE_JPG_MANIFEST } = await import('./tune-jpg-manifest')
    const slugs = Object.keys(TUNE_JPG_MANIFEST)
    expect(slugs).toHaveLength(149)
    const totalFiles = slugs.reduce((n, s) => {
      const e = TUNE_JPG_MANIFEST[s]
      return n + e.staff + e.solfege
    }, 0)
    expect(totalFiles).toBe(320)
  })

  it('never records a page count above 2', async () => {
    const { TUNE_JPG_MANIFEST } = await import('./tune-jpg-manifest')
    for (const [slug, counts] of Object.entries(TUNE_JPG_MANIFEST)) {
      expect(counts.staff, slug).toBeLessThanOrEqual(2)
      expect(counts.solfege, slug).toBeLessThanOrEqual(2)
    }
  })
})
