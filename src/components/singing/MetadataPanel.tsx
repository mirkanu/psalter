'use client'
import Link from "@/components/Link"
import { SheetClose } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import type { PsalmDetail } from '@/db/queries/psalms'

interface Props {
  psalm: PsalmDetail
  meter: string | null
  studyHref: string
}

export function MetadataPanel({ psalm, meter, studyHref }: Props) {
  return (
    <div className="space-y-4 text-sm" data-singing-metadata>
      <div className="space-y-1">
        {psalm.bibleTitle && (
          <p className="text-base font-semibold text-foreground">{psalm.bibleTitle}</p>
        )}
        {psalm.author && (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Author:</span> {psalm.author}
          </p>
        )}
        {psalm.book && (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Book:</span> {psalm.book}
          </p>
        )}
        {meter && (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Meter:</span> {meter}
          </p>
        )}
      </div>

      {psalm.psalmTopics && psalm.psalmTopics.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Topics
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {psalm.psalmTopics.map((pt, i) => (
              <Badge
                key={pt.topic?.id ?? `topic-${i}`}
                variant="secondary"
                className="text-xs"
              >
                {pt.topic?.name ?? ''}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {psalm.sectionHeadings && psalm.sectionHeadings.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Divisions
          </h4>
          <ul className="space-y-1">
            {psalm.sectionHeadings.map((sh) => (
              <li key={sh.id} className="text-sm">
                {sh.verseStart && (
                  <span className="text-muted-foreground font-mono text-xs mr-2">
                    v.{sh.verseStart}
                  </span>
                )}
                {sh.heading}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2">
        {/* base-ui Dialog.Close uses `render` prop (not Radix `asChild`) to compose
            with a custom element. Releasing focus trap before navigation. */}
        <SheetClose
          render={
            <Link
              href={studyHref}
              className="inline-flex items-center text-base font-semibold underline"
              data-open-study-link
            >
              Open full study view →
            </Link>
          }
        />
      </div>
    </div>
  )
}
