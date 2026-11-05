import { create } from 'zustand'
import { prefersReducedMotion } from '../../ui/motion.ts'
import { withChoice, withSaved } from './stored.ts'

const KEY = 'ogre.settings'

export interface Settings {
  lightsFollowSound: boolean
}

const DEFAULTS: Settings = { lightsFollowSound: false }

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

/** Reduced motion wins over the setting: the lights then stay steady. */
export const useLightsFollowSound = () =>
  useSettings((s) => s.lightsFollowSound) && !prefersReducedMotion()
