import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { api } from '../../api/client.ts'
import { keys } from '../../api/keys.ts'
import { LoginHero } from './LoginHero.tsx'
import { LoginStage } from './LoginStage.tsx'

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
    <main className="relative min-h-dvh overflow-hidden bg-[radial-gradient(ellipse_at_80%_10%,var(--color-peat-700),var(--color-peat-950)_65%)]">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col-reverse justify-center gap-12 px-4 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="relative z-10">
          <LoginHero />
          {error && (
            <p className="mt-8 max-w-sm rounded-md bg-danger/15 px-3 py-2 text-danger">{error}</p>
          )}
          <div className="mt-10 flex max-w-xs flex-col gap-3">
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
                className="rounded-lg border border-peat-600 bg-peat-900 px-4 py-3 text-ink-muted hover:text-ink"
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
          {providers.data?.discord && (
            <p className="mt-4 max-w-xs text-sm text-ink-muted">
              Only members of the group’s Discord server can log in.
            </p>
          )}
        </div>
        <LoginStage />
      </div>
    </main>
  )
}
