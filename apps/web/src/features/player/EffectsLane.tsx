import type { Card, Scene } from '@ogre/shared'
import { useRef } from 'react'
import { engine } from '../../audio/engine.ts'
import { flash } from '../../ui/flash.ts'
import { EmptyLane, Lane } from './Lane.tsx'

export const EFFECT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

export function EffectsLane({ scene, active }: { scene: Scene; active: boolean }) {
  const cards = scene.data.effects

  return (
    <Lane title="Effects" color="var(--color-arcane)">
      {cards.length === 0 && <EmptyLane>No effects in this scene.</EmptyLane>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, i) => (
          <EffectPad
            key={card.id}
            card={card}
            hotkey={active ? EFFECT_KEYS[i] : undefined}
            scene={scene}
            active={active}
          />
        ))}
      </div>
    </Lane>
  )
}

function EffectPad({
  card,
  hotkey,
  scene,
  active,
}: {
  card: Card
  hotkey?: string
  scene: Scene
  active: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const missing = !card.soundId || !engine.lookup(card.soundId)

  const fire = async () => {
    if (!active) await engine.playScene(scene)
    engine.fireEffect(card)
    flash(ref.current)
  }

  return (
    <button
      ref={ref}
      type="button"
      disabled={missing || !card.enabled}
      onClick={fire}
      data-effect-id={card.id}
      className={`relative flex min-h-20 flex-col justify-end rounded-xl bg-peat-800 p-3 text-left ring-1 ring-peat-700 transition-colors hover:bg-peat-700 hover:ring-arcane/60 active:scale-[0.98] disabled:opacity-40`}
    >
      {hotkey && (
        <kbd className="absolute top-2 right-2 grid h-6 min-w-6 place-items-center rounded border-b-2 border-peat-950 bg-peat-600 px-1 font-sans text-xs text-ink tabular">
          {hotkey}
        </kbd>
      )}
      <span className="pr-6 leading-tight">{card.label}</span>
      {missing && <span className="text-sm text-danger">missing</span>}
    </button>
  )
}
