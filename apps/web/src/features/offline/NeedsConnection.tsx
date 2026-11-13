import { type ReactNode, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useOnline } from './useOnline.ts'

/**
 * Keeps the editor closed while offline, where nothing in it could be saved. Only checked on the
 * way in: losing the network mid-edit leaves the editor open, showing that saves are failing.
 */
export function NeedsConnection({ children }: { children: ReactNode }) {
  const online = useOnline()
  const { id } = useParams()
  const [opened, setOpened] = useState(online)
  if (online && !opened) setOpened(true)
  if (opened) return children

  return (
    <div className="max-w-prose">
      <h1 className="font-display text-3xl font-bold">Editing needs a connection</h1>
      <p className="mt-3 text-ink-muted">
        You're offline, so changes to this scene wouldn't be saved. The editor opens here as soon as
        you reconnect.
      </p>
      <Link to={`/scenes/${id}`} className="mt-4 inline-block underline hover:text-ink">
        Back to the scene
      </Link>
    </div>
  )
}
