import type { Scene } from '@ogre/shared'
import { useNavigate } from 'react-router'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Icon } from '../../ui/Icon.tsx'
import { useRecentScenes } from './recentScenes.ts'
import { useConfirmStart } from './useConfirmStart.ts'

export function RecentScenes({ scenes }: { scenes: Scene[] }) {
  const ids = useRecentScenes((s) => s.ids)
  const byId = new Map(scenes.map((s) => [s.id, s]))
  const recent = ids.flatMap((id) => byId.get(id) ?? [])
  if (!recent.length) return null

  return (
    <section aria-label="Recently played" className="mt-5">
      <h2 className="mb-2 text-sm text-ink-muted">Recently played</h2>
      <ul className="flex flex-wrap gap-2">
        {recent.map((s) => (
          <li key={s.id}>
            <RecentScene scene={s} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function RecentScene({ scene }: { scene: Scene }) {
  const playing = usePlayer((s) => s.sceneId === scene.id)
  const navigate = useNavigate()
  const confirm = useConfirmStart(scene.id)
  const lit = playing || confirm.armed

  return (
    <button
      type="button"
      onClick={() =>
        confirm.attempt(() => {
          void engine.playScene(scene)
          navigate(`/scenes/${scene.id}`)
        })
      }
      aria-label={
        confirm.armed ? `Click again to replace the playing scene with ${scene.name}` : undefined
      }
      className={`flex items-center gap-2 rounded-lg py-1.5 pr-3 pl-2 ring-1 ${lit ? 'bg-brass/15 ring-brass/50' : 'bg-peat-800 ring-peat-700 hover:bg-peat-700'}`}
    >
      <span
        aria-hidden
        className={`grid h-6 w-6 place-items-center rounded-full text-xs ${lit ? 'bg-brass text-peat-950' : 'bg-peat-700'}`}
      >
        <Icon name={playing ? 'note' : 'play'} className="h-3 w-3" />
      </span>
      {scene.name}
      {confirm.armed && <span className="font-medium text-brass">Start scene?</span>}
    </button>
  )
}
