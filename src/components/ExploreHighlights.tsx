import Link from "next/link"
import { Palette, BookOpen, Library, Gem } from "lucide-react"

const HIGHLIGHTS = [
  { label: "Mood", href: "/explore?tab=themes&sub=mood", icon: Palette },
  { label: "Topic", href: "/explore?tab=themes&sub=main-topic", icon: BookOpen },
  { label: <>Nave&apos;s Topics</>, href: "/explore?tab=other-topics", icon: Library },
  { label: "Messianic", href: "/explore/messianic", icon: Gem },
]

/**
 * Compact 2x2 grid of Explore category shortcuts, rendered as the Explore
 * HomeCard's children so the Explore card doesn't sit as a bare link with no
 * highlights (issue 4). Kept visually small so it doesn't dominate the
 * homepage's 2x2 card grid.
 */
export function ExploreHighlights() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {HIGHLIGHTS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border text-xs hover:bg-muted hover:border-primary/30 active:translate-y-px transition-all duration-75"
        >
          <Icon className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </div>
  )
}
