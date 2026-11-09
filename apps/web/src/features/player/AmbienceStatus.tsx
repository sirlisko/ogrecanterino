import { type CSSProperties, useState } from 'react'
import type { AmbienceCardState } from '../../audio/ambience.ts'

const RADIUS = 6
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Fills until the next firing. A CSS animation, so nothing re-renders while it runs. */
function WaitRing({ nextAt, waitMs }: { nextAt: number; waitMs: number }) {
  const [elapsed] = useState(() => Math.max(0, waitMs - (nextAt - Date.now())))
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 -rotate-90 fill-none stroke-2">
      <circle cx="8" cy="8" r={RADIUS} className="stroke-peat-600" />
      <circle
        cx="8"
        cy="8"
        r={RADIUS}
        strokeDasharray={CIRCUMFERENCE}
        className="animate-wait-ring stroke-lichen"
        style={
          {
            '--ring-length': CIRCUMFERENCE,
            animationDuration: `${waitMs}ms`,
            animationDelay: `-${elapsed}ms`,
          } as CSSProperties
        }
      />
    </svg>
  )
}

/** A pulse while the layer sounds, a filling ring while it waits, else the `idle` dot if any. */
export function AmbienceStatus({ state, idle }: { state?: AmbienceCardState; idle?: string }) {
  return (
    <span aria-hidden className="grid h-4 w-4 shrink-0 place-items-center">
      {state?.sounding ? (
        <span className="h-2 w-2 animate-breathe rounded-full bg-lichen" />
      ) : state?.nextAt ? (
        <WaitRing key={state.nextAt} nextAt={state.nextAt} waitMs={state.waitMs} />
      ) : (
        idle && <span className={`h-2.5 w-2.5 rounded-full ${idle}`} />
      )}
    </span>
  )
}
