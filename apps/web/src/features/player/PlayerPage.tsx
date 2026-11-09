import type { SceneSection, SceneSettings } from '@ogre/shared'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useScene } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Button } from '../../ui/Button.tsx'
import { combatSceneIdFor } from '../collections/setlist.ts'
import { hasNoSounds, NO_SOUNDS_HINT } from '../editor/blankScene.ts'
import { useActiveCollectionData } from '../collections/useSetlist.ts'
import { SceneArt } from '../scenes/art/SceneArt.tsx'
import { useSceneGlow } from '../scenes/art/useSceneGlow.ts'
import { AmbienceLane } from './AmbienceLane.tsx'
import { EffectsLane } from './EffectsLane.tsx'
import { LaneTabs } from './LaneTabs.tsx'
import { MusicLane } from './MusicLane.tsx'
import { SaveConflict } from './SaveConflict.tsx'
import { useLiveScene } from './useLiveScene.ts'

export function PlayerPage() {
  const { id } = useParams()
  const live = useLiveScene(id)
  const { scene, canEdit, isPending, error, updateData, updateCard } = live
  const active = usePlayer((s) => s.sceneId === id)
  const combat = usePlayer((s) => s.combat)
  const collection = useActiveCollectionData()
  const combatScene = useScene((scene && combatSceneIdFor(scene, collection)) ?? undefined).data
  const [tab, setTab] = useState<SceneSection>('music')
  const glow = useSceneGlow(active)

  if (isPending) return <p className="text-ink-muted">Loading scene…</p>
  if (error || !scene) {
    return (
      <p className="text-ink-muted">
        This scene doesn't exist or isn't shared with you.{' '}
        <Link to="/" className="text-brass underline">
          Back to scenes
        </Link>
      </p>
    )
  }

  const onSettings = (patch: Partial<SceneSettings>) =>
    updateData((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
  // min-w-0 lets long labels truncate inside the grid columns.
  const shown = (section: SceneSection) => `min-w-0 ${tab === section ? '' : 'max-lg:hidden'}`

  return (
    <>
      {/* The same height playing or not, so starting a scene doesn't shift the lanes under the cursor. */}
      <header className="relative -mt-6 mb-4 mx-[calc(50%-50vw)] py-3 sm:py-4">
        <SceneArt scene={scene} wide {...glow} className="absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-r from-peat-900/90 via-peat-900/50 to-peat-900/10"
        />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4">
          <div className="min-w-0 flex-[1_1_16rem]">
            <h1 className="truncate font-display text-2xl leading-tight font-bold sm:text-3xl">
              {scene.name}
            </h1>
            <p
              className={`mt-0.5 flex items-center gap-2 text-[15px] ${active ? 'text-ink' : 'text-ink-muted'}`}
            >
              <span
                aria-hidden
                className={`h-2 w-2 shrink-0 rounded-full ${active ? 'animate-breathe bg-brass' : 'bg-peat-400'}`}
              />
              <span className="truncate">
                {active
                  ? 'Playing for the table. Clicks are heard by everyone.'
                  : 'Not playing. Clicks play on this device only.'}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {active ? (
              // From a tablet up, the transport bar has its own Fade out.
              <Button className="sm:hidden" onClick={() => void engine.stopScene()}>
                Fade out
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={hasNoSounds(scene)}
                title={hasNoSounds(scene) ? NO_SOUNDS_HINT : undefined}
                onClick={() => void engine.playScene(scene)}
              >
                Start scene
              </Button>
            )}
            {combatScene && (
              <Button
                variant={combat ? 'danger' : 'quiet'}
                disabled={!active}
                onClick={() => engine.toggleCombat(combatScene)}
                title={`Switch music to "${combatScene.name}" (C)`}
              >
                {combat ? 'End combat' : 'Combat'}
              </Button>
            )}
            <Link
              to="/table"
              className="rounded-lg bg-peat-800 px-4 py-2 text-ink ring-1 ring-peat-600 hover:bg-peat-700"
            >
              Table mode
            </Link>
            {canEdit && (
              <Link
                to={`/scenes/${scene.id}/edit`}
                className="rounded-lg bg-peat-800 px-4 py-2 text-ink ring-1 ring-peat-600 hover:bg-peat-700"
              >
                Edit
              </Link>
            )}
          </div>
        </div>
      </header>

      <SaveConflict live={live} className="mb-4" />
      {!canEdit && (
        <p className="mb-4 text-sm text-peat-400">
          Tweaks to a shared scene aren't saved. Duplicate it to keep your own version.
        </p>
      )}

      <LaneTabs
        value={tab}
        onChange={setTab}
        counts={{
          music: scene.data.music.length,
          ambiences: scene.data.ambiences.length,
          effects: scene.data.effects.length,
        }}
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr_1.15fr]">
        <div className={shown('music')}>
          <MusicLane
            scene={scene}
            active={active}
            onCard={(cid, p) => updateCard('music', cid, p)}
            onSettings={onSettings}
          />
        </div>
        <div className={shown('ambiences')}>
          <AmbienceLane
            scene={scene}
            active={active}
            onCard={(cid, p) => updateCard('ambiences', cid, p)}
          />
        </div>
        <div className={shown('effects')}>
          <EffectsLane scene={scene} active={active} />
        </div>
      </div>
    </>
  )
}
