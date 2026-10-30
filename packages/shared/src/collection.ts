import { z } from 'zod'
import { visibility } from './scene.ts'

export const collectionInput = z.object({
  name: z.string().trim().min(1).max(120),
  visibility: visibility.default('private'),
  /** Played by the Combat button for scenes that don't name their own. */
  combatSceneId: z.string().nullable().default(null),
  /** In play order. */
  sceneIds: z.array(z.string()).max(200).default([]),
})
export type CollectionInput = z.infer<typeof collectionInput>

export const collection = collectionInput.extend({
  id: z.string(),
  ownerId: z.string(),
  ownerName: z.string(),
})
export type Collection = z.infer<typeof collection>
