import type { Sound, SoundCategory } from '@ogre/shared'
import { type ReactNode, useMemo, useState } from 'react'
import { useFavourites, useRecent } from '../../api/me.ts'
import { useSounds } from '../../api/sounds.ts'
import { Chip } from '../../ui/Chip.tsx'
import { emptyFilter, filterSounds, tagCounts, type SoundFilter } from './filters.ts'
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
}

export function SoundBrowser({ actions, wrapRow, compact }: Props) {
  const sounds = useSounds()
  const favourites = new Set(useFavourites().data ?? [])
  const recent = useRecent().data ?? []
  const preview = usePreview()
  const [filter, setFilter] = useState<SoundFilter>(emptyFilter)
  const [view, setView] = useState<View>('all')
  const [limit, setLimit] = useState(PAGE)

  const all = sounds.data ?? []
  const tags = useMemo(() => tagCounts(all).slice(0, compact ? 12 : 24), [all, compact])
  const base = view === 'recent' ? recent.flatMap((id) => all.find((s) => s.id === id) ?? []) : all
  const results = filterSounds(
    base,
    { ...filter, favouritesOnly: view === 'favourites' },
    favourites,
  )
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
          className="w-full rounded-lg bg-peat-800 px-3 py-2 ring-1 ring-peat-700 placeholder:text-peat-400 sm:w-72"
        />
        {(['all', 'favourites', 'recent'] as const).map((v) => (
          <Chip key={v} active={view === v} onClick={() => setView(v)}>
            {{ all: 'All', favourites: 'Favourites', recent: 'Recently previewed' }[v]}
          </Chip>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-peat-600 sm:block" />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            active={filter.category === c.value}
            onClick={() => update({ category: filter.category === c.value ? null : c.value })}
          >
            {c.label}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map(([t, n]) => (
          <Chip key={t} active={filter.tags.includes(t)} onClick={() => toggleTag(t)}>
            {t} <span className="opacity-60">{n}</span>
          </Chip>
        ))}
      </div>

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
              : 'Nothing matches. Remove a tag or change the search.'}
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
