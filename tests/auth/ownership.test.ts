import { describe, it, expect } from 'vitest'
import { canAccessSet } from '@/lib/precent-auth'

describe('D-22 ownership guard predicate', () => {
  it('owner can mutate', () => {
    expect(canAccessSet({ userId: 'u1' }, { user: { id: 'u1', role: 'precentor' } })).toBe(true)
  })
  it('admin can mutate any set', () => {
    expect(canAccessSet({ userId: 'u1' }, { user: { id: 'u2', role: 'admin' } })).toBe(true)
  })
  it('non-owner precentor cannot mutate', () => {
    expect(canAccessSet({ userId: 'u1' }, { user: { id: 'u2', role: 'precentor' } })).toBe(false)
  })
  it('foreign precentor cannot mutate — 403 condition', () => {
    expect(canAccessSet({ userId: 'owner-id' }, { user: { id: 'other-id', role: 'precentor' } })).toBe(false)
  })
  it('visitor role cannot mutate — 403 condition (extensibility check)', () => {
    expect(canAccessSet({ userId: 'u1' }, { user: { id: 'u2', role: 'visitor' } })).toBe(false)
  })
})
