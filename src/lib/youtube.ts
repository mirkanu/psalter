/**
 * Converts a YouTube watch URL (long or short form) to an embeddable URL.
 * Returns null for null input or non-YouTube URLs (caller should render plain link).
 */
export function toEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const shortMatch = url.match(/youtu\.be\/([\w-]+)/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  const longMatch = url.match(/[?&]v=([\w-]+)/)
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`
  return null
}
