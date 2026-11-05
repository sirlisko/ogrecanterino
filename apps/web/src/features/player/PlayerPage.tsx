import type { SceneSection, SceneSettings } from '@ogre/shared'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useScene } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Button } from '../../ui/Button.tsx'
import { combatSceneIdFor } from '../collections/setlist.ts'
import { useActiveCollectionData } from '../collections/useSetlist.ts'
import { SceneArt } from '../scenes/art/SceneArt.tsx'
import { useSceneGlow } from '../scenes/art/useSceneGlow.ts'
import { AmbienceLane } from './AmbienceLane.tsx'
import { EffectsLane } from './EffectsLane.tsx'
import { LaneTabs } from './LaneTabs.tsx'
import { MusicLane } from './MusicLane.tsx'
import { useLiveScene } from './useLiveScene.ts'

export function PlayerPage() {
  const { id } = useParams()
  const { scene, canEdit, isPending, error, updateData, updateCard } = useLiveScene(id)
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
      <header className="relative -mt-6 mb-6 mx-[calc(50%-50vw)] pt-20 pb-5">
        <SceneArt scene={scene} wide glowRef={glow} className="absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-transparent from-30% to-peat-900"
        />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-end gap-4 px-4">
          <div className="min-w-0">
            <h1 className="font-display text-4xl leading-tight font-bold text-balance sm:text-5xl">
              {scene.name}
            </h1>
            {scene.tags.length > 0 && (
              <p className="mt-1 text-ink-muted">{scene.tags.join(', ')}</p>
            )}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {active ? (
              <Button onClick={() => void engine.stopScene()}>Fade out</Button>
            ) : (
              <Button variant="primary" onClick={() => void engine.playScene(scene)}>
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
              className="rounded-lg px-4 py-2 text-ink-muted ring-1 ring-peat-600 hover:text-ink"
            >
              Table mode
            </Link>
            {canEdit && (
              <Link
                to={`/scenes/${scene.id}/edit`}
                className="rounded-lg px-4 py-2 text-ink-muted ring-1 ring-peat-600 hover:text-ink"
              >
                Edit
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Both states keep the same slot, so starting the scene doesn't shift the lanes under the cursor. */}
      {active ? (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-brass/10 px-3 py-2 text-ink ring-1 ring-brass/40">
          <span aria-hidden className="h-2 w-2 shrink-0 animate-breathe rounded-full bg-brass" />
          Playing for the table. Tracks and effects you click here are heard by everyone.
        </p>
      ) : (
        <p className="mb-4 rounded-lg bg-peat-800 px-3 py-2 text-ink-muted ring-1 ring-peat-700">
          Not playing. Tracks and effects you click play on this device only, so you can prepare
          without interrupting the table.
        </p>
      )}
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
