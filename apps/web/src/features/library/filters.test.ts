import type { Sound } from '@ogre/shared'
import { describe, expect, it } from 'vitest'
import { emptyFilter, filterSounds, tagCounts } from './filters.ts'

const sound = (
  id: string,
  title: string,
  category: Sound['category'],
  tags: string[],
  artist = 'Kevin',
): Sound => ({
  id,
  title,
  artist,
  tags,
  category,
  filename: `${id}.mp3`,
  mime: 'audio/mpeg',
  size: 1,
  durationMs: 1000,
  gainDb: null,
  uploadedBy: null,
})

const sounds = [
  sound('a', 'Battle Metal', 'music', ['Music', 'Epic', 'Battle']),
  sound('b', 'Sword Clash', 'effect', ['Sound Effect', 'Battle', 'Fight'], 'RPG Audio Vault'),
  sound('c', 'Rainy Tavern', 'ambience', ['Ambience', 'Tavern', 'Rain']),
]

describe('filterSounds', () => {
  const ids = (f: Partial<typeof emptyFilter>, fav = new Set<string>()) =>
    filterSounds(sounds, { ...emptyFilter, ...f }, fav).map((s) => s.id)

  it('matches every term across title, artist and tags', () => {
    expect(ids({ query: 'battle' })).toEqual(['a', 'b'])
    expect(ids({ query: 'battle vault' })).toEqual(['b'])
  })

  it('filters by category, tags and favourites', () => {
    expect(ids({ category: 'ambience' })).toEqual(['c'])
    expect(ids({ tags: ['Battle', 'Fight'] })).toEqual(['b'])
    expect(ids({ favouritesOnly: true }, new Set(['c']))).toEqual(['c'])
  })
})

describe('tagCounts', () => {
  it('ranks descriptive tags and skips category tags', () => {
    expect(tagCounts(sounds)[0]).toEqual(['Battle', 2])
    expect(tagCounts(sounds).map(([t]) => t)).not.toContain('Music')
  })
})
