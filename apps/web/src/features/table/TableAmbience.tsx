import type { Card, Scene } from '@ogre/shared'
import { useSoundStatus } from '../../api/sounds.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { formatRange } from '../../ui/format.ts'
import { useNow } from '../../ui/useNow.ts'

/** Ambience layers as big on/off tiles; an interval layer can also be fired now. */
export function TableAmbience({
  scene,
  onCard,
}: {
  scene: Scene
  onCard: (id: string, patch: Partial<Card>) => void
}) {
  const state = usePlayer((s) => s.ambience)
  const soundStatus = useSoundStatus()
  const cards = scene.data.ambiences
  const now = useNow(cards.some((c) => c.mode === 'interval'))
  if (!cards.length) return null

  return (
    <section aria-label="Ambience">
      <h2 className="mb-3 font-display text-2xl font-bold text-lichen">Ambience</h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
        {cards.map((card) => {
          const ready = soundStatus(card.soundId) === 'ready'
          const on = card.enabled && ready
          const s = state[card.id]
          const interval = card.mode === 'interval' && card.intervalMs
          const nextIn = s?.nextAt ? Math.max(0, Math.ceil((s.nextAt - now) / 1000)) : null
          return (
            <li
              key={card.id}
              className={`flex min-h-20 overflow-hidden rounded-xl ring-1 ${on ? 'bg-lichen/12 ring-lichen/50' : 'bg-peat-800 ring-peat-700'}`}
            >
              <button
                type="button"
                aria-pressed={on}
                disabled={!ready}
                onClick={() => onCard(card.id, { enabled: !card.enabled })}
                className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-4 py-3 text-left disabled:opacity-40"
              >
                <span className="flex items-center gap-2 text-lg">
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${s?.sounding ? 'animate-breathe bg-lichen' : on ? 'bg-lichen/50' : 'bg-peat-600'}`}
                  />
                  <span className="truncate">{card.label}</span>
                </span>
                <span className="text-sm text-ink-muted tabular">
                  {!ready
                    ? 'Missing sound'
                    : !on
                      ? 'Off'
                      : interval
                        ? nextIn !== null
                          ? `Next in ${nextIn} s, every ${formatRange(interval)}`
                          : `Every ${formatRange(interval)}`
                        : 'On, looping'}
                </span>
              </button>
              {interval && on && (
                <button
                  type="button"
                  onClick={() => engine.triggerAmbience(card.id)}
                  aria-label={`Play ${card.label} now`}
                  className="shrink-0 border-l border-lichen/30 px-5 text-lg text-lichen hover:bg-lichen/15"
                >
                  Now
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
