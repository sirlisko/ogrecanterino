import type { Scene } from '@ogre/shared'
import { useScene } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { combatSceneIdFor } from '../collections/setlist.ts'
import { useActiveCollectionData, useGoToScene, useSetlist } from '../collections/useSetlist.ts'

const big = 'min-h-14 rounded-xl px-5 py-3 text-lg ring-1'

/** Where the session goes next, and the controls a GM reaches for mid-sentence. */
export function TableStrip({ scene }: { scene: Scene | null }) {
  const setlist = useSetlist()
  const goTo = useGoToScene()
  const combat = usePlayer((s) => s.combat)
  const ducked = usePlayer((s) => s.ducked)
  const collection = useActiveCollectionData()
  const combatScene = useScene((scene && combatSceneIdFor(scene, collection)) ?? undefined).data
  const duck = (on: boolean) => () => engine.setDucked(on)

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-peat-700 px-4 py-3 sm:px-5">
      {setlist.previous && (
        <button
          type="button"
          onClick={() => setlist.previous && goTo(setlist.previous)}
          className={`max-w-72 truncate text-ink-muted ring-peat-600 hover:text-ink ${big}`}
        >
          Back: {setlist.previous.name}
        </button>
      )}
      {setlist.next && (
        <button
          type="button"
          onClick={() => setlist.next && goTo(setlist.next)}
          className={`max-w-72 truncate bg-brass font-medium text-peat-950 ring-brass ${big}`}
        >
          {scene ? 'Next' : 'Start'}: {setlist.next.name}
        </button>
      )}
      {scene && (
        <div className="ml-auto flex flex-wrap gap-2.5">
          <button
            type="button"
            aria-pressed={ducked}
            onPointerDown={duck(true)}
            onPointerUp={duck(false)}
            onPointerCancel={duck(false)}
            onPointerLeave={duck(false)}
            onContextMenu={(e) => e.preventDefault()}
            className={`touch-none select-none ${big} ${ducked ? 'bg-brass/20 text-brass ring-brass' : 'ring-peat-600'}`}
          >
            {ducked ? 'Music lowered' : 'Hold to talk'}
          </button>
          {combatScene && (
            <button
              type="button"
              onClick={() => engine.toggleCombat(combatScene)}
              className={`${big} ${combat ? 'bg-danger/20 text-danger ring-danger' : 'ring-peat-600'}`}
            >
              {combat ? 'End combat' : 'Combat'}
            </button>
          )}
          <button
            type="button"
            onClick={() => void engine.stopScene()}
            className={`ring-peat-600 ${big}`}
          >
            Fade out
          </button>
        </div>
      )}
    </div>
  )
}
