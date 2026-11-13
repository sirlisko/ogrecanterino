import { describe, expect, it } from 'vitest'
import { partial, rangeBounds } from './range.ts'

const file = () =>
  new Response(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), {
    headers: { 'content-type': 'audio/mpeg' },
  })

const bytes = async (res: Response) => [...new Uint8Array(await res.arrayBuffer())]

describe('rangeBounds', () => {
  it('reads open, closed and suffix ranges', () => {
    expect(rangeBounds('bytes=0-', 10)).toEqual({ start: 0, end: 9 })
    expect(rangeBounds('bytes=2-5', 10)).toEqual({ start: 2, end: 5 })
    expect(rangeBounds('bytes=-3', 10)).toEqual({ start: 7, end: 9 })
  })

  it('clamps an end past the file', () => {
    expect(rangeBounds('bytes=4-99', 10)).toEqual({ start: 4, end: 9 })
    expect(rangeBounds('bytes=-99', 10)).toEqual({ start: 0, end: 9 })
  })

  it('refuses a start past the file', () => {
    expect(rangeBounds('bytes=10-', 10)).toBe('unsatisfiable')
    expect(rangeBounds('bytes=6-2', 10)).toBe('unsatisfiable')
    expect(rangeBounds('bytes=-0', 10)).toBe('unsatisfiable')
  })

  it('leaves multiple or malformed ranges alone', () => {
    expect(rangeBounds('bytes=0-1,4-5', 10)).toBeNull()
    expect(rangeBounds('items=0-1', 10)).toBeNull()
    expect(rangeBounds('bytes=-', 10)).toBeNull()
  })
})

describe('partial', () => {
  it('returns the cached file as is without a range', async () => {
    const full = file()
    expect(await partial(full, null)).toBe(full)
  })

  it('answers a range with the slice and its position', async () => {
    const res = await partial(file(), 'bytes=2-5')
    expect(res.status).toBe(206)
    expect(res.headers.get('content-range')).toBe('bytes 2-5/10')
    expect(res.headers.get('content-length')).toBe('4')
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
    expect(await bytes(res)).toEqual([2, 3, 4, 5])
  })

  it('answers the opening range a media element sends with the whole file as a 206', async () => {
    const res = await partial(file(), 'bytes=0-')
    expect(res.status).toBe(206)
    expect(await bytes(res)).toHaveLength(10)
  })

  it('says 416 for a range past the end', async () => {
    const res = await partial(file(), 'bytes=20-')
    expect(res.status).toBe(416)
    expect(res.headers.get('content-range')).toBe('bytes */10')
  })

  it('falls back to the whole file for ranges it does not handle', async () => {
    const res = await partial(file(), 'bytes=0-1,4-5')
    expect(res.status).toBe(200)
    expect(await bytes(res)).toHaveLength(10)
  })
})
