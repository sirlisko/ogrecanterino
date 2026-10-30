import type { SceneSettings } from '@ogre/shared'
import { Link, useParams } from 'react-router'
import { useScene } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Button } from '../../ui/Button.tsx'
import { PadsStrip } from '../pads/PadsStrip.tsx'
import { sceneGradient } from '../scenes/sceneArt.ts'
import { AmbienceLane } from './AmbienceLane.tsx'
import { EffectsLane } from './EffectsLane.tsx'
import { MusicLane } from './MusicLane.tsx'
import { useLiveScene } from './useLiveScene.ts'

export function PlayerPage() {
  const { id } = useParams()
  const { scene, canEdit, isPending, error, updateData, updateCard } = useLiveScene(id)
  const active = usePlayer((s) => s.sceneId === id)
  const combat = usePlayer((s) => s.combat)
  const combatScene = useScene(scene?.combatSceneId ?? undefined).data

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

  return (
    <>
      <header
        className="-mx-4 -mt-6 mb-6 bg-cover bg-center px-4 pt-14 pb-5"
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent, var(--color-peat-900)), ${
            scene.bannerPath
              ? `url(/banners/${encodeURIComponent(scene.bannerPath)})`
              : sceneGradient(scene.name, scene.tags)
          }`,
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-4">
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
              <Button onClick={() => void engine.stopScene()}>Fade out scene</Button>
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

      {!canEdit && (
        <p className="mb-4 text-sm text-peat-400">
          Tweaks to a shared scene aren't saved. Duplicate it to keep your own version.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr_1.15fr]">
        <MusicLane
          scene={scene}
          active={active}
          onCard={(cid, p) => updateCard('music', cid, p)}
          onSettings={onSettings}
        />
        <AmbienceLane
          scene={scene}
          active={active}
          onCard={(cid, p) => updateCard('ambiences', cid, p)}
        />
        <EffectsLane scene={scene} active={active} />
      </div>

      <PadsStrip />
    </>
  )
}
