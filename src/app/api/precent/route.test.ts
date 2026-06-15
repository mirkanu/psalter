// Wave 0 stub (RED) — turned GREEN in plan 02
import { describe, it, expect } from 'vitest'
import { POST } from './route'

function req(body: unknown) {
  return new Request('http://test/api/precent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/precent', () => {
  it('rejects missing date with 400', async () => {
    const res = await POST(req({ type: 'AM Service' }) as any)
    expect(res.status).toBe(400)
  })
  it('rejects invalid type with 400', async () => {
    const res = await POST(req({ date: '2026-06-21', type: 'Evening' }) as any)
    expect(res.status).toBe(400)
  })
  it('accepts a valid set and returns an id', async () => {
    const res = await POST(req({ date: '2026-06-21', type: 'AM Service' }) as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(typeof json.id).toBe('number')
  })
})
