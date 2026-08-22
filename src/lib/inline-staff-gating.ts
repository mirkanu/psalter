export type MelismaStatus = 'approved' | 'not_approved'

/** EXPLICIT approval only: null / 'not_approved' / anything else → false (MOBILE-08). */
export function resolveStaffInlineApproved(status: string | null | undefined): boolean {
  return status === 'approved'
}

/** Mirrors GearPopover's existing inlineLayoutDisabled, extended for the Staff branch. */
export function computeInlineLayoutDisabled(opts: {
  isStaff: boolean
  staffInlineApproved: boolean
  solfegeInlineAvailable: boolean
}): boolean {
  return opts.isStaff ? !opts.staffInlineApproved : !opts.solfegeInlineAvailable
}

/** True only when currently in INLINE staff on a non-approved tune (→ fall back to split-leaf + toast). */
export function shouldFallbackToSplit(opts: {
  viewMode: string
  staffInlineApproved: boolean
}): boolean {
  return opts.viewMode === 'staff' && !opts.staffInlineApproved
}

/**
 * Quick 260822-fgb: should /tunes/[slug] show the voluntary "Digital / Original scan"
 * toggle? True only when live abcjs is what's actually rendering AND a staff scan exists.
 *
 * Mirrors the negation of NotationRenderer's `forceStaffJpgFallback` (line ~1489):
 *   forceStaffJpgFallback = (isSplit && !staffInlineApproved) || (tunePageMode && !abc.trim())
 * There is deliberately NO Split-Leaf requirement here (unlike GearPopover's
 * showScoreSourceRow): the tune page has no Inline-vs-Split-Leaf layout control, and its
 * staff-split state only ever occurs when there is no abc at all — i.e. exactly the
 * already-forced case this helper excludes. Requiring isSplit would make the toggle dead UI.
 */
export function computeScanToggleVisible(opts: {
  tunePageMode: boolean
  viewMode: string
  hasAbc: boolean
  staffScanUrl: string | null
  staffInlineApproved: boolean
}): boolean {
  if (!opts.tunePageMode) return false
  const isStaff = opts.viewMode === 'staff' || opts.viewMode === 'staff-split'
  if (!isStaff) return false
  if (!opts.staffScanUrl) return false
  const isSplit = opts.viewMode === 'staff-split' || opts.viewMode === 'solfege-split'
  const scanAlreadyForced = (isSplit && !opts.staffInlineApproved) || !opts.hasAbc
  return !scanAlreadyForced
}
