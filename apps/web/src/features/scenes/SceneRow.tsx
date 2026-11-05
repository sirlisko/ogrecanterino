import type { Scene } from '@ogre/shared'
import { Link, useNavigate } from 'react-router'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Icon } from '../../ui/Icon.tsx'
import { SceneArt } from './art/SceneArt.tsx'
import { SceneCounts } from './SceneCounts.tsx'
import { SceneMenu } from './SceneMenu.tsx'
import { useConfirmStart } from './useConfirmStart.ts'

/** One scene in the list layout: the same actions as a tile, a fraction of the height. */
export function SceneRow({ scene, canEdit }: { scene: Scene; canEdit: boolean }) {
  const navigate = useNavigate()
  const playing = usePlayer((s) => s.sceneId === scene.id)
  const confirm = useConfirmStart(scene.id)
  const notes = [
    scene.tags.join(', '),
    playing && 'Live now',
    scene.visibility === 'private' && 'Only you',
  ].filter(Boolean)

  return (
    <li
      className={`relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center sm:grid-cols-[auto_6rem_minmax(0,1fr)_auto] gap-3.5 border-b border-peat-700 px-1.5 py-2 has-[:focus-visible]:bg-peat-800 ${playing ? 'bg-brass/8' : ''}`}
    >
      <button
        type="button"
        onClick={() =>
          confirm.attempt(() => {
            void engine.playScene(scene)
            navigate(`/scenes/${scene.id}`)
          })
        }
        aria-label={
          playing
            ? `${scene.name} is playing`
            : confirm.armed
              ? `Click again to replace the playing scene with ${scene.name}`
              : `Start scene: ${scene.name}`
        }
        className={`relative z-10 flex h-9 min-w-9 items-center justify-center gap-2 rounded-full transition ${
          playing || confirm.armed
            ? 'bg-brass text-peat-950'
            : 'bg-peat-700 text-ink hover:bg-brass hover:text-peat-950'
        } ${confirm.armed ? 'px-3.5 font-medium' : ''}`}
      >
        {playing ? (
          <Icon name="note" className="h-4 w-4 animate-breathe" />
        ) : (
          <Icon name="play" className="ml-0.5 h-3.5 w-3.5" />
        )}
        {confirm.armed && 'Start scene?'}
      </button>
      {/* On a phone the name needs the room more than the picture does. */}
      <div className="hidden overflow-hidden rounded-md sm:block">
        <SceneArt scene={scene} className="h-10" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-4">
          <Link
            to={`/scenes/${scene.id}`}
            className="font-display text-lg leading-tight font-bold outline-none"
          >
            <span className="absolute inset-0" aria-hidden />
            {scene.name}
          </Link>
          <SceneCounts scene={scene} />
        </div>
        {notes.length > 0 && <p className="truncate text-sm text-ink-muted">{notes.join('. ')}</p>}
      </div>
      <div className="relative z-10">
        <SceneMenu scene={scene} canEdit={canEdit} />
      </div>
    </li>
  )
}
