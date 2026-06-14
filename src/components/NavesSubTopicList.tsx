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

function SubTopicCollapsible({ entry }: { entry: SubTopicEntry }) {
  const [open, setOpen] = useState(true)
  const stripped = (entry.quotation ?? '').replace(/^\d+:\d+\s*/, '')
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
        {entry.verses.map((v) => (
          <div key={`${v.psalmId}-${v.verseNumber}`} className="mb-1">
            <Link href={`/psalms/${v.psalmId}`} className="text-sm font-semibold hover:text-primary">
              Psalm {v.psalmId}
            </Link>
            {entry.quotation && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {v.verseNumber != null ? `${v.verseNumber} ` : ''}{stripped}
              </p>
            )}
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
