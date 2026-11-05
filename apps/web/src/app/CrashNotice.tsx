import { Link } from 'react-router'
import { engine } from '../audio/engine.ts'
import { Button } from '../ui/Button.tsx'

/** Shown in place of a page that crashed; the transport bar and hotkeys stay usable around it. */
export function PageCrash({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="max-w-prose">
      <h1 className="font-display text-3xl font-bold">This page stopped working</h1>
      <p className="mt-2 text-ink-muted">
        Anything playing keeps playing. Fade it out here if you need to, then try the page again.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="primary" onClick={retry}>
          Try again
        </Button>
        <Button onClick={() => void engine.stopScene()}>Fade out</Button>
        <Link
          to="/"
          className="rounded-lg px-4 py-2 text-ink-muted ring-1 ring-peat-600 hover:text-ink"
        >
          Back to scenes
        </Link>
      </div>
    </div>
  )
}

/** Last resort when the whole app crashed: the audio engine may still be playing with no controls. */
export function AppCrash() {
  return (
    <main role="alert" className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-prose">
        <h1 className="font-display text-3xl font-bold">Ogre Canterino stopped working</h1>
        <p className="mt-2 text-ink-muted">
          Fade out first if anything is still playing, then reload the page.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => void engine.stopScene()}>Fade out</Button>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </main>
  )
}
