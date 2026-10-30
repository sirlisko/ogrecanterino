import type { Scene } from '@ogre/shared'
import { useScene } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { combatSceneIdFor } from '../collections/setlist.ts'
import { useActiveCollectionData } from '../collections/useSetlist.ts'

const big = 'grid h-16 min-w-16 place-items-center rounded-xl px-5 text-xl ring-1 ring-peat-600'

export function TableControls({ scene }: { scene: Scene }) {
  const music = usePlayer((s) => s.music)
  const combat = usePlayer((s) => s.combat)
  const ducked = usePlayer((s) => s.ducked)
  const collection = useActiveCollectionData()
  const combatScene = useScene(combatSceneIdFor(scene, collection) ?? undefined).data
  const track = scene.data.music.find((c) => c.id === music.cardId)
  const duck = (on: boolean) => () => engine.setDucked(on)

  return (
    <section aria-label="Music" className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        aria-label="Previous track"
        onClick={() => engine.music?.previous()}
        className={big}
      >
        ⏮
      </button>
      <button
        type="button"
        aria-label={music.playing ? 'Pause music' : 'Play music'}
        onClick={() => engine.music?.toggle()}
        className={`${big} bg-brass text-peat-950 ring-0`}
      >
        {music.playing ? '❚❚' : '▶'}
      </button>
      <button
        type="button"
        aria-label="Next track"
        onClick={() => engine.music?.next()}
        className={big}
      >
        ⏭
      </button>
      <p className="min-w-0 flex-1 truncate text-lg text-ink-muted">
        {combat ? 'Combat music' : (track?.label ?? 'No music playing')}
      </p>
      <button
        type="button"
        aria-pressed={ducked}
        onPointerDown={duck(true)}
        onPointerUp={duck(false)}
        onPointerCancel={duck(false)}
        onPointerLeave={duck(false)}
        onContextMenu={(e) => e.preventDefault()}
        className={`${big} touch-none select-none ${ducked ? 'bg-brass/20 text-brass ring-brass' : ''}`}
      >
        Hold to talk
      </button>
      {combatScene && (
        <button
          type="button"
          onClick={() => engine.toggleCombat(combatScene)}
          className={`${big} ${combat ? 'bg-danger/20 text-danger ring-danger' : ''}`}
        >
          {combat ? 'End combat' : 'Combat'}
        </button>
      )}
      <button type="button" onClick={() => void engine.stopScene()} className={big}>
        Fade out
      </button>
    </section>
  )
}
