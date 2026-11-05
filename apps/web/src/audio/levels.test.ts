import { describe, expect, it } from 'vitest'
import { mixColor, toLevel } from './levels.ts'

describe('toLevel', () => {
  it('maps amplitude to a 60 dB scale', () => {
    expect(toLevel(1)).toBe(1)
    expect(toLevel(0.001)).toBeCloseTo(0)
    expect(toLevel(0)).toBe(0)
    expect(toLevel(0.1)).toBeCloseTo(2 / 3)
  })
})

describe('mixColor', () => {
  it('is the section colour when one section sounds', () => {
    expect(mixColor({ music: 0.8, ambience: 0, effect: 0 })).toBe('215, 168, 74')
    expect(mixColor({ music: 0, ambience: 0, effect: 0.5 })).toBe('169, 139, 234')
  })

  it('blends sections by loudness', () => {
    expect(mixColor({ music: 0.5, ambience: 0.5, effect: 0 })).toBe('175, 180, 122')
  })

  it('falls back to brass in silence', () => {
    expect(mixColor({ music: 0, ambience: 0, effect: 0 })).toBe('215, 168, 74')
  })
})
