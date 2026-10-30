import { describe, expect, it } from 'vitest'
import { formatRange, formatTime } from './format.ts'

describe('formatTime', () => {
  it('formats minutes and seconds', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(125.7)).toBe('2:05')
    expect(formatTime(Number.NaN)).toBe('0:00')
  })
})

describe('formatRange', () => {
  it('shares the unit when both ends match', () => {
    expect(formatRange([20_000, 45_000])).toBe('20–45 s')
    expect(formatRange([120_000, 300_000])).toBe('2–5 min')
  })

  it('keeps both units when they differ', () => {
    expect(formatRange([45_000, 120_000])).toBe('45 s–2 min')
  })

  it('collapses equal ends', () => {
    expect(formatRange([30_000, 30_000])).toBe('30 s')
  })
})
