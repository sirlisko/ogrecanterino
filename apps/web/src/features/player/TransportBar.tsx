import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { toggleHotkeyHelp } from '../../hotkeys/helpStore.ts'
import { formatTime } from '../../ui/format.ts'
import { Icon } from '../../ui/Icon.tsx'
import { useGoToScene, useSetlist } from '../collections/useSetlist.ts'
import { DiscordControl } from '../discord/DiscordControl.tsx'
import { PadsPopover } from '../pads/PadsPopover.tsx'
import { MixerPopover } from './MixerPopover.tsx'

export function TransportBar() {
  const scene = usePlayer((s) => s.scene)
  const music = usePlayer((s) => s.music)
  const combat = usePlayer((s) => s.combat)
  const monitor = usePlayer((s) => s.monitor)
  const ducked = usePlayer((s) => s.ducked)
  const ambience = usePlayer((s) => s.ambience)
  const track = scene?.data.music.find((c) => c.id === music.cardId)
  const progress = music.duration ? (music.current / music.duration) * 100 : 0
  const sounding = (scene?.data.ambiences ?? []).filter((c) => ambience[c.id]?.sounding)
  const setlist = useSetlist()
  const goTo = useGoToScene()

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-peat-700 bg-peat-950/95 backdrop-blur">
      <div
        className="h-0.5 bg-brass transition-[width] duration-500"
        style={{ width: `${progress}%` }}
      />
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          {scene ? (
            <>
              <Link
                to={`/scenes/${scene.id}`}
                className="block truncate font-display text-lg leading-tight font-bold hover:underline"
              >
                {scene.name}
              </Link>
              <p className="flex items-center gap-2 text-sm text-ink-muted tabular">
                <span className="truncate">
                  {combat ? 'Combat music' : (track?.label ?? 'No music playing')}
                  {music.duration > 0 &&
                    ` ${formatTime(music.current)} / ${formatTime(music.duration)}`}
                </span>
                {ducked && <span className="shrink-0 text-brass">Music lowered</span>}
                {sounding.length > 0 && (
                  <span
                    className="flex shrink-0 items-center gap-1 text-lichen"
                    title={sounding.map((c) => c.label).join(', ')}
                  >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lichen" />
                    {sounding.length} ambience
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="text-ink-muted">Nothing playing. Start a scene.</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <TransportButton
            label="Previous track (P)"
            onClick={() => engine.music?.previous()}
            disabled={!scene}
          >
            <Icon name="previous" />
          </TransportButton>
          <button
            type="button"
            aria-label={music.playing ? 'Pause music (Space)' : 'Play music (Space)'}
            title={music.playing ? 'Pause music (Space)' : 'Play music (Space)'}
            disabled={!scene}
            onClick={() => engine.music?.toggle()}
            className="grid h-11 w-11 place-items-center rounded-full bg-brass text-peat-950 disabled:opacity-40"
          >
            <Icon name={music.playing ? 'pause' : 'play'} className="h-5 w-5" />
          </button>
          <TransportButton
            label="Next track (N)"
            onClick={() => engine.music?.next()}
            disabled={!scene}
          >
            <Icon name="next" />
          </TransportButton>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {setlist.next && (
            <button
              type="button"
              onClick={() => setlist.next && goTo(setlist.next)}
              title={`${scene ? 'Next scene' : 'Start'} in ${setlist.collection?.name} (])`}
              className="hidden max-w-56 truncate rounded-lg px-3 py-2 text-left text-ink-muted ring-1 ring-peat-600 hover:text-ink lg:block"
            >
              {scene ? 'Next' : 'Start'}: {setlist.next.name}
            </button>
          )}
          {!monitor && (
            <button
              type="button"
              onClick={() => engine.setMonitor(true)}
              title="Unmute this device (M)"
              className="rounded-lg bg-danger/15 px-3 py-2 font-medium text-danger hover:bg-danger/25"
            >
              Muted here
            </button>
          )}
          <button
            type="button"
            disabled={!scene}
            onClick={() => void engine.stopScene()}
            title="Fade out everything (Esc)"
            className="hidden rounded-lg px-3 py-2 text-ink-muted ring-1 ring-peat-600 hover:text-ink disabled:opacity-40 sm:block"
          >
            Fade out
          </button>
          <DiscordControl />
          <PadsPopover />
          <MixerPopover />
          <button
            type="button"
            onClick={toggleHotkeyHelp}
            aria-label="Keyboard shortcuts (?)"
            title="Keyboard shortcuts (?)"
            className="hidden h-9 w-9 place-items-center rounded-full text-ink-muted ring-1 ring-peat-600 hover:text-ink md:grid"
          >
            ?
          </button>
        </div>
      </div>
    </div>
  )
}

function TransportButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full text-ink-muted hover:bg-peat-700 hover:text-ink disabled:opacity-40"
    >
      {children}
    </button>
  )
}
