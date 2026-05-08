/**
 * Returns the 1-based day of year (1..365) for the given date.
 * Wraps day 366 (leap years) back to day 1 so the 365-entry plan stays bounded.
 * Pure function — works in both Node and browser.
 */
export function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)
  return ((dayOfYear - 1) % 365) + 1
}
