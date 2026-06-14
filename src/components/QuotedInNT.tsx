'use client'

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

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

export function QuotedInNT({ entries }: { entries: NTEntry[] }) {
  return (
    <div>
      {entries.map((entry) => (
        <CollapsibleRow
          key={entry.id}
          label={entry.sub_topic ?? "General"}
          count={entry.verses.length}
        >
          <div className="space-y-2">
            {entry.verses.map((v) => (
              <div key={`${v.verseId}`}>
                <Link
                  href={`/psalms/${v.psalmId}`}
                  className="text-sm font-semibold hover:text-primary"
                >
                  Psalm {v.psalmId}
                  {v.verseNumber != null ? `:${v.verseNumber}` : ""}
                </Link>
              </div>
            ))}
            {entry.quotation && (
              <p className="text-sm text-muted-foreground italic ml-4">
                {entry.quotation}
              </p>
            )}
          </div>
        </CollapsibleRow>
      ))}
    </div>
  )
}
