import type { PsalmRow } from '@/components/PsalmListingGrid'

export interface ParsedPsalmEntry {
  psalmNum: number
  verseRange: string | null
  psalm: PsalmRow | null
}

export function parsePsalmList(input: string, psalms: PsalmRow[]): ParsedPsalmEntry[] {
  const results: ParsedPsalmEntry[] = []
  const regex = /\b(\d{1,3})(?::([0-9]+(?:-[0-9]+)?))?/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(input)) !== null) {
    const psalmNum = parseInt(match[1], 10)
    if (psalmNum < 1 || psalmNum > 150) continue
    const verseRange = match[2] ?? null
    const numStr = String(psalmNum)
    const psalm =
      psalms.find((r) => r.displayLabel === numStr) ??
      psalms.find((r) => r.displayLabel.startsWith(numStr + ':')) ??
      null
    results.push({ psalmNum, verseRange, psalm })
  }
  return results
}

export function nextSunday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const daysUntil = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + daysUntil)
  return d
}
