import { randomBytes } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { config } from '../config.ts'
import type { Db } from '../db/client.ts'
import { users } from '../db/schema.ts'
import { authorizeUrl, fetchDiscordProfile, type OAuthConfig } from './discordOAuth.ts'
import { createSession, deleteSession, sessionIdFrom, setSessionCookie } from './session.ts'

const STATE_COOKIE = 'ogre_oauth_state'

function upsertUser(
  db: Db,
  profile: { discordId: string; name: string; avatarUrl: string | null },
) {
  const role = config.ADMIN_DISCORD_IDS.includes(profile.discordId) ? 'admin' : 'gm'
  return db
    .insert(users)
    .values({ ...profile, role })
    .onConflictDoUpdate({
      target: users.discordId,
      set: { name: profile.name, avatarUrl: profile.avatarUrl, role },
    })
    .returning()
    .get()
}

export async function authRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const oauth: OAuthConfig | null =
    config.DISCORD_CLIENT_ID && config.DISCORD_CLIENT_SECRET
      ? {
          clientId: config.DISCORD_CLIENT_ID,
          clientSecret: config.DISCORD_CLIENT_SECRET,
          redirectUri: `${config.PUBLIC_URL}/auth/callback`,
        }
      : null

  app.get('/auth/providers', async () => ({ discord: !!oauth, dev: config.DEV_LOGIN }))

  app.get('/auth/login', async (_req, reply) => {
    if (!oauth) return reply.code(503).send({ error: 'Discord login is not configured' })
    const state = randomBytes(16).toString('base64url')
    reply.setCookie(STATE_COOKIE, state, {
      path: '/auth',
      httpOnly: true,
      sameSite: 'lax',
      secure: config.secure,
      maxAge: 600,
    })
    return reply.redirect(authorizeUrl(oauth, state))
  })

  app.get<{ Querystring: { code?: string; state?: string } }>(
    '/auth/callback',
    async (req, reply) => {
      if (!oauth) return reply.code(503).send()
      const { code, state } = req.query
      if (!code || !state || state !== req.cookies[STATE_COOKIE])
        return reply.redirect('/login?error=state')
      reply.clearCookie(STATE_COOKIE, { path: '/auth' })
      const profile = await fetchDiscordProfile(oauth, code)
      const allowed =
        config.ALLOWED_GUILD_IDS.length === 0 ||
        profile.guildIds.some((g) => config.ALLOWED_GUILD_IDS.includes(g))
      if (!allowed) return reply.redirect('/login?error=guild')
      const user = upsertUser(db, profile)
      setSessionCookie(reply, createSession(db, user.id), config.secure)
      return reply.redirect('/')
    },
  )

  if (config.DEV_LOGIN) {
    app.post('/auth/dev-login', async (_req, reply) => {
      const user = upsertUser(db, { discordId: 'dev', name: 'Dev GM', avatarUrl: null })
      setSessionCookie(reply, createSession(db, user.id), config.secure)
      return { ok: true }
    })
  }

  app.post('/auth/logout', async (req, reply) => {
    const id = sessionIdFrom(req)
    if (id) deleteSession(db, id)
    reply.clearCookie('ogre_sid', { path: '/' })
    return { ok: true }
  })
}
