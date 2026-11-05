import type { Scene } from '@ogre/shared'
import { useMemo, useState } from 'react'
import { useMe } from '../../api/me.ts'
import { Chip } from '../../ui/Chip.tsx'
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilters = (owner !== 'all' ? 1 : 0) + (tag ? 1 : 0)
  // On phones the filters fold behind a button, so the first scenes show without scrolling.
  const folded = filtersOpen ? '' : 'max-sm:hidden'

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
        <div className="flex w-full items-center gap-2 sm:contents">
          <SceneSearch value={query} onChange={setQuery} />
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((o) => !o)}
            className={`shrink-0 rounded-lg px-3 py-2 ring-1 sm:hidden ${activeFilters ? 'text-ink ring-ink-muted' : 'text-ink-muted ring-peat-700'}`}
          >
            Filters{activeFilters > 0 && ` (${activeFilters})`}
          </button>
        </div>
        <div className={`flex flex-wrap gap-2 ${folded}`}>
          {(['all', 'mine', 'shared'] as const).map((o) => (
            <Chip key={o} active={owner === o} onClick={() => setOwner(o)}>
              {{ all: 'All', mine: 'Mine', shared: 'Shared with me' }[o]}
            </Chip>
          ))}
        </div>
      </div>
      <div className={`mt-3 flex flex-wrap gap-1.5 ${folded}`}>
        {tags.map((t) => (
          <Chip key={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)}>
            {t}
          </Chip>
        ))}
      </div>
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
