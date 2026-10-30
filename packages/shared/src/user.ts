import { z } from 'zod'

export const role = z.enum(['admin', 'gm'])

export const me = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  role,
})
export type Me = z.infer<typeof me>

export const pad = z.object({
  slot: z.number().int().min(1).max(9),
  soundId: z.string(),
  label: z.string(),
})
export type Pad = z.infer<typeof pad>
