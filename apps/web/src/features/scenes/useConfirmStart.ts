import { useEffect, useState } from 'react'
import { usePlayer } from '../../audio/store.ts'

const ARMED_MS = 3000

/**
 * While another scene is live, the first click on a start button only arms it, so a misclick
 * while browsing scenes mid-session can't crossfade the table. Nothing live: starts straight away.
 */
export function useConfirmStart(sceneId: string) {
  const otherLive = usePlayer((s) => s.sceneId !== null && s.sceneId !== sceneId)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => setArmed(false), ARMED_MS)
    return () => window.clearTimeout(t)
  }, [armed])

  return {
    armed: armed && otherLive,
    attempt: (start: () => void) => {
      if (otherLive && !armed) return setArmed(true)
      setArmed(false)
      start()
    },
  }
}
