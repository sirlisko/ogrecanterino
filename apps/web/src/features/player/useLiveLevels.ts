import { useEffect, useRef } from 'react'
import type { Levels } from '../../audio/levels.ts'
import { subscribeLevels } from '../../audio/liveLevels.ts'

/** Calls `onFrame` every animation frame with the section levels while `active`. */
export function useLiveLevels(active: boolean, onFrame: (levels: Levels) => void) {
  const callback = useRef(onFrame)
  callback.current = onFrame
  useEffect(() => (active ? subscribeLevels((l) => callback.current(l)) : undefined), [active])
}
