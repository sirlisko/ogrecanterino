import { useDiscordStatus } from '../../api/discord.ts'
import { canStreamToDiscord } from '../../audio/discordOut.ts'
import { Popover } from '../../ui/Popover.tsx'
import { DiscordPanel } from './DiscordPanel.tsx'
import { useDiscordStream } from './useDiscordStream.ts'

export function DiscordControl() {
  const status = useDiscordStatus().data
  const stream = useDiscordStream()
  if (!status?.configured) return null

  const live = stream.status === 'streaming'
  return (
    <Popover
      label="Discord"
      trigger={
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${live ? 'animate-breathe bg-[#5865f2]' : status.session ? 'bg-ink-muted' : 'bg-peat-600'}`}
          />
          <span className="hidden sm:inline">{live ? 'Live on Discord' : 'Discord'}</span>
          <span className="sm:hidden">DC</span>
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
