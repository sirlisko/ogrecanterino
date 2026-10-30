import { create } from 'zustand'

const KEY = 'ogre.padsVisible'

function load(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true'
  } catch {
    return false
  }
}

/** Whether the quick pads row is docked above the transport bar on this device. */
export const usePadsVisible = create<{ visible: boolean }>(() => ({ visible: load() }))

export function togglePads() {
  const visible = !usePadsVisible.getState().visible
  usePadsVisible.setState({ visible })
  try {
    localStorage.setItem(KEY, String(visible))
  } catch {
    // storage unavailable: the choice just won't survive a reload
  }
}
