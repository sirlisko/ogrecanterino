import type { Scene, SceneArt as Art } from '@ogre/shared'
import { type Ref, useMemo } from 'react'
import { drawScene, PALETTES } from './compose.ts'
import { artFor, artForTags } from './kinds.ts'
import { hashText, seededRandom } from './random.ts'

type ArtScene = Pick<Scene, 'id' | 'tags' | 'bannerPath' | 'data'>

/**
 * A scene's picture: its uploaded banner, else its chosen illustration, else the one its tags pick.
 * Size it with `className`; the drawing fills the box and keeps its bottom edge in view.
 */
export function SceneArt({
  scene,
  show,
  wide,
  className = '',
  glowRef,
}: {
  scene: ArtScene
  /** Draws this illustration whatever the scene uses ('auto': the one its tags pick), as in the picker. */
  show?: Art | 'auto'
  /** A 720-unit drawing instead of 320, for full-width banners. */
  wide?: boolean
  className?: string
  /** Gives `useSceneGlow` the element whose lights it drives. */
  glowRef?: Ref<HTMLDivElement>
}) {
  if (!show && scene.bannerPath) {
    return (
      <div
        ref={glowRef}
        aria-hidden
        className={`bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(/banners/${encodeURIComponent(scene.bannerPath)})` }}
      />
    )
  }
  const kind = show === 'auto' ? artForTags(scene.tags) : (show ?? artFor(scene))
  return <Drawing kind={kind} seed={scene.id} wide={wide} className={className} glowRef={glowRef} />
}

function Drawing({
  kind,
  seed,
  wide,
  className,
  glowRef,
}: {
  kind: Art
  seed: string
  wide?: boolean
  className: string
  glowRef?: Ref<HTMLDivElement>
}) {
  const width = wide ? 720 : 320
  // Seeded by id, not name: renaming a scene keeps its picture.
  const d = useMemo(
    () => drawScene(kind, seededRandom(hashText(`${seed}:${kind}`)), width),
    [kind, seed, width],
  )
  const p = PALETTES[kind]
  return (
    // A one-cell grid stacks the drawing and the flash without positioning, so callers can
    // place the box however they like (absolute in a header, in flow in a card).
    <div
      ref={glowRef}
      aria-hidden
      className={`grid overflow-hidden ${className}`}
      style={{ background: `linear-gradient(180deg, ${p.top}, ${p.bottom})` }}
    >
      <svg
        viewBox={`0 0 ${width} 80`}
        preserveAspectRatio="xMidYMax slice"
        className="col-start-1 row-start-1 block h-full w-full"
      >
        {d.stars && <path d={d.stars} style={{ fill: 'var(--color-ink)' }} opacity={0.55} />}
        {d.orb && (
          <path
            data-glow="orb"
            data-base={d.orbOpacity}
            d={d.orb}
            style={{ fill: d.orbFill }}
            opacity={d.orbOpacity}
          />
        )}
        {d.far && <path d={d.far} fill={p.far} fillRule={d.farRule} />}
        {d.detail && <path d={d.detail} style={{ fill: d.detailFill }} opacity={0.85} />}
        <path d={d.near} fill={p.near} fillRule={d.nearRule} />
        {d.lights && (
          // Dim until the scene plays; `useSceneGlow` brings them up with the sound.
          <path data-glow="lights" d={d.lights} style={{ fill: d.lightsFill }} opacity={0.5} />
        )}
      </svg>
      <div
        data-glow="flash"
        className="pointer-events-none col-start-1 row-start-1 h-full w-full opacity-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 120% at 50% 100%, color-mix(in oklab, var(--color-arcane) 60%, transparent), transparent 70%)',
        }}
      />
    </div>
  )
}
