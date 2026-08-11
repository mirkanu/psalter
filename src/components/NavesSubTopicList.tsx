'use client'

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

interface SubTopicEntry {
  id: number
  sub_topic: string | null
  quotation: string | null
  verses: Array<{ psalmId: number; verseNumber: number | null }>
}

function parseVerseSegments(quotation: string): Map<number, string> {
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

function groupByPsalm(verses: Array<{ psalmId: number; verseNumber: number | null }>) {
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

function SubTopicCollapsible({ entry }: { entry: SubTopicEntry }) {
  const [open, setOpen] = useState(false)

  const verseMap = entry.quotation
    ? parseVerseSegments(entry.quotation)
    : new Map<number, string>()

  const allParsed = entry.verses.length > 0 &&
    entry.verses.every(v => v.verseNumber != null && verseMap.has(v.verseNumber))

  const groups = groupByPsalm(entry.verses)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 min-h-[44px] hover:bg-muted rounded-md">
        <span className="text-base font-semibold">{entry.sub_topic ?? 'General'}</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{entry.verses.length} verses</Badge>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pt-2 space-y-2">
        {groups.map(({ psalmId, verses: groupVerses }) => (
          <div key={psalmId} className="mb-1">
            <Link href={`/psalms/${psalmId}`} className="text-sm font-semibold hover:text-primary block active:bg-muted active:translate-y-px transition-all duration-75">
              Psalm {psalmId}
            </Link>
            {allParsed
              ? groupVerses.map((v) => (
                  <p key={`${psalmId}-${v.verseNumber}`} className="text-sm text-muted-foreground mt-0.5 ml-2">
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
      </CollapsibleContent>
    </Collapsible>
  )
}

export function NavesSubTopicList({ entries }: { entries: SubTopicEntry[] }) {
  return (
    <div>
      {entries.map((entry) => (
        <SubTopicCollapsible key={entry.id} entry={entry} />
      ))}
    </div>
  )
}
