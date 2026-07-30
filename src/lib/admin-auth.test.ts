import { describe, it, expect, vi, beforeEach } from 'vitest'

const getSessionMock = vi.fn()

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

import { getAdminSessionOr401 } from './admin-auth'

describe('getAdminSessionOr401', () => {
  beforeEach(() => {
    getSessionMock.mockReset()
  })

  it('returns 401 when there is no session', async () => {
    getSessionMock.mockResolvedValue(null)

    const result = await getAdminSessionOr401()

    expect(result.session).toBeNull()
    expect(result.res).not.toBeNull()
    expect(result.res!.status).toBe(401)
    const body = await result.res!.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })

  it('returns 403 when the session belongs to a plain user', async () => {
    getSessionMock.mockResolvedValue({ user: { id: 'u1', role: 'user' } })

    const result = await getAdminSessionOr401()

    expect(result.session).toBeNull()
    expect(result.res).not.toBeNull()
    expect(result.res!.status).toBe(403)
    const body = await result.res!.json()
    expect(body).toEqual({ error: 'Forbidden' })
  })

  it('returns 403 when the session belongs to a precentor (not admin)', async () => {
    getSessionMock.mockResolvedValue({ user: { id: 'u2', role: 'precentor' } })

    const result = await getAdminSessionOr401()

    expect(result.session).toBeNull()
    expect(result.res).not.toBeNull()
    expect(result.res!.status).toBe(403)
    const body = await result.res!.json()
    expect(body).toEqual({ error: 'Forbidden' })
  })

  it('returns the session when the caller is an admin', async () => {
    getSessionMock.mockResolvedValue({ user: { id: 'u3', role: 'admin' } })

    const result = await getAdminSessionOr401()

    expect(result.res).toBeNull()
    expect(result.session).toEqual({ user: { id: 'u3', role: 'admin' } })
  })
})
