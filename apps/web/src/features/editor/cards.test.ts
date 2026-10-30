import { emptySceneData, type Sound } from '@ogre/shared'
import { describe, expect, it } from 'vitest'
import { cardForSound, insertCard, moveCard, removeCard, sectionOfCard } from './cards.ts'

const sound = (category: Sound['category']): Sound => ({
  id: `s-${category}`,
  title: 'Crow',
  artist: '',
  tags: [],
  category,
  filename: 'crow.ogg',
  mime: 'audio/ogg',
  size: 1,
  durationMs: 2000,
  gainDb: null,
  uploadedBy: null,
})

describe('cardForSound', () => {
  it('picks a mode that fits the section and sound', () => {
    expect(cardForSound(sound('effect'), 'effects', 'x').mode).toBe('oneshot')
    expect(cardForSound(sound('ambience'), 'ambiences', 'x').mode).toBe('loop')
    expect(cardForSound(sound('effect'), 'ambiences', 'x')).toMatchObject({
      mode: 'interval',
      intervalMs: [30_000, 90_000],
    })
  })
})

describe('card list edits', () => {
  const a = cardForSound(sound('music'), 'music', 'a')
  const b = cardForSound(sound('music'), 'music', 'b')
  const data = insertCard(insertCard(emptySceneData(), 'music', a), 'music', b)

  it('inserts at an index and reorders', () => {
    expect(insertCard(data, 'music', { ...a, id: 'c' }, 0).music.map((c) => c.id)).toEqual([
      'c',
      'a',
      'b',
    ])
    expect(moveCard(data, 'music', 0, 1).music.map((c) => c.id)).toEqual(['b', 'a'])
  })

  it('removes cards and finds their section', () => {
    expect(removeCard(data, 'music', 'a').music.map((c) => c.id)).toEqual(['b'])
    expect(sectionOfCard(data, 'b')).toBe('music')
    expect(sectionOfCard(data, 'zzz')).toBeNull()
  })
})
