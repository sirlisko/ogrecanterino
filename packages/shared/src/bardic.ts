import { z } from 'zod'
import type { Card, SceneData } from './scene.ts'

const msRange = z.object({ from: z.object({ ms: z.number() }), to: z.object({ ms: z.number() }) })

const bardicCard = z.object({
  id: z.string(),
  name: z.string(),
  sound: z.object({ name: z.string(), datapath: z.string() }),
  playSettings: z.object({
    enabled: z.boolean(),
    volume: z.number(),
    repeat: z
      .object({ times: z.object({ from: z.number(), to: z.number() }), every: msRange })
      .nullable(),
  }),
})
type BardicCard = z.infer<typeof bardicCard>

const bardicSection = z.object({ cards: z.array(bardicCard) }).optional()

const settingValue = z.object({ value: z.boolean() }).optional()

export const bardicSceneData = z.object({
  name: z.string(),
  settings: z.object({
    values: z.object({
      isMusicAPlaylist: settingValue,
      musicCrossfadeEnabled: settingValue,
      startMusicWhenStartingScene: settingValue,
    }),
  }),
  globalVolume: z.number().optional(),
  music: bardicSection,
  ambiences: bardicSection,
  effects: bardicSection,
})

export const bardicExportRow = z.object({
  Name: z.string(),
  Data: z.string(),
  Tags: z
    .array(z.object({ Name: z.string() }))
    .nullable()
    .optional(),
})

export type ResolveSound = (filename: string) => string | null

export interface ConvertedScene {
  name: string
  tags: string[]
  data: SceneData
  missing: string[]
}

const HASH_SUFFIX = /_(?=[a-zA-Z]*\d)[a-zA-Z0-9]{10}$/

/** Bardic filenames end in a random 10-char id (always containing a digit); strip it (and the extension) to match renamed copies. */
export function filenameStem(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '')
  return base.replace(HASH_SUFFIX, '').toLowerCase()
}

export function createResolver(filenames: Iterable<[filename: string, id: string]>): ResolveSound {
  const exact = new Map<string, string>()
  const byStem = new Map<string, string>()
  for (const [filename, id] of filenames) {
    exact.set(filename, id)
    // Re-uploaded files can carry a second id suffix (foo_<id1>_<id2>.ogg), so index every stem level.
    for (
      let stem = filenameStem(filename), prev = '';
      stem !== prev;
      prev = stem, stem = stem.replace(HASH_SUFFIX, '')
    ) {
      if (!byStem.has(stem)) byStem.set(stem, id)
    }
  }
  return (filename) => exact.get(filename) ?? byStem.get(filenameStem(filename)) ?? null
}

function toCard(raw: BardicCard, resolve: ResolveSound, section: string): Card {
  const filename = raw.sound.datapath.split('/').pop() ?? raw.sound.datapath
  const soundId = resolve(filename)
  const repeat = raw.playSettings.repeat
  const base: Card = {
    id: raw.id,
    label: raw.name.trim() || raw.sound.name,
    soundId,
    volume: Math.max(0, Math.min(100, raw.playSettings.volume)),
    enabled: raw.playSettings.enabled,
    mode: section === 'effects' ? 'oneshot' : 'loop',
    ...(soundId ? {} : { missingRef: filename }),
  }
  if (section === 'music' || !repeat || repeat.every.to.ms <= 0) return base
  return {
    ...base,
    mode: 'interval',
    intervalMs: [repeat.every.from.ms, Math.max(repeat.every.from.ms, repeat.every.to.ms)],
    times: [repeat.times.from, Math.max(repeat.times.from, repeat.times.to)],
  }
}

export function convertBardicScene(row: unknown, resolve: ResolveSound): ConvertedScene {
  const parsedRow = bardicExportRow.parse(row)
  const raw = bardicSceneData.parse(JSON.parse(parsedRow.Data))
  const section = (key: 'music' | 'ambiences' | 'effects') =>
    (raw[key]?.cards ?? []).map((c) => toCard(c, resolve, key))
  const v = raw.settings.values
  const data: SceneData = {
    settings: {
      musicIsPlaylist: v.isMusicAPlaylist?.value ?? true,
      musicCrossfade: v.musicCrossfadeEnabled?.value ?? true,
      autoStartMusic: v.startMusicWhenStartingScene?.value ?? true,
      shuffle: false,
    },
    globalVolume: raw.globalVolume ?? 100,
    music: section('music'),
    ambiences: section('ambiences'),
    effects: section('effects'),
  }
  const all = [...data.music, ...data.ambiences, ...data.effects]
  return {
    name: parsedRow.Name.trim(),
    tags: [...new Set((parsedRow.Tags ?? []).map((t) => t.Name))],
    data,
    missing: all.flatMap((c) => (c.missingRef ? [c.missingRef] : [])),
  }
}
