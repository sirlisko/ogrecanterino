import { engine } from './engine.ts'
import { type Levels, toLevel } from './levels.ts'

/** Per frame: slow enough to read, fast enough to follow a hit. */
const FALLOFF = 0.9

type Listener = (levels: Levels) => void

const listeners = new Set<Listener>()
const shown: Levels = { music: 0, ambience: 0, effect: 0 }
let frame = 0

function tick() {
  for (const bus of ['music', 'ambience', 'effect'] as const)
    shown[bus] = Math.max(toLevel(engine.peak(bus)), shown[bus] * FALLOFF)
  for (const listener of listeners) listener(shown)
  frame = requestAnimationFrame(tick)
}

/** One animation loop reads the mixer for everything that follows the live levels. */
export function subscribeLevels(listener: Listener) {
  listeners.add(listener)
  if (listeners.size === 1) frame = requestAnimationFrame(tick)
  return () => {
    listeners.delete(listener)
    if (listeners.size) return
    cancelAnimationFrame(frame)
    shown.music = shown.ambience = shown.effect = 0
  }
}
