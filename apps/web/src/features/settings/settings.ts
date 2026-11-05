import { create } from 'zustand'
import { prefersReducedMotion } from '../../ui/motion.ts'

const KEY = 'ogre.settings'

export interface Settings {
  lightsFollowSound: boolean
}

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { lightsFollowSound: saved?.lightsFollowSound === true }
  } catch {
    return { lightsFollowSound: false }
  }
}

/** Preferences for this device. */
export const useSettings = create<Settings>(() => load())

export function changeSettings(patch: Partial<Settings>) {
  useSettings.setState(patch)
  try {
    localStorage.setItem(KEY, JSON.stringify(useSettings.getState()))
  } catch {
    // storage unavailable: the choice just won't survive a reload
  }
}

/** Reduced motion wins over the setting: the lights then stay steady. */
export const useLightsFollowSound = () =>
  useSettings((s) => s.lightsFollowSound) && !prefersReducedMotion()
