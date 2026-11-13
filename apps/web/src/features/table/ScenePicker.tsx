import type { Scene } from '@ogre/shared'
import { useEffect, useState } from 'react'
import { useScenes } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Button } from '../../ui/Button.tsx'
import { Dialog, fieldClass } from '../../ui/Dialog.tsx'
import { useActiveCollectionData } from '../collections/useSetlist.ts'
import { hasNoSounds } from '../editor/blankScene.ts'
import { NotOnDevice } from '../offline/NotOnDevice.tsx'
import { matchesQuery } from '../scenes/SceneSearch.tsx'

/** Starts any scene from table mode, with the active collection's scenes first and in order. */
export function ScenePicker({ onClose }: { onClose: () => void }) {
  const scenes = useScenes().data ?? []
  const collection = useActiveCollectionData()
  const playingId = usePlayer((s) => s.sceneId)
  const [query, setQuery] = useState('')

  // The dialog focuses the search box; on a tablet that would cover the list with the keyboard.
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches)
      (document.activeElement as HTMLElement | null)?.blur()
  }, [])

  const byId = new Map(scenes.map((s) => [s.id, s]))
  const inCollection = (collection?.sceneIds ?? []).flatMap((id) => byId.get(id) ?? [])
  const others = scenes.filter((s) => !collection?.sceneIds.includes(s.id))
  const groups = [
    { title: collection?.name, scenes: inCollection },
    { title: collection ? 'Other scenes' : undefined, scenes: others },
  ]
    .map((g) => ({ ...g, scenes: g.scenes.filter((s) => matchesQuery(s, query)) }))
    .filter((g) => g.scenes.length > 0)

  const start = (scene: Scene) => {
    void engine.playScene(scene)
    onClose()
  }

  return (
    <Dialog title="Start a scene" onClose={onClose} wide>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search scenes"
        aria-label="Search scenes"
        className={`${fieldClass} text-lg`}
      />
      <div className="mt-4 flex max-h-[60dvh] flex-col gap-5 overflow-y-auto">
        {groups.length === 0 && <p className="text-ink-muted">No scenes match.</p>}
        {groups.map((group) => (
          <section key={group.title ?? 'all'} aria-label={group.title ?? 'Scenes'}>
            {group.title && <h3 className="mb-2 text-ink-muted">{group.title}</h3>}
            <ul className="grid gap-2 sm:grid-cols-2">
              {group.scenes.map((s) => {
                const playing = s.id === playingId
                const empty = hasNoSounds(s)
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={playing || empty}
                      onClick={() => start(s)}
                      className={`flex min-h-16 w-full flex-col justify-center rounded-xl px-4 py-2 text-left ring-1 disabled:cursor-default ${playing ? 'bg-brass/12 ring-brass/40' : empty ? 'bg-peat-900 opacity-60 ring-peat-700' : 'bg-peat-900 ring-peat-700 hover:bg-peat-700'}`}
                    >
                      <span className="text-lg leading-tight">{s.name}</span>
                      <span className="truncate text-sm text-ink-muted">
                        {playing ? 'Playing now' : empty ? 'No sounds yet' : s.tags.join(', ')}
                      </span>
                      <NotOnDevice sceneId={s.id} className="text-sm" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-4 text-right">
        <Button onClick={onClose}>Cancel</Button>
      </div>
    </Dialog>
  )
}
