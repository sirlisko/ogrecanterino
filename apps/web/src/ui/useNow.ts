import { useEffect, useState } from 'react'

/** Current time, ticking once a second while enabled; for countdowns. */
export function useNow(enabled: boolean) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!enabled) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [enabled])
  return now
}
