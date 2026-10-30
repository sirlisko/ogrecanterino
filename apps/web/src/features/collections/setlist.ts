import type { Collection, Scene } from '@ogre/shared'

/** The scene `offset` steps away from `currentId` in the collection, among scenes the GM can see. */
export function adjacentScene(
  collection: Collection | undefined,
  scenes: Scene[],
  currentId: string | null,
  offset: 1 | -1,
): Scene | null {
  if (!collection) return null
  const byId = new Map(scenes.map((s) => [s.id, s]))
  const order = collection.sceneIds.flatMap((id) => byId.get(id) ?? [])
  if (!order.length) return null
  const i = order.findIndex((s) => s.id === currentId)
  if (i < 0) return offset === 1 ? (order[0] ?? null) : null
  return order[i + offset] ?? null
}

export function combatSceneIdFor(scene: Scene, collection: Collection | undefined) {
  if (scene.combatSceneId) return scene.combatSceneId
  return collection?.sceneIds.includes(scene.id) ? collection.combatSceneId : null
}
