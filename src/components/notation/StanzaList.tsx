import type { ReactNode } from 'react'

interface StanzaListProps {
  stanzas: string[]
  className?: string
}

/**
 * Renders a vertical column of psalm stanzas. The leading number on each
 * stanza (if any) is rendered as a superscript verse number (D-17).
 *
 * Used in:
 *  - NotationRenderer "Lyrics only" view mode
 *  - NotationRenderer "Solfège" view mode (below the JPG)
 *  - AbcPlayer "Show original" mode (below the JPG)
 *
 * Sizing follows the `--staff-base-size` CSS var set on the nearest
 * `data-notation-renderer` ancestor so A+/A− buttons control text size.
 */
export function StanzaList({ stanzas, className }: StanzaListProps): ReactNode {
  if (!stanzas || stanzas.length === 0) return null
  return (
    <div className={className ?? 'space-y-4'}>
      {stanzas.map((s, i) => (
        <p key={i} className="verse-text whitespace-pre-line">{s}</p>
      ))}
    </div>
  )
}
