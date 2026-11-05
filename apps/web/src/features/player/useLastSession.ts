import type { QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { sceneQuery } from '../../api/scenes.ts'
import { usePlayer } from '../../audio/store.ts'
import { type LastSession, parseLastSession } from './lastSession.ts'

const KEY = 'ogre.lastSession'
const POSITION_EVERY_MS = 5000

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** Read before this tab starts anything, so it still describes the page that went away. */
let pending = parseLastSession(read(), Date.now())
let lastSave = 0

function save() {
  const { sceneId, music, combat } = usePlayer.getState()
  lastSave = Date.now()
  try {
    if (!sceneId) return localStorage.removeItem(KEY)
    const session: LastSession = {
      sceneId,
      cardId: combat ? null : music.cardId,
      at: combat ? 0 : music.current,
      savedAt: lastSave,
    }
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // storage unavailable: a reload just won't offer to resume
  }
}

usePlayer.subscribe((s, prev) => {
  if (s.sceneId !== prev.sceneId || s.music.cardId !== prev.music.cardId) save()
  else if (s.sceneId && Date.now() - lastSave > POSITION_EVERY_MS) save()
})
window.addEventListener('pagehide', save)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save()
})

/** After a reload or crash, offers the scene that was playing through the Resume toast. */
export function useOfferLastSession(qc: QueryClient, loggedIn: boolean) {
  useEffect(() => {
    const last = pending
    if (!loggedIn || !last) return
    pending = null
    if (usePlayer.getState().sceneId) return
    qc.fetchQuery(sceneQuery(last.sceneId)).then(
      (scene) => {
        if (usePlayer.getState().sceneId) return
        usePlayer.setState({
          faded: { scene, cardId: last.cardId, at: last.at, reason: 'reload' },
        })
      },
      () => undefined, // deleted or unshared since: nothing to offer
    )
  }, [qc, loggedIn])
}
