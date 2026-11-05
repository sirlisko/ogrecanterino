import type { Scene } from '@ogre/shared'
import { useMemo, useState } from 'react'
import { useMe } from '../../api/me.ts'
import { Chip } from '../../ui/Chip.tsx'
import { Segmented } from '../../ui/Segmented.tsx'
import { LayoutToggle } from './LayoutToggle.tsx'
import { RecentScenes } from './RecentScenes.tsx'
import { SceneGrid } from './SceneGrid.tsx'
import { SceneSearch, matchesQuery } from './SceneSearch.tsx'
import { topTags } from './topTags.ts'

type Owner = 'all' | 'mine' | 'shared'

export function AllScenes({ scenes }: { scenes: Scene[] }) {
  const me = useMe().data
  const [query, setQuery] = useState('')
  const [owner, setOwner] = useState<Owner>('all')
  const [tag, setTag] = useState<string | null>(null)
  // Tags fold behind a button, so the scenes start near the top of the page.
  const [tagsOpen, setTagsOpen] = useState(false)

  const tags = useMemo(
    () =>
      topTags(
        scenes.map((s) => s.tags),
        14,
      ),
    [scenes],
  )
  const visible = scenes.filter(
    (s) =>
      (owner === 'all' || (owner === 'mine') === (s.ownerId === me?.id)) &&
      (!tag || s.tags.includes(tag)) &&
      matchesQuery(s, query),
  )

  return (
    <>
      <RecentScenes scenes={scenes} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SceneSearch value={query} onChange={setQuery} />
        <Segmented
          label="Whose scenes"
          value={owner}
          onChange={setOwner}
          options={[
            { value: 'all', label: 'All' },
            { value: 'mine', label: 'Mine' },
            { value: 'shared', label: 'Shared with me' },
          ]}
        />
        <button
          type="button"
          aria-expanded={tagsOpen}
          onClick={() => setTagsOpen((o) => !o)}
          className={`rounded-lg px-3 py-1.5 text-[15px] ring-1 ${tag ? 'text-ink ring-ink-muted' : 'text-ink-muted ring-peat-700 hover:text-ink'}`}
        >
          {tag ? `Tags: ${tag}` : 'Tags'}
        </button>
        <LayoutToggle className="ml-auto" />
      </div>
      {tagsOpen && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Chip key={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)}>
              {t}
            </Chip>
          ))}
        </div>
      )}
      {visible.length === 0 ? (
        <p className="mt-10 max-w-prose text-ink-muted">
          {scenes.length === 0
            ? 'No scenes yet. Create one, or import a bardic.tools export.'
            : 'No scenes match. Clear the search or pick another tag.'}
        </p>
      ) : (
        <SceneGrid scenes={visible} />
      )}
    </>
  )
}
