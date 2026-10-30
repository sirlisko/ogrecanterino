import type { Scene } from '@ogre/shared'
import { Link, useNavigate } from 'react-router'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { SceneMenu } from './SceneMenu.tsx'
import { sceneGradient } from './sceneArt.ts'

export function SceneCard({
  scene,
  canEdit,
  mine,
}: {
  scene: Scene
  canEdit: boolean
  mine: boolean
}) {
  const navigate = useNavigate()
  const playing = usePlayer((s) => s.sceneId === scene.id)
  const { music, ambiences, effects } = scene.data

  const start = () => {
    void engine.playScene(scene)
    navigate(`/scenes/${scene.id}`)
  }

  return (
    <article className="group relative overflow-hidden rounded-xl bg-peat-800 ring-1 ring-peat-700 has-[:focus-visible]:ring-brass">
      <div
        className="aspect-[16/7] bg-cover bg-center"
        style={{
          backgroundImage: scene.bannerPath
            ? `url(/banners/${encodeURIComponent(scene.bannerPath)})`
            : sceneGradient(scene.name, scene.tags),
        }}
      />
      <div className="p-4 pt-3">
        <Link
          to={`/scenes/${scene.id}`}
          className="block font-display text-xl leading-tight font-bold outline-none"
        >
          <span className="absolute inset-0" aria-hidden />
          {scene.name}
        </Link>
        <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-ink-muted">
          <span className="text-brass">{music.length} music</span>
          <span className="text-lichen">{ambiences.length} ambience</span>
          <span className="text-arcane">{effects.length} effects</span>
        </p>
        {scene.tags.length > 0 && (
          <p className="mt-2 truncate text-sm text-ink-muted">{scene.tags.join(', ')}</p>
        )}
        <p className="mt-1 text-sm text-peat-400">
          {scene.visibility === 'private'
            ? 'Only you'
            : mine
              ? 'Shared with the group'
              : `Shared by ${scene.ownerName}`}
        </p>
      </div>
      <button
        type="button"
        onClick={start}
        aria-label={playing ? `${scene.name} is playing` : `Play ${scene.name}`}
        className={`absolute top-3 left-3 z-10 grid h-11 w-11 place-items-center rounded-full shadow-lg transition ${
          playing
            ? 'bg-brass text-peat-950'
            : 'bg-peat-950/70 text-ink hover:bg-brass hover:text-peat-950'
        }`}
      >
        {playing ? (
          <span className="animate-breathe text-lg">♪</span>
        ) : (
          <span className="ml-0.5">▶</span>
        )}
      </button>
      <div className="absolute top-3 right-3 z-10">
        <SceneMenu scene={scene} canEdit={canEdit} />
      </div>
    </article>
  )
}
