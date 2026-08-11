import Link from "next/link"
import { renderSnippet } from "@/lib/search-utils"
import { abbreviateMeter } from "@/lib/meter-abbrev"

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
  onClick?: () => void
}

function formatLabel(label: string): string {
  return label
}

// Long labels need a smaller font to fit on mobile
function labelSizeClass(label: string): string {
  if (label.length > 8) return 'text-[9px]'
  if (label.length > 5) return 'text-[10px]'
  return 'text-xs'
}

export function PsalmNumberBox({ psalm, isTopResult, showFirstLine, showMeter, showRecommendedTune, snippet, query, className, onClick }: PsalmNumberBoxProps) {
  const meterLabel = showMeter ? abbreviateMeter(psalm.meter) : null
  // Gap 4b: a displayed meter must occupy real layout space. The old compact branch painted it in an
  // absolutely positioned span, which contributes zero height, so the box could never grow and the text
  // landed on top of the psalm number. Any box that shows a meter now uses the flow-layout branch.
  const hasContent = showFirstLine || showRecommendedTune || !!snippet || !!meterLabel
  const isHighlighted = isTopResult && query.length > 0
  const label = formatLabel(psalm.displayLabel)
  const sizeClass = labelSizeClass(label)

  const baseClasses = [
    "block rounded-lg",
    "hover:border-primary transition-colors duration-200",
    "active:bg-muted active:scale-[0.98] transition-transform duration-75",
    hasContent
      ? "flex flex-col py-2 px-2 min-h-[44px] min-w-[44px]"
      : `flex items-center justify-center relative min-w-[44px] h-12 md:h-14${className ? ` ${className}` : ''}`,
    isHighlighted
      ? "bg-primary/5 border-primary border-2"
      : "bg-card border border-border",
  ].join(' ')

  const inner = hasContent ? (
    <>
      <div className="flex items-start justify-between w-full">
        <span className={`${sizeClass} font-semibold font-mono tabular-nums text-foreground leading-none shrink-0`}>
          {label}
        </span>
        {meterLabel && (
          <span data-meter className="text-[10px] text-muted-foreground leading-tight pt-0.5 pl-1 text-right min-w-0 break-words">
            {meterLabel}
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
        {label}
      </span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClasses}
        aria-label={`Psalm ${label}`}
        aria-current={isHighlighted ? "true" : undefined}
        data-psalm-box
      >
        {inner}
      </button>
    )
  }

  return (
    <Link
      href={`/psalms/${psalm.slug}`}
      className={baseClasses}
      aria-label={`Psalm ${label}`}
      aria-current={isHighlighted ? "true" : undefined}
      data-psalm-box
    >
      {inner}
    </Link>
  )
}
