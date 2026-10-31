import type { Card, Scene } from '@ogre/shared'
import { useEffect, useState } from 'react'
import { useSoundStatus } from '../../api/sounds.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Fader } from '../../ui/Fader.tsx'
import { formatRange } from '../../ui/format.ts'
import { EmptyLane, Lane } from './Lane.tsx'

function useNow(enabled: boolean) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!enabled) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [enabled])
  return now
}

export function AmbienceLane({
  scene,
  active,
  onCard,
}: {
  scene: Scene
  active: boolean
  onCard: (id: string, patch: Partial<Card>) => void
}) {
  const state = usePlayer((s) => s.ambience)
  const cards = scene.data.ambiences
  const soundStatus = useSoundStatus()
  const now = useNow(active && cards.some((c) => c.mode === 'interval'))

  return (
    <Lane title="Ambience" color="var(--color-lichen)">
      {cards.length === 0 && <EmptyLane>No ambience in this scene.</EmptyLane>}
      <ul className="flex flex-col gap-1">
        {cards.map((card) => {
          const s = active ? state[card.id] : undefined
          const status = soundStatus(card.soundId)
          const missing = status === 'missing'
          const interval = card.mode === 'interval' && card.intervalMs
          const nextIn = s?.nextAt ? Math.max(0, Math.ceil((s.nextAt - now) / 1000)) : null
          return (
            <li
              key={card.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-peat-800"
            >
              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={card.enabled}
                  disabled={status !== 'ready'}
                  onChange={(e) => onCard(card.id, { enabled: e.target.checked })}
                />
                <span className="h-5 w-9 rounded-full bg-peat-600 transition-colors peer-checked:bg-lichen peer-focus-visible:outline-2 peer-focus-visible:outline-brass peer-disabled:opacity-40" />
                <span className="absolute left-0.5 h-4 w-4 rounded-full bg-ink transition-transform peer-checked:translate-x-4" />
                <span className="sr-only">Enable {card.label}</span>
              </label>
              <span
                aria-hidden
                className={`h-2 w-2 shrink-0 rounded-full ${s?.sounding ? 'animate-breathe bg-lichen' : 'bg-transparent'}`}
              />
              <span className="min-w-0 flex-1">
                <span className={`block truncate ${card.enabled ? '' : 'text-peat-400'}`}>
                  {card.label}
                </span>
                {missing ? (
                  <span className="text-sm text-danger">missing</span>
                ) : (
                  interval && (
                    <span className="block truncate text-sm text-ink-muted tabular">
                      {nextIn !== null && card.enabled
                        ? `Next in ${nextIn} s, every ${formatRange(interval)}`
                        : `Every ${formatRange(interval)}`}
                    </span>
                  )
                )}
              </span>
              {interval && active && card.enabled && (
                <button
                  type="button"
                  onClick={() => engine.triggerAmbience(card.id)}
                  className="shrink-0 rounded-md px-2 py-1 text-sm text-lichen hover:bg-peat-700"
                  aria-label={`Play ${card.label} now`}
                >
                  Now
                </button>
              )}
              <Fader
                value={card.volume}
                label={`${card.label} volume`}
                color="var(--color-lichen)"
                className="max-w-20"
                onChange={(volume) => onCard(card.id, { volume })}
              />
            </li>
          )
        })}
      </ul>
    </Lane>
  )
}
