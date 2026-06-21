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
