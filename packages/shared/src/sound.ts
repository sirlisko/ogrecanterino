import { z } from 'zod'

export const soundCategory = z.enum(['music', 'ambience', 'effect'])
export type SoundCategory = z.infer<typeof soundCategory>

export const sound = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  tags: z.array(z.string()),
  filename: z.string(),
  mime: z.string(),
  size: z.number().int(),
  durationMs: z.number().int().nullable(),
  gainDb: z.number().nullable(),
  category: soundCategory,
  uploadedBy: z.string().nullable(),
})
export type Sound = z.infer<typeof sound>

const soundFields = {
  title: z.string().trim().min(1).max(200),
  artist: z.string().trim().max(200),
  tags: z.array(z.string().trim().min(1)).max(20),
  category: soundCategory,
}

export const soundUpload = z.object({
  ...soundFields,
  artist: soundFields.artist.default(''),
  tags: soundFields.tags.default([]),
})
export type SoundUpload = z.infer<typeof soundUpload>

/** Built without `soundUpload`'s defaults: zod applies them to absent optional keys, wiping fields. */
export const soundPatch = z.object(soundFields).partial()

export interface SoundUsage {
  /** Names of scenes the caller can see that use the sound. */
  scenes: string[]
  /** Other GMs' private scenes that use it, counted but not named. */
  privateCount: number
}

export function categoryFromTags(tags: readonly string[]): SoundCategory {
  if (tags.includes('Music')) return 'music'
  if (tags.includes('Ambience')) return 'ambience'
  return 'effect'
}
