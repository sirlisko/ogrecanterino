import { useState } from 'react'
import { useLibrarySync } from '../../app/Layout.tsx'
import { usePlayer } from '../../audio/store.ts'
import { HotkeyLayer } from '../../hotkeys/HotkeyLayer.tsx'
import { Button } from '../../ui/Button.tsx'
import { ErrorBoundary } from '../../ui/ErrorBoundary.tsx'
import { PageCrash } from '../../app/CrashNotice.tsx'
import { OfflineBanner } from '../offline/OfflineBanner.tsx'
import { EFFECT_KEYS, EffectPad } from '../player/EffectsLane.tsx'
import { ResumeToast } from '../player/ResumeToast.tsx'
import { SaveConflict } from '../player/SaveConflict.tsx'
import { useLiveScene } from '../player/useLiveScene.ts'
import { ScenePicker } from './ScenePicker.tsx'
import { TableAmbience } from './TableAmbience.tsx'
import { TableControls } from './TableControls.tsx'
import { TableHeader } from './TableHeader.tsx'
import { TableMixer } from './TableMixer.tsx'
import { TableMusic } from './TableMusic.tsx'
import { TablePads } from './TablePads.tsx'
import { TableStrip } from './TableStrip.tsx'

/** Big touch targets for running a session from a tablet: no navigation, no editing. */
export function TablePage() {
  useLibrarySync()
  const scene = usePlayer((s) => s.scene)
  // Same working copy as the player page, so ambience switches save the same way.
  const live = useLiveScene(scene?.id)
  const [picking, setPicking] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col">
      <OfflineBanner />
      <TableHeader onPickScene={() => setPicking(true)} />
      <TableStrip scene={scene} />
      <SaveConflict live={live} className="m-4 mb-0 sm:mx-5" />
      <ErrorBoundary resetKey={scene?.id} fallback={(retry) => <PageCrash retry={retry} />}>
        {scene ? (
          <main className="flex flex-1 flex-wrap items-start gap-5 p-4 sm:p-5">
            <div className="flex min-w-0 flex-[1_1_34rem] flex-col gap-5">
              <TableControls scene={scene} />
              <div className="lg:hidden">
                <TableMixer compact />
              </div>
              <TableMusic scene={scene} />
              <section aria-label="Effects">
                <h2 className="mb-3 font-display text-2xl font-bold text-arcane">Effects</h2>
                {scene.data.effects.length === 0 ? (
                  <p className="text-ink-muted">No effects in this scene.</p>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
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
              <TablePads />
            </div>
            <div className="hidden min-w-[17rem] flex-[0_1_22rem] lg:sticky lg:top-4 lg:block">
              <TableMixer />
            </div>
          </main>
        ) : (
          <div className="flex flex-col items-start gap-4 p-4 sm:p-5">
            <p className="max-w-prose text-lg text-ink-muted">
              Start a scene to get its music and effects here.
            </p>
            <Button
              variant="primary"
              className="px-5 py-3 text-lg"
              onClick={() => setPicking(true)}
            >
              Pick a scene
            </Button>
            <TablePads />
          </div>
        )}
      </ErrorBoundary>
      {picking && <ScenePicker onClose={() => setPicking(false)} />}
      <HotkeyLayer />
      <ResumeToast floating />
    </div>
  )
}
