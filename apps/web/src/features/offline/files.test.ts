import { type Card, type Collection, emptySceneData, type Scene, type Sound } from '@ogre/shared'
import { describe, expect, it } from 'vitest'
import { collectionScenes, offlinePlan, sceneFiles } from './files.ts'

const card = (soundId: string | null, enabled = true): Card => ({
  id: `card-${soundId}`,
  label: '',
  soundId,
  volume: 100,
  enabled,
  mode: 'loop',
})

const scene = (id: string, over: Partial<Scene> = {}, cards: Card[] = []): Scene => ({
  id,
  name: id,
  tags: [],
  visibility: 'private',
  combatSceneId: null,
  data: { ...emptySceneData(), music: cards },
  ownerId: 'u',
  ownerName: 'U',
  bannerPath: null,
  updatedAt: '',
  ...over,
})

const sound = (id: string): Sound => ({
  id,
  title: id,
  artist: '',
  tags: [],
  filename: `${id} file.mp3`,
  mime: 'audio/mpeg',
  size: 1,
  durationMs: 1000,
  gainDb: null,
  category: 'music',
  uploadedBy: null,
})

const collection = (over: Partial<Collection> = {}): Collection => ({
  id: 'c',
  name: 'C',
  visibility: 'private',
  combatSceneId: null,
  sceneIds: [],
  ownerId: 'u',
  ownerName: 'U',
  ...over,
})

describe('collectionScenes', () => {
  it('adds the combat scenes the collection and its scenes play', () => {
    const scenes = [
      scene('a', { combatSceneId: 'boss' }),
      scene('b'),
      scene('boss'),
      scene('fight'),
    ]
    const ids = collectionScenes(
      collection({ sceneIds: ['a', 'b'], combatSceneId: 'fight' }),
      scenes,
    ).map((s) => s.id)
    expect(ids.sort()).toEqual(['a', 'b', 'boss', 'fight'])
  })

  it('skips scenes the GM can no longer see', () => {
    expect(collectionScenes(collection({ sceneIds: ['gone'] }), [scene('a')])).toEqual([])
  })
})

describe('sceneFiles', () => {
  it('lists each sound once, disabled cards included, and skips missing sounds', () => {
    const scenes = [
      scene('a', {}, [card('s1'), card('s2', false), card(null), card('deleted')]),
      scene('b', {}, [card('s1')]),
    ]
    expect(sceneFiles(scenes, [sound('s1'), sound('s2')])).toEqual([
      '/audio/s1%20file.mp3',
      '/audio/s2%20file.mp3',
    ])
  })

  it('includes uploaded banners and extra sounds', () => {
    const files = sceneFiles([scene('a', { bannerPath: 'a b.jpg' })], [sound('pad')], ['pad'])
    expect(files).toEqual(['/banners/a%20b.jpg', '/audio/pad%20file.mp3'])
  })
})

describe('offlinePlan', () => {
  it('gives every collection the quick pads', () => {
    const plan = offlinePlan(
      [collection({ id: 'one', sceneIds: ['a'] }), collection({ id: 'two' })],
      [scene('a', {}, [card('s1')])],
      [sound('s1'), sound('pad')],
      [{ slot: 1, soundId: 'pad', label: 'Pad' }],
    )
    expect(plan.get('one')).toEqual(['/audio/s1%20file.mp3', '/audio/pad%20file.mp3'])
    expect(plan.get('two')).toEqual(['/audio/pad%20file.mp3'])
  })
})
