import type { Scene } from '@ogre/shared'
import { Link } from 'react-router'
import { engine } from '../../audio/engine.ts'
import { Button } from '../../ui/Button.tsx'
import { Icon } from '../../ui/Icon.tsx'
import { SceneArt } from '../scenes/art/SceneArt.tsx'
import { SceneCounts } from '../scenes/SceneCounts.tsx'
import { useConfirmStart } from '../scenes/useConfirmStart.ts'
import type { StepStatus } from './setlist.ts'

const DOT: Record<StepStatus, string> = {
  live: 'bg-brass text-peat-950',
  next: 'bg-peat-900 text-brass ring-2 ring-brass ring-inset',
  played: 'bg-peat-700 text-ink-muted',
  later: 'bg-peat-900 text-ink-muted ring-2 ring-peat-600 ring-inset',
}

/** One numbered step of a collection, joined to its neighbours by the rail on the left. */
export function SetlistStep({
  scene,
  position,
  status,
  first,
  last,
}: {
  scene: Scene
  position: number
  status: StepStatus
  first: boolean
  last: boolean
}) {
  const confirm = useConfirmStart(scene.id)
  const start = () => void engine.playScene(scene)
  const played = status === 'played'

  return (
    <li
      className={`grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 rounded-xl py-2.5 pr-3.5 pl-1.5 sm:grid-cols-[2.75rem_10rem_minmax(0,1fr)_auto] ${status === 'live' ? 'bg-brass/9' : ''}`}
    >
      <div className="relative -my-2.5 grid place-items-center self-stretch">
        <span
          aria-hidden
          className={`absolute left-1/2 w-0.5 -translate-x-1/2 bg-peat-700 ${first ? 'top-1/2' : 'top-0'} ${last ? 'bottom-1/2' : 'bottom-0'}`}
        />
        <span
          className={`relative grid h-[34px] w-[34px] place-items-center rounded-full text-[15px] font-bold tabular ${DOT[status]}`}
        >
          {played ? (
            <>
              <Icon name="check" />
              <span className="sr-only">{position}</span>
            </>
          ) : (
            position
          )}
        </span>
      </div>
      <div className={`hidden overflow-hidden rounded-lg sm:block ${played ? 'opacity-60' : ''}`}>
        <SceneArt scene={scene} className="h-14" />
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-xl leading-tight font-bold">
          <Link to={`/scenes/${scene.id}`} className={played ? 'text-ink-muted' : ''}>
            {scene.name}
          </Link>
        </h3>
        <div className="mt-0.5 flex flex-wrap gap-x-2.5 text-sm">
          {scene.tags.length > 0 && <span className="text-ink-muted">{scene.tags.join(', ')}</span>}
          <SceneCounts scene={scene} />
        </div>
      </div>
      <div className="col-start-2 flex flex-wrap items-center gap-x-3.5 gap-y-2 sm:col-start-auto sm:justify-end">
        {status === 'live' && (
          <>
            <span className="flex items-center gap-2 font-medium text-brass">
              <span aria-hidden className="h-2 w-2 animate-breathe rounded-full bg-brass" />
              Playing for the table
            </span>
            <Button onClick={() => void engine.stopScene()}>Fade out</Button>
          </>
        )}
        {status === 'next' && (
          <>
            <span className="flex items-center gap-2">
              Up next
              <kbd className="grid h-[22px] min-w-[22px] place-items-center rounded border-b-2 border-peat-950 bg-peat-600 px-1 font-sans text-xs tabular">
                ]
              </kbd>
            </span>
            {/* As deliberate as pressing ], so it skips the second click. */}
            <Button variant="primary" onClick={start}>
              Start scene
            </Button>
          </>
        )}
        {(status === 'played' || status === 'later') && (
          <>
            {played && <span className="text-ink-muted">Played</span>}
            <Button
              variant={confirm.armed ? 'primary' : 'quiet'}
              onClick={() => confirm.attempt(start)}
              aria-label={
                confirm.armed
                  ? `Click again to replace the playing scene with ${scene.name}`
                  : `Start scene: ${scene.name}`
              }
            >
              {confirm.armed ? 'Start scene?' : 'Start scene'}
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
