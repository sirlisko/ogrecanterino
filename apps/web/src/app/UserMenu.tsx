import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api/client.ts'
import { useMe } from '../api/me.ts'
import { keys } from '../api/keys.ts'
import { SettingsDialog } from '../features/settings/SettingsDialog.tsx'

export function UserMenu() {
  const me = useMe().data
  const qc = useQueryClient()
  const [settings, setSettings] = useState(false)
  if (!me) return null

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' })
    qc.setQueryData(keys.me, null)
  }

  return (
    <div className="flex items-center gap-3 text-[15px]">
      {me.avatarUrl ? (
        <img src={me.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-peat-700 text-sm">
          {me.name[0]}
        </span>
      )}
      <span className="hidden text-ink-muted md:inline">{me.name}</span>
      <button
        type="button"
        onClick={() => setSettings(true)}
        className="text-ink-muted hover:text-ink"
      >
        Settings
      </button>
      <button type="button" onClick={logout} className="text-ink-muted hover:text-ink">
        Log out
      </button>
      {settings && <SettingsDialog onClose={() => setSettings(false)} />}
    </div>
  )
}
