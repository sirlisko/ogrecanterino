import { z } from 'zod'

const range = z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()])

export const cardMode = z.enum(['loop', 'interval', 'oneshot'])
export type CardMode = z.infer<typeof cardMode>

export const card = z.object({
  id: z.string(),
  label: z.string(),
  soundId: z.string().nullable(),
  missingRef: z.string().optional(),
  volume: z.number().min(0).max(100),
  enabled: z.boolean(),
  mode: cardMode,
  intervalMs: range.optional(),
  times: range.optional(),
})
export type Card = z.infer<typeof card>

export const sceneSettings = z.object({
  musicIsPlaylist: z.boolean().default(true),
  musicCrossfade: z.boolean().default(true),
  autoStartMusic: z.boolean().default(true),
  shuffle: z.boolean().default(false),
})
export type SceneSettings = z.infer<typeof sceneSettings>

export const sceneData = z.object({
  settings: sceneSettings,
  globalVolume: z.number().min(0).max(100).default(100),
  music: z.array(card),
  ambiences: z.array(card),
  effects: z.array(card),
})
export type SceneData = z.infer<typeof sceneData>

export const sceneSections = ['music', 'ambiences', 'effects'] as const
export type SceneSection = (typeof sceneSections)[number]

export const visibility = z.enum(['private', 'group'])

export const sceneInput = z.object({
  name: z.string().trim().min(1).max(120),
  tags: z.array(z.string()).max(20).default([]),
  visibility: visibility.default('private'),
  combatSceneId: z.string().nullable().default(null),
  data: sceneData,
})
export type SceneInput = z.infer<typeof sceneInput>

export const scene = sceneInput.extend({
  id: z.string(),
  ownerId: z.string(),
  ownerName: z.string(),
  bannerPath: z.string().nullable(),
  updatedAt: z.string(),
})
export type Scene = z.infer<typeof scene>

export function emptySceneData(): SceneData {
  return sceneData.parse({ settings: {}, music: [], ambiences: [], effects: [] })
}
