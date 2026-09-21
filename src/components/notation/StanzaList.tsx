import type { ReactNode } from 'react'
import type { Stanza } from '@/lib/lyrics-structured'

interface StanzaListProps {
  stanzas: Stanza[]
  className?: string
  /** Stanza metre (CM/LM/SM/…). When CM, every stanza indents its 2nd and 4th
   *  lines from the left so the visual shape matches the printed Scottish Psalter.
   *  Other metres leave lines flush-left — non-CM indentation is a future
   *  plan item (see plan-milestone-2-public-beta.md §lyrics-display). */
  stanzaMeter?: string | null
}

/**
 * Renders a vertical column of psalm stanzas with verse numbers in their own
 * left column (so they always left-align, even when the lyrics below are
 * indented) and italic orange psalm subtitles above the lyrics.
 *
 * Visual layout (D-07 / RENDER-03 + m2 follow-ups):
 *  - Each <line> becomes a grid row: invisible verse-number column on the left,
 *    lyrics column on the right. This keeps verse numbers strictly left-aligned
 *    while still letting lines be indented (CM lines 2 & 4) without dragging
 *    the verse number with them.
 *  - CM: lines 2 and 4 of each stanza are indented ~4ch from the lyrics column.
 *  - Verse numbers are coloured in the orange accent (`var(--psalter-accent)`).
 *
 * Used in:
 *  - NotationRenderer "Lyrics only" view mode
 *  - NotationRenderer "Solfège" view mode (below the JPG)
 *  - NotationRenderer "Staff" view mode via AbcPlayer's `renderLyricsBelow`
 *    (Show Original mode below the JPG)
 *
 * Sizing/typography come from the `.verse-line` / `.verse-text` /
 * `.verse-number` / `.psalm-subtitle` rules in `globals.css`, driven by
 * `--staff-base-size` on the nearest `data-notation-renderer` ancestor
 * (A+/A- controls). No new CSS is introduced by this component beyond the
 * grid-row markup and CM indent modifiers.
 */
export function StanzaList({ stanzas, className, stanzaMeter }: StanzaListProps): ReactNode {
  if (!stanzas || stanzas.length === 0) return null
  const isCm = (stanzaMeter ?? '').trim().toUpperCase() === 'CM'
  return (
    <div className={className ?? 'space-y-4'}>
      {stanzas.map((stanza, i) => (
        <div key={i} className="space-y-0">
          {stanza.lines.map((line, j) => {
            // CM stanzas are 4 lines; indent lines 2 and 4. For any other
            // stanza length (truncated verses, partial stanzas) we leave the
            // indent off rather than mis-render.
            const isCmIndent = isCm && stanza.lines.length >= 4 && (j === 1 || j === 3)
            const indentClass = isCmIndent
              ? j === 1
                ? ' cm-indent-2'
                : ' cm-indent-4'
              : ''
            return (
              <div key={j} className={`verse-line${indentClass}`}>
                <span className="verse-number">
                  {line.bibleVerseRef !== undefined ? line.bibleVerseRef : ''}
                </span>
                <span className="verse-text">{line.text}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
