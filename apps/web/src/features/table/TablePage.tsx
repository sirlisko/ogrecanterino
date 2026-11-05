import { Link } from 'react-router'
import { useLibrarySync } from '../../app/Layout.tsx'
import { usePlayer } from '../../audio/store.ts'
import { HotkeyLayer } from '../../hotkeys/HotkeyLayer.tsx'
import { ErrorBoundary } from '../../ui/ErrorBoundary.tsx'
import { PageCrash } from '../../app/CrashNotice.tsx'
import { useGoToScene, useSetlist } from '../collections/useSetlist.ts'
import { EFFECT_KEYS, EffectPad } from '../player/EffectsLane.tsx'
import { ResumeToast } from '../player/ResumeToast.tsx'
import { useLiveScene } from '../player/useLiveScene.ts'
import { TableAmbience } from './TableAmbience.tsx'
import { TableControls } from './TableControls.tsx'
import { TableMixer } from './TableMixer.tsx'
import { TableMusic } from './TableMusic.tsx'
import { TablePads } from './TablePads.tsx'

/** Big touch targets for running a session from a tablet: no navigation, no editing. */
export function TablePage() {
  useLibrarySync()
  const scene = usePlayer((s) => s.scene)
  // Same working copy as the player page, so ambience switches save the same way.
  const live = useLiveScene(scene?.id)
  const setlist = useSetlist()
  const goTo = useGoToScene()

  return (
    <div className="flex min-h-dvh flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <Link
          to={scene ? `/scenes/${scene.id}` : '/'}
          className="rounded-lg px-4 py-3 text-ink-muted ring-1 ring-peat-600 hover:text-ink"
        >
          Exit table mode
        </Link>
        <h1 className="order-first min-w-0 flex-1 basis-full truncate font-display text-3xl font-bold sm:order-none sm:basis-0">
          {scene?.name ?? 'Nothing playing'}
        </h1>
        {setlist.previous && (
          <button
            type="button"
            onClick={() => setlist.previous && goTo(setlist.previous)}
            className="max-w-64 truncate rounded-lg px-4 py-3 text-ink-muted ring-1 ring-peat-600 hover:text-ink"
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
        <button
          type="button"
          onClick={() =>
            document.fullscreenElement
              ? void document.exitFullscreen()
              : void document.documentElement.requestFullscreen()
          }
          className="rounded-lg px-4 py-3 text-ink-muted ring-1 ring-peat-600 hover:text-ink"
        >
          Full screen
        </button>
      </header>

      <ErrorBoundary resetKey={scene?.id} fallback={(retry) => <PageCrash retry={retry} />}>
        {scene ? (
          <>
            <TableControls scene={scene} />
            <TableMixer />
            <TableMusic scene={scene} />
            <section aria-label="Effects">
              <h2 className="mb-3 font-display text-2xl font-bold text-arcane">Effects</h2>
              {scene.data.effects.length === 0 ? (
                <p className="text-ink-muted">No effects in this scene.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {scene.data.effects.map((card, i) => (
                    <EffectPad key={card.id} card={card} hotkey={EFFECT_KEYS[i]} active large />
                  ))}
                </div>
              )}
            </section>
            {live.scene?.id === scene.id && (
              <TableAmbience
                scene={scene}
                onCard={(id, patch) => live.updateCard('ambiences', id, patch)}
              />
            )}
          </>
        ) : (
          <p className="max-w-prose text-lg text-ink-muted">
            Start a scene to get its music and effects here.{' '}
            {!setlist.next && (
              <Link to="/" className="text-brass underline">
                Pick a scene
              </Link>
            )}
          </p>
        )}
        <TablePads />
      </ErrorBoundary>
      <HotkeyLayer />
      <ResumeToast />
    </div>
  )
}
