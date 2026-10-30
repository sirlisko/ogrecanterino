import type { Card, Scene } from '@ogre/shared'
import { useRef } from 'react'
import { useSoundStatus } from '../../api/sounds.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
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
            active={active}
          />
        ))}
      </div>
    </Lane>
  )
}

export function EffectPad({
  card,
  hotkey,
  active,
  large,
}: {
  card: Card
  hotkey?: string
  active: boolean
  large?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const status = useSoundStatus()(card.soundId)
  const missing = status === 'missing'
  const previewing = usePlayer((s) => !active && !!card.soundId && s.previewId === card.soundId)
  const startedAt = usePlayer((s) => (active ? s.effects[card.id] : undefined))
  const long = engine.isLongEffect(card)
  const stoppable = long && startedAt !== undefined
  const durationMs = card.soundId ? engine.lookup(card.soundId)?.durationMs : null

  const fire = () => {
    if (!active) return card.soundId && engine.togglePreview(card.soundId)
    void engine.triggerEffect(card)
    if (!stoppable) flash(ref.current)
  }

  return (
    <button
      ref={ref}
      type="button"
      disabled={status !== 'ready' || !card.enabled}
      onClick={fire}
      data-effect-id={card.id}
      aria-pressed={active ? stoppable : previewing}
      aria-label={stoppable ? `Stop ${card.label}` : undefined}
      className={`relative flex flex-col justify-end rounded-xl p-3 ${large ? 'min-h-28 text-xl' : 'min-h-20'} text-left ring-1 transition-colors hover:bg-peat-700 hover:ring-arcane/60 active:scale-[0.98] disabled:opacity-40 overflow-hidden ${previewing || stoppable ? 'bg-arcane/15 ring-arcane' : 'bg-peat-800 ring-peat-700'}`}
    >
      {hotkey && (
        <kbd className="absolute top-2 right-2 grid h-6 min-w-6 place-items-center rounded border-b-2 border-peat-950 bg-peat-600 px-1 font-sans text-xs text-ink tabular">
          {hotkey}
        </kbd>
      )}
      <span className="pr-6 leading-tight">{card.label}</span>
      {missing && <span className="text-sm text-danger">missing</span>}
      {stoppable && <span className="text-sm text-arcane">Playing, press to stop</span>}
      {long && startedAt !== undefined && durationMs && (
        <span
          key={startedAt}
          aria-hidden
          className="animate-progress absolute inset-x-0 bottom-0 h-1 origin-left bg-arcane"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      )}
    </button>
  )
}
