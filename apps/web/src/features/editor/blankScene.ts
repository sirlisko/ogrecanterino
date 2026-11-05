import { type Scene, sceneSections } from '@ogre/shared'

export const UNTITLED = 'Untitled scene'

/** Long enough that no one is still looking at it in another tab. */
const SWEEP_AFTER_MS = 60 * 60_000

export const isBlank = (s: Scene) =>
  s.name === UNTITLED &&
  s.tags.length === 0 &&
  !s.bannerPath &&
  sceneSections.every((section) => s.data[section].length === 0)

/** The GM's own untouched new scenes that were left behind by a closed tab or a crash. */
export function staleBlankScenes(scenes: Scene[], meId: string, now: number): string[] {
  return scenes
    .filter(
      (s) => s.ownerId === meId && isBlank(s) && now - Date.parse(s.updatedAt) > SWEEP_AFTER_MS,
    )
    .map((s) => s.id)
}
