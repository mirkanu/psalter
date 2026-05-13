import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Extract soprano-only ABC from a 4-voice SATB string (inline [V:n] format). */
export function sopranoOnly(abc: string): string {
  return abc
    .split('\n')
    .flatMap((line) => {
      const t = line.trim()
      // Drop non-soprano voice declarations and directives
      if (/^V:[2-9]/.test(t) || /^%%/.test(t) || /^I:/.test(t)) return []
      // Drop non-soprano music lines
      if (/^\[V:[2-9]\]/.test(t)) return []
      // Strip [V:1] prefix from soprano music lines
      if (t.startsWith('[V:1]')) return [t.slice(5).trimStart()]
      return [line]
    })
    .join('\n')
}
