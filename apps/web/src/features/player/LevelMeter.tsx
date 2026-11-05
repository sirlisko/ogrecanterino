import { useEffect, useRef } from 'react'
import { engine } from '../../audio/engine.ts'
import { toLevel } from '../../audio/levels.ts'
import type { MeterName } from '../../audio/mixer.ts'

/** Per animation frame: slow enough to read, fast enough to follow a hit. */
const FALLOFF = 0.9

/** Peak meter on a dB scale; draws through a ref so it never re-renders. */
export function LevelMeter({ channel, color }: { channel: MeterName; color: string }) {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    let shown = 0
    const draw = () => {
      shown = Math.max(toLevel(engine.peak(channel)), shown * FALLOFF)
      if (bar.current) bar.current.style.width = `${shown * 100}%`
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [channel])

  return (
    <div className="h-1 overflow-hidden rounded-full bg-peat-900" aria-hidden>
      <div ref={bar} className="h-full w-0 rounded-full" style={{ backgroundColor: color }} />
    </div>
  )
}
