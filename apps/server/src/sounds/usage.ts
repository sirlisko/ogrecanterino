import { sceneSections, type SceneData, type SoundUsage } from '@ogre/shared'
import { asc } from 'drizzle-orm'
import type { User } from '../auth/session.ts'
import type { Db } from '../db/client.ts'
import { scenes } from '../db/schema.ts'

const usesSound = (data: SceneData, soundId: string) =>
  sceneSections.some((section) => data[section].some((card) => card.soundId === soundId))

/** Scenes keep sound ids inside their JSON data, so nothing cascades when a sound is deleted. */
export function soundUsage(db: Db, user: User, soundId: string): SoundUsage {
  const usage: SoundUsage = { scenes: [], privateCount: 0 }
  const rows = db
    .select({
      name: scenes.name,
      ownerId: scenes.ownerId,
      visibility: scenes.visibility,
      data: scenes.data,
    })
    .from(scenes)
    .orderBy(asc(scenes.name))
    .all()
  for (const row of rows) {
    if (!usesSound(row.data, soundId)) continue
    if (row.ownerId === user.id || row.visibility === 'group') usage.scenes.push(row.name)
    else usage.privateCount++
  }
  return usage
}
