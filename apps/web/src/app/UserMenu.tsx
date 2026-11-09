import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api/client.ts'
import { useMe } from '../api/me.ts'
import { keys } from '../api/keys.ts'
import { SettingsDialog } from '../features/settings/SettingsDialog.tsx'
import { Menu, MenuItem } from '../ui/Menu.tsx'

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
    <>
      {/* Behind a menu so Log out can't be hit by accident mid-session. */}
      <Menu
        label="Account"
        triggerClassName="flex min-h-11 items-center gap-2 rounded-lg px-1.5 text-[15px] text-ink-muted hover:text-ink"
        trigger={
          <>
            {me.avatarUrl ? (
              <img src={me.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-peat-700 text-sm">
                {me.name[0]}
              </span>
            )}
            <span className="hidden md:inline">{me.name}</span>
          </>
        }
      >
        <MenuItem onSelect={() => setSettings(true)}>Settings</MenuItem>
        <MenuItem onSelect={() => void logout()}>Log out</MenuItem>
      </Menu>
      {settings && <SettingsDialog onClose={() => setSettings(false)} />}
    </>
  )
}
