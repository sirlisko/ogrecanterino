import { create } from 'zustand'

const KEY = 'ogre.collection'

function load(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** The collection the GM is running from; drives the scenes page and next/previous scene. */
export const useActiveCollection = create<{ id: string | null }>(() => ({ id: load() }))

export function setActiveCollection(id: string | null) {
  useActiveCollection.setState({ id })
  try {
    if (id) localStorage.setItem(KEY, id)
    else localStorage.removeItem(KEY)
  } catch {
    // storage unavailable: the choice just won't survive a reload
  }
}
