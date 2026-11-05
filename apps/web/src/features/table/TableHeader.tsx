import { Link } from 'react-router'
import { usePlayer } from '../../audio/store.ts'
import { useGoToScene, useSetlist } from '../collections/useSetlist.ts'
import { DiscordControl } from '../discord/DiscordControl.tsx'

const quiet = 'rounded-lg px-4 py-3 text-ink-muted ring-1 ring-peat-600 hover:text-ink'

export function TableHeader({ onPickScene }: { onPickScene: () => void }) {
  const scene = usePlayer((s) => s.scene)
  const setlist = useSetlist()
  const goTo = useGoToScene()

  return (
    <header className="flex flex-wrap items-center gap-3">
      <Link to={scene ? `/scenes/${scene.id}` : '/'} className={quiet}>
        Exit table mode
      </Link>
      <h1 className="order-first min-w-0 flex-1 basis-full truncate font-display text-3xl font-bold sm:order-none sm:basis-0">
        {scene?.name ?? 'Nothing playing'}
      </h1>
      <button type="button" onClick={onPickScene} className={quiet}>
        Scenes
      </button>
      {setlist.previous && (
        <button
          type="button"
          onClick={() => setlist.previous && goTo(setlist.previous)}
          className={`max-w-64 truncate ${quiet}`}
        >
          Back: {setlist.previous.name}
        </button>
      )}
      {setlist.next && (
        <button
          type="button"
          onClick={() => setlist.next && goTo(setlist.next)}
          className="max-w-64 truncate rounded-lg bg-brass px-4 py-3 font-medium text-peat-950"
        >
          {scene ? 'Next' : 'Start'}: {setlist.next.name}
        </button>
      )}
      <DiscordControl below />
      <button
        type="button"
        onClick={() =>
          document.fullscreenElement
            ? void document.exitFullscreen()
            : void document.documentElement.requestFullscreen()
        }
        className={quiet}
      >
        Full screen
      </button>
    </header>
  )
}
