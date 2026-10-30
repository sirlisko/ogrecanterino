export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData
  const res = await fetch(path, {
    ...init,
    headers:
      init.body && !isForm ? { 'content-type': 'application/json', ...init.headers } : init.headers,
  })
  if (res.status === 204) return undefined as T
  const body = res.headers.get('content-type')?.includes('json')
    ? await res.json()
    : await res.text()
  if (!res.ok) {
    const fields =
      typeof body === 'object' && body ? (body as { message?: string; error?: string }) : {}
    throw new ApiError(res.status, fields.message ?? fields.error ?? res.statusText)
  }
  return body as T
}

export const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})
