import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formatTime } from './format.ts'

const KEY_STEP_S = 5

/**
 * Pointer-driven instead of a range input: the position keeps ticking while you drag,
 * and only the release seeks, so playback doesn't stutter or snap back under your finger.
 */
export function SeekBar({
  current,
  duration,
  onSeek,
  className = '',
}: {
  current: number
  duration: number
  onSeek: (seconds: number) => void
  className?: string
}) {
  const [dragging, setDragging] = useState<number | null>(null)
  const value = dragging ?? current
  const percent = duration > 0 ? Math.min(100, (value / duration) * 100) : 0

  const at = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const to = {
      ArrowLeft: current - KEY_STEP_S,
      ArrowDown: current - KEY_STEP_S,
      ArrowRight: current + KEY_STEP_S,
      ArrowUp: current + KEY_STEP_S,
      Home: 0,
      End: duration - 1,
    }[e.key]
    if (to === undefined) return
    e.preventDefault()
    onSeek(Math.min(duration, Math.max(0, to)))
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-ink-muted tabular ${className}`}>
      <span>{formatTime(value)}</span>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(value)}
        aria-valuetext={formatTime(value)}
        className="group relative h-6 flex-1 cursor-pointer touch-none rounded-full focus-visible:outline-2 focus-visible:outline-brass"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDragging(at(e))
        }}
        onPointerMove={(e) => dragging !== null && setDragging(at(e))}
        onPointerUp={(e) => {
          if (dragging === null) return
          onSeek(at(e))
          setDragging(null)
        }}
        onPointerCancel={() => setDragging(null)}
        onKeyDown={onKeyDown}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-peat-600">
          <div className="h-full bg-brass" style={{ width: `${percent}%` }} />
        </div>
        <div
          className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-peat-900 bg-brass transition-transform ${dragging !== null ? 'scale-125' : 'group-hover:scale-110'}`}
          style={{ left: `${percent}%` }}
        />
      </div>
      <span>{formatTime(duration)}</span>
    </div>
  )
}
