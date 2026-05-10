import Link from "next/link"

function renderSnippet(snippet: string, query: string) {
  if (!query) return <span>{snippet}</span>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = snippet.split(new RegExp(`(${escaped})`, 'gi')).filter(Boolean)
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <strong key={i}>{part}</strong>
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
    recommendedTune?: string | null
    snippet?: string | null
  }
  isTopResult: boolean
  showFirstLine: boolean
  showMeter: boolean
  showRecommendedTune?: boolean
  snippet: string | null
  query: string
}

export function PsalmNumberBox({ psalm, isTopResult, showFirstLine, showMeter, showRecommendedTune, snippet, query }: PsalmNumberBoxProps) {
  const hasContent = showFirstLine || showRecommendedTune || !!snippet
  const isHighlighted = isTopResult && query.length > 0

  const baseClasses = [
    "block rounded-lg",
    "hover:border-primary transition-colors duration-200",
    "active:scale-[0.97]",
    hasContent
      ? "flex flex-col py-2 px-2 min-h-[44px] min-w-[44px]"
      : "flex items-center justify-center relative min-w-[44px] h-12 md:h-14",
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
      {hasContent ? (
        <>
          <div className="flex items-start justify-between w-full">
            <span className="text-sm font-semibold font-mono tabular-nums text-foreground leading-none">
              {psalm.id}
            </span>
            {showMeter && psalm.meter && (
              <span className="text-[10px] text-muted-foreground leading-none pt-0.5 pr-1 pl-1 shrink-0">
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
          {showRecommendedTune && psalm.recommendedTune && (
            <span className="text-[10px] text-primary/80 mt-1 leading-none self-start line-clamp-1">
              {psalm.recommendedTune}
            </span>
          )}
        </>
      ) : (
        <>
          <span className="text-sm font-semibold font-mono tabular-nums text-foreground leading-none">
            {psalm.id}
          </span>
          {showMeter && psalm.meter && (
            <span className="absolute top-1 right-1.5 text-[10px] text-muted-foreground leading-none">
              {psalm.meter}
            </span>
          )}
        </>
      )}
    </Link>
  )
}
