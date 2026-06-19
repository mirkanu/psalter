import { describe, it, expect } from 'vitest'
import { auth } from '@/lib/auth'

describe('AUTH-01 email+password login', () => {
  it('exposes auth.api with session + sign-in methods', () => {
    expect(typeof auth.api.getSession).toBe('function')
    expect(typeof auth.api.signInEmail).toBe('function')
  })
  it.todo('valid credentials return a session')
  it.todo('invalid credentials return an error (no session)')
  it.todo('session cookie persists across requests')
})
