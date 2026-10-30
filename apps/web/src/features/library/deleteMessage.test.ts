import { describe, expect, it } from 'vitest'
import { deleteSoundMessage } from './deleteMessage.ts'

describe('deleteSoundMessage', () => {
  it('warns that deletion is permanent when no scene uses the sound', () => {
    expect(deleteSoundMessage('Rain', { scenes: [], privateCount: 0 })).toBe(
      `Delete "Rain" from the library?\n\nThis can't be undone.`,
    )
  })

  it('names visible scenes and counts the rest', () => {
    expect(deleteSoundMessage('Rain', { scenes: ['Farm'], privateCount: 2 })).toContain(
      `It's used in 3 scenes (Farm, 2 other scenes)`,
    )
  })

  it('caps the named list', () => {
    const scenes = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    expect(deleteSoundMessage('Rain', { scenes, privateCount: 0 })).toContain(
      '(A, B, C, D, E, 2 other scenes)',
    )
  })

  it('uses the singular for one scene', () => {
    expect(deleteSoundMessage('Rain', { scenes: ['Farm'], privateCount: 0 })).toContain(
      `It's used in 1 scene (Farm)`,
    )
  })
})
