import { describe, expect, it } from 'vitest'
import { nextTrackIndex, previousTrackIndex, randomInRange, randomIntInRange } from './schedule.ts'

const fixed = (v: number) => () => v

describe('random ranges', () => {
  it('stays within bounds', () => {
    expect(randomInRange([20_000, 45_000], fixed(0))).toBe(20_000)
    expect(randomInRange([20_000, 45_000], fixed(0.999999))).toBeLessThan(45_000)
    expect(randomIntInRange([1, 3], fixed(0))).toBe(1)
    expect(randomIntInRange([1, 3], fixed(0.5))).toBe(2)
    expect(randomIntInRange([1, 3], fixed(1))).toBe(3)
  })

  it('tolerates inverted ranges', () => {
    expect(randomInRange([10, 5], fixed(0.5))).toBe(10)
    expect(randomIntInRange([4, 2], fixed(0.9))).toBe(4)
  })

  it('covers the whole integer range over many draws', () => {
    const seen = new Set(Array.from({ length: 500 }, () => randomIntInRange([1, 3])))
    expect([...seen].sort()).toEqual([1, 2, 3])
  })
})

describe('playlist navigation', () => {
  it('wraps sequentially', () => {
    expect(nextTrackIndex(2, 3, 'sequential')).toBe(0)
    expect(previousTrackIndex(0, 3)).toBe(2)
  })

  it('repeats one track', () => {
    expect(nextTrackIndex(1, 3, 'repeat-one')).toBe(1)
  })

  it('never shuffles to the current track', () => {
    for (const r of [0, 0.3, 0.6, 0.99])
      expect(nextTrackIndex(1, 3, 'shuffle', fixed(r))).not.toBe(1)
  })

  it('handles empty playlists', () => {
    expect(nextTrackIndex(0, 0, 'sequential')).toBe(-1)
  })
})
