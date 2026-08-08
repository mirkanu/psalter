import { describe, it, expect, vi, beforeEach } from 'vitest'
import { existsSync } from 'fs'

vi.mock('fs', () => ({ existsSync: vi.fn() }))

const mockedExistsSync = vi.mocked(existsSync)

describe('deriveTuneJpgPages memo cache', () => {
  beforeEach(() => {
    mockedExistsSync.mockReset()
  })

  it('probes the filesystem on a cache miss', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    mockedExistsSync.mockImplementation((p) => String(p).includes('dundee-staff-0.jpg'))
    const result = deriveTuneJpgPages('Dundee')
    expect(result).toEqual({ staffPages: ['/tunes/dundee-staff-0.jpg'], solfegePages: [] })
  })

  it('does not re-probe on a cache hit', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    mockedExistsSync.mockImplementation((p) => String(p).includes('dundee-staff-0.jpg'))
    deriveTuneJpgPages('Dundee')
    const countAfterFirst = mockedExistsSync.mock.calls.length
    deriveTuneJpgPages('Dundee')
    const countAfterSecond = mockedExistsSync.mock.calls.length
    expect(countAfterSecond).toBe(countAfterFirst)
  })

  it('returns the same result object contents on a cache hit', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    mockedExistsSync.mockImplementation((p) => String(p).includes('dundee-staff-0.jpg'))
    const first = deriveTuneJpgPages('Dundee')
    const second = deriveTuneJpgPages('Dundee')
    expect(second).toEqual(first)
  })

  it('caches different tune names independently', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    mockedExistsSync.mockImplementation((p) => String(p).includes('-staff-0.jpg'))
    deriveTuneJpgPages('Dundee')
    const countAfterDundee = mockedExistsSync.mock.calls.length
    deriveTuneJpgPages('Crimond')
    const countAfterCrimond = mockedExistsSync.mock.calls.length
    expect(countAfterCrimond).toBeGreaterThan(countAfterDundee)
  })

  it('bypasses the default-cache entry for a non-default maxPages', async () => {
    const { deriveTuneJpgPages } = await import('./tune-jpg-urls')
    mockedExistsSync.mockImplementation((p) => String(p).includes('-staff-0.jpg'))
    deriveTuneJpgPages('Martyrdom')
    const countAfterDefault = mockedExistsSync.mock.calls.length
    deriveTuneJpgPages('Martyrdom', 2)
    const countAfterCustomMax = mockedExistsSync.mock.calls.length
    expect(countAfterCustomMax).toBeGreaterThan(countAfterDefault)
  })
})
