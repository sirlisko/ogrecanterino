import type { SaveStatus } from '../player/useLiveScene.ts'

const TEXT: Record<SaveStatus | 'unnamed', string> = {
  idle: 'Changes save automatically',
  pending: 'Saving…',
  saving: 'Saving…',
  saved: 'Saved',
  error: "Couldn't save",
  unnamed: 'Name the scene to save it',
}

export function SaveIndicator({
  status,
  error,
}: {
  status: SaveStatus | 'unnamed'
  error?: string
}) {
  const bad = status === 'error' || status === 'unnamed'
  return (
    <span role="status" className={`text-sm ${bad ? 'text-danger' : 'text-ink-muted'}`}>
      {TEXT[status]}
      {status === 'error' && error && `: ${error}`}
    </span>
  )
}
