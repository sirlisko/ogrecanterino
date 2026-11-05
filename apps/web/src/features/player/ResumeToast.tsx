import { useEffect } from 'react'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Icon } from '../../ui/Icon.tsx'

const SHOW_MS = 8000

/** `aboveBar`: rendered inside the transport bar, so it clears the bar and its pads at any height. */
export function ResumeToast({ aboveBar }: { aboveBar?: boolean }) {
  const faded = usePlayer((s) => s.faded)

  useEffect(() => {
    // A reload offer waits for the GM: they may take a moment to get back to the table.
    if (faded?.reason !== 'fadeOut') return
    const t = window.setTimeout(() => engine.dismissFaded(), SHOW_MS)
    return () => window.clearTimeout(t)
  }, [faded])

  if (!faded) return null
  return (
    <div
      role="status"
      className={`${aboveBar ? 'absolute bottom-full mb-3' : 'fixed bottom-6'} inset-x-0 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl bg-peat-700 py-2 pr-2 pl-4 shadow-2xl ring-1 ring-peat-600`}
    >
      <span className="line-clamp-2 min-w-0">
        {faded.reason === 'reload'
          ? `${faded.scene.name} was playing before the page reloaded`
          : `Faded out ${faded.scene.name}`}
      </span>
      <button
        type="button"
        onClick={() => void engine.resumeFaded()}
        className="shrink-0 rounded-lg bg-brass px-3 py-1.5 font-medium text-peat-950"
      >
        Resume
      </button>
      <button
        type="button"
        onClick={() => engine.dismissFaded()}
        aria-label="Dismiss"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted hover:text-ink"
      >
        <Icon name="close" />
      </button>
    </div>
  )
}
