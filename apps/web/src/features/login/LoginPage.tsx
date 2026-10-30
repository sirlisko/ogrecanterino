import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { api } from '../../api/client.ts'
import { keys } from '../../api/keys.ts'

const ERRORS: Record<string, string> = {
  guild:
    "Your Discord account isn't in the group's server. Ask the GM for an invite, then try again.",
  state: 'The login link expired. Log in again.',
}

export function LoginPage() {
  const [params] = useSearchParams()
  const qc = useQueryClient()
  const providers = useQuery({
    queryKey: ['providers'],
    queryFn: () => api<{ discord: boolean; dev: boolean }>('/auth/providers'),
  })
  const error = ERRORS[params.get('error') ?? '']

  const devLogin = async () => {
    await api('/auth/dev-login', { method: 'POST' })
    await qc.invalidateQueries({ queryKey: keys.me })
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <img src="/favicon.svg" alt="" className="mb-6 h-14 w-14" />
        <h1 className="font-display text-5xl leading-none font-bold">Ogre Canterino</h1>
        <p className="mt-3 text-ink-muted">
          Music, ambience and effects for your table, live or over Discord.
        </p>
        {error && <p className="mt-6 rounded-md bg-danger/15 px-3 py-2 text-danger">{error}</p>}
        <div className="mt-8 flex flex-col gap-3">
          {providers.data?.discord && (
            <a
              href="/auth/login"
              className="rounded-lg bg-[#5865f2] px-4 py-3 text-center font-medium text-white hover:bg-[#4752c4]"
            >
              Log in with Discord
            </a>
          )}
          {providers.data?.dev && (
            <button
              type="button"
              onClick={devLogin}
              className="rounded-lg border border-peat-600 px-4 py-3 text-ink-muted hover:text-ink"
            >
              Log in as dev GM
            </button>
          )}
          {providers.data && !providers.data.discord && !providers.data.dev && (
            <p className="text-ink-muted">
              Login isn't configured. Set the Discord app credentials on the server.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
