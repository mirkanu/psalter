'use client'

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

const NT_BOOK_ORDER = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
]

interface NTEntry {
  id: number
  sub_topic: string | null
  quotation: string | null
  verses: Array<{ verseId: number; psalmId: number; verseNumber: number | null }>
}

function CollapsibleRow({
  label,
  count,
  children,
}: {
  label: string
  count: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 min-h-[44px] hover:bg-muted rounded-md">
        <span className="text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{count} verses</Badge>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 py-2 text-sm text-muted-foreground">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

function parseVerseSegments(
  quotation: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _verses: Array<{ verseNumber: number | null }>
): Map<number, string> {
  const result = new Map<number, string>()
  const parts = quotation.split(/(?=\d+:\d+\s)/)
  for (const part of parts) {
    const m = part.match(/^\d+:(\d+)\s+(.+)/)
    if (m) {
      result.set(parseInt(m[1], 10), m[2].trim())
    }
  }
  return result
}

function groupByPsalm(verses: Array<{ verseId: number; psalmId: number; verseNumber: number | null }>) {
  const groups: Array<{ psalmId: number; verses: typeof verses }> = []
  for (const v of verses) {
    const last = groups[groups.length - 1]
    if (last && last.psalmId === v.psalmId) {
      last.verses.push(v)
    } else {
      groups.push({ psalmId: v.psalmId, verses: [v] })
    }
  }
  return groups
}

export function QuotedInNT({ entries }: { entries: NTEntry[] }) {
  const sorted = [...entries].sort((a, b) => {
    const idxA = NT_BOOK_ORDER.findIndex(book => (a.sub_topic ?? '').startsWith(book))
    const idxB = NT_BOOK_ORDER.findIndex(book => (b.sub_topic ?? '').startsWith(book))
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
  })

  return (
    <div>
      {sorted.map((entry) => {
        const verseMap = entry.quotation
          ? parseVerseSegments(entry.quotation, entry.verses)
          : new Map<number, string>()

        const allParsed = entry.verses.length > 0 &&
          entry.verses.every(v => v.verseNumber != null && verseMap.has(v.verseNumber))

        const groups = groupByPsalm(entry.verses)

        return (
          <CollapsibleRow
            key={entry.id}
            label={entry.sub_topic ?? "General"}
            count={entry.verses.length}
          >
            <div className="space-y-2">
              {groups.map(({ psalmId, verses: groupVerses }) => (
                <div key={psalmId} className="mb-2">
                  <Link
                    href={`/psalms/${psalmId}`}
                    className="text-sm font-semibold hover:text-primary block active:bg-muted active:translate-y-px transition-all duration-75"
                  >
                    Psalm {psalmId}
                  </Link>
                  {allParsed
                    ? groupVerses.map((v) => (
                        <p key={v.verseId} className="text-sm text-muted-foreground mt-0.5 ml-2">
                          {v.verseNumber != null ? `${v.verseNumber} ` : ''}
                          {verseMap.get(v.verseNumber!) ?? ''}
                        </p>
                      ))
                    : entry.quotation && (
                        <p className="text-sm text-muted-foreground mt-0.5 ml-2">
                          {entry.quotation.replace(/^[\d:,\s]+\s/, '')}
                        </p>
                      )
                  }
                </div>
              ))}
            </div>
          </CollapsibleRow>
        )
      })}
    </div>
  )
}
