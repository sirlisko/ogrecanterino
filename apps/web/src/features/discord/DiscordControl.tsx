import { useEffect } from 'react'
import { useDiscordStatus } from '../../api/discord.ts'
import { canStreamToDiscord } from '../../audio/discordOut.ts'
import { Popover } from '../../ui/Popover.tsx'
import { DiscordPanel } from './DiscordPanel.tsx'
import { type StreamStatus, useDiscordStream } from './useDiscordStream.ts'

const LABELS: Record<StreamStatus, { full: string; short: string }> = {
  streaming: { full: 'Live on Discord', short: 'DC' },
  reconnecting: { full: 'Reconnecting to Discord', short: 'DC…' },
  // Shown in full on phones too: the table may be hearing silence.
  error: { full: 'Discord stream dropped', short: 'Discord dropped' },
  stopped: { full: 'Discord', short: 'DC' },
}

/** `below`: for a trigger at the top of the screen (table mode) instead of in the transport bar. */
export function DiscordControl({ below }: { below?: boolean }) {
  const { data: status, refetch } = useDiscordStatus()
  const stream = useDiscordStream()
  // The bot can leave without this page asking (a kick, a lost connection), so the panel re-checks.
  useEffect(() => void refetch(), [stream.status, refetch])
  if (!status?.configured) return null

  const label = LABELS[stream.status]
  const dot = {
    streaming: 'animate-breathe bg-[#5865f2]',
    reconnecting: 'animate-breathe bg-brass',
    error: 'bg-danger',
    stopped: status.session ? 'bg-ink-muted' : 'bg-peat-600',
  }[stream.status]

  return (
    <Popover
      label="Discord"
      alert={stream.status === 'error'}
      below={below}
      trigger={
        <span className="flex items-center gap-2">
          <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
          <span className="hidden sm:inline">{label.full}</span>
          <span className="sm:hidden">{label.short}</span>
        </span>
      }
    >
      {canStreamToDiscord() ? (
        <DiscordPanel status={status} stream={stream} />
      ) : (
        <p className="text-sm text-ink-muted">
          This browser can't record audio for Discord. Use Chrome, Edge or Firefox.
        </p>
      )}
    </Popover>
  )
}
