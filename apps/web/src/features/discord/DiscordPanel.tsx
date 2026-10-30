import {
  type DiscordStatus,
  useConnectVoice,
  useDisconnectVoice,
  useVoiceChannels,
} from '../../api/discord.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Button } from '../../ui/Button.tsx'
import type { useDiscordStream } from './useDiscordStream.ts'

type Stream = ReturnType<typeof useDiscordStream>

export function DiscordPanel({ status, stream }: { status: DiscordStatus; stream: Stream }) {
  const session = status.session
  const channels = useVoiceChannels(status.ready && !session)
  const connect = useConnectVoice()
  const disconnect = useDisconnectVoice()
  const monitor = usePlayer((s) => s.monitor)

  if (!status.ready)
    return (
      <p className="text-sm text-ink-muted">
        The bot is starting or couldn't log in. Check the server logs.
      </p>
    )

  if (session) {
    const live = stream.status === 'streaming'
    return (
      <div className="flex flex-col gap-3">
        <p>
          Bot is in <strong>#{session.channelName}</strong>
        </p>
        {live ? (
          <Button onClick={stream.stop}>Stop sending audio</Button>
        ) : (
          <Button variant="primary" onClick={() => void stream.start()}>
            Send audio to Discord
          </Button>
        )}
        {stream.status === 'error' && (
          <p className="text-sm text-danger">
            {stream.message ?? 'The stream dropped. Send audio again.'}
          </p>
        )}
        {live && monitor && (
          <button
            type="button"
            onClick={() => engine.setMonitor(false)}
            className="text-left text-sm text-ink-muted underline hover:text-ink"
          >
            Hearing it twice? Mute this device and listen in Discord.
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            stream.stop()
            disconnect.mutate()
          }}
          className="text-left text-sm text-ink-muted hover:text-danger"
        >
          Disconnect bot
        </button>
      </div>
    )
  }

  const list = channels.data ?? []
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-muted">Pick a voice channel for the bot to join.</p>
      {channels.isPending && <p className="text-sm text-ink-muted">Loading channels…</p>}
      {channels.data && list.length === 0 && (
        <p className="text-sm text-ink-muted">
          No voice channels found. The bot must be in your Discord server
          {status.inviteUrl && (
            <>
              {' '}
              (
              <a href={status.inviteUrl} target="_blank" rel="noreferrer" className="underline">
                invite it
              </a>
              )
            </>
          )}
          .
        </p>
      )}
      <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
        {list.map((c) => (
          <li key={c.channelId}>
            <button
              type="button"
              disabled={connect.isPending}
              onClick={async () => {
                await connect.mutateAsync({ guildId: c.guildId, channelId: c.channelId })
                await stream.start()
              }}
              className="w-full rounded-lg px-3 py-2 text-left hover:bg-peat-700 disabled:opacity-50"
            >
              <span className="block">#{c.channelName}</span>
              <span className="block text-sm text-ink-muted">
                {c.guildName}
                {c.userIsHere && ', you’re here'}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {connect.error && <p className="text-sm text-danger">{connect.error.message}</p>}
    </div>
  )
}
