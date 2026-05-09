import Link from "next/link"

function renderSnippet(snippet: string, query: string) {
  if (!query) return <span>{snippet}</span>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = snippet.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <b key={i}>{part}</b>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

interface PsalmNumberBoxProps {
  psalm: {
    id: number
    firstLine: string | null
    meter: string | null
    snippet?: string | null
  }
  isTopResult: boolean
  showFirstLine: boolean
  showMeter: boolean
  snippet: string | null
  query: string
}

export function PsalmNumberBox({ psalm, isTopResult, showFirstLine, showMeter, snippet, query }: PsalmNumberBoxProps) {
  const hasExpanded = showFirstLine || !!snippet
  const isHighlighted = isTopResult && query.length > 0

  const baseClasses = [
    "block rounded-lg",
    "hover:border-primary transition-all duration-200",
    "active:scale-[0.97] transition-transform",
    "flex flex-col items-center justify-center",
    hasExpanded ? "py-2 px-2 min-h-[44px] min-w-[44px]" : "aspect-square min-w-[44px] h-12 md:h-14",
    isHighlighted
      ? "bg-primary/5 border-primary border-2"
      : "bg-card border border-border",
  ].join(' ')

  return (
    <Link
      href={`/psalms/${psalm.id}`}
      className={baseClasses}
      aria-label={`Psalm ${psalm.id}`}
      aria-current={isHighlighted ? "true" : undefined}
      data-psalm-box
    >
      <div className="flex items-start justify-between w-full">
        <span className="text-2xl md:text-3xl font-bold font-mono tabular-nums text-foreground leading-none">
          {psalm.id}
        </span>
        {showMeter && psalm.meter && (
          <span className="text-xs text-muted-foreground leading-none pt-0.5 pl-1 shrink-0">
            {psalm.meter}
          </span>
        )}
      </div>
      {snippet ? (
        <span data-snippet className="text-xs text-muted-foreground mt-0.5 leading-snug self-start line-clamp-3">
          {renderSnippet(snippet, query)}
        </span>
      ) : showFirstLine && psalm.firstLine ? (
        <span className="text-xs text-muted-foreground mt-0.5 leading-snug self-start line-clamp-2">
          {psalm.firstLine}
        </span>
      ) : null}
    </Link>
  )
}
