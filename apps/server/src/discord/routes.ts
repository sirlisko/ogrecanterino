import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authed } from '../http/auth.ts'
import { parseBody } from '../http/body.ts'
import type { DiscordBot } from './bot.ts'
import type { VoiceSessions } from './voiceSessions.ts'

const connectBody = z.object({ guildId: z.string(), channelId: z.string() })

export function discordRoutes(bot: DiscordBot | null, sessions: VoiceSessions | null) {
  return async (app: FastifyInstance) => {
    app.get('/api/discord/status', async (req) => {
      const user = authed(req)
      return {
        configured: !!bot,
        ready: !!bot?.isReady,
        inviteUrl: bot?.inviteUrl ?? null,
        session: sessions?.forUser(user.id) ?? null,
      }
    })

    if (!bot || !sessions) return

    app.get('/api/discord/channels', async (req) => bot.voiceChannelsFor(authed(req).discordId))

    app.post('/api/discord/connect', async (req) => {
      const user = authed(req)
      const { guildId, channelId } = parseBody(connectBody, req.body)
      return sessions.connect(user.id, guildId, channelId)
    })

    app.post('/api/discord/disconnect', async (req) => {
      sessions.disconnect(authed(req).id)
      return { ok: true }
    })

    app.get('/api/discord/stream', { websocket: true }, (socket, req) => {
      let stream: ReturnType<VoiceSessions['openStream']>
      try {
        stream = sessions.openStream(authed(req).id)
      } catch (e) {
        socket.close(1008, e instanceof Error ? e.message : 'Not allowed')
        return
      }
      socket.on('message', (data, isBinary) => {
        if (isBinary)
          stream.write(Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data as ArrayBuffer))
      })
      socket.on('close', () => stream.close())
    })
  }
}
