import type { Collection, Pad, Scene, Sound } from '@ogre/shared'
import { soundUrl } from '../../audio/sources.ts'
import { bannerUrl } from '../scenes/art/bannerUrl.ts'

/** Collection id → the files it needs on this device. */
export type OfflinePlan = Map<string, string[]>

/** The scenes a collection can reach: its own, plus the combat scenes their Combat button plays. */
export function collectionScenes(collection: Collection, scenes: Scene[]): Scene[] {
  const byId = new Map(scenes.map((s) => [s.id, s]))
  const ids = new Set(collection.sceneIds)
  if (collection.combatSceneId) ids.add(collection.combatSceneId)
  for (const id of collection.sceneIds) {
    const combat = byId.get(id)?.combatSceneId
    if (combat) ids.add(combat)
  }
  return [...ids].flatMap((id) => byId.get(id) ?? [])
}

/** Disabled cards too: the GM can switch them on mid-session. */
export function sceneFiles(scenes: Scene[], sounds: Sound[], extraSoundIds: string[] = []) {
  const byId = new Map(sounds.map((s) => [s.id, s]))
  const files = new Set<string>()
  const add = (soundId: string | null) => {
    const sound = soundId ? byId.get(soundId) : undefined
    if (sound) files.add(soundUrl(sound))
  }
  for (const { data, bannerPath } of scenes) {
    for (const card of [...data.music, ...data.ambiences, ...data.effects]) add(card.soundId)
    if (bannerPath) files.add(bannerUrl(bannerPath))
  }
  extraSoundIds.forEach(add)
  return [...files]
}

/** Quick pads go with every collection, since table mode shows them whatever is playing. */
export function offlinePlan(
  collections: Collection[],
  scenes: Scene[],
  sounds: Sound[],
  pads: Pad[],
): OfflinePlan {
  const padSounds = pads.map((p) => p.soundId)
  return new Map(
    collections.map((c) => [c.id, sceneFiles(collectionScenes(c, scenes), sounds, padSounds)]),
  )
}
