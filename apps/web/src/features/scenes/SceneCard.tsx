import type { Scene } from '@ogre/shared'
import { Link, useNavigate } from 'react-router'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Icon } from '../../ui/Icon.tsx'
import { SceneArt } from './art/SceneArt.tsx'
import { SceneCounts } from './SceneCounts.tsx'
import { SceneMenu } from './SceneMenu.tsx'
import { useConfirmStart } from './useConfirmStart.ts'

export function SceneCard({
  scene,
  canEdit,
  position,
}: {
  scene: Scene
  canEdit: boolean
  position?: number
}) {
  const navigate = useNavigate()
  const playing = usePlayer((s) => s.sceneId === scene.id)
  const confirm = useConfirmStart(scene.id)

  const start = () =>
    confirm.attempt(() => {
      void engine.playScene(scene)
      navigate(`/scenes/${scene.id}`)
    })

  return (
    <article
      className={`relative overflow-hidden rounded-[10px] bg-peat-800 has-[:focus-visible]:ring-brass ${playing ? 'ring-2 ring-brass' : 'ring-1 ring-peat-700'}`}
    >
      <div className="relative h-[76px]">
        <SceneArt scene={scene} className="h-full" />
        {playing && (
          <span className="absolute top-[15px] left-[52px] flex items-center gap-1.5 rounded-full bg-peat-950/80 px-2.5 text-[13px] font-medium text-brass">
            <span aria-hidden className="h-[7px] w-[7px] animate-breathe rounded-full bg-brass" />
            Live
          </span>
        )}
      </div>
      <div className="px-3.5 pt-2.5 pb-3">
        <h2 className="font-display text-[19px] leading-tight font-bold">
          <Link to={`/scenes/${scene.id}`} className="outline-none">
            <span className="absolute inset-0" aria-hidden />
            {position !== undefined && (
              <span className="mr-2 font-sans text-base font-normal text-ink-muted tabular">
                {position}
              </span>
            )}
            {scene.name}
          </Link>
        </h2>
        <SceneCounts scene={scene} className="mt-1" />
        {scene.tags.length > 0 && (
          <p className="mt-0.5 truncate text-sm text-ink-muted">{scene.tags.join(', ')}</p>
        )}
        {scene.visibility === 'private' && <p className="text-sm text-ink-muted">Only you</p>}
      </div>
      <button
        type="button"
        onClick={start}
        aria-label={
          playing
            ? `${scene.name} is playing`
            : confirm.armed
              ? `Click again to replace the playing scene with ${scene.name}`
              : `Start scene: ${scene.name}`
        }
        className={`absolute top-2 left-2 z-10 flex h-9 min-w-9 items-center justify-center gap-2 rounded-full shadow-lg transition ${
          playing || confirm.armed
            ? 'bg-brass text-peat-950'
            : 'bg-peat-950/70 text-ink hover:bg-brass hover:text-peat-950'
        } ${confirm.armed ? 'px-3.5 font-medium' : ''}`}
      >
        {playing ? (
          <Icon name="note" className="h-4 w-4 animate-breathe" />
        ) : (
          <Icon name="play" className="ml-0.5 h-3.5 w-3.5" />
        )}
        {confirm.armed && 'Start scene?'}
      </button>
      <div className="absolute top-2 right-2 z-10">
        <SceneMenu scene={scene} canEdit={canEdit} />
      </div>
    </article>
  )
}
