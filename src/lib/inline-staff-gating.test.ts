import { describe, it, expect } from 'vitest'
import {
  resolveStaffInlineApproved,
  computeInlineLayoutDisabled,
  shouldFallbackToSplit,
  computeScanToggleVisible,
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

describe('computeScanToggleVisible (quick 260822-fgb)', () => {
  it('true when tune page, staff, live abc, scan exists, approved', () => {
    expect(
      computeScanToggleVisible({
        tunePageMode: true,
        viewMode: 'staff',
        hasAbc: true,
        staffScanUrl: '/tunes/bangor-staff-0.jpg',
        staffInlineApproved: true,
      })
    ).toBe(true)
  })

  it('false when no scan url', () => {
    expect(
      computeScanToggleVisible({
        tunePageMode: true,
        viewMode: 'staff',
        hasAbc: true,
        staffScanUrl: null,
        staffInlineApproved: true,
      })
    ).toBe(false)
  })

  it('false when no abc (scan already force-shown via tunePageMode && !abc)', () => {
    expect(
      computeScanToggleVisible({
        tunePageMode: true,
        viewMode: 'staff',
        hasAbc: false,
        staffScanUrl: '/tunes/bangor-staff-0.jpg',
        staffInlineApproved: true,
      })
    ).toBe(false)
  })

  it('false for staff-split with no abc', () => {
    expect(
      computeScanToggleVisible({
        tunePageMode: true,
        viewMode: 'staff-split',
        hasAbc: false,
        staffScanUrl: '/tunes/bangor-staff-0.jpg',
        staffInlineApproved: true,
      })
    ).toBe(false)
  })

  it('false for solfege-split (the scan IS the render)', () => {
    expect(
      computeScanToggleVisible({
        tunePageMode: true,
        viewMode: 'solfege-split',
        hasAbc: true,
        staffScanUrl: '/tunes/bangor-staff-0.jpg',
        staffInlineApproved: true,
      })
    ).toBe(false)
  })

  it('false for lyrics view', () => {
    expect(
      computeScanToggleVisible({
        tunePageMode: true,
        viewMode: 'lyrics',
        hasAbc: true,
        staffScanUrl: '/tunes/bangor-staff-0.jpg',
        staffInlineApproved: true,
      })
    ).toBe(false)
  })

  it('false when not tune page mode (GearPopover owns that surface)', () => {
    expect(
      computeScanToggleVisible({
        tunePageMode: false,
        viewMode: 'staff',
        hasAbc: true,
        staffScanUrl: '/tunes/bangor-staff-0.jpg',
        staffInlineApproved: true,
      })
    ).toBe(false)
  })

  it('false for staff-split with abc present but not approved', () => {
    expect(
      computeScanToggleVisible({
        tunePageMode: true,
        viewMode: 'staff-split',
        hasAbc: true,
        staffScanUrl: '/tunes/bangor-staff-0.jpg',
        staffInlineApproved: false,
      })
    ).toBe(false)
  })
})
