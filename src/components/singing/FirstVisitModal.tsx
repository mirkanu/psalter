'use client'

/**
 * FirstVisitModal (Phase 20-01, items 4 + 5)
 *
 * First-visit view-selector modal at `/psalms/[id]` ONLY (NOT `/psalms`
 * index, NOT `/psalms/[id]/study`). Three view-mode radios (Music Notes /
 * Lyrics Only / Legacy) with a "Save" Accept button.
 *
 * Behaviour (D-17..D-24):
 *   - Opens automatically when `psalter.firstVisitModalAccepted !== 'true'`
 *   - Initial state has NO radio selected (D-21)
 *   - Selecting a radio updates transient state only (D-20)
 *   - "Save" persists `psalter.viewMode` AND `psalter.firstVisitModalAccepted`
 *   - X / Escape / browser back does NOT persist; modal re-opens next visit
 *
 * The component supports two modes:
 *   1. Self-managed (default) — reads/writes localStorage directly. Used by
 *      `psalms/[id]/page.tsx` so the modal works with zero wiring.
 *   2. Controlled (props provided) — parent owns state. Used by unit tests
 *      and any future call site that wants to embed the modal inline.
 */
import { useEffect, useState } from 'react'
import { Music2, FileText, Library, type LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ViewMode } from '@/components/notation/NotationRenderer'

// Phase 20 CR-01 fix: align with SingingView.STORAGE_MODE_KEY so the modal's
// Save action actually controls /psalms/[id] view selection. The previous
// 'psalter.viewMode' key was never read by any consumer, so first-time
// visitors' view picks were silently dropped after Save+reload.
const STORAGE_VIEW_MODE_KEY = 'psalter-score-mode'
const STORAGE_FIRST_VISIT_KEY = 'psalter.firstVisitModalAccepted'

type ViewModeOption = {
  value: ViewMode
  label: string
  description: string
  icon: LucideIcon
}

// D-19: exactly three options; mirrors the gear popover's "Music Notes /
// Lyrics Only / Legacy" radio set. Study and Restart-tour are excluded.
// `staff-split` is the canonical "Music Notes" mode today (existing gear
// popover maps the Music Notes toggle to staff-split).
const VIEW_MODES: readonly ViewModeOption[] = [
  {
    value: 'staff-split',
    label: 'Music Notes',
    description: 'Show the tune with notes and lyrics below',
    icon: Music2,
  },
  {
    value: 'lyrics',
    label: 'Lyrics Only',
    description: 'Just the words — no notation',
    icon: FileText,
  },
  {
    value: 'legacy',
    label: 'Legacy',
    description: 'SoundCloud + piano player at the top, lyrics below',
    icon: Library,
  },
] as const

export interface FirstVisitModalProps {
  /** Transient view-mode selection in the modal. Null = nothing picked yet (D-21). */
  viewMode?: ViewMode | null
  /** Called when a radio is selected. Transient only; does NOT persist (D-20). */
  onViewModeChange?: (m: ViewMode) => void
  /** Controls open state externally. If undefined, modal self-manages via localStorage (D-24). */
  open?: boolean
  /** Called on Save. Parent owns persistence; if not provided, modal persists + reloads (D-23). */
  onAccept?: (m: ViewMode) => void
}

export function FirstVisitModal({
  viewMode: controlledViewMode,
  onViewModeChange: controlledChange,
  open: controlledOpen,
  onAccept: controlledAccept,
}: FirstVisitModalProps = {}) {
  const isControlled = controlledOpen !== undefined
  const [internalViewMode, setInternalViewMode] = useState<ViewMode | null>(null)
  const [internalOpen, setInternalOpen] = useState(false)

  // Self-managed open state: open when `firstVisitModalAccepted !== 'true'`.
  // `internalOpen` defaults to false (closed) to avoid flashing open on
  // returning visitors during hydration; the effect flips it after mount.
  useEffect(() => {
    if (isControlled) return
    try {
      const accepted = localStorage.getItem(STORAGE_FIRST_VISIT_KEY) === 'true'
      setInternalOpen(!accepted)
    } catch {
      setInternalOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // D-35: defense-in-depth body scroll lock while modal is open. The base-ui
  // Dialog primitive handles focus trap + scrim, but body scroll lock depends
  // on the portal's data-state behavior — belt-and-braces in case the portal
  // doesn't lock body scroll on this base-ui version.
  const open = isControlled ? controlledOpen : internalOpen
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const viewMode = isControlled ? controlledViewMode ?? null : internalViewMode
  const onViewModeChange = controlledChange ?? setInternalViewMode
  const onAccept = controlledAccept ?? ((m: ViewMode) => {
    try {
      localStorage.setItem(STORAGE_VIEW_MODE_KEY, m)
      localStorage.setItem(STORAGE_FIRST_VISIT_KEY, 'true')
    } catch {
      /* ignore */
    }
    // Hard reload so SingingView re-hydrates with the persisted viewMode.
    // Simpler than threading the new viewMode through the psalm-detail
    // server-rendered bundle, and the modal is a one-shot experience.
    if (typeof window !== 'undefined') window.location.reload()
  })

  // D-22: dismissing via X/Escape/back does NOT persist. Suppress
  // onOpenChange(false) so the parent doesn't accidentally treat dismiss
  // as Accept.
  const handleOpenChange = (v: boolean) => {
    if (!v && !isControlled) {
      // Keep modal open on next visit by leaving firstVisitAccepted alone.
      // Re-read localStorage in case it changed in another tab.
      setInternalOpen(false)
      // Re-open on next mount via the hydrate effect — close for now.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-first-visit-modal=""
        className="sm:max-w-md p-6"
        // Per D-22: suppress default X close behaviour from re-opening
        // next visit. We handle close explicitly via the onOpenChange above.
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Choose a view</DialogTitle>
        </DialogHeader>
        <div role="radiogroup" aria-label="View type" className="grid gap-2 mt-2">
          {VIEW_MODES.map((m) => {
            const active = viewMode === m.value
            const Icon = m.icon
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onViewModeChange(m.value)}
                data-view-option={m.value}
                className={[
                  'h-11 inline-flex items-center gap-2 px-3 rounded-md text-sm font-semibold text-left',
                  'active:scale-[0.95] transition-[transform,background,color] duration-75 motion-reduce:transition-none',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="flex-1">{m.label}</span>
                <span
                  className={[
                    'text-xs font-normal',
                    active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {m.description}
                </span>
              </button>
            )
          })}
        </div>
        <Button
          type="button"
          disabled={!viewMode}
          onClick={() => viewMode && onAccept(viewMode)}
          className="w-full h-11 mt-4 bg-primary text-primary-foreground"
          data-first-visit-save=""
        >
          Save
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default FirstVisitModal