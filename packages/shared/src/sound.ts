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

export const soundUpload = z.object({
  title: z.string().trim().min(1).max(200),
  artist: z.string().trim().max(200).default(''),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  category: soundCategory,
})
export type SoundUpload = z.infer<typeof soundUpload>

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
