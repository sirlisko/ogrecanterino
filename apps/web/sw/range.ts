type Bounds = { start: number; end: number }

/** The bytes a single-range `Range` header asks for, or null for one we don't handle. */
export function rangeBounds(header: string, size: number): Bounds | 'unsatisfiable' | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return null
  const [, from = '', to = ''] = match
  if (from === '' && to === '') return null
  if (from === '') {
    const suffix = Number(to)
    return suffix === 0 ? 'unsatisfiable' : { start: Math.max(0, size - suffix), end: size - 1 }
  }
  const start = Number(from)
  const end = to === '' ? size - 1 : Math.min(Number(to), size - 1)
  return start >= size || start > end ? 'unsatisfiable' : { start, end }
}

/**
 * Answers a media element's Range request from a whole cached file. Safari won't play audio
 * whose range request gets the full file back, so this always slices.
 */
export async function partial(full: Response, header: string | null): Promise<Response> {
  if (!header) return full
  const blob = await full.blob()
  const type = full.headers.get('content-type') ?? blob.type
  const bounds = rangeBounds(header, blob.size)
  if (bounds === null)
    return new Response(blob, { headers: { 'content-type': type, 'accept-ranges': 'bytes' } })
  if (bounds === 'unsatisfiable')
    return new Response(null, { status: 416, headers: { 'content-range': `bytes */${blob.size}` } })
  const { start, end } = bounds
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'content-type': type,
      'content-length': String(end - start + 1),
      'content-range': `bytes ${start}-${end}/${blob.size}`,
      'accept-ranges': 'bytes',
    },
  })
}
