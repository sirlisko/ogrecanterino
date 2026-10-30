import { emptySceneData } from '@ogre/shared'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useMe } from '../../api/me.ts'
import { useSaveScene, useScenes } from '../../api/scenes.ts'
import { Button } from '../../ui/Button.tsx'
import { Chip } from '../../ui/Chip.tsx'
import { ImportScenesButton } from './ImportScenesButton.tsx'
import { SceneCard } from './SceneCard.tsx'
import { topTags } from './topTags.ts'

type Owner = 'all' | 'mine' | 'shared'

export function ScenesPage() {
  const me = useMe().data
  const scenes = useScenes()
  const save = useSaveScene()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [owner, setOwner] = useState<Owner>('all')
  const [tag, setTag] = useState<string | null>(null)

  const all = scenes.data ?? []
  const tags = useMemo(
    () =>
      topTags(
        all.map((s) => s.tags),
        14,
      ),
    [all],
  )
  const q = query.trim().toLowerCase()
  const visible = all.filter(
    (s) =>
      (owner === 'all' || (owner === 'mine') === (s.ownerId === me?.id)) &&
      (!tag || s.tags.includes(tag)) &&
      (!q || s.name.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q))),
  )

  const create = async () => {
    const scene = await save.mutateAsync({
      input: {
        name: 'Untitled scene',
        tags: [],
        visibility: 'private',
        combatSceneId: null,
        data: emptySceneData(),
      },
    })
    navigate(`/scenes/${scene.id}/edit`)
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <h1 className="font-display text-4xl font-bold">Scenes</h1>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <ImportScenesButton />
          <Button variant="primary" onClick={create} disabled={save.isPending}>
            New scene
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search scenes"
          aria-label="Search scenes"
          data-hotkey-search
          className="w-full rounded-lg bg-peat-800 px-3 py-2 ring-1 ring-peat-700 placeholder:text-peat-400 sm:w-64"
        />
        {(['all', 'mine', 'shared'] as const).map((o) => (
          <Chip key={o} active={owner === o} onClick={() => setOwner(o)}>
            {{ all: 'All', mine: 'Mine', shared: 'Shared with me' }[o]}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Chip key={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)}>
            {t}
          </Chip>
        ))}
      </div>

      {scenes.isPending ? (
        <p className="mt-10 text-ink-muted">Loading scenes…</p>
      ) : visible.length === 0 ? (
        <p className="mt-10 max-w-prose text-ink-muted">
          {all.length === 0
            ? 'No scenes yet. Create one, or import a bardic.tools export.'
            : 'No scenes match. Clear the search or pick another tag.'}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <SceneCard
              key={s.id}
              scene={s}
              canEdit={me?.role === 'admin' || s.ownerId === me?.id}
              mine={s.ownerId === me?.id}
            />
          ))}
        </div>
      )}
    </>
  )
}
