import { create } from 'zustand'
import { usePlayer } from '../../audio/store.ts'

const KEY = 'ogre.recentScenes'
const LIMIT = 6

function load(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Scenes this browser started most recently, newest first. */
export const useRecentScenes = create<{ ids: string[] }>(() => ({ ids: load() }))

usePlayer.subscribe((state, prev) => {
  const id = state.sceneId
  if (!id || id === prev.sceneId) return
  const ids = [id, ...useRecentScenes.getState().ids.filter((x) => x !== id)].slice(0, LIMIT)
  useRecentScenes.setState({ ids })
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    // storage unavailable: the list just won't survive a reload
  }
})
