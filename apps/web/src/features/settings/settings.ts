import { create } from 'zustand'
import { engine } from '../../audio/engine.ts'
import { prefersReducedMotion } from '../../ui/motion.ts'
import { withChoice, withSaved } from './stored.ts'

const KEY = 'ogre.settings'

export interface Settings {
  crossfadeSeconds: number
  fadeOutSeconds: number
  /** Music gain while ducked, as a fraction. */
  duckGain: number
  confirmStart: boolean
  /** Keys shown on effects, pads and the setlist. */
  keyHints: boolean
  muteWhileStreaming: boolean
  lightsFollowSound: boolean
}

const DEFAULTS: Settings = {
  crossfadeSeconds: 3,
  fadeOutSeconds: 1.5,
  duckGain: 0.3,
  confirmStart: true,
  // A touch screen usually has no keyboard to press them on.
  keyHints: !window.matchMedia('(pointer: coarse)').matches,
  muteWhileStreaming: false,
  lightsFollowSound: false,
}

function saved() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** Preferences for this device. */
export const useSettings = create<Settings>(() => withSaved(DEFAULTS, saved()))

export function changeSettings(patch: Partial<Settings>) {
  useSettings.setState(patch)
  try {
    localStorage.setItem(KEY, withChoice(saved(), patch))
  } catch {
    // storage unavailable: the choice just won't survive a reload
  }
}

/** The engine doesn't know about settings; it's told whenever they change. */
function applyToEngine(s: Settings) {
  engine.setCrossfade(s.crossfadeSeconds)
  engine.setFadeOut(s.fadeOutSeconds)
  engine.setDuckGain(s.duckGain)
}

applyToEngine(useSettings.getState())
useSettings.subscribe(applyToEngine)

/** Reduced motion wins over the setting: the lights then stay steady. */
export const useLightsFollowSound = () =>
  useSettings((s) => s.lightsFollowSound) && !prefersReducedMotion()
