import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useSounds } from '../api/sounds.ts'
import { engine } from '../audio/engine.ts'
import { ResumeToast } from '../features/player/ResumeToast.tsx'
import { TransportBar } from '../features/player/TransportBar.tsx'
import { HotkeyLayer } from '../hotkeys/HotkeyLayer.tsx'
import { UserMenu } from './UserMenu.tsx'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 transition-colors ${isActive ? 'bg-peat-700 text-ink' : 'text-ink-muted hover:text-ink'}`

export function Layout() {
  const sounds = useSounds()

  useEffect(() => {
    if (sounds.data) engine.setSounds(sounds.data)
  }, [sounds.data])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-peat-700 bg-peat-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5">
          <NavLink to="/" className="mr-3 flex items-center gap-2 font-display text-xl font-bold">
            <img src="/logo.png" alt="" className="h-7 w-7" />
            <span className="hidden sm:inline">Ogre Canterino</span>
          </NavLink>
          <nav className="flex gap-1 text-[15px]">
            <NavLink to="/" end className={navClass}>
              Scenes
            </NavLink>
            <NavLink to="/library" className={navClass}>
              Library
            </NavLink>
            <NavLink to="/credits" className={navClass}>
              Credits
            </NavLink>
          </nav>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-40">
        <Outlet />
      </main>
      <TransportBar />
      <ResumeToast />
      <HotkeyLayer />
    </div>
  )
}
