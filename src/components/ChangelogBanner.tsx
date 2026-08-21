import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ChangelogPost } from "@/db/queries/changelog"

/**
 * Compact single-line changelog notice shown above the homepage hero heading.
 * Presentational only — the page fetches the newest post and passes it down so
 * this stays unit-testable without touching the DB. Renders nothing when there
 * are zero changelog posts (never shows an empty banner shell).
 *
 * Threat model T-P2Y-01: post.title is rendered as a plain React text child
 * (never dangerouslySetInnerHTML) so React escapes it — same pattern as
 * ChangelogPostCard.
 */
export function ChangelogBanner({ post }: { post: ChangelogPost | null }) {
  if (!post) return null

  return (
    <Link
      href="/changelog"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors max-w-full"
    >
      <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden="true" />
      <Badge variant="secondary" className="shrink-0">
        New
      </Badge>
      <span className="truncate max-w-[16rem] sm:max-w-xs">{post.title}</span>
      <span className="shrink-0">— Read the changelog</span>
    </Link>
  )
}
