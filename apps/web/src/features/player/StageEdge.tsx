import { useRef } from 'react'
import { mixColor } from '../../audio/levels.ts'
import { usePlayer } from '../../audio/store.ts'
import { useLightsFollowSound } from '../settings/settings.ts'
import { useLiveLevels } from './useLiveLevels.ts'

/** Brass and lichen, as a steady light unless the lights follow the sound. */
const STEADY = '182, 177, 113'

const glowFor = (rgb: string) =>
  `radial-gradient(ellipse 60% 100% at 50% 100%, rgba(${rgb}, 0.45), rgba(${rgb}, 0) 100%)`

/**
 * The top edge of the transport bar lights up while a scene plays for the table. With "Lights
 * follow the sound" its colour mixes the sections by loudness and it flares on effects, drawn
 * through refs so it never re-renders.
 */
export function StageEdge() {
  const live = usePlayer((s) => s.sceneId !== null)
  const line = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  const still = !useLightsFollowSound()

  useLiveLevels(live && !still, (levels) => {
    const peak = Math.max(levels.music, levels.ambience, levels.effect)
    const rgb = mixColor(levels)
    if (line.current) {
      line.current.style.background = `rgb(${rgb})`
      line.current.style.opacity = String(0.35 + 0.65 * peak)
    }
    if (glow.current) {
      glow.current.style.background = glowFor(rgb)
      glow.current.style.opacity = String(0.15 + 0.75 * peak)
    }
  })

  if (!live) return null
  return (
    <div aria-hidden className="pointer-events-none relative h-[3px]">
      <div
        ref={glow}
        // Steady, a tall glow just hazes the page; it only needs to say the edge is lit.
        className={`absolute inset-x-0 bottom-full ${still ? 'h-8' : 'h-24'}`}
        style={still ? { background: glowFor(STEADY), opacity: 0.25 } : { opacity: 0 }}
      />
      <div
        ref={line}
        className="h-full"
        style={still ? { background: `rgb(${STEADY})`, opacity: 0.8 } : { opacity: 0 }}
      />
    </div>
  )
}
