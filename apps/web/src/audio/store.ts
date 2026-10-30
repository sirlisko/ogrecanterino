import type { Scene } from '@ogre/shared'
import { create } from 'zustand'
import type { AmbienceCardState } from './ambience.ts'
import type { BusName } from './mixer.ts'
import type { MusicState } from './music.ts'

export type Volumes = Record<BusName | 'master', number>

export interface PlayerState {
  unlocked: boolean
  sceneId: string | null
  /** Live copy of the playing scene, including unsaved tweaks. */
  scene: Scene | null
  combat: boolean
  music: MusicState
  ambience: Record<string, AmbienceCardState>
  volumes: Volumes
  monitor: boolean
  crossfadeSeconds: number
  /** Sound being auditioned on this device only. */
  previewId: string | null
  /** What the last fade-out stopped, so it can be resumed. */
  faded: { scene: Scene; cardId: string | null } | null
}

const VOLUME_KEY = 'ogre.volumes'

function loadVolumes(): Volumes {
  const fallback = { master: 80, music: 70, ambience: 80, effect: 90 }
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(VOLUME_KEY) ?? '{}') }
  } catch {
    return fallback
  }
}

export function saveVolumes(v: Volumes) {
  try {
    localStorage.setItem(VOLUME_KEY, JSON.stringify(v))
  } catch {
    // storage unavailable: volumes just won't persist
  }
}

export const usePlayer = create<PlayerState>(() => ({
  unlocked: false,
  sceneId: null,
  scene: null,
  combat: false,
  music: { playing: false, cardId: null, current: 0, duration: 0 },
  ambience: {},
  volumes: loadVolumes(),
  monitor: true,
  crossfadeSeconds: 3,
  previewId: null,
  faded: null,
}))
