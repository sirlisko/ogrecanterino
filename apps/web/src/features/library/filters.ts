import type { Sound, SoundCategory } from '@ogre/shared'

export interface SoundFilter {
  query: string
  category: SoundCategory | null
  tags: string[]
  favouritesOnly: boolean
}

export const emptyFilter: SoundFilter = {
  query: '',
  category: null,
  tags: [],
  favouritesOnly: false,
}

/** Every whitespace-separated term must match the title, artist or a tag. */
export function filterSounds(
  sounds: Sound[],
  f: SoundFilter,
  favourites: ReadonlySet<string>,
): Sound[] {
  const terms = f.query.toLowerCase().split(/\s+/).filter(Boolean)
  return sounds.filter((s) => {
    if (f.category && s.category !== f.category) return false
    if (f.favouritesOnly && !favourites.has(s.id)) return false
    if (f.tags.some((t) => !s.tags.includes(t))) return false
    if (!terms.length) return true
    const haystack = `${s.title} ${s.artist} ${s.tags.join(' ')}`.toLowerCase()
    return terms.every((t) => haystack.includes(t))
  })
}

export const STRUCTURAL_TAGS = new Set(['Music', 'Sound Effect', 'Ambience'])

export function tagCounts(sounds: Sound[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const s of sounds)
    for (const t of s.tags) if (!STRUCTURAL_TAGS.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

export type SoundSort = 'title' | 'artist' | 'longest' | 'shortest'

export const SOUND_SORTS: { value: SoundSort; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'artist', label: 'Artist' },
  { value: 'longest', label: 'Longest first' },
  { value: 'shortest', label: 'Shortest first' },
]

const byTitle = (a: Sound, b: Sound) => a.title.localeCompare(b.title)

/** Sounds without an artist or a measured length go last, whichever way the list runs. */
export function sortSounds(sounds: Sound[], sort: SoundSort): Sound[] {
  const list = [...sounds]
  if (sort === 'title') return list.sort(byTitle)
  if (sort === 'artist')
    return list.sort(
      (a, b) =>
        Number(!a.artist) - Number(!b.artist) || a.artist.localeCompare(b.artist) || byTitle(a, b),
    )
  const sign = sort === 'longest' ? -1 : 1
  return list.sort(
    (a, b) =>
      Number(a.durationMs === null) - Number(b.durationMs === null) ||
      sign * ((a.durationMs ?? 0) - (b.durationMs ?? 0)) ||
      byTitle(a, b),
  )
}
