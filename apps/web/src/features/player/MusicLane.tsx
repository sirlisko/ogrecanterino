import type { Card, Scene, SceneSettings } from '@ogre/shared'
import { useSoundStatus } from '../../api/sounds.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Fader } from '../../ui/Fader.tsx'
import { formatTime } from '../../ui/format.ts'
import { EmptyLane, IconButton, Lane } from './Lane.tsx'

interface Props {
  scene: Scene
  active: boolean
  onCard: (id: string, patch: Partial<Card>) => void
  onSettings: (patch: Partial<SceneSettings>) => void
}

export function MusicLane({ scene, active, onCard, onSettings }: Props) {
  const music = usePlayer((s) => s.music)
  const combat = usePlayer((s) => s.combat)
  const soundStatus = useSoundStatus()
  const { settings } = scene.data
  const cards = scene.data.music

  const play = (card: Card) => {
    if (!active) return void engine.playScene(scene).then(() => engine.music?.playCard(card.id, 1))
    if (music.cardId === card.id) engine.music?.toggle()
    else engine.music?.playCard(card.id)
  }

  return (
    <Lane
      title="Music"
      color="var(--color-brass)"
      actions={
        <>
          <IconButton
            label="Shuffle"
            active={settings.shuffle}
            onClick={() => onSettings({ shuffle: !settings.shuffle })}
          >
            ⤮
          </IconButton>
          <IconButton
            label={
              settings.musicIsPlaylist
                ? 'Playing as playlist (click to loop one track)'
                : 'Looping one track (click to play as playlist)'
            }
            active={!settings.musicIsPlaylist}
            onClick={() => onSettings({ musicIsPlaylist: !settings.musicIsPlaylist })}
          >
            ↻
          </IconButton>
        </>
      }
    >
      {combat && active && (
        <p className="mb-2 rounded-md bg-danger/15 px-3 py-1.5 text-sm text-danger">
          Combat music is playing
        </p>
      )}
      {cards.length === 0 && <EmptyLane>No music in this scene.</EmptyLane>}
      <ol className="flex flex-col gap-1">
        {cards.map((card) => {
          const current = active && !combat && music.cardId === card.id
          const status = soundStatus(card.soundId)
          const missing = status === 'missing'
          return (
            <li
              key={card.id}
              className={`rounded-lg ${current ? 'bg-brass/12 ring-1 ring-brass/40' : ''}`}
            >
              <div className="flex items-center gap-2 px-2 py-1.5">
                <button
                  type="button"
                  disabled={status !== 'ready' || !card.enabled}
                  onClick={() => play(card)}
                  aria-label={
                    current && music.playing ? `Pause ${card.label}` : `Play ${card.label}`
                  }
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm disabled:opacity-40 ${
                    current
                      ? 'bg-brass text-peat-950'
                      : 'bg-peat-700 hover:bg-brass hover:text-peat-950'
                  }`}
                >
                  {current && music.playing ? '❚❚' : '▶'}
                </button>
                <span
                  className={`min-w-0 flex-1 truncate ${card.enabled ? '' : 'text-peat-400 line-through'}`}
                >
                  {card.label}
                  {missing && <span className="ml-2 text-sm text-danger">missing</span>}
                </span>
                <Fader
                  value={card.volume}
                  label={`${card.label} volume`}
                  color="var(--color-brass)"
                  className="max-w-20"
                  onChange={(volume) => onCard(card.id, { volume })}
                />
              </div>
              {current && music.duration > 0 && (
                <div className="flex items-center gap-2 px-3 pb-2 text-xs text-ink-muted tabular">
                  <span>{formatTime(music.current)}</span>
                  <input
                    type="range"
                    className="fader"
                    min={0}
                    max={music.duration}
                    step={1}
                    value={music.current}
                    aria-label="Seek"
                    style={{ ['--fader-color' as string]: 'var(--color-brass)' }}
                    onChange={(e) => engine.music?.seek(Number(e.target.value))}
                  />
                  <span>{formatTime(music.duration)}</span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </Lane>
  )
}
