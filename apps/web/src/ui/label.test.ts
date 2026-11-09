import { describe, expect, it } from 'vitest'
import { spacedLabel, splitLabel } from './label.ts'

describe('splitLabel', () => {
  it.each([
    ['🧭Desert City', '🧭', 'Desert City'],
    ['🧭✨Hidden Wonders', '🧭✨', 'Hidden Wonders'],
    ['🔥 Flame Bolt', '🔥', 'Flame Bolt'],
    ['👨‍👩‍👧Family', '👨‍👩‍👧', 'Family'],
    ['☠️Skull', '☠️', 'Skull'],
    ['🇮🇹Italia', '🇮🇹', 'Italia'],
  ])('splits %s', (label, emoji, text) => {
    expect(splitLabel(label)).toEqual({ emoji, text })
  })

  it.each(['Crowd Talking - Quiet', '3 Goblins', '#1 Hit', 'Bell 🔔', '🔥'])(
    'leaves %s whole',
    (label) => {
      expect(splitLabel(label)).toEqual({ emoji: '', text: label })
    },
  )
})

describe('spacedLabel', () => {
  it('joins the emoji to the first word with a non-breaking space', () => {
    expect(spacedLabel('🧭Desert City')).toBe('🧭 Desert City')
    expect(spacedLabel('Desert City')).toBe('Desert City')
  })
})
