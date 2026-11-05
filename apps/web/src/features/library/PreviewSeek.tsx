import { useEffect, useState } from 'react'
import { engine } from '../../audio/engine.ts'
import { SeekBar } from '../../ui/SeekBar.tsx'

const TICK_MS = 250

/** Seek bar for the sound previewing on this device; renders nothing for short sounds. */
export function PreviewSeek({ className }: { className?: string }) {
  const [position, setPosition] = useState(() => engine.previewPosition())

  useEffect(() => {
    const t = window.setInterval(() => setPosition(engine.previewPosition()), TICK_MS)
    return () => window.clearInterval(t)
  }, [])

  if (!position || position.duration <= 0) return null
  return (
    <SeekBar
      current={position.current}
      duration={position.duration}
      onSeek={(seconds) => {
        engine.seekPreview(seconds)
        setPosition(engine.previewPosition())
      }}
      className={className}
    />
  )
}
