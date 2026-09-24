'use client'

import { useEffect, useCallback, useState } from 'react'
import Link from "@/components/Link"
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, List } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { slugToDisplayTitle } from '@/lib/psalm-slugs'
import { cn } from '@/lib/utils'
import type { PsalmRow } from '@/components/PsalmListingGrid'
import { PsalmPickerModalClient } from '@/components/PsalmPickerModalClient'

interface PsalmNavProps {
  prev: string | null
  next: string | null
  /** Appended after the psalm slug, e.g. '/study'. Defaults to '' (singing view). */
  suffix?: string
  /** When provided (non-empty), the mobile list icon opens the shared psalm
   *  picker dialog in place instead of navigating to /psalms. Absent/undefined
   *  keeps the legacy <Link href="/psalms"> behaviour — additive-only. */
  psalms?: PsalmRow[]
}

function isEditableTarget(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}

export function PsalmNav({ prev, next, suffix = '', psalms }: PsalmNavProps) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)
  const hrefFor = useCallback((slug: string) => `/psalms/${slug}${suffix}`, [suffix])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (isEditableTarget(document.activeElement)) return
      if (e.key === 'ArrowLeft' && prev) {
        router.push(hrefFor(prev))
      } else if (e.key === 'ArrowRight' && next) {
        router.push(hrefFor(next))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, router, hrefFor])

  const prevLabel = prev ? slugToDisplayTitle(prev) : ''
  const nextLabel = next ? slugToDisplayTitle(next) : ''

  // Shared base classes for disabled-look elements (low opacity, no pointer)
  const disabledLook = 'opacity-40 pointer-events-none'

  // Mobile: icon-only square buttons (h-9 w-9). Desktop: outline sm with text.
  // We render two versions per side to cleanly switch between layouts.

  // ----- PREV -----
  const prevMobile = prev ? (
    <Link
      href={hrefFor(prev)}
      rel="prev"
      aria-label={`Previous psalm (Ps ${prevLabel})`}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'icon-lg' }),
        'md:hidden',
      )}
    >
      <ChevronLeft />
    </Link>
  ) : (
    <span
      aria-disabled="true"
      aria-label="Previous psalm (unavailable)"
      tabIndex={-1}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'icon-lg' }),
        'md:hidden',
        disabledLook,
      )}
    >
      <ChevronLeft />
    </span>
  )

  const prevDesktop = prev ? (
    <Link
      href={hrefFor(prev)}
      rel="prev"
      aria-label={`Previous psalm (Ps ${prevLabel})`}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'hidden md:inline-flex',
      )}
    >
      <ChevronLeft />
      <span>Ps {prevLabel}</span>
    </Link>
  ) : (
    <span
      aria-disabled="true"
      aria-label="Previous psalm (unavailable)"
      tabIndex={-1}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'hidden md:inline-flex',
        disabledLook,
      )}
    >
      <ChevronLeft />
      <span>Ps 1</span>
    </span>
  )

  // ----- LIST (mobile only) -----
  const hasPsalms = !!psalms && psalms.length > 0
  const listMobile = hasPsalms ? (
    <button
      type="button"
      onClick={() => setPickerOpen(true)}
      aria-label="All psalms"
      data-testid="psalm-nav-picker"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'icon-lg' }),
        'md:hidden',
      )}
    >
      <List />
    </button>
  ) : (
    <Link
      href="/psalms"
      aria-label="All psalms"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'icon-lg' }),
        'md:hidden',
      )}
    >
      <List />
    </Link>
  )

  // ----- NEXT -----
  const nextMobile = next ? (
    <Link
      href={hrefFor(next)}
      rel="next"
      aria-label={`Next psalm (Ps ${nextLabel})`}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'icon-lg' }),
        'md:hidden',
      )}
    >
      <ChevronRight />
    </Link>
  ) : (
    <span
      aria-disabled="true"
      aria-label="Next psalm (unavailable)"
      tabIndex={-1}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'icon-lg' }),
        'md:hidden',
        disabledLook,
      )}
    >
      <ChevronRight />
    </span>
  )

  const nextDesktop = next ? (
    <Link
      href={hrefFor(next)}
      rel="next"
      aria-label={`Next psalm (Ps ${nextLabel})`}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'hidden md:inline-flex',
      )}
    >
      <span>Ps {nextLabel}</span>
      <ChevronRight />
    </Link>
  ) : (
    <span
      aria-disabled="true"
      aria-label="Next psalm (unavailable)"
      tabIndex={-1}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'hidden md:inline-flex',
        disabledLook,
      )}
    >
      <span>Ps 150</span>
      <ChevronRight />
    </span>
  )

  return (
    <>
      <nav aria-label="Psalm navigation" className="flex shrink-0 items-center gap-2">
        {prevMobile}
        {prevDesktop}
        {listMobile}
        {nextMobile}
        {nextDesktop}
      </nav>
      {hasPsalms && (
        <PsalmPickerModalClient
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          psalms={psalms!}
          onSelect={(p) => router.push(hrefFor(p.slug))}
        />
      )}
    </>
  )
}
