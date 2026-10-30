import { describe, expect, it } from 'vitest'
import { guessCategory, titleFromFilename } from './guessCategory.ts'

describe('guessCategory', () => {
  it('trusts words in the filename first', () => {
    expect(guessCategory('tavern_theme.mp3', 5_000)).toBe('music')
    expect(guessCategory('forest-ambience-loop.ogg', 400_000)).toBe('ambience')
  })

  it('falls back to length', () => {
    expect(guessCategory('door creak.wav', 2_000)).toBe('effect')
    expect(guessCategory('rain.wav', 60_000)).toBe('ambience')
    expect(guessCategory('untitled.mp3', 240_000)).toBe('music')
    expect(guessCategory('mystery.flac', null)).toBe('effect')
  })
})

describe('titleFromFilename', () => {
  it('drops the extension and separators', () => {
    expect(titleFromFilename('dragon_roar-02.wav')).toBe('dragon roar 02')
  })
})
