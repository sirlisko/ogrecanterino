function parse(saved: string | null): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(saved ?? '{}')
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** `defaults` with the saved choices on top; a missing or mistyped choice keeps its default. */
export function withSaved<T extends object>(defaults: T, saved: string | null): T {
  const choices = parse(saved)
  const out = { ...defaults }
  for (const key of Object.keys(defaults) as (keyof T & string)[])
    if (typeof choices[key] === typeof defaults[key]) out[key] = choices[key] as T[typeof key]
  return out
}

/**
 * Adds `patch` to the saved choices. Only what the GM changed is saved, so a setting they never
 * touched follows its default, even when that default changes later.
 */
export function withChoice(saved: string | null, patch: object): string {
  return JSON.stringify({ ...parse(saved), ...patch })
}
