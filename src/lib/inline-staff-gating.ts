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
