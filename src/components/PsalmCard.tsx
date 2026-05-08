import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export interface PsalmCardProps {
  id: number
  bibleTitle: string | null
  book: string | null
  firstLine: string | null
  meter: string | null
}

export function PsalmCard({ id, bibleTitle, firstLine, meter }: PsalmCardProps) {
  return (
    <Link
      href={`/psalms/${id}`}
      className="block bg-card border border-border rounded-lg p-4 min-h-20 hover:border-primary hover:shadow-sm transition-all duration-200 group active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{id}</span>
        {meter && (
          <Badge variant="secondary" className="text-xs">
            {meter}
          </Badge>
        )}
      </div>
      <p className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
        {bibleTitle ?? `Psalm ${id}`}
      </p>
      {firstLine && (
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 italic">
          {firstLine}
        </p>
      )}
    </Link>
  )
}
