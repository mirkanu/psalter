import type { ReactNode } from 'react'
import type { Stanza } from '@/lib/lyrics-structured'

interface StanzaListProps {
  stanzas: Stanza[]
  className?: string
}

/**
 * Renders a vertical column of psalm stanzas with inline Bible-verse
 * superscripts (D-07 / RENDER-03). Each line whose `bibleVerseRef` is set
 * is prefixed inline by `<sup class="verse-number">{ref}</sup>` so verse
 * boundaries that start mid-stanza are visible (per D-06 invariant 5).
 *
 * Used in:
 *  - NotationRenderer "Lyrics only" view mode
 *  - NotationRenderer "Solfège" view mode (below the JPG)
 *  - NotationRenderer "Staff" view mode via AbcPlayer's `renderLyricsBelow`
 *    (Show Original mode below the JPG)
 *
 * Sizing/typography come from existing `.verse-text` and `.verse-number`
 * rules in `globals.css` (driven by `--staff-base-size` CSS var on the
 * nearest `data-notation-renderer` ancestor — A+/A- controls). No new CSS
 * is introduced by this component.
 */
export function StanzaList({ stanzas, className }: StanzaListProps): ReactNode {
  if (!stanzas || stanzas.length === 0) return null
  return (
    <div className={className ?? 'space-y-4'}>
      {stanzas.map((stanza, i) => (
        <p key={i} className="verse-text whitespace-pre-line">
          {stanza.lines.map((line, j) => (
            <span key={j}>
              {line.bibleVerseRef !== undefined && (
                <sup className="verse-number">{line.bibleVerseRef}</sup>
              )}
              {line.text}
              {j < stanza.lines.length - 1 && '\n'}
            </span>
          ))}
        </p>
      ))}
    </div>
  )
}
