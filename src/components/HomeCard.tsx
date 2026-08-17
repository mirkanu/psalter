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

function CardBody({
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
    <Card className="h-full hover:ring-foreground/25 transition-all duration-75 active:translate-y-px">
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
    </Card>
  )
}

/**
 * A reusable icon+title+description card whose whole body is a link.
 *
 * When `children` are provided, the outer wrapper is a plain `<div>` and the
 * link scopes ONLY to the card body so that the caller can nest their own
 * interactive children (e.g. DailyTodayCard's "Sing psalm" Link) without
 * producing nested anchors (invalid HTML / hydration warning).
 */
export function HomeCard({
  icon,
  title,
  description,
  href,
  external,
  children,
}: HomeCardProps) {
  const body = (
    <CardBody
      icon={icon}
      title={title}
      description={description}
      external={external}
    />
  )

  if (children) {
    return (
      <div className="space-y-4">
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 rounded-xl"
          >
            {body}
          </a>
        ) : (
          <Link
            href={href}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 rounded-xl"
          >
            {body}
          </Link>
        )}
        <div>{children}</div>
      </div>
    )
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 rounded-xl"
      >
        {body}
      </a>
    )
  }

  return (
    <Link
      href={href}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 rounded-xl"
    >
      {body}
    </Link>
  )
}
