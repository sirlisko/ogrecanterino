import { useEffect } from 'react'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Toast } from '../../ui/Toast.tsx'

const SHOW_MS = 8000

/** `floating`: for pages without a transport bar to stack it on (table mode). */
export function ResumeToast({ floating }: { floating?: boolean }) {
  const faded = usePlayer((s) => s.faded)

  useEffect(() => {
    // A reload offer waits for the GM: they may take a moment to get back to the table.
    if (faded?.reason !== 'fadeOut') return
    const t = window.setTimeout(() => engine.dismissFaded(), SHOW_MS)
    return () => window.clearTimeout(t)
  }, [faded])

  if (!faded) return null
  return (
    <Toast
      action="Resume"
      onAction={() => void engine.resumeFaded()}
      onDismiss={() => engine.dismissFaded()}
      className={floating ? 'fixed inset-x-0 bottom-6 z-40 mx-auto' : ''}
    >
      {faded.reason === 'reload'
        ? `${faded.scene.name} was playing before the page reloaded`
        : `Faded out ${faded.scene.name}`}
    </Toast>
  )
}
