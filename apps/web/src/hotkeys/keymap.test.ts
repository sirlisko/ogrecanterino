import { describe, expect, it } from 'vitest'
import { actionFor } from './keymap.ts'

const key = (k: string, code = '', mods: Partial<KeyboardEvent> = {}) => ({
  key: k,
  code,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...mods,
})

describe('actionFor', () => {
  it('maps digits to effects and shifted digits to pads', () => {
    expect(actionFor(key('1', 'Digit1'))).toEqual({ type: 'effect', index: 0 })
    expect(actionFor(key('0', 'Digit0'))).toEqual({ type: 'effect', index: 9 })
    expect(actionFor(key('!', 'Digit1', { shiftKey: true }))).toEqual({ type: 'pad', slot: 1 })
    expect(actionFor(key('=', 'Digit0', { shiftKey: true }))).toBeNull()
  })

  it('maps transport keys', () => {
    expect(actionFor(key(' ', 'Space'))).toEqual({ type: 'toggleMusic' })
    expect(actionFor(key('Escape', 'Escape'))).toEqual({ type: 'fadeOut' })
    expect(actionFor(key('N', 'KeyN'))).toEqual({ type: 'nextTrack' })
    expect(actionFor(key('d', 'KeyD'))).toEqual({ type: 'duck' })
  })

  it('steps through the collection by physical bracket keys or page keys', () => {
    expect(actionFor(key('+', 'BracketRight'))).toEqual({ type: 'nextScene' })
    expect(actionFor(key('è', 'BracketLeft'))).toEqual({ type: 'previousScene' })
    expect(actionFor(key('PageDown', 'PageDown'))).toEqual({ type: 'nextScene' })
  })

  it('ignores browser shortcuts', () => {
    expect(actionFor(key('n', 'KeyN', { metaKey: true }))).toBeNull()
    expect(actionFor(key('1', 'Digit1', { ctrlKey: true }))).toBeNull()
  })
})
