import type { z } from 'zod'
import { httpError } from './auth.ts'

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body)
  if (!result.success)
    throw httpError(
      400,
      result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    )
  return result.data
}
