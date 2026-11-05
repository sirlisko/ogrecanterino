import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../../ui/motion.ts'
import { useLiveLevels } from '../../player/useLiveLevels.ts'

/** Matches `SceneArt`: lights are dim until the scene plays. */
const DRAWN_LIGHTS = '0.5'

function paint(root: HTMLElement, glow: number, flash: number) {
  for (const el of root.querySelectorAll('[data-glow="lights"]'))
    el.setAttribute('opacity', (0.6 + 0.4 * glow).toFixed(3))
  for (const el of root.querySelectorAll<SVGElement>('[data-glow="orb"]'))
    el.setAttribute('opacity', (Number(el.dataset.base) * (0.45 + 0.55 * glow)).toFixed(3))
  for (const el of root.querySelectorAll<HTMLElement>('[data-glow="flash"]'))
    el.style.opacity = flash.toFixed(3)
}

function reset(root: HTMLElement) {
  for (const el of root.querySelectorAll('[data-glow="lights"]'))
    el.setAttribute('opacity', DRAWN_LIGHTS)
  for (const el of root.querySelectorAll<SVGElement>('[data-glow="orb"]'))
    el.setAttribute('opacity', el.dataset.base ?? '1')
  for (const el of root.querySelectorAll<HTMLElement>('[data-glow="flash"]')) el.style.opacity = '0'
}

/**
 * While `live`, a drawn scene's windows, torches and fires follow the music and ambience, and an
 * effect flashes the picture. Pass the returned ref to `SceneArt` as `glowRef`. Uploaded pictures
 * have nothing to light, so they rely on the transport bar's edge instead.
 */
export function useSceneGlow(live: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const animate = live && !prefersReducedMotion()

  useLiveLevels(animate, (levels) => {
    if (!ref.current) return
    const glow = 0.25 + 0.75 * (0.65 * levels.music + 0.35 * levels.ambience)
    const flash = Math.max(0, (levels.effect - 0.2) / 0.8) * 0.85
    paint(ref.current, glow, flash)
  })

  useEffect(() => {
    if (!animate && ref.current) reset(ref.current)
  }, [animate])

  return ref
}
