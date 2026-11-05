import { useEffect, useState } from 'react'
import { usePlayer } from '../../audio/store.ts'
import { useSettings } from '../settings/settings.ts'

const ARMED_MS = 3000

/**
 * While another scene is live, the first click on a start button only arms it, so a misclick
 * while browsing scenes mid-session can't crossfade the table. Nothing live, or the GM turned
 * the question off in Settings: starts straight away.
 */
export function useConfirmStart(sceneId: string) {
  const ask = useSettings((s) => s.confirmStart)
  const guarded = usePlayer((s) => s.sceneId !== null && s.sceneId !== sceneId) && ask
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => setArmed(false), ARMED_MS)
    return () => window.clearTimeout(t)
  }, [armed])

  return {
    armed: armed && guarded,
    attempt: (start: () => void) => {
      if (guarded && !armed) return setArmed(true)
      setArmed(false)
      start()
    },
  }
}
