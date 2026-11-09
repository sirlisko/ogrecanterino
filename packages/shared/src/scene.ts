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
  /** Effects only: lower the music while this one plays. */
  duckMusic: z.boolean().optional(),
})
export type Card = z.infer<typeof card>

export const sceneSettings = z.object({
  musicIsPlaylist: z.boolean().default(true),
  musicCrossfade: z.boolean().default(true),
  autoStartMusic: z.boolean().default(true),
  shuffle: z.boolean().default(false),
})
export type SceneSettings = z.infer<typeof sceneSettings>

/** The drawn illustrations a scene can use when it has no uploaded picture. */
export const sceneArtKinds = [
  'town',
  'night',
  'forest',
  'horror',
  'camp',
  'mountain',
  'desert',
  'sea',
  'storm',
  'dungeon',
  'crypt',
  'caverns',
  'castle',
  'temple',
  'tower',
  'battle',
] as const
export const sceneArt = z.enum(sceneArtKinds)
export type SceneArt = z.infer<typeof sceneArt>

export const sceneData = z.object({
  settings: sceneSettings,
  globalVolume: z.number().min(0).max(100).default(100),
  /** A chosen illustration. Absent: one is picked from the tags. An uploaded banner wins over both. */
  art: sceneArt.optional(),
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

/** `expectedUpdatedAt`: refuse the save if the scene has changed since that version was read. */
export const sceneUpdate = sceneInput.extend({ expectedUpdatedAt: z.string().optional() })
export type SceneUpdate = z.input<typeof sceneUpdate>

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
