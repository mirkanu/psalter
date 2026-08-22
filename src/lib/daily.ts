/**
 * Returns the 1-based day of year (1..365) for the given date.
 * Wraps day 366 (leap years) back to day 1 so the 365-entry plan stays bounded.
 * Pure function — works in both Node and browser.
 */
export function getDayOfYear(date: Date = new Date()): number {
  const year = date.getFullYear()
  const startOfYear = Date.UTC(year, 0, 1)
  const dayMs = Date.UTC(year, date.getMonth(), date.getDate())
  const dayOfYear = Math.floor((dayMs - startOfYear) / (1000 * 60 * 60 * 24)) + 1
  return ((dayOfYear - 1) % 365) + 1
}

/**
 * Format a psalm reference for display.
 * prefix=false → "50:1-8" (calendar cell); prefix=true → "Psalm 50:1-8" (today card).
 * Range is shown only when BOTH verses are non-null; otherwise the psalm number alone.
 */
export function formatPsalmRef(
  psalmId: number,
  startingVerse: number | null,
  endingVerse: number | null,
  prefix = false
): string {
  const base = prefix ? `Psalm ${psalmId}` : String(psalmId)
  if (startingVerse !== null && endingVerse !== null) {
    return `${base}:${startingVerse}-${endingVerse}`
  }
  return base
}

/**
 * Convert a calendar date (year, 0-based month, 1-based day) to day-of-year (1-365).
 * Mirrors getDayOfYear() exactly; wraps leap-year day 366 back to 1.
 */
export function calendarDateToDayOfYear(year: number, month: number, day: number): number {
  const startOfYear = Date.UTC(year, 0, 1)
  const targetDay = Date.UTC(year, month, day)
  const dayOfYear = Math.floor((targetDay - startOfYear) / (1000 * 60 * 60 * 24)) + 1
  return ((dayOfYear - 1) % 365) + 1
}

/**
 * Reverse of getDayOfYear(): converts a 1..365 day number back to a calendar
 * Date. Uses a fixed non-leap reference year (2025 by default) so Feb 29
 * never appears in the output; the input is wrapped with the same modulo
 * used by getDayOfYear/calendarDateToDayOfYear so day 366 maps to day 1.
 */
export function dayOfYearToDate(dayNumber: number, year = 2025): Date {
  const wrapped = ((dayNumber - 1) % 365) + 1
  return new Date(Date.UTC(year, 0, wrapped))
}

/**
 * Format a date as an ordinal day + full month name, e.g. "12th August".
 * No year, no weekday. Reads UTC fields so a server timezone can never
 * shift the day relative to dayOfYearToDate's UTC construction.
 */
export function formatOrdinalDate(date: Date): string {
  const day = date.getUTCDate()
  const month = date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
  const suffix = ordinalSuffix(day)
  return `${day}${suffix} ${month}`
}

function ordinalSuffix(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return 'th'
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

/**
 * Parse a `YYYY-MM-DD` string (the shape returned by Drizzle's `date` column
 * type) into a UTC Date. Returns null for malformed input rather than
 * throwing or producing an Invalid Date.
 */
export function parseReadingDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const [, y, mo, d] = m
  const year = parseInt(y, 10)
  const month = parseInt(mo, 10)
  const day = parseInt(d, 10)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null
  }
  return date
}
