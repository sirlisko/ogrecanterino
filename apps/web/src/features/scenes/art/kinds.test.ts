import { emptySceneData } from '@ogre/shared'
import { describe, expect, it } from 'vitest'
import { artFor, artForTags } from './kinds.ts'

describe('artForTags', () => {
  it('picks the starter scenes’ settings', () => {
    expect(artForTags(['town', 'indoor', 'social'])).toBe('town')
    expect(artForTags(['town', 'outdoor', 'night'])).toBe('night')
    expect(artForTags(['wilderness', 'outdoor', 'horror', 'night'])).toBe('horror')
    expect(artForTags(['wilderness', 'outdoor', 'night', 'calm'])).toBe('camp')
    expect(artForTags(['wilderness', 'outdoor', 'travel', 'cold'])).toBe('mountain')
    expect(artForTags(['sea', 'outdoor', 'danger'])).toBe('storm')
    expect(artForTags(['dungeon', 'underground', 'exploration'])).toBe('caverns')
    expect(artForTags(['dungeon', 'indoor', 'horror', 'undead'])).toBe('crypt')
    expect(artForTags(['indoor', 'magic', 'mystery'])).toBe('tower')
  })

  it('ignores case and knows synonyms', () => {
    expect(artForTags(['Desert', 'People', 'Town'])).toBe('desert')
    expect(artForTags(['Bloodwood', 'People', 'Tavern'])).toBe('town')
    expect(artForTags(['Graveyard'])).toBe('crypt')
    expect(artForTags(['Woods', 'Ghost'])).toBe('horror')
  })

  it('draws the place before the fight', () => {
    expect(artForTags(['PF2e', 'Beach', 'Ocean', 'Battle', 'Pirate'])).toBe('sea')
    expect(artForTags(['Horror', 'Battle', 'Forest', 'Dark'])).toBe('horror')
    expect(artForTags(['Epic', 'Bloodwood', 'Boss', 'Battle'])).toBe('battle')
    expect(artForTags(['combat'])).toBe('battle')
  })

  it('falls back to the mood when no setting is named', () => {
    expect(artForTags(['Ghost', 'Horror', 'Monster', 'Night', 'Dark'])).toBe('horror')
    expect(artForTags(['Calm'])).toBe('forest')
    expect(artForTags([])).toBe('forest')
  })
})

describe('artFor', () => {
  it('prefers the illustration the GM chose', () => {
    const data = { ...emptySceneData(), art: 'castle' as const }
    expect(artFor({ tags: ['sea'], data })).toBe('castle')
    expect(artFor({ tags: ['sea'], data: emptySceneData() })).toBe('sea')
  })
})
