export type HotkeyAction =
  | { type: 'effect'; index: number }
  | { type: 'pad'; slot: number }
  | { type: 'toggleMusic' }
  | { type: 'nextTrack' }
  | { type: 'previousTrack' }
  | { type: 'fadeOut' }
  | { type: 'toggleMonitor' }
  | { type: 'toggleCombat' }
  | { type: 'duck' }
  | { type: 'nextScene' }
  | { type: 'previousScene' }
  | { type: 'focusSearch' }
  | { type: 'help' }

type KeyLike = Pick<KeyboardEvent, 'key' | 'code' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>

const EFFECT_CODES = [
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
  'Digit6',
  'Digit7',
  'Digit8',
  'Digit9',
  'Digit0',
]

/** Uses `code` for digits so Shift+1 works on any keyboard layout (where `key` would be "!" or similar). */
export function actionFor(e: KeyLike): HotkeyAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null
  const digit = EFFECT_CODES.indexOf(e.code)
  if (digit >= 0)
    return e.shiftKey
      ? digit < 9
        ? { type: 'pad', slot: digit + 1 }
        : null
      : { type: 'effect', index: digit }
  if (e.key === '?') return { type: 'help' }
  if (e.shiftKey) return null
  // Physical bracket keys, so layouts that need AltGr for "[" still work; PageUp/Down suit clickers.
  if (e.code === 'BracketRight' || e.key === 'PageDown') return { type: 'nextScene' }
  if (e.code === 'BracketLeft' || e.key === 'PageUp') return { type: 'previousScene' }
  switch (e.key.toLowerCase()) {
    case ' ':
      return { type: 'toggleMusic' }
    case 'n':
      return { type: 'nextTrack' }
    case 'p':
      return { type: 'previousTrack' }
    case 'escape':
      return { type: 'fadeOut' }
    case 'm':
      return { type: 'toggleMonitor' }
    case 'c':
      return { type: 'toggleCombat' }
    case 'd':
      return { type: 'duck' }
    case '/':
      return { type: 'focusSearch' }
    default:
      return null
  }
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLInputElement)
    return !['checkbox', 'radio', 'range', 'button'].includes(target.type)
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
}

export const HOTKEY_HELP: [keys: string, description: string][] = [
  ['1 – 0', 'Fire the playing scene’s effects'],
  ['Shift + 1 – 9', 'Fire your quick pads'],
  ['Space', 'Play or pause music'],
  ['N / P', 'Next or previous track'],
  ['C', 'Start or end combat music'],
  ['[ / ] or Page Up / Down', 'Previous or next scene in the collection'],
  ['Esc', 'Fade out everything'],
  ['Hold D', 'Lower the music while you talk'],
  ['M', 'Mute or unmute this device'],
  ['/', 'Search'],
  ['?', 'Show these shortcuts'],
]
