import { type Collection, emptySceneData, type Scene } from '@ogre/shared'
import { describe, expect, it } from 'vitest'
import { adjacentScene, combatSceneIdFor, stepStatus } from './setlist.ts'

const scene = (id: string, combatSceneId: string | null = null): Scene => ({
  id,
  name: id,
  tags: [],
  visibility: 'private',
  combatSceneId,
  data: emptySceneData(),
  ownerId: 'u',
  ownerName: 'U',
  bannerPath: null,
  updatedAt: '',
})

const collection: Collection = {
  id: 'c',
  name: 'C',
  visibility: 'private',
  combatSceneId: 'fight',
  sceneIds: ['a', 'hidden', 'b', 'c'],
  ownerId: 'u',
  ownerName: 'U',
}
const scenes = [scene('a'), scene('b'), scene('c', 'boss')]

describe('adjacentScene', () => {
  it('steps through visible scenes in collection order', () => {
    expect(adjacentScene(collection, scenes, 'a', 1)?.id).toBe('b')
    expect(adjacentScene(collection, scenes, 'b', -1)?.id).toBe('a')
    expect(adjacentScene(collection, scenes, 'c', 1)).toBeNull()
  })

  it('starts at the top when nothing from the collection is playing', () => {
    expect(adjacentScene(collection, scenes, null, 1)?.id).toBe('a')
    expect(adjacentScene(collection, scenes, 'elsewhere', -1)).toBeNull()
  })
})

describe('combatSceneIdFor', () => {
  it("prefers the scene's own combat music, then the collection's", () => {
    expect(combatSceneIdFor(scene('c', 'boss'), collection)).toBe('boss')
    expect(combatSceneIdFor(scene('a'), collection)).toBe('fight')
    expect(combatSceneIdFor(scene('elsewhere'), collection)).toBeNull()
  })
})

describe('stepStatus', () => {
  const run = { liveId: 'b', nextId: 'c', played: new Set(['a', 'b']) }

  it('marks the live scene, the next one and what was played this session', () => {
    expect(['a', 'b', 'c', 'd'].map((id) => stepStatus(id, run))).toEqual([
      'played',
      'live',
      'next',
      'later',
    ])
  })

  it('offers the first scene as next before anything plays', () => {
    expect(stepStatus('a', { liveId: null, nextId: 'a', played: new Set() })).toBe('next')
  })
})
