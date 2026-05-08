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
