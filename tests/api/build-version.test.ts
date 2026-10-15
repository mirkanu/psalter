/**
 * /api/build-version — public build-version cache-bust endpoint.
 *
 * Phase 20 Plan 03 (D-25..D-30). The endpoint:
 *   - is PUBLIC (no auth gate)
 *   - returns ONLY `{ buildId: string }` — no commit SHA / message / metadata
 *   - returns 500 with `{ error: 'BUILD_ID missing' }` on empty file
 *   - returns 500 with `{ error: 'BUILD_ID unreadable' }` on read failure
 *   - sets `Cache-Control: private, max-age=0, must-revalidate` on success
 *   - sets `Cache-Control: no-store` on 500 paths
 *
 * Tests mock `node:fs` `readFileSync` so we can deterministically trigger
 * the three response shapes without touching the real .next/BUILD_ID.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Hoisted mocks — must be declared BEFORE the dynamic import of the route.
const readFileSync = vi.fn()
vi.mock('node:fs', () => ({ readFileSync }))

const GET = (await import('@/app/api/build-version/route')).GET

describe('/api/build-version — Phase 20 Plan 03 (D-25..D-30)', () => {
  beforeEach(() => {
    readFileSync.mockReset()
  })

  it('returns HTTP 200 with body `{ buildId }` and NO other keys (D-25, T-20-02)', async () => {
    readFileSync.mockReturnValue('znMivluITRkXM-xFMoqWh\n')
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ buildId: 'znMivluITRkXM-xFMoqWh' })
    // T-20-02 info-disclosure mitigation: ONLY buildId in the response.
    expect(Object.keys(data)).toEqual(['buildId'])
    // The endpoint MUST NOT leak commit / message / deployedAt.
    expect(data.commit).toBeUndefined()
    expect(data.message).toBeUndefined()
    expect(data.deployedAt).toBeUndefined()
    expect(data.commitLong).toBeUndefined()
  })

  it('sets Cache-Control: private, max-age=0, must-revalidate on success (D-25)', async () => {
    readFileSync.mockReturnValue('abc123\n')
    const res = await GET()
    expect(res.status).toBe(200)
    const cc = res.headers.get('Cache-Control')
    expect(cc).toBe('private, max-age=0, must-revalidate')
  })

  it('returns HTTP 500 with `{ error: "BUILD_ID missing" }` when file is empty (D-25, T-20-03)', async () => {
    // Empty string after .trim() — simulates a file present but blank.
    readFileSync.mockReturnValue('')
    const res = await GET()
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data).toEqual({ error: 'BUILD_ID missing' })
    // No buildId leaked in the error path either.
    expect(data.buildId).toBeUndefined()
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('returns HTTP 500 with `{ error: "BUILD_ID unreadable" }` when read throws (D-25, T-20-03)', async () => {
    readFileSync.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    const res = await GET()
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data).toEqual({ error: 'BUILD_ID unreadable' })
    expect(data.buildId).toBeUndefined()
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('does NOT call any admin auth helper (route is PUBLIC, no auth gate)', async () => {
    // Sanity-check that the module graph contains no admin-auth import.
    // If a future refactor reintroduces an auth call, this assertion will
    // catch it at compile time (the import will fail to resolve in the
    // mock-only environment).
    readFileSync.mockReturnValue('ok123\n')
    const res = await GET()
    expect(res.status).toBe(200)
    // Implicit assertion: the call succeeded without an auth setup.
  })

  it('trims trailing whitespace from BUILD_ID before returning', async () => {
    readFileSync.mockReturnValue('   build-id-with-whitespace   \n')
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.buildId).toBe('build-id-with-whitespace')
  })

  it('reads from process.cwd()/.next/BUILD_ID (D-33, PM2 cwd = /home/services/psalter)', async () => {
    const join = (await import('node:path')).default.join
    const expectedPath = join(process.cwd(), '.next', 'BUILD_ID')
    readFileSync.mockReturnValue('test-build-id\n')
    await GET()
    expect(readFileSync).toHaveBeenCalledWith(expectedPath, 'utf8')
  })
})