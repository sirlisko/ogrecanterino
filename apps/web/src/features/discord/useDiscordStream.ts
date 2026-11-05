import { useEffect, useState } from 'react'
import { api, ApiError, json } from '../../api/client.ts'
import { DiscordStreamer } from '../../audio/discordOut.ts'
import { engine } from '../../audio/engine.ts'
import { afterClose } from './reconnect.ts'

export type StreamStatus = 'stopped' | 'streaming' | 'reconnecting' | 'error'

export interface VoiceTarget {
  guildId: string
  channelId: string
}

let streamer: DiscordStreamer | null = null
let status: { value: StreamStatus; message?: string } = { value: 'stopped' }
/** Where the bot should be, so a stream that lost its voice session can rejoin by itself. */
let target: VoiceTarget | null = null
let retry: { attempt: number; since: number; timer: number } | null = null
const listeners = new Set<() => void>()

function setStatus(value: StreamStatus, message?: string) {
  status = { value, message }
  for (const l of listeners) l()
}

function cancelRetry() {
  if (retry) window.clearTimeout(retry.timer)
  retry = null
}

function getStreamer() {
  streamer ??= new DiscordStreamer(
    () => {
      cancelRetry()
      setStatus('streaming')
    },
    (code, reason) => onDrop(code, reason),
  )
  return streamer
}

function open() {
  const stream = engine.outputStream
  if (stream) getStreamer().start(stream)
}

function onDrop(code: number, reason: string) {
  const attempt = retry?.attempt ?? 0
  const since = retry?.since ?? Date.now()
  const outcome = afterClose(code, reason, attempt, Date.now() - since)
  if (outcome.action === 'stop') {
    cancelRetry()
    return setStatus('stopped')
  }
  if (outcome.action === 'fail' || (outcome.rejoin && !target)) {
    cancelRetry()
    return setStatus('error', (outcome.action === 'fail' && outcome.message) || undefined)
  }
  setStatus('reconnecting')
  const timer = window.setTimeout(async () => {
    try {
      if (outcome.rejoin && target) await api('/api/discord/connect', json('POST', target))
      open()
    } catch (e) {
      // Another GM took the bot, or the channel is gone: retrying won't help.
      if (e instanceof ApiError && e.status < 500) {
        cancelRetry()
        setStatus('error', e.message)
      } else onDrop(1006, '')
    }
  }, outcome.delayMs)
  retry = { attempt: attempt + 1, since, timer }
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
    start: async (to: VoiceTarget) => {
      target = to
      cancelRetry()
      await engine.unlock()
      open()
    },
    stop: () => {
      target = null
      cancelRetry()
      getStreamer().stop()
      setStatus('stopped')
    },
  }
}
