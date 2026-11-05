import type { Scene } from '@ogre/shared'
import { Link } from 'react-router'
import type { SaveStatus } from '../player/useLiveScene.ts'
import { artForTags, SCENE_ART_TITLES } from '../scenes/art/kinds.ts'
import { SceneArt } from '../scenes/art/SceneArt.tsx'
import { hasNoSounds } from './blankScene.ts'
import { SaveIndicator } from './SaveIndicator.tsx'

function pictureLabel(scene: Scene) {
  if (scene.bannerPath) return 'your upload'
  if (scene.data.art) return SCENE_ART_TITLES[scene.data.art]
  return `automatic (${SCENE_ART_TITLES[artForTags(scene.tags)]})`
}

/** The scene's picture across the page, with its name editable on top of it. */
export function EditorHeader({
  scene,
  status,
  error,
  onRename,
  picking,
  onTogglePicture,
}: {
  scene: Scene
  status: SaveStatus | 'unnamed'
  error?: string
  onRename: (name: string) => void
  picking: boolean
  onTogglePicture: () => void
}) {
  return (
    <header className="relative -mt-6 mb-6 mx-[calc(50%-50vw)] pt-20 pb-5">
      <SceneArt scene={scene} wide className="absolute inset-0" />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-transparent from-20% to-peat-900"
      />
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-end gap-x-5 gap-y-3 px-4">
        <div className="min-w-0 flex-[1_1_26rem]">
          <input
            value={scene.name}
            onChange={(e) => onRename(e.target.value)}
            aria-label="Scene name"
            className="w-full border-b-2 border-ink/25 bg-transparent pb-0.5 font-display text-4xl leading-tight font-bold outline-none focus:border-brass sm:text-5xl"
          />
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-ink-muted">
            <SaveIndicator status={status} error={error} />
            <span>Picture: {pictureLabel(scene)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-expanded={picking}
            onClick={onTogglePicture}
            className={`rounded-lg px-4 py-2 ring-1 ring-peat-600 ${picking ? 'bg-peat-700' : 'bg-peat-950/80 hover:bg-peat-800'}`}
          >
            Change picture
          </button>
          {/* An empty scene has nothing to play, so the accent waits for its first sound. */}
          {hasNoSounds(scene) ? (
            <button
              type="button"
              disabled
              title="Add a sound to the scene first"
              className="rounded-lg bg-peat-950/80 px-4 py-2 text-ink-muted ring-1 ring-peat-600 disabled:opacity-60"
            >
              Open player
            </button>
          ) : (
            <Link
              to={`/scenes/${scene.id}`}
              className="rounded-lg bg-brass px-4 py-2 font-medium text-peat-950 hover:bg-[#e6ba5e]"
            >
              Open player
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
