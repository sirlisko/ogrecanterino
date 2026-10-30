import { z } from 'zod'

const API = 'https://discord.com/api/v10'

const token = z.object({ access_token: z.string() })
const discordUser = z.object({
  id: z.string(),
  username: z.string(),
  global_name: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
})
const guilds = z.array(z.object({ id: z.string() }))

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function authorizeUrl(cfg: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
    state,
    prompt: 'none',
  })
  return `https://discord.com/oauth2/authorize?${params}`
}

async function getJson<T>(schema: z.ZodType<T>, url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`Discord ${url} failed: ${res.status} ${await res.text()}`)
  return schema.parse(await res.json())
}

export async function fetchDiscordProfile(cfg: OAuthConfig, code: string) {
  const { access_token } = await getJson(token, `${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: cfg.redirectUri,
    }),
  })
  const headers = { authorization: `Bearer ${access_token}` }
  const [user, userGuilds] = await Promise.all([
    getJson(discordUser, `${API}/users/@me`, { headers }),
    getJson(guilds, `${API}/users/@me/guilds`, { headers }),
  ])
  return {
    discordId: user.id,
    name: user.global_name ?? user.username,
    avatarUrl: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
      : null,
    guildIds: userGuilds.map((g) => g.id),
  }
}
