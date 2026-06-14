'use client'

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react"

interface CatechismRow {
  question_number: number
  url: string
  verses: Array<{ psalmId: number; verseNumber: number | null }>
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

export function HeidelbergCatechism({ rows }: { rows: CatechismRow[] }) {
  return (
    <div>
      {rows.map((row) => (
        <CollapsibleRow
          key={row.question_number}
          label={`Question ${row.question_number}`}
          count={row.verses.length}
        >
          <div className="space-y-1">
            {row.verses.map((v) => (
              <a
                key={`${v.psalmId}-${v.verseNumber}`}
                href={row.url.startsWith('http') ? row.url : `https://${row.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-primary block"
              >
                Psalm {v.psalmId}
                {v.verseNumber != null ? `:${v.verseNumber}` : ""} — Question{" "}
                {row.question_number}
                <ExternalLink className="inline ml-1 h-3 w-3" />
              </a>
            ))}
          </div>
        </CollapsibleRow>
      ))}
    </div>
  )
}
