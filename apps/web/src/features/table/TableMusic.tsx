import type { Card, Scene } from '@ogre/shared'
import { useSoundStatus } from '../../api/sounds.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Icon } from '../../ui/Icon.tsx'
import { SeekBar } from '../../ui/SeekBar.tsx'

export function TableMusic({ scene }: { scene: Scene }) {
  const music = usePlayer((s) => s.music)
  const combat = usePlayer((s) => s.combat)
  const soundStatus = useSoundStatus()
  const cards = scene.data.music

  const play = (card: Card) => {
    if (music.cardId === card.id) engine.music?.toggle()
    else engine.music?.playCard(card.id)
  }

  return (
    <section aria-label="Tracks" className="flex flex-col gap-3">
      {music.duration > 0 && (
        <SeekBar
          current={music.current}
          duration={music.duration}
          onSeek={(seconds) => engine.music?.seek(seconds)}
        />
      )}
      {cards.length > 0 && (
        <details className="group rounded-xl ring-1 ring-peat-700">
          <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden gap-2 px-4 py-3 text-lg text-ink-muted hover:text-ink">
            <Icon name="play" className="h-3 w-3 transition-transform group-open:rotate-90" />
            Tracks ({cards.length})
          </summary>
          <ol className="grid gap-2 px-3 pb-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const current = !combat && music.cardId === card.id
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    disabled={soundStatus(card.soundId) !== 'ready' || !card.enabled}
                    onClick={() => play(card)}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-lg px-3 text-left text-lg ring-1 disabled:opacity-40 ${
                      current
                        ? 'bg-brass/12 ring-brass/40'
                        : 'bg-peat-800 ring-peat-700 hover:bg-peat-700'
                    }`}
                  >
                    <Icon
                      name={current && music.playing ? 'pause' : 'play'}
                      className={`h-4 w-4 shrink-0 ${current ? 'text-brass' : 'text-ink-muted'}`}
                    />
                    <span className="min-w-0 flex-1 truncate">{card.label}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </details>
      )}
    </section>
  )
}
