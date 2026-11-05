import { create } from 'zustand'
import { usePlayer } from '../../audio/store.ts'

const KEY = 'ogre.sessionPlays'

function load(): string[] {
  try {
    const ids: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? '[]')
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

/**
 * Scenes started in this tab since it opened (a reload keeps them, a new tab starts fresh),
 * so a setlist can show tonight's progress rather than every scene ever played.
 */
export const useSessionPlays = create<{ ids: string[] }>(() => ({ ids: load() }))

usePlayer.subscribe((state, prev) => {
  const id = state.sceneId
  if (!id || id === prev.sceneId || useSessionPlays.getState().ids.includes(id)) return
  const ids = [...useSessionPlays.getState().ids, id]
  useSessionPlays.setState({ ids })
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    // storage unavailable: progress just won't survive a reload
  }
})
