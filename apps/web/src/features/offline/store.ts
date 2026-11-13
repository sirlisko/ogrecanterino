import { create } from 'zustand'
import type { OfflineStatus } from './status.ts'

const KEY = 'ogre.offline'

function load(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Collections kept on this device, how far each one's download has got, and the scenes they reach. */
export const useOffline = create<{
  ids: string[]
  status: Record<string, OfflineStatus>
  sceneIds: ReadonlySet<string>
}>(() => ({ ids: load(), status: {}, sceneIds: new Set() }))

export function setKeptOffline(ids: string[]) {
  useOffline.setState({ ids })
  try {
    if (ids.length) localStorage.setItem(KEY, JSON.stringify(ids))
    else localStorage.removeItem(KEY)
  } catch {
    // storage unavailable: the choice just won't survive a reload
  }
}

export function keepOffline(id: string, on: boolean) {
  const { ids } = useOffline.getState()
  setKeptOffline(on ? [...new Set([...ids, id])] : ids.filter((x) => x !== id))
  // Asks the browser not to clear the downloads when space runs low. It may say no.
  if (on) void navigator.storage?.persist?.().catch(() => false)
}

export const setKeptScenes = (sceneIds: ReadonlySet<string>) => useOffline.setState({ sceneIds })

export const setOfflineStatus = (status: Record<string, OfflineStatus>) =>
  useOffline.setState({ status })
