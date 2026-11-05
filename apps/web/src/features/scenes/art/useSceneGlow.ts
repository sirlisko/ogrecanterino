import { useEffect, useRef } from 'react'
import { useLiveLevels } from '../../player/useLiveLevels.ts'
import { useLightsFollowSound } from '../../settings/settings.ts'

/** Opacity of a drawing's windows, torches and fires: dim at rest, up while the scene plays. */
export const LIGHTS = { dim: 0.5, lit: 0.95 }

function paint(root: HTMLElement, glow: number, flash: number) {
  for (const el of root.querySelectorAll('[data-glow="lights"]'))
    el.setAttribute('opacity', (0.6 + 0.4 * glow).toFixed(3))
  for (const el of root.querySelectorAll<SVGElement>('[data-glow="orb"]'))
    el.setAttribute('opacity', (Number(el.dataset.base) * (0.45 + 0.55 * glow)).toFixed(3))
  for (const el of root.querySelectorAll<HTMLElement>('[data-glow="flash"]'))
    el.style.opacity = flash.toFixed(3)
}

function settle(root: HTMLElement, lit: boolean) {
  for (const el of root.querySelectorAll('[data-glow="lights"]'))
    el.setAttribute('opacity', String(lit ? LIGHTS.lit : LIGHTS.dim))
  for (const el of root.querySelectorAll<SVGElement>('[data-glow="orb"]'))
    el.setAttribute('opacity', el.dataset.base ?? '1')
  for (const el of root.querySelectorAll<HTMLElement>('[data-glow="flash"]')) el.style.opacity = '0'
}

/**
 * Lights a drawn scene while `live`: steadily, or, with "Lights follow the sound", its windows,
 * torches and fires follow the music and ambience and an effect flashes the picture. Spread the
 * result onto `SceneArt`. Uploaded pictures have nothing to light, so they rely on the transport
 * bar's edge instead.
 */
export function useSceneGlow(live: boolean) {
  const glowRef = useRef<HTMLDivElement>(null)
  const animate = useLightsFollowSound() && live

  useLiveLevels(animate, (levels) => {
    if (!glowRef.current) return
    const glow = 0.25 + 0.75 * (0.65 * levels.music + 0.35 * levels.ambience)
    const flash = Math.max(0, (levels.effect - 0.2) / 0.8) * 0.85
    paint(glowRef.current, glow, flash)
  })

  // The drawing renders the steady state itself; this undoes whatever the animation left behind.
  useEffect(() => {
    if (!animate && glowRef.current) settle(glowRef.current, live)
  }, [animate, live])

  return { glowRef, lit: live }
}
