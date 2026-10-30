import { useEffect } from 'react'
import { usePlayer } from '../audio/store.ts'

/** While a scene plays: ask before closing the tab, and keep the screen from sleeping. */
export function usePlayingGuards() {
  const playing = usePlayer((s) => s.sceneId !== null)

  useEffect(() => {
    if (!playing) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [playing])

  useEffect(() => {
    if (!playing || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = () => {
      if (document.visibilityState !== 'visible') return
      navigator.wakeLock.request('screen').then(
        (l) => (cancelled ? void l.release() : (lock = l)),
        () => undefined, // denied, e.g. battery saver: the screen may sleep as usual
      )
    }
    // The browser drops the lock whenever the tab is hidden; take it again on return.
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release()
    }
  }, [playing])
}
