import type { Sound, SoundCategory } from '@ogre/shared'
import { type ReactNode, useMemo, useState } from 'react'
import { useFavourites, useRecent } from '../../api/me.ts'
import { useSounds } from '../../api/sounds.ts'
import { Chip } from '../../ui/Chip.tsx'
import { FoldButton } from '../../ui/FoldButton.tsx'
import { Segmented } from '../../ui/Segmented.tsx'
import {
  emptyFilter,
  filterSounds,
  SOUND_SORTS,
  sortSounds,
  tagCounts,
  type SoundFilter,
  type SoundSort,
} from './filters.ts'
import { SoundRow } from './SoundRow.tsx'
import { usePreview } from './usePreview.ts'

const PAGE = 150
const CATEGORIES: { value: SoundCategory; label: string }[] = [
  { value: 'music', label: 'Music' },
  { value: 'ambience', label: 'Ambience' },
  { value: 'effect', label: 'Effects' },
]

type View = 'all' | 'favourites' | 'recent'

interface Props {
  actions?: (sound: Sound) => ReactNode
  wrapRow?: (sound: Sound, row: ReactNode) => ReactNode
  compact?: boolean
  initialCategory?: SoundCategory
}

export function SoundBrowser({ actions, wrapRow, compact, initialCategory }: Props) {
  const sounds = useSounds()
  const favourites = new Set(useFavourites().data ?? [])
  const recent = useRecent().data ?? []
  const preview = usePreview()
  const [filter, setFilter] = useState<SoundFilter>({
    ...emptyFilter,
    category: initialCategory ?? null,
  })
  const [view, setView] = useState<View>('all')
  const [limit, setLimit] = useState(PAGE)
  const [sort, setSort] = useState<SoundSort>('title')
  // Folded like the scenes page's, so the sounds start near the top.
  const [tagsOpen, setTagsOpen] = useState(false)

  const all = sounds.data ?? []
  const tags = useMemo(() => tagCounts(all).slice(0, compact ? 12 : 24), [all, compact])
  const base = view === 'recent' ? recent.flatMap((id) => all.find((s) => s.id === id) ?? []) : all
  const matches = filterSounds(
    base,
    { ...filter, favouritesOnly: view === 'favourites' },
    favourites,
  )
  // "Recently previewed" keeps its own order: newest first is the point of it.
  const results = view === 'recent' ? matches : sortSounds(matches, sort)
  const update = (patch: Partial<SoundFilter>) => {
    setFilter((f) => ({ ...f, ...patch }))
    setLimit(PAGE)
  }
  const toggleTag = (t: string) =>
    update({
      tags: filter.tags.includes(t) ? filter.tags.filter((x) => x !== t) : [...filter.tags, t],
    })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={filter.query}
          onChange={(e) => update({ query: e.target.value })}
          placeholder={`Search ${all.length} sounds`}
          aria-label="Search sounds"
          data-hotkey-search
          className="w-full rounded-lg bg-peat-800 px-3 py-2 ring-1 ring-peat-700 placeholder:text-peat-400 sm:w-64"
        />
        <Segmented
          label="Which sounds"
          value={view}
          onChange={setView}
          options={[
            { value: 'all', label: 'All' },
            { value: 'favourites', label: 'Favourites' },
            { value: 'recent', label: 'Recently previewed' },
          ]}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            active={filter.category === c.value}
            onClick={() => update({ category: filter.category === c.value ? null : c.value })}
          >
            {c.label}
          </Chip>
        ))}
        <FoldButton
          open={tagsOpen}
          active={filter.tags.length > 0}
          onToggle={() => setTagsOpen((o) => !o)}
        >
          {filter.tags.length ? `Tags: ${filter.tags.join(', ')}` : 'Tags'}
        </FoldButton>
        {view !== 'recent' && (
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SoundSort)
              setLimit(PAGE)
            }}
            aria-label="Sort sounds"
            className="ml-auto rounded-lg bg-peat-800 py-1.5 pr-2 pl-3 text-[15px] text-ink-muted ring-1 ring-peat-700 hover:text-ink"
          >
            {SOUND_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort by {s.label.toLowerCase()}
              </option>
            ))}
          </select>
        )}
      </div>
      {tagsOpen && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map(([t, n]) => (
            <Chip key={t} active={filter.tags.includes(t)} onClick={() => toggleTag(t)}>
              {t} <span className="opacity-60">{n}</span>
            </Chip>
          ))}
        </div>
      )}

      <p className="mt-4 mb-2 text-sm text-ink-muted" aria-live="polite">
        {sounds.isPending
          ? 'Loading library…'
          : `${results.length} sound${results.length === 1 ? '' : 's'}`}
      </p>
      {!sounds.isPending && results.length === 0 && (
        <p className="py-6 text-ink-muted">
          {view === 'favourites'
            ? 'No favourites yet. Star sounds to collect them here.'
            : view === 'recent'
              ? 'Sounds you preview show up here.'
              : 'No sounds match. Clear the search or remove a tag.'}
        </p>
      )}
      <ul className="flex flex-col">
        {results.slice(0, limit).map((s) => {
          const row = (
            <SoundRow
              sound={s}
              previewing={preview.playing === s.id}
              onPreview={() => preview.toggle(s.id)}
              actions={actions?.(s)}
            />
          )
          return <li key={s.id}>{wrapRow ? wrapRow(s, row) : row}</li>
        })}
      </ul>
      {results.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="mt-3 w-full rounded-lg py-2 text-ink-muted ring-1 ring-peat-700 hover:text-ink"
        >
          Show more ({results.length - limit} left)
        </button>
      )}
    </div>
  )
}
