import { describe, it, expect } from 'vitest'
import {
  resolveStaffInlineApproved,
  computeInlineLayoutDisabled,
  shouldFallbackToSplit,
} from './inline-staff-gating'

describe('resolveStaffInlineApproved — MOBILE-08 explicit-approval gate', () => {
  it("returns true for 'approved'", () => {
    expect(resolveStaffInlineApproved('approved')).toBe(true)
  })

  it("returns false for 'not_approved'", () => {
    expect(resolveStaffInlineApproved('not_approved')).toBe(false)
  })

  it('returns false for null', () => {
    expect(resolveStaffInlineApproved(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(resolveStaffInlineApproved(undefined)).toBe(false)
  })

  it("returns false for any other string (e.g. 'anything-else')", () => {
    expect(resolveStaffInlineApproved('anything-else')).toBe(false)
  })
})

describe('computeInlineLayoutDisabled', () => {
  it('Staff branch: disabled when not approved (solfège flag irrelevant)', () => {
    expect(
      computeInlineLayoutDisabled({ isStaff: true, staffInlineApproved: false, solfegeInlineAvailable: false })
    ).toBe(true)
  })

  it('Staff branch: enabled when approved', () => {
    expect(
      computeInlineLayoutDisabled({ isStaff: true, staffInlineApproved: true, solfegeInlineAvailable: false })
    ).toBe(false)
  })

  it('Solfège branch unchanged: disabled when solfegeInlineAvailable is false', () => {
    expect(
      computeInlineLayoutDisabled({ isStaff: false, staffInlineApproved: true, solfegeInlineAvailable: false })
    ).toBe(true)
  })

  it('Solfège branch unchanged: enabled when solfegeInlineAvailable is true', () => {
    expect(
      computeInlineLayoutDisabled({ isStaff: false, staffInlineApproved: false, solfegeInlineAvailable: true })
    ).toBe(false)
  })
})

describe('shouldFallbackToSplit', () => {
  it('true when in inline staff on a non-approved tune', () => {
    expect(shouldFallbackToSplit({ viewMode: 'staff', staffInlineApproved: false })).toBe(true)
  })

  it('false when in inline staff on an approved tune', () => {
    expect(shouldFallbackToSplit({ viewMode: 'staff', staffInlineApproved: true })).toBe(false)
  })

  it('false when already in staff-split (no fallback/toast needed)', () => {
    expect(shouldFallbackToSplit({ viewMode: 'staff-split', staffInlineApproved: false })).toBe(false)
  })

  it('false when in solfege view (not the Staff branch)', () => {
    expect(shouldFallbackToSplit({ viewMode: 'solfege', staffInlineApproved: false })).toBe(false)
  })
})
