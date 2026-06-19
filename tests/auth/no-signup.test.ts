import { describe, it, expect } from 'vitest'
import { auth } from '@/lib/auth'

describe('AUTH-02 no self-registration', () => {
  it('has emailAndPassword.disableSignUp enabled in config', () => {
    expect(auth.options.emailAndPassword?.disableSignUp).toBe(true)
  })
  it.todo('POST /api/auth/sign-up/email returns an error/disabled response')
})
