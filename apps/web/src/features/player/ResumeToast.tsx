import { useEffect } from 'react'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Icon } from '../../ui/Icon.tsx'

const SHOW_MS = 8000

export function ResumeToast() {
  const faded = usePlayer((s) => s.faded)

  useEffect(() => {
    if (!faded) return
    const t = window.setTimeout(() => engine.dismissFaded(), SHOW_MS)
    return () => window.clearTimeout(t)
  }, [faded])

  if (!faded) return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-20 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl bg-peat-700 py-2 pr-2 pl-4 shadow-2xl ring-1 ring-peat-600"
    >
      <span className="truncate">Faded out {faded.scene.name}</span>
      <button
        type="button"
        onClick={() => void engine.resumeFaded()}
        className="rounded-lg bg-brass px-3 py-1.5 font-medium text-peat-950"
      >
        Resume
      </button>
      <button
        type="button"
        onClick={() => engine.dismissFaded()}
        aria-label="Dismiss"
        className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:text-ink"
      >
        <Icon name="close" />
      </button>
    </div>
  )
}
