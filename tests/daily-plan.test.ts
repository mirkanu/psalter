import { describe, it, expect } from 'vitest'
import { fetchAllDailyReadings, fetchDailyReading } from '@/db/queries/daily'
import { getDayOfYear } from '@/lib/daily'

describe('Daily Reading Plan (PLAN-01)', () => {
  it('fetchAllDailyReadings returns exactly 365 entries', async () => {
    const readings = await fetchAllDailyReadings()
    expect(readings).toHaveLength(365)
  })

  it('every entry has a dayNumber 1..365 (sorted)', async () => {
    const readings = await fetchAllDailyReadings()
    for (let i = 0; i < readings.length; i++) {
      expect(readings[i].dayNumber).toBe(i + 1)
    }
  })

  it('every entry has an associated psalm', async () => {
    const readings = await fetchAllDailyReadings()
    const withoutPsalm = readings.filter((r) => !r.psalm)
    expect(withoutPsalm).toHaveLength(0)
  })

  it('fetchDailyReading(1) returns the day-1 entry', async () => {
    const r = await fetchDailyReading(1)
    expect(r).toBeDefined()
    expect(r!.dayNumber).toBe(1)
  })

  it('fetchDailyReading(365) returns the day-365 entry', async () => {
    const r = await fetchDailyReading(365)
    expect(r).toBeDefined()
    expect(r!.dayNumber).toBe(365)
  })

  it('fetchDailyReading(366) returns undefined', async () => {
    const r = await fetchDailyReading(366)
    expect(r).toBeUndefined()
  })

  it('getDayOfYear returns a value matching one of the 365 readings', async () => {
    const today = getDayOfYear()
    expect(today).toBeGreaterThanOrEqual(1)
    expect(today).toBeLessThanOrEqual(365)
    const reading = await fetchDailyReading(today)
    expect(reading).toBeDefined()
  })
})
