import * as React from "react"
import Link from "next/link"
import { ExternalLink, type LucideIcon } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface HomeCardProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
  external?: boolean
  children?: React.ReactNode
}

function CardInner({
  icon: Icon,
  title,
  description,
  external,
}: {
  icon: LucideIcon
  title: string
  description: string
  external?: boolean
}) {
  return (
    <>
      <CardHeader>
        <Icon className="h-8 w-8 text-amber-500" aria-hidden="true" />
        <CardTitle className="font-semibold text-lg flex items-center gap-1.5">
          {title}
          {external && (
            <ExternalLink
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </>
  )
}

/**
 * A reusable icon+title+description card.
 *
 * There is always exactly ONE `<Card>` element rendered. When `children` are
 * provided, the header+description fragment is wrapped in a link that scopes
 * ONLY to that fragment (not the whole Card), and `children` render in their
 * own `CardContent` as a sibling of that link — both live inside the same
 * Card, so the caller's own interactive children (e.g. DailyTodayCard's "Sing
 * psalm" Link) never become nested anchors, while the card still shares one
 * bordered surface with no interior void. When there are no children, the
 * entire Card surface is the link (maximum click target, previous behaviour).
 */
export function HomeCard({
  icon,
  title,
  description,
  href,
  external,
  children,
}: HomeCardProps) {
  const inner = (
    <CardInner
      icon={icon}
      title={title}
      description={description}
      external={external}
    />
  )

  if (children) {
    const linkContent = <div className="flex flex-col gap-4">{inner}</div>
    return (
      <Card className="h-full hover:ring-foreground/25 transition-all duration-75 active:translate-y-px">
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25"
          >
            {linkContent}
          </a>
        ) : (
          <Link
            href={href}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25"
          >
            {linkContent}
          </Link>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    )
  }

  const cardBody = (
    <Card className="h-full hover:ring-foreground/25 transition-all duration-75 active:translate-y-px">
      {inner}
    </Card>
  )

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 rounded-xl"
      >
        {cardBody}
      </a>
    )
  }

  return (
    <Link
      href={href}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 rounded-xl"
    >
      {cardBody}
    </Link>
  )
}
