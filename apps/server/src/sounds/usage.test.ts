import { emptySceneData, type Card } from '@ogre/shared'
import { describe, expect, it } from 'vitest'
import { openDb } from '../db/client.ts'
import { scenes, users } from '../db/schema.ts'
import { soundUsage } from './usage.ts'

const card = (soundId: string): Card => ({
  id: soundId,
  label: soundId,
  soundId,
  volume: 50,
  enabled: true,
  mode: 'loop',
})

describe('soundUsage', () => {
  it('names visible scenes and only counts other GMs’ private ones', () => {
    const db = openDb(':memory:')
    const addUser = (discordId: string) =>
      db.insert(users).values({ discordId, name: discordId }).returning().get()
    const me = addUser('me')
    const other = addUser('other')
    const addScene = (
      name: string,
      ownerId: string,
      visibility: 'private' | 'group',
      soundId: string,
    ) =>
      db
        .insert(scenes)
        .values({
          name,
          ownerId,
          visibility,
          data: { ...emptySceneData(), effects: [card(soundId)] },
        })
        .run()

    addScene('Mine', me.id, 'private', 'rain')
    addScene('Shared', other.id, 'group', 'rain')
    addScene('Secret', other.id, 'private', 'rain')
    addScene('Unrelated', me.id, 'group', 'wind')

    expect(soundUsage(db, me, 'rain')).toEqual({ scenes: ['Mine', 'Shared'], privateCount: 1 })
    expect(soundUsage(db, me, 'thunder')).toEqual({ scenes: [], privateCount: 0 })
  })
})
