import { Button } from '../../ui/Button.tsx'
import type { useLiveScene } from './useLiveScene.ts'

type Live = Pick<ReturnType<typeof useLiveScene>, 'saveStatus' | 'keepMine' | 'loadNewer'>

/** Shown instead of silently overwriting edits made in another tab or on another device. */
export function SaveConflict({ live, className = '' }: { live: Live; className?: string }) {
  if (live.saveStatus !== 'conflict') return null
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center gap-3 rounded-lg bg-danger/10 px-3 py-2 ring-1 ring-danger/40 ${className}`}
    >
      <p className="min-w-48 flex-1">
        This scene was changed somewhere else, so your latest edits aren't saved.
      </p>
      <Button onClick={() => void live.loadNewer()}>Load the newer version</Button>
      <Button onClick={live.keepMine}>Keep mine</Button>
    </div>
  )
}
