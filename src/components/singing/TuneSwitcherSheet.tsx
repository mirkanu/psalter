'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { TuneOption, TuneSwitcherSections } from './types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: TuneSwitcherSections
  meterLabel: string | null
}

function TuneRow({
  tune,
  isCurrent,
  onSelect,
}: {
  tune: TuneOption
  isCurrent: boolean
  onSelect: (t: TuneOption) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tune)}
      data-tune-slug={String(tune.id)}
      aria-current={isCurrent ? 'true' : undefined}
      className={[
        'w-full text-left h-12 min-h-11 px-3 rounded-md text-base transition-colors',
        'flex items-center justify-between gap-2 active:scale-[0.99]',
        isCurrent
          ? 'bg-foreground text-background ring-1 ring-foreground'
          : 'hover:bg-muted',
      ].join(' ')}
    >
      <span className="font-semibold truncate">{tune.name}</span>
      <span className="flex items-center gap-2 shrink-0">
        {tune.meter && (
          <Badge variant={isCurrent ? 'outline' : 'secondary'} className="text-xs">
            {tune.meter}
          </Badge>
        )}
        {isCurrent && (
          <Badge variant="outline" className="text-xs">Current</Badge>
        )}
      </span>
    </button>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2 mt-1">
      {children}
    </h3>
  )
}

export function TuneSwitcherSheet({ open, onOpenChange, sections, meterLabel }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSelect = (tune: TuneOption) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.set('tune', String(tune.id))
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    // Close after a brief delay so the user sees the selection register (UI-SPEC §Interaction).
    setTimeout(() => onOpenChange(false), 120)
  }

  const hasAny =
    sections.current !== null ||
    sections.recommended.length > 0 ||
    sections.other.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-tune-switcher-sheet
        className="max-h-[80dvh] flex flex-col"
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Choose a tune</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-1 pb-4 space-y-4">
          {!hasAny && (
            <p className="text-sm text-muted-foreground italic py-6 text-center">
              No tunes available for this psalm.
            </p>
          )}

          {sections.current && (
            <section>
              <SectionHeader>Current</SectionHeader>
              <TuneRow tune={sections.current} isCurrent={true} onSelect={handleSelect} />
            </section>
          )}

          {sections.recommended.length > 0 && (
            <>
              <Separator />
              <section>
                <SectionHeader>
                  Recommended {meterLabel && <>for {meterLabel}</>}
                </SectionHeader>
                <div className="space-y-1">
                  {sections.recommended.map((t) => (
                    <TuneRow
                      key={t.id}
                      tune={t}
                      isCurrent={false}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {sections.other.length > 0 && (
            <>
              <Separator />
              <section>
                <SectionHeader>Other tunes</SectionHeader>
                <div className="space-y-1">
                  {sections.other.map((t) => (
                    <TuneRow
                      key={t.id}
                      tune={t}
                      isCurrent={false}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {sections.recommended.length === 0 &&
            sections.other.length === 0 &&
            sections.current && (
              <p className="text-sm text-muted-foreground italic">
                No other tunes available for this meter.
              </p>
            )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
