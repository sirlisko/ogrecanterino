import { useEffect, useState } from 'react'
import { DiscordStreamer } from '../../audio/discordOut.ts'
import { engine } from '../../audio/engine.ts'

export type StreamStatus = 'stopped' | 'streaming' | 'error'

let streamer: DiscordStreamer | null = null
let status: { value: StreamStatus; message?: string } = { value: 'stopped' }
const listeners = new Set<() => void>()

function getStreamer() {
  streamer ??= new DiscordStreamer((value, message) => {
    status = { value, message }
    for (const l of listeners) l()
  })
  return streamer
}

/** Module-level so the stream survives page navigation inside the app. */
export function useDiscordStream() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const l = () => rerender((n) => n + 1)
    listeners.add(l)
    return () => void listeners.delete(l)
  }, [])

  return {
    status: status.value,
    message: status.message,
    start: async () => {
      await engine.unlock()
      const stream = engine.outputStream
      if (stream) getStreamer().start(stream)
    },
    stop: () => getStreamer().stop(),
  }
}
