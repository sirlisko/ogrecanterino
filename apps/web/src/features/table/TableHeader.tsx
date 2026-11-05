import { Link } from 'react-router'
import { usePlayer } from '../../audio/store.ts'
import { DiscordControl } from '../discord/DiscordControl.tsx'
import { SceneArt } from '../scenes/art/SceneArt.tsx'
import { useSceneGlow } from '../scenes/art/useSceneGlow.ts'

const onArt =
  'rounded-lg bg-peat-950/70 px-4 py-3 text-ink-muted ring-1 ring-peat-600 hover:text-ink'

/** The live scene's picture across the top, lit by its sound, under the few ways out. */
export function TableHeader({ onPickScene }: { onPickScene: () => void }) {
  const scene = usePlayer((s) => s.scene)
  const glow = useSceneGlow(!!scene)

  return (
    // Only the picture is clipped: the Discord panel opens below the header.
    <header className="relative bg-peat-950">
      <div className="absolute inset-0 overflow-hidden">
        {scene && <SceneArt scene={scene} wide {...glow} className="absolute inset-0" />}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-peat-950/20 to-peat-900/75"
        />
      </div>
      <div className="relative flex min-h-28 flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
        <Link to={scene ? `/scenes/${scene.id}` : '/'} className={onArt}>
          Exit table mode
        </Link>
        <h1 className="order-first min-w-0 flex-1 basis-full truncate font-display text-4xl font-bold sm:order-none sm:basis-0">
          {scene?.name ?? 'Nothing playing'}
        </h1>
        <DiscordControl below />
        <button type="button" onClick={onPickScene} className={onArt}>
          Scenes
        </button>
        <button
          type="button"
          onClick={() =>
            document.fullscreenElement
              ? void document.exitFullscreen()
              : void document.documentElement.requestFullscreen()
          }
          className={onArt}
        >
          Full screen
        </button>
      </div>
    </header>
  )
}
