import { describe, it, expect } from 'vitest'

// Guard predicate mirrors src/app/api/precent guards (Plan 03 wires routes).
function canMutate(set: { userId: string }, session: { user: { id: string; role: string } }) {
  return set.userId === session.user.id || session.user.role === 'admin'
}

describe('D-22 ownership guard predicate', () => {
  it('owner can mutate', () => {
    expect(canMutate({ userId: 'u1' }, { user: { id: 'u1', role: 'precentor' } })).toBe(true)
  })
  it('admin can mutate any set', () => {
    expect(canMutate({ userId: 'u1' }, { user: { id: 'u2', role: 'admin' } })).toBe(true)
  })
  it('non-owner precentor cannot mutate', () => {
    expect(canMutate({ userId: 'u1' }, { user: { id: 'u2', role: 'precentor' } })).toBe(false)
  })
  it.todo('PATCH /api/precent/[id] by non-owner returns 403')
  it.todo('DELETE /api/precent/[id] by non-owner returns 403')
})
