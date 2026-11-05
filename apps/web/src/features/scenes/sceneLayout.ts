import { create } from 'zustand'

export type SceneLayout = 'tiles' | 'list'

const KEY = 'ogre.sceneLayout'

function load(): SceneLayout {
  try {
    return localStorage.getItem(KEY) === 'list' ? 'list' : 'tiles'
  } catch {
    return 'tiles'
  }
}

/** Tiles or a dense list, remembered per device. */
export const useSceneLayout = create<{ layout: SceneLayout }>(() => ({ layout: load() }))

export function setSceneLayout(layout: SceneLayout) {
  useSceneLayout.setState({ layout })
  try {
    localStorage.setItem(KEY, layout)
  } catch {
    // storage unavailable: the choice just won't survive a reload
  }
}
