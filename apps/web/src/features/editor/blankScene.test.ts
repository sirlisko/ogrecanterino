import { emptySceneData, type Scene } from '@ogre/shared'
import { describe, expect, it } from 'vitest'
import { staleBlankScenes, UNTITLED } from './blankScene.ts'

const now = Date.UTC(2026, 10, 5, 20)
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString()

const scene = (patch: Partial<Scene>): Scene => ({
  id: 'a',
  name: UNTITLED,
  tags: [],
  visibility: 'private',
  combatSceneId: null,
  data: emptySceneData(),
  ownerId: 'me',
  ownerName: 'Me',
  bannerPath: null,
  updatedAt: hoursAgo(2),
  ...patch,
})

describe('staleBlankScenes', () => {
  it('finds my untouched new scenes after an hour', () => {
    expect(staleBlankScenes([scene({})], 'me', now)).toEqual(['a'])
  })

  it('leaves recent, renamed, tagged and other GMs’ scenes alone', () => {
    const scenes = [
      scene({ id: 'recent', updatedAt: hoursAgo(0.5) }),
      scene({ id: 'renamed', name: 'Tavern' }),
      scene({ id: 'tagged', tags: ['Forest'] }),
      scene({ id: 'theirs', ownerId: 'someone' }),
    ]
    expect(staleBlankScenes(scenes, 'me', now)).toEqual([])
  })

  it('keeps a scene with any card in it', () => {
    const data = emptySceneData()
    data.effects.push({
      id: 'c',
      label: 'Door',
      soundId: 's',
      volume: 80,
      enabled: true,
      mode: 'oneshot',
    })
    expect(staleBlankScenes([scene({ data })], 'me', now)).toEqual([])
  })
})
