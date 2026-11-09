import type { Scene } from '@ogre/shared'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Icon } from '../../ui/Icon.tsx'
import { SeekBar } from '../../ui/SeekBar.tsx'

const side =
  'grid h-16 w-16 shrink-0 place-items-center rounded-xl ring-1 ring-peat-600 hover:bg-peat-700'

/** Transport with the playing track and where it is, sized for fingers. */
export function TableControls({ scene }: { scene: Scene }) {
  const music = usePlayer((s) => s.music)
  const combat = usePlayer((s) => s.combat)
  const track = scene.data.music.find((c) => c.id === music.cardId)

  return (
    <section
      aria-label="Music"
      className="flex flex-wrap items-center gap-3.5 rounded-2xl bg-peat-800 p-3 ring-1 ring-peat-700"
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Previous track"
          onClick={() => engine.music?.previous()}
          className={side}
        >
          <Icon name="previous" className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label={music.playing ? 'Pause music' : 'Play music'}
          onClick={() => engine.music?.toggle()}
          className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-2xl bg-brass text-peat-950"
        >
          <Icon name={music.playing ? 'pause' : 'play'} className="h-7 w-7" />
        </button>
        <button
          type="button"
          aria-label="Next track"
          onClick={() => engine.music?.next()}
          className={side}
        >
          <Icon name="next" className="h-6 w-6" />
        </button>
      </div>
      <div className="min-w-48 flex-1">
        <p className="truncate text-xl">
          {combat ? 'Combat music' : (track?.label ?? 'No music playing')}
        </p>
        {music.failing && <p className="text-danger">Can't load the music, retrying</p>}
        {music.duration > 0 && (
          <SeekBar
            current={music.current}
            duration={music.duration}
            onSeek={(seconds) => engine.music?.seek(seconds)}
            className="mt-1"
          />
        )}
      </div>
    </section>
  )
}
