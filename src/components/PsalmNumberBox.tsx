import Link from "next/link"
import { renderSnippet } from "@/lib/search-utils"

interface PsalmNumberBoxProps {
  psalm: {
    id: number
    displayLabel: string
    slug: string
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
  className?: string
}

// Long labels (like "119:105-112") need a smaller font to fit on mobile
function labelSizeClass(label: string): string {
  if (label.length > 8) return 'text-[9px]'
  if (label.length > 5) return 'text-[10px]'
  return 'text-xs'
}

export function PsalmNumberBox({ psalm, isTopResult, showFirstLine, showMeter, showRecommendedTune, snippet, query, className }: PsalmNumberBoxProps) {
  const hasContent = showFirstLine || showRecommendedTune || !!snippet
  const isHighlighted = isTopResult && query.length > 0
  const sizeClass = labelSizeClass(psalm.displayLabel)

  const baseClasses = [
    "block rounded-lg",
    "hover:border-primary transition-colors duration-200",
    "active:scale-[0.97]",
    hasContent
      ? "flex flex-col py-2 px-2 min-h-[44px] min-w-[44px]"
      : `flex items-center justify-center relative min-w-[44px] h-12 md:h-14${className ? ` ${className}` : ''}`,
    isHighlighted
      ? "bg-primary/5 border-primary border-2"
      : "bg-card border border-border",
  ].join(' ')

  return (
    <Link
      href={`/psalms/${psalm.slug}`}
      className={baseClasses}
      aria-label={`Psalm ${psalm.displayLabel}`}
      aria-current={isHighlighted ? "true" : undefined}
      data-psalm-box
    >
      {hasContent ? (
        <>
          <div className="flex items-start justify-between w-full">
            <span className={`${sizeClass} font-semibold font-mono tabular-nums text-foreground leading-none`}>
              {psalm.displayLabel}
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
          <span className={`${sizeClass} font-semibold font-mono tabular-nums text-foreground text-center leading-tight`}>
            {psalm.displayLabel}
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
